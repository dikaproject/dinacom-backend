const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const createNutritionLog = async (req, res) => {
  try {
    const { mealType, foodItems, totalCalories, totalProtein, totalCarbs, totalFat, totalFolate, totalIron } = req.body;
    const userId = req.user.id;

    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Pregnant profile not found' });
    }

    const nutritionLog = await prisma.nutritionLog.create({
      data: {
        profileId: profile.id,
        date: new Date(),
        mealType,
        foodItems,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFolate,
        totalIron
      }
    });

    res.status(201).json(nutritionLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const logs = await prisma.nutritionLog.findMany({
      where: { profileId: profile.id },
      orderBy: { date: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const analyzeFood = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ 
        message: 'Food description is required' 
      });
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `Analyze this meal and provide nutritional information in JSON format with the following structure:
          {
            "calories": number,
            "protein": number (in grams),
            "carbs": number (in grams),
            "fats": number (in grams)
          }
          
          Meal description: ${description}`
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

    // Parse JSON from AI response
    const nutritionData = JSON.parse(response.data.choices[0].message.content);
    
    res.json(nutritionData);
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze food nutrition',
      error: error.message 
    });
  }
};

module.exports = { 
  createNutritionLog, 
  getLogs, 
  analyzeFood 
};