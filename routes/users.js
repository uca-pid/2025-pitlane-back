const express = require('express');
const router = express.Router();

// POST /users testing
router.post('/', (req, res) => {
  // Here you would add logic to create a user (e.g., save to DB)
  res.status(201).json({ message: 'User created successfully' });
});

module.exports = router;
