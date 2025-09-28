// utils/initDirectories.ts
import fs from 'fs';
import path from 'path';

/**
 * Инициализация всех необходимых директорий при запуске сервера
 */
export const initializeDirectories = () => {
  const baseDir = process.cwd();
  const directories = [
    'uploads',
    'uploads/images',
    'uploads/documents', 
    'uploads/videos',
    'uploads/temp',
    'uploads/thumbnails',
    'logs'
  ];

  console.log('Initializing application directories...');

  directories.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      console.log(`Directory already exists: ${dir}`);
    }
  });

  console.log('Directory initialization completed.');
};