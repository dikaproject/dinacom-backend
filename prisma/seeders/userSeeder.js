// prisma/seeder/userSeeder.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const userSeeder = async () => {
    console.log('Seeding users...');

    const users = [
        {
            email: 'user@gmail.com',
            password: 'password123',
            role: 'USER',
        },
        {
            email: 'sofwannuhaalfaruq@gmail.com',
            password: 'password123',
            role: 'USER',
        },
        {
            email: 'doctor@gmail.com',
            password: 'password123',
            role: 'DOCTOR',
        },
        {
            email: 'admin@gmail.com',
            password: 'password123',
            role: 'ADMIN',
        },
    ];

    for (const user of users) {

        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                email: user.email,
                password: hashedPassword,
                role: user.role,
            },
        });
    }
};

module.exports = userSeeder;
