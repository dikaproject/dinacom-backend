const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createDailyCheckup = async (req, res) => {
  try {
    const { weight, bloodPressure, mood, sleepHours, waterIntake, symptoms, notes } = req.body;
    const userId = req.user.id;

    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Pregnant profile not found' });
    }

    const checkup = await prisma.dailyCheckup.create({
      data: {
        profileId: profile.id,
        date: new Date(),
        weight,
        bloodPressure,
        mood,
        sleepHours,
        waterIntake,
        symptoms,
        notes
      }
    });

    res.status(201).json(checkup);
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

    const logs = await prisma.dailyCheckup.findMany({
      where: { profileId: profile.id },
      orderBy: { date: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDailyCheckup, getLogs };