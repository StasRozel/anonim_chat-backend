import { MongoClient, ServerApiVersion, Db } from 'mongodb';
import logger from '../utils/logger';
require('dotenv').config();

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    if (this.client) {
      return; // Уже подключен
    }

    const uri = process.env.DB_URL;
    if (!uri) {
      throw new Error('DB_URL environment variable is not set');
    }

    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    try {
      await this.client.connect();
      this.db = this.client.db('anonim_chat_centerd17');
      
      // Проверяем подключение
      await this.db.admin().ping();
    } catch (error) {
      logger.error({ error }, 'Failed to connect to MongoDB');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.info('Disconnected from MongoDB');
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getClient(): MongoClient {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.client;
  }
}

export const dbConnection = new DatabaseConnection();