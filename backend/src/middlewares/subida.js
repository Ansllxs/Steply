import multer from 'multer';

// Los archivos quedan en memoria (req.file o req.files) y luego se mandan a Cloudinary.
// Máximo 5 MB por foto y hasta 5 fotos por petición.
export const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});
