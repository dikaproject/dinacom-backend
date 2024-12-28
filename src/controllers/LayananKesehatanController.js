const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllLayananKesehatan = async (req, res) => {
  try {
    const layananKesehatan = await prisma.layananKesehatan.findMany({
      include: { doctors: true }
    });
    res.json(layananKesehatan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLayananKesehatanById = async (req, res) => {
  try {
    const { id } = req.params;
    const layananKesehatan = await prisma.layananKesehatan.findUnique({
      where: { id },
      include: { doctors: true }
    });
    if (!layananKesehatan) {
      return res.status(404).json({ message: 'LayananKesehatan not found' });
    }
    res.json(layananKesehatan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createLayananKesehatan = async (req, res) => {
  try {
    const { name, type, noIzin, phoneNumber, email, province, city, district, address, codePos } = req.body;
    const layananKesehatan = await prisma.layananKesehatan.create({
      data: {
        name,
        type,
        noIzin,
        phoneNumber,
        email,
        province,
        city,
        district,
        address,
        codePos
      }
    });
    res.status(201).json(layananKesehatan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLayananKesehatan = async (req, res) => {
  try {
    const { id } = req.params;
    const layananKesehatan = await prisma.layananKesehatan.update({
      where: { id },
      data: req.body
    });
    res.json(layananKesehatan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLayananKesehatan = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.layananKesehatan.delete({
      where: { id }
    });
    res.json({ message: 'LayananKesehatan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllLayananKesehatan,
  getLayananKesehatanById,
  createLayananKesehatan,
  updateLayananKesehatan,
  deleteLayananKesehatan
};