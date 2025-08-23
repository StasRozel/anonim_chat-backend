import { dbConnection } from "../config/db.config";
import { TelegramUser } from "../types/types";
import { Collection } from "mongodb";

class AuthRepository {
  private getCollection(): Collection<TelegramUser> {
    return dbConnection.getDb().collection<TelegramUser>("users");
  }

  async register(user: any): Promise<any> {
    try {
      const collection = this.getCollection();

      const foundUser = await collection.findOne({ id: user.id });

      if (foundUser) {
        console.warn("User already exists:", user);
        return { ...foundUser };
      }

      await collection.insertOne(user);
      return { ...user };
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  }

  async login(user: TelegramUser): Promise<TelegramUser | null> {
    try {
      const collection = this.getCollection();
      const foundUser = await collection.findOne({ id: user.id });

      if (!foundUser) {
        console.warn("User not found during login:", user);
        return null;
      }

      return { ...foundUser };
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  }
}


export const authRepository = new AuthRepository();