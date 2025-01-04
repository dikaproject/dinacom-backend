const { PrismaClient } = require('@prisma/client');

const userSeeder = require('./seeders/userSeeder');
const articleCategorySeeder = require('./seeders/articleCategorySeeder');
const articleSeeder = require('./seeders/articleSeeder');
const layananKesehatanSeeder = require('./seeders/layananKesehatanSeeder');
const doctorSeeder = require('./seeders/doctorSeeder');
const productCategorySeeder = require('./seeders/productCategorySeeder');
const productSeeder = require('./seeders/productSeeder');
const cartSeeder = require('./seeders/cartSeeder');

const prisma = new PrismaClient();

const main = async () => {
  console.log('Starting seeding...');
  try {
    await userSeeder();
    await articleCategorySeeder();
    await articleSeeder();
    await layananKesehatanSeeder();
    // await doctorSeeder();
    await productCategorySeeder();
    await productSeeder();
    await cartSeeder();
    console.log('Seeding completed!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

main();
