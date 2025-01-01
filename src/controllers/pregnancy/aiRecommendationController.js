const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const analyzeHealthData = async (req, res) => {
  try {
    const healthData = req.body;

    const prompt = `Based on pregnancy health data:
    Trimester: ${healthData.trimester}
    Weight: ${healthData.weight}kg
    Nutrition: ${JSON.stringify(healthData.nutrition)}
    Exercise: ${JSON.stringify(healthData.exercise)}
    
    Provide personalized recommendations for:
    1. Diet and nutrition
    2. Safe exercises
    3. Health precautions
    4. Daily activities`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = completion.choices[0].message.content;

    await prisma.aIRecommendation.create({
      data: {
        profileId: req.user.pregnantProfile.id,
        type: 'HEALTH',
        week: healthData.week,
        trimester: healthData.trimester,
        recommendation: analysis,
        analysis: 'AI Generated Health Recommendations'
      }
    });

    res.json({ analysis });
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { analyzeHealthData };