import { dbConnection } from "../config/db.config";
import { TelegramUser } from "../types/types";
import { Collection, ReturnDocument } from "mongodb";

class UserRepository {
  private getCollection(): Collection<TelegramUser> {
    return dbConnection.getDb().collection<TelegramUser>("users");
  }

  async getUsers(): Promise<TelegramUser[] | null> {
    try {
      const collection = this.getCollection();
      const users = await collection.find({}).toArray();

      if (!users) {
        console.warn("No users found");
        return null;
      }

      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<TelegramUser | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ id: id });

      if (!user) {
        console.warn("No user found");
        return null;
      }

      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  async banUser(user_id: number): Promise<TelegramUser | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOneAndUpdate(
        { id: user_id },
        { $set: { is_banned: true } },
        { returnDocument: 'after'}
      );

      if (!user) {
        console.warn("No users found");
        return null;
      }

      return user;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  async unbanUser(user_id: number): Promise<TelegramUser | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOneAndUpdate(
        { id: user_id },
        { $set: { is_banned: false } },
        { returnDocument: 'after'}
      );

      if (!user) {
        console.warn("No users found");
        return null;
      }

      return user;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  async setAdmin(user_id: number): Promise<TelegramUser | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOneAndUpdate(
        { id: user_id },
        { $set: { is_admin: true },  },
        { returnDocument: 'after' }
      );

      if (!user) {
        console.warn("No users found");
        return null;
      }

      return user;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  async deleteAdmin(user_id: number): Promise<TelegramUser | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOneAndUpdate(
        { id: user_id },
        { $set: { is_admin: false } },
        { returnDocument: "after" }
      );

      if (!user) {
        console.warn("No users found");
        return null;
      }

      return user;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
