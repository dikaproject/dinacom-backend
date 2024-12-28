const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const layananKesehatanRoutes = require('./routes/LayananKesehatan');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/layanan-kesehatan', layananKesehatanRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;