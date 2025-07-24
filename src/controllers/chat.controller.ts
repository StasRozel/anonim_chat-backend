import { Request, Response } from 'express';
import { Message } from '../types';

// Временное хранилище сообщений (в продакшене используйте базу данных)
let messages: Message[] = [
  {
    id: '1',
    text: 'Добро пожаловать в чат!',
    user: {
      id: 0,
      first_name: 'Система'
    },
    timestamp: new Date(),
    type: 'system'
  }
];

export const getMessages = (req: Request, res: Response) => {
  res.json(messages);
};

export const sendMessage = (req: Request, res: Response) => {
  const { text, user } = req.body;
  
  const newMessage: Message = {
    id: Date.now().toString(),
    text,
    user,
    timestamp: new Date(),
    type: 'text'
  };

  messages.push(newMessage);
  res.json(newMessage);
};