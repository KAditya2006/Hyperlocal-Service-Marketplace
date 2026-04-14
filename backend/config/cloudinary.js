const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const kycStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'marketplace_kyc',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf']
  }
});

const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'marketplace_chat',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});

const kycFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  cb(null, allowed.includes(file.mimetype));
};

const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage: kycStorage,
  fileFilter: kycFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = { cloudinary, upload, uploadImage };
