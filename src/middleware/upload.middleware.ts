// middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Определяем папку по типу файла
    let folder = 'documents';
    if (file.mimetype.startsWith('image/')) folder = 'images';
    if (file.mimetype.startsWith('video/')) folder = 'videos';
    
    const uploadPath = `uploads/${folder}/`;
    
    // Создаем папку, если она не существует
    fs.mkdirSync(uploadPath, { recursive: true });
    
    // Также создаем папку thumbnails для миниатюр
    const thumbnailsPath = 'uploads/thumbnails/';
    fs.mkdirSync(thumbnailsPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя: uuid + расширение
    const extension = path.extname(file.originalname);
    cb(null, `${randomUUID()}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Запрещенные расширения
  const forbiddenExtensions = ['.exe', '.so'];
  const extension = path.extname(file.originalname).toLowerCase();

  if (forbiddenExtensions.includes(extension)) {
    cb(new Error('Запрещенный тип файла'), false);
  } else {
    cb(null, true);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // максимум 5 файлов за раз
  }
});