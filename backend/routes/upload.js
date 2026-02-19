const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

router.use(protect);

router.post('/image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No file uploaded' });

    // If Cloudinary is configured, upload there
    if (process.env.CLOUDINARY_API_KEY) {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'restaurant-reservations', resource_type: 'image' },
          (error, result) => (error ? reject(error) : resolve(result))
        ).end(req.file.buffer);
      });

      return res.status(200).json({
        status: 'success',
        data: { url: result.secure_url, publicId: result.public_id },
      });
    }

    // Fallback: return base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.status(200).json({ status: 'success', data: { url: base64 } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
