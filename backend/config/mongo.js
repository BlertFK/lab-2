const mongoose = require("mongoose");

let connectionPromise = null;

const getMongoUri = () => process.env.MONGO_URI || process.env.MONGODB_URI || "";

const isMongoAvailable = () => mongoose.connection.readyState === 1;

const connectMongo = async () => {
  const uri = getMongoUri();
  if (!uri) {
    console.log("MongoDB not configured. Continuing with SQL fallback.");
    return null;
  }

  if (isMongoAvailable()) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 2500),
  })
    .then(() => {
      console.log("MongoDB connected successfully.");
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error("MongoDB connection failed:", error.message);
      return null;
    });

  return connectionPromise;
};

module.exports = {
  connectMongo,
  isMongoAvailable,
};
