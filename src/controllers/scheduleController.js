const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAvailableSchedules = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59);

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        date: {
          gte: startDate,
          lte: endDate
        },
        isBooked: false
      },
      orderBy: {
        time: 'asc'
      }
    });

    res.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAvailableSchedules };