import { server } from './app';
import logger from './utils/logger';

const PORT = 3001;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.once('SIGINT', () => {
  logger.info('SIGINT received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});