const express = require('express');
const router = express.Router();
const foodsRouter = require('./foods');
const usersRouter = require('./users');

const preferencesRouter = require('./preferences');
const dietaryRestrictionsRouter = require('./dietaryRestrictions');

router.use('/foods', foodsRouter);
router.use('/users', usersRouter);

router.use('/preferences', preferencesRouter);
router.use('/dietary-restrictions', dietaryRestrictionsRouter);

module.exports = router;
