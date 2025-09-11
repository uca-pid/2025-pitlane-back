// controllers/usersLib.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllUsers() {
    return prisma.user.findMany({
        include: { preferences: true, dietaryRestrictions: true }
    });
}

async function getUserById(id) {
    return prisma.user.findUnique({
        where: { userID: parseInt(id) },
        include: { preferences: true, dietaryRestrictions: true }
    });
}

async function createUser({ name, email, password, preferences = [], dietaryRestrictions = [] }) {
    return prisma.user.create({
        data: {
            name,
            email,
            password,
            preferences: preferences.length ? { connect: preferences.map(id => ({ PreferenceID: id })) } : undefined,
            dietaryRestrictions: dietaryRestrictions.length ? { connect: dietaryRestrictions.map(id => ({ DietaryRestrictionID: id })) } : undefined
        },
        include: { preferences: true, dietaryRestrictions: true }
    });
}


module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    deleteUser
};

// Delete a user by id
async function deleteUser(id) {
    try {
        await prisma.user.delete({ where: { userID: parseInt(id) } });
        return true;
    } catch (err) {
        if (err.code === 'P2025') return false;
        throw err;
    }
}