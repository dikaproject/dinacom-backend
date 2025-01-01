const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getChatCommunity = async (req, res) => {
    try {
        const chats = await prisma.chatCommunity.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendChatCommunity = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        const newMessage = await prisma.chatCommunity.create({
            data: {
              userId,
              message,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          });
          

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getChatCommunity, sendChatCommunity };
