import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import chatRoutes from './routes/chat';
import { bot } from './services/tgbot.service';
import messageRepository from './repositories/message.repository';
import { dbConnection } from './config/db.config';
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL  || 'http://localhost:3000', // Укажите URL вашего фронтенда
    methods: ["GET", "POST", "PUT", "DELETE"],
  }
});

async function startDB() {
  try {
    // Подключаемся к MongoDB
    await dbConnection.connect();
    console.log('Database connected successfully');

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startDB();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-chat', (data) => {
    // Проверяем, передан ли объект с данными или просто строка chatId
    if (typeof data === 'string') {
      // Старый формат - только chatId
      const chatId = data;
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    } else if (data && data.chatId && data.user) {
      // Новый формат - объект с chatId и user
      const { chatId, user } = data;
      socket.join(chatId);
      console.log(`User ${user.first_name} (${socket.id}) joined chat: ${chatId}`);
      
      // Уведомляем других пользователей о подключении
      socket.to(chatId).emit('user-joined', {
        id: Date.now().toString(),
        text: `${user.first_name} присоединился к чату`,
        user: { id: 0, first_name: 'Система' },
        timestamp: new Date(),
        type: 'system'
      });
    } else {
      console.error('Invalid join-chat data format:', data);
    }
  });

  socket.on('send-message', async (data) => {
    console.log('Message received:', data);
    await messageRepository.createMessage(data.message);
    socket.to(data.chatId).emit('new-message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());
app.use('/api/chat', chatRoutes);

// Запуск бота
bot.launch();

export { app, server, io };