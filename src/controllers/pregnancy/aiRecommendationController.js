const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Rekomendasi default per trimester, untuk fallback jika data kurang lengkap
const defaultRecommendations = {
  FIRST_TRIMESTER: {
    diet: "Focus on folic acid-rich foods, stay hydrated, small frequent meals to manage nausea",
    exercise: "Light walking, gentle stretching, avoid high-impact activities",
    precautions: "Avoid raw foods, limit caffeine, get plenty of rest",
    activities: "Take prenatal vitamins, attend early prenatal checkups"
  },
  SECOND_TRIMESTER: {
    diet: "Increase calcium and iron intake, eat plenty of fruits and vegetables",
    exercise: "Regular walking, prenatal yoga, swimming",
    precautions: "Avoid lying flat on back, maintain good posture",
    activities: "Start planning nursery, continue regular checkups"
  },
  THIRD_TRIMESTER: {
    diet: "Small frequent meals, foods rich in omega-3, maintain hydration",
    exercise: "Gentle walking, pelvic floor exercises, stretching",
    precautions: "Watch for swelling, avoid heavy lifting",
    activities: "Prepare hospital bag, attend childbirth classes"
  }
};

const analyzeHealthData = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.pregnantProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        message: 'No pregnancy profile found. Please create your profile first.'
      });
    }

    // Cek old recommendation
    const lastRecommendation = await prisma.aIRecommendation.findFirst({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    let needNewRecommendation = true;

    // Jika ada rekomendasi lama
    if (lastRecommendation) {
      const diffMs = now.getTime() - lastRecommendation.createdAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // Jika rekomendasi kurang dari 7 hari, gunakan rekomendasi lama
      if (diffDays < 7) {
        return res.json({ 
          analysis: lastRecommendation.recommendation, 
          message: 'Using existing recommendation (less than 7 days old)'
        });
      }
    }

    // Jika sampai di sini, artinya rekomendasi sudah >7 hari atau belum ada
    // Hapus semua rekomendasi lama agar tidak menumpuk
    await prisma.aIRecommendation.deleteMany({
      where: { profileId: profile.id }
    });

    // Jika data checkup kurang lengkap, pakai default recommendations
    const { weight, nutrition } = req.body;
    if (!weight || !nutrition) {
      const trimester = profile.trimester || 'FIRST_TRIMESTER';
      const defaultRecs = defaultRecommendations[trimester] || defaultRecommendations.FIRST_TRIMESTER;
      const defaultAnalysis = `
        Weekly Recommendations for Week ${profile.pregnancyWeek}:

        Diet: ${defaultRecs.diet}

        Exercise: ${defaultRecs.exercise}

        Health Precautions: ${defaultRecs.precautions}

        Daily Activities: ${defaultRecs.activities}
      `;

      const newRec = await prisma.aIRecommendation.create({
        data: {
          profileId: profile.id,
          type: 'HEALTH',
          week: profile.pregnancyWeek,
          trimester: profile.trimester,
          recommendation: defaultAnalysis,
          analysis: 'Default Weekly Recommendations'
        }
      });

      return res.json({
        analysis: newRec.recommendation,
        message: 'New default recommendation created (missing checkup data)'
      });
    }

    const promptText = `Weight: ${weight}, Nutrition: ${JSON.stringify(nutrition)}, Trimester: ${profile.trimester}, Week: ${profile.pregnancyWeek}. 
Please generate a pregnancy recommendation.`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful medical assistant." },
        { role: "user", content: promptText }
      ]
    });

    const aiContent = aiResponse.choices?.[0]?.message?.content || "Recommendation not found";

    // Simpan rekomendasi baru ke DB
    const newRecommendation = await prisma.aIRecommendation.create({
      data: {
        profileId: profile.id,
        type: 'HEALTH',
        week: profile.pregnancyWeek,
        trimester: profile.trimester,
        recommendation: aiContent,
        analysis: 'Weekly AI Recommendation'
      }
    });

    res.json({
      analysis: newRecommendation.recommendation,
      message: 'New AI recommendation generated'
    });
  } catch (error) {
    console.error('AI Analysis error:', error);
    return res.status(500).json({
      message: 'Failed to generate AI recommendation',
      error: error.message
    });
  }
};

module.exports = { analyzeHealthData };