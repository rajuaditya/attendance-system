const app = require('./app');
const env = require('./config/env');
const { connectDB, sequelize } = require('./config/db');
const logger = require('./utils/logger');
require('./models'); // ensure all models + associations are registered

const startServer = async () => {
  await connectDB();

  // In production, use proper migrations instead of sync(). alter:true is
  // convenient for initial setup / demos but should be replaced by
  // versioned migrations before real production use.
  await sequelize.sync({ alter: env.NODE_ENV !== 'production' });
  logger.info('Database models synchronized.');

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await sequelize.close();
      logger.info('Server closed. Database connections released.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
  });
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
  });
};

startServer();
