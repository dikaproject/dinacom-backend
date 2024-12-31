const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllCommunities = async (req, res) => {
    try {
        const communities = await prisma.community.findMany({
            include: {
                user: { select: { name: true, email: true } },
            },
        });
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCommunityById = async (req, res) => {
    try {
        const { id } = req.params;
        const community = await prisma.community.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true } },
                chats: { include: { user: { select: { name: true } } } },
            },
        });
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }
        res.json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCommunity = async (req, res) => {
    try {
        const { title, content, slug, userId } = req.body;
        const community = await prisma.community.create({
            data: {
                title,
                content,
                slug,
                userId,
            },
        });
        res.status(201).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const community = await prisma.community.update({
            where: { id },
            data: req.body,
        });
        res.json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.community.delete({
            where: { id },
        });
        res.json({ message: 'Community deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllCommunities,
    getCommunityById,
    createCommunity,
    updateCommunity,
    deleteCommunity,
};
