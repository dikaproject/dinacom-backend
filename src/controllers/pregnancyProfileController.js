const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs').promises;

const calculatePregnancyWeek = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);

  // Start of pregnancy (40 weeks before due date)
  const pregnancyStart = new Date(due);
  pregnancyStart.setDate(due.getDate() - (40 * 7));

  // Hitung selisih minggu dari 'start kehamilan' sampai 'hari ini'
  const diffTime = today.getTime() - pregnancyStart.getTime();
  const currentWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

  // Batas di kisaran 1-40 minggu
  return Math.min(Math.max(1, currentWeek), 40);
};

function parseTime(timeString) {
  // Set to Jakarta timezone
  const date = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
  const [hour, minute] = timeString.split(':');
  const dateObj = new Date(date);
  dateObj.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
  return dateObj;
}

const determinePregnancyWeek = (weekNumber) => {
  if (weekNumber <= 12) return 'FIRST_TRIMESTER';
  if (weekNumber <= 26) return 'SECOND_TRIMESTER';
  return 'THIRD_TRIMESTER';
};

const calculateDueDate = (startDate) => {
  const start = new Date(startDate);
  const dueDate = new Date(start);
  dueDate.setMonth(start.getMonth() + 9); // Add 9 months
  return dueDate;
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
      pregnancyStartDate, // Changed from dueDate
    } = req.body;

    // Calculate due date from start date
    const dueDate = calculateDueDate(pregnancyStartDate);
    
    // Calculate pregnancy week
    const pregnancyWeek = calculatePregnancyWeek(dueDate);
    const trimester = determinePregnancyWeek(pregnancyWeek);

    const profile = await prisma.pregnantProfile.create({
      data: {
        userId: req.user.id,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        phoneNumber,
        reminderTime: parseTime(reminderTime),
        address,
        bloodType,
        height: height ? parseFloat(height) : null,
        dueDate, // Save calculated due date
        pregnancyStartDate: new Date(pregnancyStartDate),
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

const getProfile = async (req, res) => {
  try {
    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Transform response to match frontend expectations
    const responseProfile = {
      ...profile,
      photoProfile: profile.photoProfile || null,
      user: {
        email: profile.user.email,
        role: profile.user.role
      }
    };

    res.json({ profile: responseProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, address } = req.body;
    const photoProfile = req.file?.filename;

    // If new photo uploaded, delete old photo
    if (photoProfile) {
      const oldProfile = await prisma.pregnantProfile.findUnique({
        where: { userId: req.user.id },
        select: { photoProfile: true }
      });

      if (oldProfile?.photoProfile) {
        const oldPhotoPath = path.join(__dirname, '../../uploads/profiles', oldProfile.photoProfile);
        await fs.unlink(oldPhotoPath).catch(console.error);
      }
    }

    const updatedProfile = await prisma.pregnantProfile.update({
      where: { userId: req.user.id },
      data: {
        fullName,
        phoneNumber,
        address,
        ...(photoProfile && { photoProfile })
      },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile
};