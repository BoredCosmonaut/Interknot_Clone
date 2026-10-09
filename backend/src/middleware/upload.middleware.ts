import multer from "multer";
import path from "node:path";
import crypto from 'node:crypto';

const storage = multer.diskStorage({
    destination: (_req,_file,cb) => {
        cb(null,'uploads/');
    },
    filename:(_req,file,cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(16).toString('hex');
        cb(null,`${name}${ext}`);
    } ,
});

export const uploadImage = multer({
    storage,
    limits:{fileSize: 10 * 1024 * 1024},
    fileFilter: (_req,file,cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if(!allowed.includes(file.mimetype)) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null,true);
    },
}).single('image');