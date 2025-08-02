import messageRepository from "../repositories/message.repository";
import { Server } from "socket.io";

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-chat', (data) => {

    if (typeof data === 'string') {

      const chatId = data;
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    } else if (data && data.chatId && data.user) {

      const { chatId, user } = data;
      socket.join(chatId);
      console.log(`User ${user.first_name} (${socket.id}) joined chat: ${chatId}`);

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
    try {
        console.log('Message received:', data);
        
        // Генерируем уникальный ID и timestamp на сервере
        const messageWithServerData = {
          ...data.message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        };
        
        // Сохраняем в базу данных
        await messageRepository.createMessage(messageWithServerData);
        
        // ВАЖНО: Отправляем всем участникам чата (включая отправителя)
        // Изменяем socket.to() на io.to() чтобы включить отправителя
        io.to(data.chatId).emit('new-message', messageWithServerData);
        
        console.log(`Message sent to chat ${data.chatId}:`, messageWithServerData.text);
      } catch (error) {
        console.error('Error in send-message handler:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
};