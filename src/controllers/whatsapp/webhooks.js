const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const analyzeFood = async (foodDescription) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ API key not configured');
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
            
            Meal to analyze: "${foodDescription}"`
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          }
        }
      );
  
      let content = response.data.choices[0].message.content;
      content = content.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
  
      const nutritionData = JSON.parse(content);
      
      return {
        calories: Math.round(nutritionData.calories || 0),
        protein: Math.round(nutritionData.protein || 0),
        carbs: Math.round(nutritionData.carbs || 0),
        fats: Math.round(nutritionData.fats || 0),
        explanation: nutritionData.explanation || 'No explanation provided'
      };
    } catch (error) {
      console.error('AI Analysis error:', error);
      console.error('Food description:', foodDescription);
      throw new Error('Failed to analyze nutrition data');
    }
  };

const conversationStates = new Map();

const checkupQuestions = {
  weight: "Berapa berat badan Anda hari ini? (contoh: 65.5)",
  mood: "Bagaimana perasaan Anda hari ini?\n1. Sangat Baik\n2. Baik\n3. Biasa\n4. Kurang Baik\n5. Buruk",
  sleepHours: "Berapa jam Anda tidur tadi malam? (contoh: 8)",
  waterIntake: "Berapa gelas air yang Anda minum hari ini? (contoh: 8)",
  symptoms: "Apakah ada keluhan hari ini? (ketik '-' jika tidak ada)",
};

const nutritionQuestions = {
    mealType: "Pilih jenis makanan:\n1. Sarapan\n2. Makan Siang\n3. Makan Malam\n4. Camilan",
    foodItems: "Tuliskan makanan apa saja yang Anda makan\n(contoh: nasi putih, ayam goreng, sayur bayam)",
    inputMethod: "Pilih metode input nutrisi:\n1. Manual\n2. AI (Analisis otomatis)",
    manualNutrition: "Masukkan informasi nutrisi (format: kalori,protein,karbohidrat,lemak)\nContoh: 500,20,60,15",
    notes: "Ada catatan tambahan? (ketik '-' jika tidak ada)"
  };
  
  const exerciseQuestions = {
    activityType: "Pilih jenis aktivitas:\n1. Jalan kaki\n2. Yoga\n3. Senam hamil\n4. Berenang\n5. Lainnya",
    duration: "Berapa menit Anda berolahraga? (contoh: 30)",
    intensity: "Pilih intensitas:\n1. Ringan\n2. Sedang\n3. Berat",
    notes: "Ada catatan tambahan? (ketik '-' jika tidak ada)"
  };
  
  const mealTypeMap = {
    "1": "BREAKFAST",
    "2": "LUNCH",
    "3": "DINNER",
    "4": "SNACK"
  };
  
  const activityTypeMap = {
    "1": "WALKING",
    "2": "YOGA",
    "3": "PREGNANCY_EXERCISE",
    "4": "SWIMMING",
    "5": "OTHER"
  };
  
  const intensityMap = {
    "1": "LIGHT",
    "2": "MODERATE",
    "3": "VIGOROUS"
  };

const moodMap = {
  "1": "VERY_GOOD",
  "2": "GOOD",
  "3": "NEUTRAL",
  "4": "BAD",
  "5": "VERY_BAD"
};

const sendWhatsAppMessage = async (phone, message) => {
    try {
      const response = await axios.post('https://api.fonnte.com/send', {
        target: phone,
        message: message,
        delay: '1'
      }, {
        headers: {
          'Authorization': process.env.FONNTE_TOKEN
        }
      });
  
      console.log('Message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  

const handleWebhook = async (req, res) => {
    try {
        const { message, sender } = req.body;
        console.log('Incoming webhook:', { message, sender });

        // Skip processing if message is from our bot (contains Fonnte signature)
        if (message.includes('_Sent via fonnte.com_')) {
            return res.json({
                status: 'ignored',
                message: 'Bot message ignored'
            });
        }
    
        // Validate required fields
        if (!message || !sender) {
          console.error('Missing required fields');
          return res.status(400).json({
            status: 'error',
            message: 'Missing required fields'
          });
        }
    
        // Clean phone number and add country code if needed
        let cleanPhone = sender.replace(/^\+?62|^0/, '');
        if (!cleanPhone.startsWith('62')) {
          cleanPhone = '62' + cleanPhone;
        }
    
        console.log('Looking up profile for phone:', cleanPhone);
    
        // Find profile with more detailed logging
        const profile = await prisma.pregnantProfile.findFirst({
          where: { 
            phoneNumber: cleanPhone
          },
          include: {
            user: true
          }
        });
    
        if (!profile) {
          console.log('No profile found for phone:', cleanPhone);
          // Send helpful message to user
          await sendWhatsAppMessage(sender, 
            "Maaf, nomor Anda belum terdaftar. Silakan daftar di aplikasi kami terlebih dahulu: " +
            process.env.FRONTEND_URL
          );
          
          return res.json({
            status: 'warning',
            message: 'Profile not found, sent registration instructions'
          });
        }
    
        // Update profile to activate WhatsApp if not already
        if (!profile.isWhatsappActive) {
          await prisma.pregnantProfile.update({
            where: { id: profile.id },
            data: { isWhatsappActive: true }
          });
        }
  
      // Get current conversation state
      let state = conversationStates.get(cleanPhone) || { step: 'none' };
      let response = '';

      console.log('Current state:', state); // Debug log

      // Handle initial command for checkup (1)
      if (message.trim() === '1' && state.step === 'none') {
          // Check if already submitted today
          const lastCheckup = await prisma.dailyCheckup.findFirst({
              where: {
                  profileId: profile.id,
                  date: {
                      gte: new Date(new Date().setHours(0,0,0,0))
                  }
              }
          });

          if (lastCheckup) {
              response = "Anda sudah mengisi checkup hari ini 😊";
              state = { step: 'none' };
          } else {
              response = checkupQuestions.weight;
              state = { step: 'weight', data: {} };
          }
          
          // Update state and send response
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle weight input
      if (state.step === 'weight') {
          const weight = parseFloat(message);
          if (isNaN(weight) || weight < 30 || weight > 200) {
              response = "Berat badan tidak valid. Mohon masukkan angka yang benar (30-200)";
          } else {
              state.data.weight = weight;
              state.step = 'mood';
              response = checkupQuestions.mood;
          }
          
          // Update state and send response
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle mood input
      if (state.step === 'mood') {
          if (!['1','2','3','4','5'].includes(message)) {
              response = "Pilihan tidak valid. " + checkupQuestions.mood;
          } else {
              state.data.mood = moodMap[message];
              state.step = 'sleepHours';
              response = checkupQuestions.sleepHours;
          }
          
          // Update state and send response
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle sleepHours input
      if (state.step === 'sleepHours') {
          const sleep = parseInt(message);
          if (isNaN(sleep) || sleep < 0 || sleep > 24) {
              response = "Jam tidur tidak valid. Mohon masukkan angka 0-24";
          } else {
              state.data.sleepHours = sleep;
              state.step = 'waterIntake';
              response = checkupQuestions.waterIntake;
          }
          
          // Update state and send response
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle waterIntake input
      if (state.step === 'waterIntake') {
          const water = parseInt(message);
          if (isNaN(water) || water < 0 || water > 30) {
              response = "Jumlah tidak valid. Mohon masukkan angka 0-30";
          } else {
              state.data.waterIntake = water;
              state.step = 'symptoms';
              response = checkupQuestions.symptoms;
          }
          
          // Update state and send response
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle symptoms input
      if (state.step === 'symptoms') {
          state.data.symptoms = message === '-' ? null : message;
          
          // Save to database
          try {
              await prisma.dailyCheckup.create({
                  data: {
                      profileId: profile.id,
                      date: new Date(),
                      ...state.data
                  }
              });

              response = "✅ Checkup berhasil disimpan!\n\n" +
                        "Ringkasan:\n" +
                        `Berat: ${state.data.weight} kg\n` +
                        `Mood: ${state.data.mood}\n` +
                        `Tidur: ${state.data.sleepHours} jam\n` +
                        `Air: ${state.data.waterIntake} gelas\n` +
                        `Keluhan: ${state.data.symptoms || 'Tidak ada'}\n\n` +
                        "Terima kasih telah mengisi checkup hari ini! 😊";

              // Reset state
              state = { step: 'none' };
          } catch (error) {
              response = "Maaf, terjadi kesalahan. Silakan coba lagi.";
              state = { step: 'none' };
          }
          
          // Update state and send response
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle nutrition log (2)
      if (message.trim() === '2' && state.step === 'none') {
          response = nutritionQuestions.mealType;
          state = { step: 'nutrition_mealType', data: {} };
          
          // Update state and send response
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle nutrition flow
      if (state.step === 'nutrition_mealType') {
          if (!['1','2','3','4'].includes(message)) {
              response = "Pilihan tidak valid. " + nutritionQuestions.mealType;
          } else {
              state.data.mealType = mealTypeMap[message];
              state.step = 'nutrition_foodItems';
              response = nutritionQuestions.foodItems;
          }
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      if (state.step === 'nutrition_foodItems') {
          state.data.foodItems = message.split(',').map(item => item.trim());
          state.step = 'nutrition_inputMethod';
          response = nutritionQuestions.inputMethod;
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      if (state.step === 'nutrition_inputMethod') {
        if (!['1', '2'].includes(message)) {
          response = "Pilihan tidak valid. " + nutritionQuestions.inputMethod;
        } else if (message === '1') {
          state.step = 'nutrition_manual';
          response = nutritionQuestions.manualNutrition;
        } else {
          try {
            const nutritionData = await analyzeFood(state.data.foodItems.join(', '));
            state.data = {
              ...state.data,
              calories: nutritionData.calories,
              protein: nutritionData.protein,
              carbs: nutritionData.carbs,
              fats: nutritionData.fats
            };
            state.step = 'nutrition_notes';
            response = "✅ Analisis AI berhasil!\n\n" +
                       "Hasil Analisis:\n" +
                       `Kalori: ${nutritionData.calories} kkal\n` +
                       `Protein: ${nutritionData.protein}g\n` +
                       `Karbohidrat: ${nutritionData.carbs}g\n` +
                       `Lemak: ${nutritionData.fats}g\n\n` +
                       `Penjelasan: ${nutritionData.explanation}\n\n` +
                       nutritionQuestions.notes;
          } catch (error) {
            response = "Maaf, terjadi kesalahan analisis. Silakan coba input manual.\n" + nutritionQuestions.manualNutrition;
            state.step = 'nutrition_manual';
          }
        }
        
        conversationStates.set(cleanPhone, state);
        await sendWhatsAppMessage(sender, response);
        return res.json({ status: 'success' });
      }

      if (state.step === 'nutrition_manual') {
          const values = message.split(',').map(v => parseFloat(v.trim()));
          if (values.length !== 4 || values.some(v => isNaN(v))) {
              response = "Format tidak valid. " + nutritionQuestions.manualNutrition;
          } else {
              state.data = {
                  ...state.data,
                  calories: values[0],
                  protein: values[1],
                  carbs: values[2],
                  fats: values[3]
              };
              state.step = 'nutrition_notes';
              response = nutritionQuestions.notes;
          }
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      if (state.step === 'nutrition_notes') {
          try {
              await prisma.nutritionLog.create({
                  data: {
                      profileId: profile.id,
                      date: new Date(),
                      mealType: state.data.mealType,
                      foodItems: state.data.foodItems,
                      notes: message === '-' ? null : message,
                      calories: state.data.calories,
                      protein: state.data.protein,
                      carbs: state.data.carbs,
                      fats: state.data.fats
                  }
              });

              response = "✅ Catatan nutrisi berhasil disimpan!\n\n" +
                        "Ringkasan:\n" +
                        `Jenis: ${state.data.mealType}\n` +
                        `Makanan: ${state.data.foodItems.join(', ')}\n` +
                        `Kalori: ${state.data.calories} kkal\n` +
                        `Protein: ${state.data.protein}g\n` +
                        `Karbohidrat: ${state.data.carbs}g\n` +
                        `Lemak: ${state.data.fats}g\n` +
                        `Catatan: ${message === '-' ? 'Tidak ada' : message}`;
              
              state = { step: 'none' };
          } catch (error) {
              console.error('Save nutrition error:', error);
              response = "Maaf, terjadi kesalahan. Silakan coba lagi.";
              state = { step: 'none' };
          }
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle exercise log (3)
      if (message.trim() === '3' && state.step === 'none') {
          response = exerciseQuestions.activityType;
          state = { step: 'exercise_activityType', data: {} };
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Handle exercise flow
      if (state.step === 'exercise_activityType') {
          if (!['1','2','3','4','5'].includes(message)) {
              response = "Pilihan tidak valid. " + exerciseQuestions.activityType;
          } else {
              state.data.activityType = activityTypeMap[message];
              state.step = 'exercise_duration';
              response = exerciseQuestions.duration;
          }
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      if (state.step === 'exercise_duration') {
          const duration = parseInt(message);
          if (isNaN(duration) || duration < 1 || duration > 180) {
              response = "Durasi tidak valid. Mohon masukkan angka 1-180 menit";
          } else {
              state.data.duration = duration;
              state.step = 'exercise_intensity';
              response = exerciseQuestions.intensity;
          }
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      if (state.step === 'exercise_intensity') {
          if (!['1','2','3'].includes(message)) {
              response = "Pilihan tidak valid. " + exerciseQuestions.intensity;
          } else {
              state.data.intensity = intensityMap[message];
              state.step = 'exercise_notes';
              response = exerciseQuestions.notes;
          }
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      if (state.step === 'exercise_notes') {
          try {
              await prisma.exerciseLog.create({
                  data: {
                      profileId: profile.id,
                      date: new Date(),
                      activityType: state.data.activityType,
                      duration: state.data.duration,
                      intensity: state.data.intensity,
                      notes: message === '-' ? null : message
                  }
              });

              response = "✅ Catatan olahraga berhasil disimpan!\n\n" +
                        "Ringkasan:\n" +
                        `Aktivitas: ${state.data.activityType}\n` +
                        `Durasi: ${state.data.duration} menit\n` +
                        `Intensitas: ${state.data.intensity}\n` +
                        `Catatan: ${message === '-' ? 'Tidak ada' : message}`;
              
              state = { step: 'none' };
          } catch (error) {
              response = "Maaf, terjadi kesalahan. Silakan coba lagi.";
              state = { step: 'none' };
          }
          
          conversationStates.set(cleanPhone, state);
          await sendWhatsAppMessage(sender, response);
          return res.json({ status: 'success' });
      }

      // Default menu response
      if (state.step === 'none' && !['1','2','3','4'].includes(message.trim())) {
          response = `Perintah yang tersedia:
1️⃣ Checkup harian
2️⃣ Catatan nutrisi
3️⃣ Catatan olahraga
4️⃣ Lihat insight`;
          
          await sendWhatsAppMessage(sender, response);
      }

      return res.json({ status: 'success' });

    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  module.exports = { 
    handleWebhook,
    sendWhatsAppMessage 
  };