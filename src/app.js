const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const layananKesehatanRoutes = require('./routes/LayananKesehatan');
const VerificationDoctorController = require('./routes/VerificationDoctor');
const consultationController = require('./routes/consultation');
const articleCategoryRoutes = require('./routes/articleCategory');
const articleRoutes = require('./routes/article');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/layanan-kesehatan', layananKesehatanRoutes);
app.use('/api/doctor-verification', VerificationDoctorController);
app.use('/api/consultation', consultationController);
app.use('/api/article-category', articleCategoryRoutes);
app.use('/api/article', articleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;