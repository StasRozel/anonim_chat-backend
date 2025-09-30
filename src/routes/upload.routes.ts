// routes/upload.routes.ts
import express from 'express';
import { upload } from '../middleware/upload.middleware';
import { FileService } from '../services/file.service';
import path from 'path';
import fs from 'fs/promises';
import { getMimeType } from '../utils/getMimeType';
import { getFolderByType } from '../utils/getFolderByType';

const router = express.Router();

// Функция для создания необходимых папок
const ensureUploadDirectories = async () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const subDirs = ['images', 'documents', 'videos', 'temp', 'thumbnails'];
  
  try {
    // Создаем основную папку uploads
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Создаем подпапки
    for (const subDir of subDirs) {
      const dirPath = path.join(uploadDir, subDir);
      await fs.mkdir(dirPath, { recursive: true });
    }
    
    console.log('Upload directories ensured');
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw error;
  }
};

router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    // Убеждаемся, что все необходимые папки существуют
    await ensureUploadDirectories();
    
    const files = req.files as Express.Multer.File[];
    const processedFiles = [];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Нет загруженных файлов'
      });
      return;
    }

    for (const file of files) {
      const validation = FileService.validateFile(file);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: validation.error
        });
        return;
      }

      let thumbnailUrl = null;

      if (file.mimetype.startsWith('image/')) {
        await FileService.optimizeImage(file.path);
        thumbnailUrl = await FileService.createThumbnail(file.path);
      }

      if (file.mimetype.startsWith('video/')) {
        thumbnailUrl = await FileService.createVideoThumbnail(file.path);
      }

      const fileInfo = {
        id: path.basename(file.filename, path.extname(file.filename)),
        originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        filename: file.filename,
        url: `/uploads/${getFolderByType(file.mimetype)}/${file.filename}`,
        thumbnailUrl: thumbnailUrl ? `/uploads/thumbnails/${path.basename(thumbnailUrl)}` : null,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      };

      processedFiles.push(fileInfo);
    }

    res.json({
      success: true,
      files: processedFiles
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки файлов'
    });
  }
});

router.get('/download/:filename', async (req, res) => {
  try {
    // Убеждаемся, что все необходимые папки существуют
    await ensureUploadDirectories();
    
    const { filename } = req.params;
    
    const possibleFolders = ['images', 'documents', 'videos', 'temp'];
    let filePath = null;
    let foundFolder = null;

    for (const folder of possibleFolders) {
      const testPath = path.join(process.cwd(), 'uploads', folder, filename);
      try {
        await fs.access(testPath);
        filePath = testPath;
        foundFolder = folder;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!filePath) {
      const rootPath = path.join(process.cwd(), 'uploads', filename);
      try {
        await fs.access(rootPath);
        filePath = rootPath;
      } catch (error) {
        res.status(404).json({ error: 'Файл не найден' });
        return;
      }
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const mimeType = getMimeType(filename);
    res.setHeader('Content-Type', mimeType);
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Ошибка при скачивании файла' });
  }
});

export default router;