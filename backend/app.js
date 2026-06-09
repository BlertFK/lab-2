const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");

const env = require("./config/env");
const logger = require("./config/logger");
const swagger = require("./config/swagger");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");
const { authLimiter, apiLimiter } = require("./middleware/rateLimit.middleware");

// Blert routes (new)
const authRoutesNew = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const roleRoutes = require("./routes/role.routes");
const permissionRoutes = require("./routes/permission.routes");
const auditRoutes = require("./routes/audit.routes");
const notificationRoutes = require("./routes/notification.routes");
const settingsRoutes = require("./routes/settings.routes");
const searchRoutes = require("./routes/search.routes");

// Lis routes (CMS + Files)
const cmsRoutes = require("./routes/cmsRoutes");
const fileRoutes = require("./routes/fileRoutes");

// Fadil + legacy routes (preserved)
const propertyRoutes = require("./routes/propertyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const buyerRoutes = require("./routes/buyerRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const messageRoutes = require("./routes/messageRoutes");
const threadRoutes = require("./routes/threadRoutes");
const reportRoutes = require("./routes/reportRoutes");
const viewingRoutes = require("./routes/viewingRoutes");
const offerRoutes = require("./routes/offerRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const propertyAmenityRoutes = require("./routes/propertyAmenityRoutes");
const propertyImageRoutes = require("./routes/propertyImageRoutes");
const agencyRoutes = require("./routes/agencyRoutes");
const agentRoutes = require("./routes/agentRoutes");
const planRoutes = require("./routes/planRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const lookupRoutes = require("./routes/lookupRoutes");

const app = express();
app.disable("x-powered-by");

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (env.cors.origins.includes(origin) || env.cors.origins.includes("*")) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin} is not in the allowlist`));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Stripe webhook must see the raw body — mount payment route BEFORE json parsing.
app.use("/api/payments", paymentRoutes);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (!env.isProd) {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Swagger UI
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swagger.spec, {
    customSiteTitle: `${env.appName} API Docs`,
    swaggerOptions: { persistAuthorization: true },
  })
);
app.get("/api/openapi.json", (_req, res) => res.json(swagger.spec));

// General /api limiter (auth gets its own tighter limiter on its mount below)
app.use("/api", apiLimiter);

// ── Blert routes ────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutesNew);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/search", searchRoutes);

// ── Lis routes (CMS + Files) ───────────────────────────────────────
app.use("/api/files", fileRoutes);
app.use("/api/cms", cmsRoutes);

// ── Fadil + legacy routes ───────────────────────────────────────────
app.use("/api/properties", propertyRoutes);
app.use("/api/properties", propertyAmenityRoutes);
app.use("/api/properties", propertyImageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/viewings", viewingRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/plans", planRoutes);
app.use("/api", lookupRoutes);

// Index endpoints
app.get("/", (_req, res) => {
  res.json({ message: `${env.appName} API is running.`, env: env.nodeEnv, docs: "/api/docs" });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
