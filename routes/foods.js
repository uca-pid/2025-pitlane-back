
const express = require('express');
const router = express.Router();
const foodsController = require('../controllers/foodsLib');

// GET /foods - get all foods
router.get('/', async (req, res) => {
    try {
        const foods = await foodsController.getAllFoods();
        res.json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /foods/:id - get food by id
router.get('/:id', async (req, res) => {
    try {
        const food = await foodsController.getFoodById(req.params.id);
        if (!food) return res.status(404).json({ error: 'Food not found' });
        res.json(food);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /foods/by-preference/:preferenceId
router.get('/by-preference/:preferenceId', async (req, res) => {
    try {
        const foods = await foodsController.getFoodsByPreference(req.params.preferenceId);
        res.json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /foods/by-restriction/:restrictionId
router.get('/by-restriction/:restrictionId', async (req, res) => {
    try {
        const foods = await foodsController.getFoodsByRestriction(req.params.restrictionId);
        res.json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /foods/by-preference-and-restriction
router.post('/by-preference-and-restriction', async (req, res) => {
    try {
        const { preferenceId, restrictionId } = req.body;
        const foods = await foodsController.getFoodsByPreferenceAndRestriction(preferenceId, restrictionId);
        res.json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /foods/recommended/:userId
router.get('/recommended/:userId', async (req, res) => {
    try {
        const foods = await foodsController.getRecommendedFoodsForUser(req.params.userId);
        if (foods === null) return res.status(404).json({ error: 'User not found' });
        res.json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
