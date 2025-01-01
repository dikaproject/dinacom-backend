const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createExerciseLog = async (req, res) => {
  try {
    const { activityType, duration, intensity, heartRate, notes } = req.body;
    const userId = req.user.id;

    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Pregnant profile not found' });
    }

    const exerciseLog = await prisma.exerciseLog.create({
      data: {
        profileId: profile.id,
        date: new Date(),
        activityType,
        duration,
        intensity,
        heartRate,
        notes
      }
    });

    res.status(201).json(exerciseLog);
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

    const logs = await prisma.exerciseLog.findMany({
      where: { profileId: profile.id },
      orderBy: { date: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createExerciseLog, getLogs };