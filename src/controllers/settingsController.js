const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, phoneNumber, address } = req.body;

    // Check if email exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already in use'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email,
        phoneNumber,
        address
      }
    });

    res.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      message: 'Failed to update password',
      error: error.message
    });
  }
};

module.exports = {
  updateProfile,
  updatePassword
};