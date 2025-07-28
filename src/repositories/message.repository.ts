import { Message } from '../types';
import { dbConnection } from '../config/db.config'; // Импортируем клиент MongoDB
import { Collection } from 'mongodb';

class MessageRepository {
  private getCollection(): Collection<Message> {
    return dbConnection.getDb().collection<Message>('messages');
  }

  async createMessage(message: Omit<Message, '_id'>): Promise<Message> {
    try {
      const collection = this.getCollection();
      const result = await collection.insertOne(message);
      return { ...message, id: result.insertedId.getTimestamp().toDateString() };
    } catch (error) {
      console.error('Error creating message:', error);
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
      
      return messages.reverse(); // Возвращаем в хронологическом порядке
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getMessageById(id: string): Promise<Message | null> {
    try {
      const collection = this.getCollection();
      return await collection.findOne({ id });
    } catch (error) {
      console.error('Error fetching message by id:', error);
      throw error;
    }
  }
}

export default new MessageRepository();