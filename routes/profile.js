const express = require('express');
const router = express.Router();

const profilesController = require('../controllers/profilesLib');
const authenticateJWT = require('./auth');

// GET /profile - get all profiles (protegido)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const profiles = await profilesController.getAllProfiles();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /profile/:id - get profile by id (protegido)
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const profile = await profilesController.getProfileById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// DELETE /profile/:id - delete a profile by id (protegido)
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const deleted = await profilesController.deleteProfile(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Profile not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /profile - create a new profile (protegido)
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { id, username, preferences, dietaryRestrictions } = req.body;
    const profile = await profilesController.createProfile({ id, username, preferences, dietaryRestrictions });
    res.status(201).json(profile);
  } catch (err) {
    if (err.code === 'P2002') {
      // Prisma unique constraint failed
      res.status(409).json({ error: 'Profile with this username already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});
