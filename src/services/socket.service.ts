import { Message } from "./../types/types";
import messageRepository from "../repositories/message.repository";
import { Server } from "socket.io";

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-chat", (data) => {
      if (typeof data === "string") {
        const chatId = data;
        socket.join(chatId);
        console.log(`User ${socket.id} joined chat: ${chatId}`);
      } else if (data && data.chatId && data.user) {
        const { chatId, user } = data;
        socket.join(chatId);
        console.log(
          `User ${user.first_name} (${socket.id}) joined chat: ${chatId}`
        );

        socket.to(chatId).emit("user-joined", {
          id: Date.now().toString(),
          text: `${user.first_name} присоединился к чату`,
          user: { id: 0, first_name: "Система" },
          timestamp: new Date(),
          type: "system",
        });
      } else {
        console.error("Invalid join-chat data format:", data);
      }
    });

    socket.on("send-message", async (data) => {
      try {
        console.log("Message received:", data);

        const messageWithServerData = {
          ...data.message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };

        await messageRepository.createMessage(messageWithServerData);

        io.to(data.chatId).emit("new-message", messageWithServerData);

        console.log(
          `Message sent to chat ${data.chatId}:`,
          messageWithServerData.text
        );
      } catch (error) {
        console.error("Error in send-message handler:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("pin-message", async (data) => {
      try {
        console.log("Message pinned:", data);

        const result = await messageRepository.pinMessage(data.message.id);

        io.to(data.chatId).emit("pin-message", result);
      } catch (error) {
        console.error("Error in pin-message handler:", error);
        socket.emit("error", { message: "Failed to pin message" });
      }
    });

    socket.on("unpin-message", async (data) => {
      try {
        console.log("Message unpinned:", data);

        const result = await messageRepository.unPinMessage(data.message.id);

        io.to(data.chatId).emit("unpin-message", result);
      } catch (error) {
        console.error("Error in pin-message handler:", error);
        socket.emit("error", { message: "Failed to pin message" });
      }
    });

    socket.on("delete-message", async (data) => {
      try {
        console.log("Message deleted:", data);

        const result = await messageRepository.deleteMessage(data.messageId);

        io.to(data.chatId).emit("delete-message", result);
      } catch (error) {
        console.error("Error in delete-message handler:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    socket.on("delete-all-messages", async (data) => {
      try {
        console.log("Deleting all messages for chat:", data);

        // Передаем chatId в репозиторий
        const result = await messageRepository.deleteAllMessages(data);

        // Отправляем ответ в тот же чат
        io.to(data).emit("delete-all-messages", {
          chatId: data,
          deletedCount: result,
        });

        console.log(
          `All messages deleted from chat: ${data}, count: ${result}`
        );
      } catch (error) {
        console.error("Error in delete-all-messages handler:", error);
        socket.emit("error", { message: "Failed to delete all messages" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
