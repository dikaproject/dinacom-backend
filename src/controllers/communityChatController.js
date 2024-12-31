const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllMessagesByCommunityId = async (req, res) => {
    try {
        const { communityId } = req.params;
        const messages = await prisma.message.findMany({
            where: { communityId },
            include: {
                sender: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createMessage = async (req, res) => {
    try {
        const { communityId, senderId, content } = req.body;
        const message = await prisma.message.create({
            data: {
                communityId,
                senderId,
                content,
            },
            include: {
                sender: { select: { name: true, email: true } },
            },
        });
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.message.delete({
            where: { id },
        });
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllMessagesByCommunityId,
    createMessage,
    deleteMessage,
};
