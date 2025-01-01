const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const doctorSeeder = async () => {
    console.log('Seeding doctors...');

    const users = await prisma.user.findMany({
        select: { id: true },
    });
    const layananKesehatan = await prisma.layananKesehatan.findMany({
        select: { id: true },
    });

    if (users.length === 0) {
        console.error('Error: Tidak ada data User. Tambahkan data User terlebih dahulu.');
        return;
    }
    if (layananKesehatan.length === 0) {
        console.error('Error: Tidak ada data LayananKesehatan. Tambahkan data LayananKesehatan terlebih dahulu.');
        return;
    }

    const doctors = [
        {
            id: '1d2f3b4c-5678-1234-9123-abcdef123456',
            userId: users[0].id, // Ambil userId dari data User
            fullName: 'Dr. Ahmad Subandi',
            strNumber: 'STR-123456',
            sipNumber: 'SIP-789012',
            phoneNumber: '+621234567890',
            photoProfile: null,
            documentsProof: null,
            provinsi: 'Jawa Barat',
            kabupaten: 'Bandung',
            kecamatan: 'Cicendo',
            address: 'Jl. Kesehatan No. 123, Cicendo, Bandung',
            codePos: '40174',
            layananKesehatanId: layananKesehatan[0].id, // Ambil layananKesehatanId dari data LayananKesehatan
            consultationFee: 150000,
            educationBackground: 'Universitas Kedokteran Indonesia',
            verificationStatus: 'PENDING',
            verifiedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    for (const doctor of doctors) {
        try {
            await prisma.doctor.upsert({
                where: { id: doctor.id },
                update: doctor,
                create: doctor,
            });
        } catch (error) {
            console.error(`Error seeding doctor with ID ${doctor.id}:`, error.message);
        }
    }

    console.log('Seeding doctors completed.');
};

module.exports = doctorSeeder;
