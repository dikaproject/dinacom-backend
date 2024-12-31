const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const layananKesehatanSeeder = async () => {
    console.log('Seeding layanan kesehatan...');

    const layananKesehatanData = [
        {
            id: '1b2d3f4a-5678-1234-9123-abcdef123456',
            name: 'Rumah Sakit Sehat Selalu',
            type: 'Rumah Sakit',
            noIzin: 'RS1234567890',
            phoneNumber: '+621234567890',
            email: 'info@sehatalways.com',
            province: 'Jawa Barat',
            city: 'Bandung',
            district: 'Cicendo',
            address: 'Jl. Kesehatan No. 123, Cicendo, Bandung',
            codePos: '40174',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: '2a4f5d6e-7890-2345-8123-bcdef654321',
            name: 'Klinik Medika',
            type: 'Klinik',
            noIzin: 'KL1234567891',
            phoneNumber: '+621234567891',
            email: 'contact@klinikmedika.com',
            province: 'DKI Jakarta',
            city: 'Jakarta Timur',
            district: 'Cakung',
            address: 'Jl. Pelayanan No. 45, Cakung, Jakarta Timur',
            codePos: '13910',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: '3c4d5e6f-8901-3456-9123-bcdef123456',
            name: 'Puskesmas Sehat',
            type: 'Puskesmas',
            noIzin: 'PK1234567892',
            phoneNumber: '+621234567892',
            email: 'info@puskesmassehat.com',
            province: 'Jawa Tengah',
            city: 'Semarang',
            district: 'Semarang Selatan',
            address: 'Jl. Kesehatan No. 10, Semarang Selatan, Semarang',
            codePos: '50123',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: '4d5e6f7g-9012-4567-8123-bcdef654321',
            name: 'Klinik Keluarga Sehat',
            type: 'Klinik',
            noIzin: 'KL1234567893',
            phoneNumber: '+621234567893',
            email: 'contact@klinikkeluargasehat.com',
            province: 'Bali',
            city: 'Denpasar',
            district: 'Denpasar Selatan',
            address: 'Jl. Keluarga No. 20, Denpasar Selatan, Bali',
            codePos: '80222',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: '5e6f7g8h-0123-5678-9123-bcdef123456',
            name: 'Rumah Sakit Cinta Kasih',
            type: 'Rumah Sakit',
            noIzin: 'RS1234567894',
            phoneNumber: '+621234567894',
            email: 'info@cintakasihhospital.com',
            province: 'Jawa Timur',
            city: 'Surabaya',
            district: 'Gubeng',
            address: 'Jl. Cinta No. 30, Gubeng, Surabaya',
            codePos: '60281',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    for (const layanan of layananKesehatanData) {
        await prisma.layananKesehatan.upsert({
            where: { id: layanan.id },
            update: layanan,
            create: layanan,
        });
    }

    console.log('Seeding layanan kesehatan completed.');
};

module.exports = layananKesehatanSeeder;
