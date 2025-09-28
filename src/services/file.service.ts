// services/file.service.ts
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FileService {
  // Создаем thumbnail для изображений
  static async createThumbnail(imagePath: string): Promise<string> {
    const filename = path.basename(imagePath, path.extname(imagePath));
    const thumbnailPath = `uploads/thumbnails/${filename}_thumb.jpg`;

    await sharp(imagePath)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  // Создаем thumbnail для видео (используя ffmpeg)
  static async createVideoThumbnail(videoPath: string): Promise<string | null> {
    try {
      const filename = path.basename(videoPath, path.extname(videoPath));
      const thumbnailPath = `uploads/thumbnails/${filename}_thumb.jpg`;

      // Извлекаем кадр на 1 секунде видео
      await execAsync(`ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${thumbnailPath}"`);

      return thumbnailPath;
    } catch (error) {
      console.warn('Не удалось создать thumbnail для видео:', error);
      return null;
    }
  }

  // Сжимаем большие изображения
  static async optimizeImage(imagePath: string): Promise<void> {
    const stats = await fs.stat(imagePath);

    // Если файл больше 2MB - сжимаем
    if (stats.size > 2 * 1024 * 1024) {
      const tempPath = imagePath + '_optimized';

      await sharp(imagePath)
        .jpeg({ quality: 85 })
        .toFile(tempPath);

      // Заменяем оригинал оптимизированным
      await fs.rename(tempPath, imagePath);
    }
  }

  // Получаем информацию о файле
  static async getFileInfo(filePath: string) {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: ext,
      isImage: ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext),
      isVideo: ['.mp4', '.avi', '.mov', '.mkv'].includes(ext),
      isDocument: ['.pdf', '.doc', '.docx', '.txt'].includes(ext)
    };
  }

  // Валидация файла по размеру и типу
  static validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const forbiddenExtensions = ['.exe', '.so'];
    const extension = path.extname(file.originalname).toLowerCase();

    if (file.size > maxSize) {
      return { valid: false, error: 'Файл слишком большой (макс. 10MB)' };
    }

    if (forbiddenExtensions.includes(extension)) {
      return { valid: false, error: 'Запрещенный тип файла' };
    }

    return { valid: true };
  }

  // Удаление файла и связанных ресурсов
  static async deleteFile(filePath: string): Promise<void> {
    try {
      // Удаляем основной файл
      await fs.unlink(filePath);

      // Удаляем thumbnail если существует
      const filename = path.basename(filePath, path.extname(filePath));
      const thumbnailPath = `uploads/thumbnails/${filename}_thumb.jpg`;

      try {
        await fs.access(thumbnailPath);
        await fs.unlink(thumbnailPath);
      } catch {
        // Thumbnail не существует, игнорируем
      }
    } catch (error) {
      throw new Error(`Не удалось удалить файл: ${error}`);
    }
  }
}