const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const calculatePregnancyWeek = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const pregnancyStart = new Date(due);
  pregnancyStart.setDate(due.getDate() - 280); // 40 weeks backwards
  
  const diffTime = Math.abs(today - pregnancyStart);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  return Math.min(diffWeeks, 40); // Cap at 40 weeks
};

const determinePregnancyWeek = (weekNumber) => {
  if (weekNumber <= 12) return 'FIRST_TRIMESTER';
  if (weekNumber <= 26) return 'SECOND_TRIMESTER';
  return 'THIRD_TRIMESTER';
};

const createProfile = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      phoneNumber,
      reminderTime,
      address,
      bloodType,
      height,
      dueDate,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'fullName',
      'dateOfBirth',
      'phoneNumber',
      'reminderTime',
      'address',
      'dueDate'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Calculate pregnancy week and trimester
    const pregnancyWeek = calculatePregnancyWeek(dueDate);
    const trimester = determinePregnancyWeek(pregnancyWeek);

    // Create profile
    const profile = await prisma.pregnantProfile.create({
      data: {
        userId: req.user.id, // From auth middleware
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        phoneNumber,
        reminderTime: new Date(reminderTime),
        address,
        bloodType,
        height: height ? parseFloat(height) : null,
        dueDate: new Date(dueDate),
        pregnancyWeek,
        trimester,
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Profile created successfully',
      profile
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProfile
};