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

module.exports = {
    getAllUsers,
    getUserById
};
