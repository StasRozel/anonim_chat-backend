import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import chatRoutes from "./routes/chat";
import { bot } from "./services/tgbot.service";
import { dbConnection } from "./config/db.config";
import { setupSocketHandlers } from "./services/socket.service";
import logger from "./utils/logger";
import pinoHttp from "pino-http";

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/chat", chatRoutes);

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://web.telegram.org');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://web.telegram.org");
  next();
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

setupSocketHandlers(io);

(async function startDB() {
  try {
    await dbConnection.connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error(error, "Failed connect to database");
  }
})();

bot.launch();

export { app, server, io };
