import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/arneses';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const codigo = req.body.codigo || `arnes_${Date.now()}`;
    const codigoLimpio = codigo.replace(/[^a-zA-Z0-9-_]/g, '_');
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${codigoLimpio}_${Date.now()}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
