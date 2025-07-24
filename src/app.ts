import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Telegraf, Context } from 'telegraf';
import chatRoutes from './routes/chat';
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/api/chat', chatRoutes);

// Socket.IO для реального времени
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

  socket.on('send-message', (data) => {
    console.log('Message received:', data);
    // Отправляем сообщение всем пользователям в чате, кроме отправителя
    socket.to(data.chatId).emit('new-message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


const bot = new Telegraf<Context>(process.env.BOT_TOKEN || 'bruh...'); // Замените на токен от BotFather

// Обработчик команды /start
bot.start((ctx) => ctx.reply('Привет! Я простой бот. Напиши мне что-нибудь!'));

// Эхо-обработчик для всех текстовых сообщений
bot.on('text', (ctx) => ctx.reply(`Ты написал: ${ctx.message.text}`));

// Запуск бота
bot.launch();

console.log('Бот запущен...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export { app, server, io };