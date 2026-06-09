const http = require("http");
const { Server } = require("socket.io");

const env = require("./config/env");           // validates process.env (Joi) at boot
const logger = require("./config/logger");
const app = require("./app");                  // Your express configuration lives here now
const db = require("./config/db");
const redis = require("./config/redis");
const { connectMongo } = require("./config/mongo");
const { startMongoArchiver } = require("./jobs/mongoArchiver.job");
const { registerSocketHandlers } = require("./services/socketService");
const blertSockets = require("./sockets");
const tokenCleanup = require("./jobs/tokenCleanup.job");

// NOTE: If you need to use the newly pulled cmsRoutes and fileRoutes, 
// they should be imported and linked via app.use() inside your backend/app.js file!

async function start() {
  // MySQL ping
  try {
    await db.query("SELECT 1");
    logger.info(`MySQL connected: ${env.db.name}@${env.db.host}:${env.db.port}`);
  } catch (err) {
    logger.error(`MySQL connection failed: ${err.message}`);
  }

  // Mongo (optional, only when MONGO_ENABLED=true)
  if (env.mongo.enabled) {
    await connectMongo();
    try {
      startMongoArchiver();
      logger.info("Mongo archiver scheduled.");
    } catch (err) {
      logger.warn(`Mongo archiver did not start: ${err.message}`);
    }
  } else {
    logger.info("Mongo disabled (MONGO_ENABLED=false). Archive job not scheduled.");
  }

  // Redis (optional, only when REDIS_ENABLED=true)
  await redis.init();

  // B34: nightly refresh-token cleanup
  tokenCleanup.start();

  // HTTP server + Socket.IO
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    path: env.socketPath,
    cors: {
      origin: env.cors.origins.length ? env.cors.origins : env.frontendUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  registerSocketHandlers(io);   // Fadil: thread/message/offer events
  blertSockets.attach(io);      // Blert: presence + admin room + session:revoked emit helpers

  httpServer.listen(env.port, () => {
    logger.info(`${env.appName} listening on http://localhost:${env.port} [${env.nodeEnv}]`);
    logger.info(`API docs:  http://localhost:${env.port}/api/docs`);
    logger.info(`Socket.IO: ${env.socketPath}`);
  });

  const shutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down...`);
    httpServer.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
  });
  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.stack || err.message}`);
    process.exit(1);
  });
}

start();