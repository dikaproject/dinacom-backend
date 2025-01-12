const multer = require('multer');
const path = require('path');

// Base storage configuration
const createStorage = (folder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `uploads/${folder}/`);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
};

// File filters
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image file'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image or PDF file'), false);
  }
};

// Different upload configurations
const profileUpload = multer({
  storage: createStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
});

const documentsUpload = multer({
  storage: createStorage('documents'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFilter
});

const paymentUpload = multer({
  storage: createStorage('payments'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFilter
});

const thumbnailArticleUpload = multer({
  storage: createStorage('article'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
});

const productUpload = multer({
  storage: createStorage('product'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'photoProfile') {
      cb(null, 'uploads/profiles');
    } else if (file.fieldname === 'documentsProof') {
      cb(null, 'uploads/documents');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'photoProfile') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image file'));
    }
  } else if (file.fieldname === 'documentsProof') {
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = {
  profileUpload,
  documentsUpload,
  paymentUpload,
  thumbnailArticleUpload,
  productUpload,
  upload
};