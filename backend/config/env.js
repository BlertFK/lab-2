const Joi = require("joi");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(5000),
  APP_NAME: Joi.string().default("RealEstate"),
  FRONTEND_URL: Joi.string().uri().default("http://localhost:5173"),
  SOCKET_PATH: Joi.string().default("/socket.io"),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow("").default(""),
  DB_NAME: Joi.string().required(),
  DB_CONNECTION_LIMIT: Joi.number().default(10),

  REDIS_URL: Joi.string().default("redis://localhost:6379"),
  REDIS_PREFIX: Joi.string().default("realestate"),
  REDIS_ENABLED: Joi.boolean().default(false),

  MONGO_URI: Joi.string().default("mongodb://localhost:27017/realestate_logs"),
  MONGO_ENABLED: Joi.boolean().default(false),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  BCRYPT_ROUNDS: Joi.number().default(10),

  CORS_ORIGINS: Joi.string().default("http://localhost:5173,http://localhost:3000"),

  UPLOAD_DIR: Joi.string().default("./uploads"),
  MAX_UPLOAD_SIZE_MB: Joi.number().default(10),
  ALLOWED_MIME_TYPES: Joi.string().default("image/jpeg,image/png,image/webp,application/pdf"),

  SMTP_HOST: Joi.string().allow("").default(""),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow("").default(""),
  SMTP_PASS: Joi.string().allow("").default(""),
  SMTP_FROM: Joi.string().default("RealEstate <noreply@realestate.local>"),

  STRIPE_SECRET_KEY: Joi.string().allow("").default(""),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow("").default(""),

  // legacy compatibility with existing controllers
  JWT_SECRET: Joi.string().optional(),
  JWT_EXPIRES_IN: Joi.string().optional(),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  const details = error.details.map((d) => `  - ${d.message}`).join("\n");
  // eslint-disable-next-line no-console
  console.error(`\nEnvironment validation failed:\n${details}\n`);
  process.exit(1);
}

const env = {
  nodeEnv: value.NODE_ENV,
  isProd: value.NODE_ENV === "production",
  isDev: value.NODE_ENV === "development",
  port: value.PORT,
  appName: value.APP_NAME,
  frontendUrl: value.FRONTEND_URL,
  socketPath: value.SOCKET_PATH,
  db: {
    host: value.DB_HOST,
    port: value.DB_PORT,
    user: value.DB_USER,
    password: value.DB_PASSWORD,
    name: value.DB_NAME,
    connectionLimit: value.DB_CONNECTION_LIMIT,
  },
  redis: {
    url: value.REDIS_URL,
    prefix: value.REDIS_PREFIX,
    enabled: value.REDIS_ENABLED,
  },
  mongo: {
    uri: value.MONGO_URI,
    enabled: value.MONGO_ENABLED,
  },
  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET,
    accessExpiresIn: value.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: value.JWT_REFRESH_SECRET,
    refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN,
    bcryptRounds: value.BCRYPT_ROUNDS,
  },
  cors: {
    origins: value.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  },
  uploads: {
    dir: value.UPLOAD_DIR,
    maxSizeMb: value.MAX_UPLOAD_SIZE_MB,
    allowedMimeTypes: value.ALLOWED_MIME_TYPES.split(",").map((s) => s.trim()),
  },
  smtp: {
    host: value.SMTP_HOST,
    port: value.SMTP_PORT,
    user: value.SMTP_USER,
    pass: value.SMTP_PASS,
    from: value.SMTP_FROM,
  },
  stripe: {
    secretKey: value.STRIPE_SECRET_KEY,
    webhookSecret: value.STRIPE_WEBHOOK_SECRET,
  },
};

module.exports = env;
