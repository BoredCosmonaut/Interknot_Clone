import multer from 'multer';


const imageFilter: multer.Options['fileFilter'] = (_req,file,cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if(!allowed.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null,true);
}

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('image');

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('avatar');