// controllers/foodsLib.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllFoods() {
    return prisma.food.findMany({
        include: { dietaryRestrictions: true, preferences: true }
    });
}

async function getFoodById(id) {

    foodId = parseInt(id);

    if (isNaN(foodId)) {
        throw new Error(`Invalid FoodID: ${id}`);
    }

    return prisma.food.findUnique({
        where: { FoodID: parseInt(foodId) },
        include: { dietaryRestrictions: true, preferences: true }
    });
}

async function getFoodsByPreference(preferenceId) {
    return prisma.food.findMany({
        where: { preferences: { some: { PreferenceID: parseInt(preferenceId) } } },
        include: { dietaryRestrictions: true, preferences: true }
    });
}

async function getFoodsByRestriction(restrictionId) {
    return prisma.food.findMany({
        where: { dietaryRestrictions: { some: { DietaryRestrictionID: parseInt(restrictionId) } } },
        include: { dietaryRestrictions: true, preferences: true }
    });
}

async function getFoodsByPreferenceAndRestriction(preferenceId, restrictionId) {
    // If both params are present, return intersection, else fallback to one
    if (preferenceId && restrictionId) {
        const foodsByPref = await getFoodsByPreference(preferenceId);
        const foodsByRestr = await getFoodsByRestriction(restrictionId);
        // Intersection by FoodID
        const idsByRestr = new Set(foodsByRestr.map(f => f.FoodID));
        return foodsByPref.filter(f => idsByRestr.has(f.FoodID));
    } else if (preferenceId) {
        return getFoodsByPreference(preferenceId);
    } else if (restrictionId) {
        return getFoodsByRestriction(restrictionId);
    } else {
        return getAllFoods();
    }
}

async function getRecommendedFoodsForUser(userId) {
    const user = await prisma.user.findUnique({
        where: { userID: parseInt(userId) },
        include: { preferences: true, dietaryRestrictions: true }
    });
    if (!user) return null;

    return prisma.food.findMany({
        where: {
            preferences: { some: { PreferenceID: { in: user.preferences.map(p => p.PreferenceID) } } },
            dietaryRestrictions: { some: { DietaryRestrictionID: { in: user.dietaryRestrictions.map(r => r.DietaryRestrictionID) } } }
        },
        include: { dietaryRestrictions: true, preferences: true }
    });
}

module.exports = {
    getAllFoods,
    getFoodById,
    getFoodsByPreference,
    getFoodsByRestriction,
    getFoodsByPreferenceAndRestriction,
    getRecommendedFoodsForUser,
    createFood,
    deleteFood
};

// Delete a food by id
async function deleteFood(id) {
    try {
        await prisma.food.delete({ where: { FoodID: parseInt(id) } });
        return true;
    } catch (err) {
        if (err.code === 'P2025') return false;
        throw err;
    }
}

// Create a new food
async function createFood({ name, svgLink, preferences = [], dietaryRestrictions = [] }) {
    return prisma.food.create({
        data: {
            name,
            svgLink,
            preferences: preferences.length ? { connect: preferences.map(id => ({ PreferenceID: id })) } : undefined,
            dietaryRestrictions: dietaryRestrictions.length ? { connect: dietaryRestrictions.map(id => ({ DietaryRestrictionID: id })) } : undefined
        },
        include: { dietaryRestrictions: true, preferences: true }
    });
}
