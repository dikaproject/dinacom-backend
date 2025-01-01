const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const generateHealthRecommendations = async (healthData) => {
  try {
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

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI Recommendation error:', error);
    throw error;
  }
};

module.exports = { generateHealthRecommendations };