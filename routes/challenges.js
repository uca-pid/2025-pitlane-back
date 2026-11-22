const express = require('express');
const router = express.Router();
const lib = require('../controllers/groupChallengesLib');

function errorStatus(error) {
  if (['FORBIDDEN_MEMBERSHIP', 'FORBIDDEN_ADMIN'].includes(error.message)) return 403;
  if (['CHALLENGE_NOT_FOUND', 'MENU_ENTRY_NOT_FOUND', 'PROPOSAL_NOT_FOUND', 'MEAL_NOT_FOUND'].includes(error.message)) return 404;
  if (error.message.startsWith('INVALID') || error.message === 'DATE_OUT_OF_CHALLENGE' || error.message === 'PROPOSAL_ALREADY_RESOLVED') return 400;
  return 500;
}

router.get('/groups/:groupId/challenges', async (req, res) => {
  try { res.json(await lib.listChallenges(req.params.groupId)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.post('/groups/:groupId/challenges', async (req, res) => {
  try { res.status(201).json(await lib.createChallenge(req.params.groupId, req.body.profileId, req.body)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.put('/challenges/:challengeId', async (req, res) => {
  try { res.json(await lib.updateChallenge(req.params.challengeId, req.body.profileId, req.body)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.delete('/challenges/:challengeId', async (req, res) => {
  try { res.json(await lib.deleteChallenge(req.params.challengeId, req.body.profileId)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.post('/challenges/:challengeId/completions', async (req, res) => {
  try { res.json(await lib.setCompletion(req.params.challengeId, req.body.profileId, req.body.date, req.body.completed)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.get('/challenges/:challengeId/progress/:profileId', async (req, res) => {
  try { res.json(await lib.getChallengeProgress(req.params.challengeId, req.params.profileId)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.get('/challenges/:challengeId/ranking/:requesterId', async (req, res) => {
  try { res.json(await lib.getChallengeRanking(req.params.challengeId, req.params.requesterId)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.get('/groups/:groupId/menu', async (req, res) => {
  try { res.json(await lib.listMenu(req.params.groupId, req.query.profileId, req.query.weekStart)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.post('/groups/:groupId/menu', async (req, res) => {
  try { res.status(201).json(await lib.createMenuEntry(req.params.groupId, req.body.profileId, req.body)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.put('/menu/:entryId', async (req, res) => {
  try { res.json(await lib.updateMenuEntry(req.params.entryId, req.body.profileId, req.body)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.delete('/menu/:entryId', async (req, res) => {
  try { res.json(await lib.deleteMenuEntry(req.params.entryId, req.body.profileId)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.get('/menu/:entryId/proposals', async (req, res) => {
  try { res.json(await lib.listProposals(req.params.entryId, req.query.profileId)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.post('/menu/:entryId/proposals', async (req, res) => {
  try { res.status(201).json(await lib.createProposal(req.params.entryId, req.body.profileId, req.body)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

router.put('/menu-proposals/:proposalId/respond', async (req, res) => {
  try { res.json(await lib.respondProposal(req.params.proposalId, req.body.profileId, req.body.status)); }
  catch (error) { res.status(errorStatus(error)).json({ error: error.message }); }
});

module.exports = router;
