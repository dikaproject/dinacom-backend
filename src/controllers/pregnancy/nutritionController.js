const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNutritionLog = async (req, res) => {
  try {
    const { mealType, foodItems, totalCalories, totalProtein, totalCarbs, totalFat, totalFolate, totalIron } = req.body;
    const userId = req.user.id;

    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Pregnant profile not found' });
    }

    const nutritionLog = await prisma.nutritionLog.create({
      data: {
        profileId: profile.id,
        date: new Date(),
        mealType,
        foodItems,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFolate,
        totalIron
      }
    });

    res.status(201).json(nutritionLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const logs = await prisma.nutritionLog.findMany({
      where: { profileId: profile.id },
      orderBy: { date: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNutritionLog, getLogs };