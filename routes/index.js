const express = require('express');
const router = express.Router();
const foodsRouter = require('./foods');
const usersRouter = require('./users');

router.use('/foods', foodsRouter);
router.use('/users', usersRouter);

module.exports = router;
