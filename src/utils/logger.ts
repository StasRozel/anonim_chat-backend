import pino from "pino";

require("dotenv").config();

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label: any) => {
      return { level: label.toUpperCase() };
    },
  },
  redact: ['user.name', 'user.address', 'user.passport', 'user.phone'],
  timestamp: pino.stdTimeFunctions.isoTime,
}, );

export default logger;
