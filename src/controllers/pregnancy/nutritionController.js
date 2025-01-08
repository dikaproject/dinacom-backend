const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const createNutritionLog = async (req, res) => {
  try {
    const { mealType, foodItems, calories, protein, carbs, fats, notes } = req.body;
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
        foodItems: Array.isArray(foodItems) ? foodItems : [foodItems], // Ensure array
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        notes: notes || ''
      }
    });

    res.status(201).json(nutritionLog);
  } catch (error) {
    console.error('Create nutrition log error:', error);
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

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        message: 'GROQ API key not configured'
      });
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `As a nutrition expert, analyze this meal and provide nutritional information. Only respond with a valid JSON object like this example, no other text:
          {
            "calories": 500,
            "protein": 20,
            "carbs": 60,
            "fats": 15,
            "explanation": "Brief calculation breakdown"
          }
          
          Meal to analyze: "${description}"`
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

    // Clean the response content
    let content = response.data.choices[0].message.content;
    content = content.replace(/```json\n?/, '').replace(/```\n?/, '').trim();

    try {
      const nutritionData = JSON.parse(content);
      
      const validatedData = {
        calories: Math.round(nutritionData.calories || 0),
        protein: Math.round(nutritionData.protein || 0),
        carbs: Math.round(nutritionData.carbs || 0),
        fats: Math.round(nutritionData.fats || 0),
        explanation: nutritionData.explanation || 'No explanation provided'
      };
      
      res.json(validatedData);
    } catch (parseError) {
      console.error('JSON Parse Error:', content);
      throw new Error('Invalid response format from AI');
    }
  } catch (error) {
    console.error('GROQ API Error:', error);
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