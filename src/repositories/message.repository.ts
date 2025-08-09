import { Message } from '../types/types';
import { dbConnection } from '../config/db.config'; // Импортируем клиент MongoDB
import { Collection } from 'mongodb';
import logger from '../utils/logger';

class MessageRepository {
  private getCollection(): Collection<Message> {
    return dbConnection.getDb().collection<Message>('messages');
  }

  public async getMessageById(id: string): Promise<Message | null> {
    return dbConnection.getDb().collection<Message>('messages').findOne({ id });
  }

  async createMessage(message: Omit<Message, '_id'>): Promise<Message> {
    try {
      const collection = this.getCollection();
      const result = await collection.insertOne(message);
      return { ...message, id: result.insertedId.getTimestamp().toDateString() };
    } catch (error) {
      logger.error({ error }, 'Error creating message');
      throw error;
    }
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    try {
      const collection = this.getCollection();
      const messages = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return messages.reverse();
    } catch (error) {
      logger.error({ error }, 'Error fetching messages');
      throw error;
    }
  }

  async pinMessage(id: string): Promise<number> {
    try {
      const collection = this.getCollection()
      const messagePinned = await collection.updateOne({id}, { $set: { isPinned: true } });

      if (messagePinned.matchedCount === 0) {
        logger.warn(`Message with id ${id} not found for pinning.`);
        return 0;
      }
      return messagePinned.modifiedCount;
    } catch (error) {
      logger.error({ error }, 'Error fetching messages');
      throw error;
    }
  }

  async unPinMessage(id: string): Promise<number> {
    try {
      const collection = this.getCollection()
      const messagePinned = await collection.updateOne({id}, { $set: { isPinned: false } });

      if (messagePinned.matchedCount === 0) {
        logger.warn(`Message with id ${id} not found for pinning.`);
        return 0;
      }
      return messagePinned.modifiedCount;
    } catch (error) {
      logger.error({ error }, 'Error fetching messages');
      throw error;
    }
  }

  async deleteMessage(id: string): Promise<number> {
    try {
      const collection = this.getCollection()
      logger.info({ id }, "Deleting message with id");
      const messagePinned = await collection.deleteOne({id});
      logger.info({ id, result: messagePinned }, `Message with id ${id} delete`);

      return messagePinned.deletedCount;
    } catch (error) {
      logger.error({ error }, 'Error fetching messages');
      throw error;
    }
  }

  async deleteAllMessages(chatId?: string): Promise<number> {
  try {
    const collection = this.getCollection();
    
    // Если передан chatId, удаляем только сообщения этого чата
    // Если нет - удаляем все (для админских целей)
    const filter = chatId ? { chatId } : {};
    
    logger.info({ filter }, 'Deleting messages with filter');
    
    const result = await collection.drop();
  
    
    return 1;
  } catch (error) {
    logger.error({ error }, 'Error deleting messages');
    throw error;
  }
}

}

export default new MessageRepository();