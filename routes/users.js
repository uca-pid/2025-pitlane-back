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
