const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const db = require("./config/db");
const { connectMongo } = require("./config/mongo");
const { startMongoArchiver } = require("./jobs/mongoArchiver.job");
const { registerSocketHandlers } = require("./services/socketService");
const authRoutes = require("./routes/authRoutes");
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
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

app.use(cors());
app.use("/api/payments", paymentRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
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

app.get("/", (req, res) => {
  res.json({ message: "RealEstate API is running." });
});

app.get("/api", (req, res) => {
  res.json({
    message: "RealEstate API is running.",
    endpoints: [
      "/api/auth",
      "/api/properties",
      "/api/admin",
      "/api/buyer",
      "/api/favorites",
      "/api/messages",
      "/api/threads",
      "/api/reports",
      "/api/viewings",
      "/api/offers",
      "/api/transactions",
      "/api/reviews",
      "/api/agencies",
      "/api/agents",
      "/api/plans",
      "/api/payments",
      "/api/property-types",
      "/api/categories",
      "/api/cities",
      "/api/amenities",
    ],
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.query("SELECT 1");
    console.log(`Database connected successfully to "${process.env.DB_NAME}".`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }

  await connectMongo();
  startMongoArchiver();

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
