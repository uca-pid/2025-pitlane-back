// controllers/profilesLib.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllProfiles() {
    return prisma.profile.findMany({
        include: { Preference: true, DietaryRestriction: true }
    });
}

async function getProfileById(id) {
    return prisma.profile.findUnique({
        where: { id: id },
        include: { Preference: true, DietaryRestriction: true }
    });
}

async function createProfile({ id, username, preferences = [], dietaryRestrictions = [] }) {
    return prisma.profile.create({
        data: {
            id,
            username,
            Preference: preferences.length ? { connect: preferences.map(PreferenceID => ({ PreferenceID })) } : undefined,
            DietaryRestriction: dietaryRestrictions.length ? { connect: dietaryRestrictions.map(DietaryRestrictionID => ({ DietaryRestrictionID })) } : undefined
        },
        include: { Preference: true, DietaryRestriction: true }
    });
}

// Delete a profile by id
async function deleteProfile(id) {
    try {
        await prisma.profile.delete({ where: { id: id } });
        return true;
    } catch (err) {
        if (err.code === 'P2025') return false;
        throw err;
    }
}

module.exports = {
    getAllProfiles,
    getProfileById,
    createProfile,
    deleteProfile
};

// PATCH: Update username by profile id
async function updateProfileUsername(id, newUsername) {
    return prisma.profile.update({
        where: { id },
        data: { username: newUsername },
        include: { Preference: true, DietaryRestriction: true }
    });
}

// PATCH: Update role by profile id
async function updateProfileRole(id, newRole) {
    return prisma.profile.update({
        where: { id },
        data: { role: newRole },
        include: { Preference: true, DietaryRestriction: true }
    });
}

module.exports.updateProfileUsername = updateProfileUsername;
module.exports.updateProfileRole = updateProfileRole;
