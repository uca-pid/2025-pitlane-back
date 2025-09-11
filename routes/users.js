const express = require('express');
const router = express.Router();


const usersController = require('../controllers/usersLib');

// GET /users - get all users
router.get('/', async (req, res) => {
  try {
    const users = await usersController.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id - get user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await usersController.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// DELETE /users/:id - delete a user by id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await usersController.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users - create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, preferences, dietaryRestrictions } = req.body;
    const user = await usersController.createUser({ name, email, password, preferences, dietaryRestrictions });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      // Prisma unique constraint failed
      res.status(409).json({ error: 'User with this email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});
