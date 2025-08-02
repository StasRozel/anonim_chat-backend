import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import chatRoutes from './routes/chat';
import { bot } from './services/tgbot.service';
import { dbConnection } from './config/db.config';
import { setupSocketHandlers } from './services/socket.service';

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/chat', chatRoutes);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL  || 'http://localhost:3000', // Укажите URL вашего фронтенда
    methods: ["GET", "POST", "PUT", "DELETE"],
  }
});

setupSocketHandlers(io);

async function startDB() {
  try {
    // Подключаемся к MongoDB
    await dbConnection.connect();
    console.log('Database connected successfully');

  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startDB();

// Запуск бота
bot.launch();

export { app, server, io };