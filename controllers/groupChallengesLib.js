const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function dayStart(value) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function daysBetween(startDate, endDate) {
  const start = dayStart(startDate);
  const end = dayStart(endDate);
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
}

async function getGroupMembership(groupId, profileId) {
  return prisma.groupMember.findUnique({
    where: { groupId_profileId: { groupId: parseInt(groupId), profileId } },
  });
}

async function requireMember(groupId, profileId) {
  const membership = await getGroupMembership(groupId, profileId);
  if (!membership || !membership.isActive) throw new Error('FORBIDDEN_MEMBERSHIP');
  return membership;
}

async function requireAdmin(groupId, profileId) {
  const membership = await requireMember(groupId, profileId);
  const group = await prisma.group.findUnique({ where: { GroupID: parseInt(groupId) } });
  if (membership.role !== 'admin' && group?.createdBy !== profileId) throw new Error('FORBIDDEN_ADMIN');
  return membership;
}

async function listChallenges(groupId) {
  return prisma.groupChallenge.findMany({
    where: { groupId: parseInt(groupId), isActive: true },
    include: { createdBy: { select: { id: true, username: true } } },
    orderBy: { startDate: 'desc' },
  });
}

async function createChallenge(groupId, profileId, data) {
  await requireAdmin(groupId, profileId);
  if (!data.name?.trim() || !data.ruleText?.trim() || !data.startDate || !data.endDate) {
    throw new Error('INVALID_CHALLENGE_DATA');
  }
  const startDate = dayStart(data.startDate);
  const endDate = dayStart(data.endDate);
  if (endDate < startDate) throw new Error('INVALID_CHALLENGE_DATES');
  return prisma.groupChallenge.create({
    data: {
      groupId: parseInt(groupId),
      name: data.name.trim(),
      description: data.description?.trim() || null,
      ruleText: data.ruleText.trim(),
      startDate,
      endDate,
      createdById: profileId,
    },
  });
}

async function updateChallenge(challengeId, profileId, data) {
  const challenge = await prisma.groupChallenge.findUnique({ where: { ChallengeID: parseInt(challengeId) } });
  if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
  await requireAdmin(challenge.groupId, profileId);
  const startDate = data.startDate ? dayStart(data.startDate) : challenge.startDate;
  const endDate = data.endDate ? dayStart(data.endDate) : challenge.endDate;
  if (endDate < startDate) throw new Error('INVALID_CHALLENGE_DATES');
  return prisma.groupChallenge.update({
    where: { ChallengeID: parseInt(challengeId) },
    data: {
      name: data.name?.trim() || challenge.name,
      description: data.description?.trim() ?? challenge.description,
      ruleText: data.ruleText?.trim() || challenge.ruleText,
      startDate,
      endDate,
    },
  });
}

async function deleteChallenge(challengeId, profileId) {
  const challenge = await prisma.groupChallenge.findUnique({ where: { ChallengeID: parseInt(challengeId) } });
  if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
  await requireAdmin(challenge.groupId, profileId);
  return prisma.groupChallenge.update({ where: { ChallengeID: challenge.ChallengeID }, data: { isActive: false } });
}

async function setCompletion(challengeId, profileId, dateValue, completed) {
  const challenge = await prisma.groupChallenge.findUnique({ where: { ChallengeID: parseInt(challengeId) } });
  if (!challenge || !challenge.isActive) throw new Error('CHALLENGE_NOT_FOUND');
  await requireMember(challenge.groupId, profileId);
  const date = dayStart(dateValue || new Date());
  if (date < dayStart(challenge.startDate) || date > dayStart(challenge.endDate)) throw new Error('DATE_OUT_OF_CHALLENGE');
  return prisma.groupChallengeCompletion.upsert({
    where: { challengeId_profileId_date: { challengeId: challenge.ChallengeID, profileId, date } },
    update: { completed: Boolean(completed) },
    create: { challengeId: challenge.ChallengeID, profileId, date, completed: Boolean(completed) },
  });
}

async function getChallengeProgress(challengeId, profileId) {
  const challenge = await prisma.groupChallenge.findUnique({ where: { ChallengeID: parseInt(challengeId) } });
  if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
  await requireMember(challenge.groupId, profileId);
  const completions = await prisma.groupChallengeCompletion.findMany({
    where: { challengeId: challenge.ChallengeID, profileId, completed: true },
    orderBy: { date: 'desc' },
  });
  const completedDates = completions.map((completion) => completion.date.toISOString().slice(0, 10));
  const today = dayStart(new Date()).toISOString().slice(0, 10);
  const completionSet = new Set(completedDates);
  let streak = 0;
  let cursor = dayStart(today);
  while (completionSet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  const totalDays = daysBetween(challenge.startDate, challenge.endDate);
  return {
    challenge,
    completedDays: completions.length,
    completedDates,
    todayCompleted: completionSet.has(today),
    streak,
    totalDays,
    percentage: totalDays ? Math.round(completions.length * 100 / totalDays) : 0,
  };
}

async function getChallengeRanking(challengeId, requesterId) {
  const challenge = await prisma.groupChallenge.findUnique({ where: { ChallengeID: parseInt(challengeId) } });
  if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
  await requireMember(challenge.groupId, requesterId);
  const members = await prisma.groupMember.findMany({
    where: { groupId: challenge.groupId, isActive: true },
    include: { profile: { select: { id: true, username: true } } },
  });
  const totalDays = daysBetween(challenge.startDate, challenge.endDate);
  const ranking = await Promise.all(members.map(async (member) => {
    const completedDays = await prisma.groupChallengeCompletion.count({
      where: { challengeId: challenge.ChallengeID, profileId: member.profileId, completed: true },
    });
    return {
      profileId: member.profileId,
      username: member.profile.username,
      completedDays,
      totalDays,
      percentage: totalDays ? Math.round(completedDays * 100 / totalDays) : 0,
    };
  }));
  ranking.sort((a, b) => b.percentage - a.percentage || b.completedDays - a.completedDays || a.username?.localeCompare(b.username || '') || 0);
  return ranking;
}

async function listMenu(groupId, requesterId, weekStart) {
  await requireMember(groupId, requesterId);
  const start = dayStart(weekStart || new Date());
  const day = start.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + mondayOffset);
  const end = dayStart(start); end.setUTCDate(end.getUTCDate() + 6);
  return prisma.groupMenuEntry.findMany({
    where: { groupId: parseInt(groupId), isActive: true, date: { gte: start, lte: end } },
    include: { meal: true, createdBy: { select: { id: true, username: true } }, proposals: { include: { proposedBy: { select: { id: true, username: true } }, proposedMeal: true, reviewedBy: { select: { id: true, username: true } } }, orderBy: { createdAt: 'desc' } } },
    orderBy: [{ date: 'asc' }, { moment: 'asc' }],
  });
}

async function createMenuEntry(groupId, requesterId, data) {
  await requireAdmin(groupId, requesterId);
  if (!data.date || !data.moment) throw new Error('INVALID_MENU_DATA');
  if (!data.mealId && !data.customMeal?.trim()) throw new Error('INVALID_MENU_MEAL');
  if (data.mealId) {
    const meal = await prisma.meal.findUnique({ where: { MealID: parseInt(data.mealId) } });
    if (!meal) throw new Error('MEAL_NOT_FOUND');
  }
  return prisma.groupMenuEntry.create({
    data: {
      groupId: parseInt(groupId), date: dayStart(data.date), moment: data.moment,
      mealId: data.mealId ? parseInt(data.mealId) : null,
      customMeal: data.customMeal?.trim() || null,
      createdById: requesterId,
    },
  });
}

async function updateMenuEntry(entryId, requesterId, data) {
  const entry = await prisma.groupMenuEntry.findUnique({ where: { MenuEntryID: parseInt(entryId) } });
  if (!entry) throw new Error('MENU_ENTRY_NOT_FOUND');
  await requireAdmin(entry.groupId, requesterId);
  return prisma.groupMenuEntry.update({
    where: { MenuEntryID: entry.MenuEntryID },
    data: {
      date: data.date ? dayStart(data.date) : entry.date,
      moment: data.moment || entry.moment,
      mealId: data.mealId ? parseInt(data.mealId) : (Object.prototype.hasOwnProperty.call(data, 'mealId') ? null : entry.mealId),
      customMeal: data.customMeal !== undefined ? data.customMeal?.trim() || null : entry.customMeal,
    },
  });
}

async function deleteMenuEntry(entryId, requesterId) {
  const entry = await prisma.groupMenuEntry.findUnique({ where: { MenuEntryID: parseInt(entryId) } });
  if (!entry) throw new Error('MENU_ENTRY_NOT_FOUND');
  await requireAdmin(entry.groupId, requesterId);
  return prisma.groupMenuEntry.update({ where: { MenuEntryID: entry.MenuEntryID }, data: { isActive: false } });
}

async function listProposals(entryId, requesterId) {
  const entry = await prisma.groupMenuEntry.findUnique({ where: { MenuEntryID: parseInt(entryId) } });
  if (!entry) throw new Error('MENU_ENTRY_NOT_FOUND');
  await requireMember(entry.groupId, requesterId);
  return prisma.menuProposal.findMany({
    where: { menuEntryId: entry.MenuEntryID },
    include: { proposedBy: { select: { id: true, username: true } }, proposedMeal: true, reviewedBy: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function createProposal(entryId, requesterId, data) {
  const entry = await prisma.groupMenuEntry.findUnique({ where: { MenuEntryID: parseInt(entryId) } });
  if (!entry) throw new Error('MENU_ENTRY_NOT_FOUND');
  await requireMember(entry.groupId, requesterId);
  if (!data.proposedMealId && !data.alternativeText?.trim()) throw new Error('INVALID_PROPOSAL');
  if (data.proposedMealId) {
    const meal = await prisma.meal.findUnique({ where: { MealID: parseInt(data.proposedMealId) } });
    if (!meal) throw new Error('MEAL_NOT_FOUND');
  }
  return prisma.menuProposal.create({
    data: {
      menuEntryId: entry.MenuEntryID,
      proposedById: requesterId,
      proposedMealId: data.proposedMealId ? parseInt(data.proposedMealId) : null,
      alternativeText: data.alternativeText?.trim() || null,
      reason: data.reason?.trim() || null,
    },
  });
}

async function respondProposal(proposalId, requesterId, status) {
  const proposal = await prisma.menuProposal.findUnique({ where: { ProposalID: parseInt(proposalId) }, include: { menuEntry: true } });
  if (!proposal) throw new Error('PROPOSAL_NOT_FOUND');
  if (!['accepted', 'rejected'].includes(status)) throw new Error('INVALID_PROPOSAL_STATUS');
  await requireAdmin(proposal.menuEntry.groupId, requesterId);
  if (proposal.status !== 'pending') throw new Error('PROPOSAL_ALREADY_RESOLVED');
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.menuProposal.update({
      where: { ProposalID: proposal.ProposalID },
      data: { status, reviewedById: requesterId, respondedAt: new Date() },
    });
    if (status === 'accepted') {
      await tx.groupMenuEntry.update({
        where: { MenuEntryID: proposal.menuEntryId },
        data: {
          mealId: proposal.proposedMealId,
          customMeal: proposal.alternativeText,
        },
      });
    }
    return updated;
  });
  return result;
}

module.exports = {
  listChallenges, createChallenge, updateChallenge, deleteChallenge, setCompletion,
  getChallengeProgress, getChallengeRanking,
  listMenu, createMenuEntry, updateMenuEntry, deleteMenuEntry,
  listProposals, createProposal, respondProposal,
};
