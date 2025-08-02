import { Request, Response } from "express";
import { Message } from "../types/types";
import messageRepository from "../repositories/message.repository";

class ChatController {
  async getMessages(req: Request, res: Response) {
    try {
      const messages = await messageRepository.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
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
    console.log("newMessage:", newMessage);
    const createdMessage = await messageRepository.createMessage(newMessage);
    res.json(createdMessage);
  }
}

export const chatController = new ChatController();