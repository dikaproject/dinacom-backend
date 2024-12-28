// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photoProfile") {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error('Please upload an image file'));
      }
    } else if (file.fieldname === "documentsProof") {
      if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
        return cb(new Error('Please upload an image or PDF file'));
      }
    }
    cb(null, true);
  }
});

module.exports = upload;