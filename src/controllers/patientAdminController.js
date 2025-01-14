const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const calculatePregnancyWeek = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const pregnancyStart = new Date(due);
    pregnancyStart.setDate(due.getDate() - (40 * 7));
    const diffTime = today.getTime() - pregnancyStart.getTime();
    const currentWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.min(Math.max(1, currentWeek), 40);
};

const determinePregnancyWeek = (weekNumber) => {
    if (weekNumber <= 12) return 'FIRST_TRIMESTER';
    if (weekNumber <= 26) return 'SECOND_TRIMESTER';
    return 'THIRD_TRIMESTER';
};

const calculateDueDate = (startDate) => {
    const start = new Date(startDate);
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + 9);
    return dueDate;
};

function parseTime(timeString) {
    const date = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
    const [hour, minute] = timeString.split(':');
    const dateObj = new Date(date);
    dateObj.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
    return dateObj;
}

const getAllPatients = async (req, res) => {
    try {
        const patients = await prisma.user.findMany({
            where: { role: 'USER' },
            include: {
                profile: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const createPatient = async (req, res) => {
    try {
        const { email, password } = req.body;
        const profile = JSON.parse(req.body.profile);
        const photoProfile = req.file?.filename;

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ 
                message: 'Email already registered' 
            });
        }

        // Calculate pregnancy info
        const dueDate = calculateDueDate(profile.pregnancyStartDate);
        const pregnancyWeek = calculatePregnancyWeek(dueDate);
        const trimester = determinePregnancyWeek(pregnancyWeek);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'USER',
                    profile: {
                        create: {
                            fullName: profile.fullName,
                            dateOfBirth: new Date(profile.dateOfBirth),
                            phoneNumber: profile.phoneNumber,
                            reminderTime: parseTime(profile.reminderTime),
                            address: profile.address,
                            bloodType: profile.bloodType,
                            height: profile.height ? parseFloat(profile.height) : null,
                            pregnancyStartDate: new Date(profile.pregnancyStartDate),
                            dueDate,
                            pregnancyWeek,
                            trimester,
                            isWhatsappActive: false,
                            lastReminderSent: null,
                            photoProfile: photoProfile || null
                        }
                    }
                },
                include: {
                    profile: true
                }
            });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                profile: user.profile
            };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Create patient error:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(400).json({ 
                message: 'Email already registered' 
            });
        }
        res.status(500).json({ message: error.message });
    }
};


const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, profile } = req.body;
        const photoProfile = req.file?.filename;

        // Parse profile data if it's a string
        const profileData = typeof profile === 'string' ? JSON.parse(profile) : profile;

        // First find the user and their profile
        const user = await prisma.user.findUnique({
            where: { id },
            include: { profile: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = {
            email,
            ...(password && { password: await bcrypt.hash(password, 10) })
        };

        // Update profile data
        const pregnancyStartDate = new Date(profileData.pregnancyStartDate);
        const dueDate = calculateDueDate(pregnancyStartDate);
        const pregnancyWeek = calculatePregnancyWeek(dueDate);
        const trimester = determinePregnancyWeek(pregnancyWeek);

        const profileUpdateData = {
            fullName: profileData.fullName,
            dateOfBirth: new Date(profileData.dateOfBirth),
            phoneNumber: profileData.phoneNumber,
            reminderTime: parseTime(profileData.reminderTime),
            address: profileData.address,
            bloodType: profileData.bloodType,
            height: profileData.height ? parseFloat(profileData.height) : null,
            pregnancyStartDate,
            dueDate,
            pregnancyWeek,
            trimester,
            ...(photoProfile && { photoProfile })
        };

        // Perform transaction
        const result = await prisma.$transaction([
            prisma.user.update({
                where: { id },
                data: updateData
            }),
            prisma.pregnantProfile.update({
                where: { userId: id },
                data: profileUpdateData
            })
        ]);

        res.json({
            message: 'Patient updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({ 
            message: 'Failed to update patient',
            error: error.message 
        });
    }
};

const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient
};