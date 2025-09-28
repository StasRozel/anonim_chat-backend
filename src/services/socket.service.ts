import messageRepository from "../repositories/message.repository";
import { Server } from "socket.io";
import logger from "../utils/logger";
import { userRepository } from "../repositories/user.repository";
import {
  adminMiddleware,
  superAdminMiddleware,
} from "../middleware/admin.middleware";
import { Socket } from "dgram";
import { TelegramUser } from "@/types/types";

const ADMIN_EVENTS = new Set([
  "ban-user",
  "unban-user",
  "delete-all-messages",
  "delete-message",
  "pin-message",
  "unpin-message",
]);

const SUPER_ADMIN_EVENTS = new Set(["set-admin", "delete-admin"]);

// Вспомогательная функция для проверки админских прав
const checkAdminRights = (socket: any, eventName: string) => {
  const user = socket.data?.user;
  const superAdminId = process.env.SUPER_ADMIN_ID
    ? Number(process.env.SUPER_ADMIN_ID)
    : undefined;
  const isAdmin = user?.is_admin;
  const isSuperAdmin = user?.id === superAdminId;
  const hasRights = user && (isAdmin || isSuperAdmin);

  console.log(`${eventName} authorization check:`, {
    user: user ? { id: user.id, is_admin: user.is_admin } : null,
    superAdminId,
    hasUser: !!user,
    isAdmin,
    isSuperAdmin,
    hasRights,
  });

  if (!hasRights) {
    logger.warn(
      { socketId: socket.id, userId: user?.id },
      `Unauthorized ${eventName} attempt`
    );
    socket.emit("error", { message: "Forbidden: admin access required" });
    return false;
  }

  return true;
};

// Вспомогательная функция для проверки прав супер-админа
const checkSuperAdminRights = (socket: any, eventName: string) => {
  const user = socket.data?.user;
  const superAdminId = process.env.SUPER_ADMIN_ID
    ? Number(process.env.SUPER_ADMIN_ID)
    : undefined;
  const isSuperAdmin = user?.id === superAdminId;

  console.log(`${eventName} authorization check:`, {
    user: user ? { id: user.id, is_admin: user.is_admin } : null,
    superAdminId,
    hasUser: !!user,
    isSuperAdmin,
  });

  if (!isSuperAdmin) {
    logger.warn(
      { socketId: socket.id, userId: user?.id },
      `Unauthorized ${eventName} attempt`
    );
    socket.emit("error", { message: "Forbidden: super admin access required" });
    return false;
  }

  return true;
};

export const setupSocketHandlers = (io: Server) => {
  // Apply admin middleware globally for relevant events

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "User connected");

    socket.on("join-chat", (data) => {
      if (typeof data === "string") {
        const chatId = data;
        socket.join(chatId);
        logger.info({ socketId: socket.id, chatId }, `User joined chat`);
      } else if (data && data.chatId && data.user) {
        const { chatId, user } = data;

        console.log("Setting user data:", user);

        socket.data = socket.data || {};
        socket.data.user = user;

        console.log("socket.data after setting:", socket.data);
        console.log("socket.data.user verification:", socket.data.user);

        socket.join(chatId);
        logger.info(
          {
            socketId: socket.id,
            chatId,
            userName: user.first_name,
          },
          `User ${user.first_name} joined chat`
        );

        socket.to(chatId).emit("user-joined", {
          id: Date.now().toString(),
          text: `${user.first_name} присоединился к чату`,
          user: { id: 0, first_name: "Система" },
          timestamp: new Date(),
          type: "system",
        });
      } else {
        logger.error({ data }, "Invalid join-chat data format");
      }
    });

    socket.on("send-message", async (data) => {
      try {
        const { chatId, message } = data;

        const messageWithFiles = {
          ...message,
          id: `msg_${Date.now()}_${Math.random()}`,
          timestamp: new Date().toISOString(),
        };

        // Сохраняем в БД
        await messageRepository.createMessage(messageWithFiles);

        // Отправляем всем в чат
        io.to(chatId).emit("new-message", messageWithFiles);
      } catch (error: any) {
        logger.error("Error sending message:", error);
      }
    });

    socket.on("edit-message", async (data) => {
      try {
        logger.debug({ data }, "Message received");

        await messageRepository.editMessage(data.message);

        io.to(data.chatId).emit("edit-message", data.message);

        logger.info(
          {
            chatId: data.chatId,
            messageText: data.message.text,
          },
          `Message edit to chat`
        );
      } catch (error) {
        logger.error({ error }, "Error in efit-message handler");
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    socket.on("pin-message", async (data) => {
      try {
        if (!checkAdminRights(socket, "pin-message")) {
          return;
        }

        logger.info({ data }, "Message pinned");

        const result = await messageRepository.pinMessage(data.message.id);

        io.to(data.chatId).emit("pin-message", result);
      } catch (error) {
        logger.error({ error }, "Error in pin-message handler");
        socket.emit("error", { message: "Failed to pin message" });
      }
    });

    socket.on("unpin-message", async (data) => {
      try {
        if (!checkAdminRights(socket, "unpin-message")) {
          return;
        }

        logger.info({ data }, "Message unpinned");

        const result = await messageRepository.unPinMessage(data.message.id);

        io.to(data.chatId).emit("unpin-message", result);
      } catch (error) {
        logger.error({ error }, "Error in unpin-message handler");
        socket.emit("error", { message: "Failed to unpin message" });
      }
    });

    socket.on("delete-message", async (data) => {
      try {
        if (!checkAdminRights(socket, "delete-message")) {
          return;
        }

        logger.info({ data }, "Message deleted");

        const result = await messageRepository.deleteMessage(data.messageId);

        io.to(data.chatId).emit("delete-message", result);
      } catch (error) {
        logger.error({ error }, "Error in delete-message handler");
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    socket.on("delete-all-messages", async (data) => {
      try {
        if (!checkAdminRights(socket, "delete-all-messages")) {
          return;
        }

        logger.info({ chatId: data }, "Deleting all messages for chat");

        // Передаем chatId в репозиторий
        const result = await messageRepository.deleteAllMessages(data);

        // Отправляем ответ в тот же чат
        io.to(data).emit("delete-all-messages", {
          chatId: data,
          deletedCount: result,
        });

        logger.info(
          {
            chatId: data,
            deletedCount: result,
          },
          `All messages deleted from chat`
        );
      } catch (error) {
        logger.error({ error }, "Error in delete-all-messages handler");
        socket.emit("error", { message: "Failed to delete all messages" });
      }
    });

    socket.on("ban-user", async (data) => {
      try {
        if (!checkAdminRights(socket, "ban-user")) {
          return;
        }

        logger.info({ data }, "User banned");
        const result = await userRepository.banUser(data.userId);
        io.to("general-chat").emit("ban-user", result);
      } catch (error) {
        logger.error({ error }, "Error in ban-user handler");
        socket.emit("error", { message: "Failed to ban user" });
      }
    });

    socket.on("unban-user", async (data) => {
      try {
        if (!checkAdminRights(socket, "unban-user")) {
          return;
        }

        logger.info({ data }, "User unbanned");
        const result = await userRepository.unbanUser(data.userId);
        io.to("general-chat").emit("unban-user", result);
      } catch (error) {
        logger.error({ error }, "Error in unban-user handler");
        socket.emit("error", { message: "Failed to unban user" });
      }
    });

    socket.on("set-admin", async (data) => {
      try {
        if (!checkSuperAdminRights(socket, "set-admin")) {
          return;
        }

        logger.info({ data }, "User is admin now");
        const result = await userRepository.setAdmin(data.userId);
        io.to("general-chat").emit("set-admin", result);
      } catch (error) {
        logger.error({ error }, "Error in set-admin handler");
        socket.emit("error", { message: "Failed to set admin" });
      }
    });

    socket.on("delete-admin", async (data) => {
      try {
        if (!checkSuperAdminRights(socket, "delete-admin")) {
          return;
        }

        logger.info({ data }, "User isn`t admin now");
        const result = await userRepository.deleteAdmin(data.userId);
        io.to("general-chat").emit("delete-admin", result);
      } catch (error) {
        logger.error({ error }, "Error in delete-admin handler");
        socket.emit("error", { message: "Failed to remove admin" });
      }
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "User disconnected");
    });
  });
};
