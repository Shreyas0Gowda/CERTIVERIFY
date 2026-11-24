const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/certiverify";

let isConnected = false;
let fallbackMode = false;

// Fallback JSON-backed in-memory store in case MongoDB is offline
const storageFile = path.join(__dirname, "../uploads/certiverify_store.json");

const fallbackStore = {
  admins: [],
  certificates: [],
  verificationLogs: [],
};

function loadFallbackStore() {
  try {
    if (fs.existsSync(storageFile)) {
      const data = JSON.parse(fs.readFileSync(storageFile, "utf8"));
      fallbackStore.admins = data.admins || [];
      fallbackStore.certificates = data.certificates || [];
      fallbackStore.verificationLogs = data.verificationLogs || [];
    }
  } catch (err) {
    console.warn("Could not read fallback store file:", err.message);
  }
}

function saveFallbackStore() {
  try {
    const dir = path.dirname(storageFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(storageFile, JSON.stringify(fallbackStore, null, 2));
  } catch (err) {
    console.error("Could not persist fallback store:", err.message);
  }
}

async function connectDB() {
  loadFallbackStore();

  try {
    console.log(`Attempting MongoDB connection to: ${MONGODB_URI} ...`);
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    fallbackMode = false;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(
      `[Database Warning] Could not connect to MongoDB (${error.message}). Activating robust fallback in-memory persistent store.`
    );
    fallbackMode = true;
    isConnected = false;
    return false;
  }
}

function isDbConnected() {
  return isConnected;
}

function isFallbackMode() {
  return fallbackMode;
}

module.exports = {
  connectDB,
  isDbConnected,
  isFallbackMode,
  fallbackStore,
  saveFallbackStore,
};

