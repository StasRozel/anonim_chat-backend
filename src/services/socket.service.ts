import messageRepository from "../repositories/message.repository";
import { Server } from "socket.io";
import logger from "../utils/logger";
import { userRepository } from "../repositories/user.repository";

const ADMIN_EVENTS = new Set([
  "ban-user",
  "unban-user",
  "delete-all-messages",
  "pin-message",
  "unpin-message",
]);

const SUPER_ADMIN_EVENTS = new Set(["set-admin", "delete-admin"]);

// События, которые заблокированы для забаненных пользователей
const USER_RESTRICTED_EVENTS = new Set([
  "send-message",
  "edit-message",
  "pin-message",
  "unpin-message",
]);

// Проверка статуса бана пользователя
const checkUserBanStatus = (socket: any, eventName: string) => {
  const user = socket.data?.user;
  
  // Если событие не требует проверки бана, разрешаем
  if (!USER_RESTRICTED_EVENTS.has(eventName)) {
    return true;
  }

  // Если пользователя нет, блокируем
  if (!user) {
    logger.warn(
      { socketId: socket.id },
      `Unauthorized ${eventName} attempt - no user data`
    );
    socket.emit("error", { message: "Forbidden: user authentication required" });
    return false;
  }

  // Проверяем статус бана
  if (user.is_banned) {
    logger.warn(
      { socketId: socket.id, userId: user.id },
      `Banned user attempted ${eventName}`
    );
    socket.emit("error", { message: "Forbidden: user is banned" });
    return false;
  }

  return true;
};

// Универсальная функция для проверки прав доступа
const checkEventPermissions = (socket: any, eventName: string) => {
  // Сначала проверяем статус бана
  if (!checkUserBanStatus(socket, eventName)) {
    return false;
  }

  const user = socket.data?.user;
  const superAdminId = process.env.SUPER_ADMIN_ID
    ? Number(process.env.SUPER_ADMIN_ID)
    : undefined;
  const isAdmin = user?.is_admin;
  const isSuperAdmin = user?.id === superAdminId;

  console.log(`${eventName} authorization check:`, {
    user: user ? { id: user.id, is_admin: user.is_admin, is_banned: user.is_banned } : null,
    superAdminId,
    hasUser: !!user,
    isAdmin,
    isSuperAdmin,
  });

  // Проверяем права для событий супер-админа
  if (SUPER_ADMIN_EVENTS.has(eventName)) {
    if (!isSuperAdmin) {
      logger.warn(
        { socketId: socket.id, userId: user?.id },
        `Unauthorized ${eventName} attempt - super admin required`
      );
      socket.emit("error", { message: "Forbidden: super admin access required" });
      return false;
    }
    return true;
  }

  // Проверяем права для обычных админских событий
  if (ADMIN_EVENTS.has(eventName)) {
    const hasAdminRights = user && (isAdmin || isSuperAdmin);
    if (!hasAdminRights) {
      logger.warn(
        { socketId: socket.id, userId: user?.id },
        `Unauthorized ${eventName} attempt - admin rights required`
      );
      socket.emit("error", { message: "Forbidden: admin access required" });
      return false;
    }
    return true;
  }

  // Для событий, не требующих админских прав
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
        if (!checkEventPermissions(socket, "send-message")) {
          return;
        }

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
        if (!checkEventPermissions(socket, "edit-message")) {
          return;
        }

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
        if (!checkEventPermissions(socket, "pin-message")) {
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
        if (!checkEventPermissions(socket, "unpin-message")) {
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
        if (!checkEventPermissions(socket, "delete-message")) {
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
        if (!checkEventPermissions(socket, "delete-all-messages")) {
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
        if (!checkEventPermissions(socket, "ban-user")) {
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
        if (!checkEventPermissions(socket, "unban-user")) {
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
        if (!checkEventPermissions(socket, "set-admin")) {
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
        if (!checkEventPermissions(socket, "delete-admin")) {
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
