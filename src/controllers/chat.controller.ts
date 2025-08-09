import { Request, Response } from "express";
import { Message } from "../types/types";
import messageRepository from "../repositories/message.repository";
import logger from "../utils/logger";

class ChatController {
  async getMessages(req: Request, res: Response) {
    try {
      const messages = await messageRepository.getMessages();
      res.json(messages);
    } catch (error) {
      logger.error({ error }, "Error fetching messages");
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMessageById(req: Request, res: Response) {
    try {
      const message = await messageRepository.getMessageById(req.params.id);
      res.json(message);
    } catch (error) {
      logger.error({ error }, "Error fetching messages");
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async sendMessage(req: Request, res: Response) {
    const { text, user } = req.body;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      user,
      timestamp: new Date(),
      type: "text",
      isPinned: false,
      replyTo: null
    };
    logger.info({ newMessage }, "newMessage");
    const createdMessage = await messageRepository.createMessage(newMessage);
    res.json(createdMessage);
  }
}

export const chatController = new ChatController();