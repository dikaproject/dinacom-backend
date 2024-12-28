const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'USER',
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.status(201).json({
      message: 'User registered successfully',
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const registerDoctor = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      strNumber,
      sipNumber,
      phoneNumber,
      provinsi,
      kabupaten,
      kecamatan,
      address,
      codePos,
      layananKesehatanId,
      educationBackground,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'email', 'password', 'fullName', 'strNumber', 
      'sipNumber', 'phoneNumber', 'provinsi', 'kabupaten',
      'kecamatan', 'address', 'codePos', 'layananKesehatanId',
      'educationBackground'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Validate layananKesehatan exists
    const layananKesehatan = await prisma.layananKesehatan.findUnique({
      where: { id: layananKesehatanId }
    });

    if (!layananKesehatan) {
      return res.status(400).json({ message: 'LayananKesehatan not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const photoProfile = req.files?.photoProfile?.[0]?.filename;
    const documentsProof = req.files?.documentsProof?.[0]?.filename;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'DOCTOR',
        doctor: {
          create: {
            fullName,
            strNumber,
            sipNumber,
            phoneNumber,
            provinsi,
            kabupaten,
            kecamatan,
            address,
            codePos,
            educationBackground,
            photoProfile,
            documentsProof,
            layananKesehatan: {
              connect: { id: layananKesehatanId }
            }
          },
        },
      },
      include: {
        doctor: {
          include: {
            layananKesehatan: true
          }
        },
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.status(201).json({
      message: 'Doctor registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        doctor: user.doctor
      }
    });
  } catch (error) {
    console.error('Register doctor error:', error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctor: {
          include: {
            layananKesehatan: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        doctor: user.doctor
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  registerDoctor,
  login,
};