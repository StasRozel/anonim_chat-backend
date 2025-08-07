import { Message } from '../types/types';
import { dbConnection } from '../config/db.config'; // Импортируем клиент MongoDB
import { Collection } from 'mongodb';

class MessageRepository {
  private getCollection(): Collection<Message> {
    return dbConnection.getDb().collection<Message>('messages');
  }

  private async getMessageById(id: string): Promise<Message | null> {
    return dbConnection.getDb().collection<Message>('messages').findOne({ id });
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
      
      return messages.reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async pinMessage(id: string): Promise<number> {
    try {
      const collection = this.getCollection()
      const messagePinned = await collection.updateOne({id}, { $set: { isPinned: true } });

      if (messagePinned.matchedCount === 0) {
        console.warn(`Message with id ${id} not found for pinning.`);
        return 0;
      }
      return messagePinned.modifiedCount;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async unPinMessage(id: string): Promise<number> {
    try {
      const collection = this.getCollection()
      const messagePinned = await collection.updateOne({id}, { $set: { isPinned: false } });

      if (messagePinned.matchedCount === 0) {
        console.warn(`Message with id ${id} not found for pinning.`);
        return 0;
      }
      return messagePinned.modifiedCount;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async deleteMessage(id: string): Promise<number> {
    try {
      const collection = this.getCollection()
      console.log("Deleting message with id:", id);
      const messagePinned = await collection.deleteOne({id});
      console.log(`Message with id ${id} delete:`, messagePinned);

      return messagePinned.deletedCount;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

}

export default new MessageRepository();