require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/db");
const dbService = require("./services/dbService");
const bcrypt = require("bcryptjs");

const authRoutes = require("./routes/authRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const blockchainRoutes = require("./routes/blockchainRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Request logger for audit
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith("/api")) {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    system: "CERTIVERIFY API Gateway",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/blockchain", blockchainRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Internal Error]", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Initialize database and start server
async function startServer() {
  await connectDB();

  // Ensure default admin user is initialized
  try {
    const existing = await dbService.findAdminByUsernameOrEmail("admin");
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("AdminPassword123!", salt);
      await dbService.createAdmin({
        username: "admin",
        email: "admin@certiverify.edu",
        passwordHash,
        walletAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        role: "admin",
      });
      console.log("[Auto-Init] Default admin initialized: admin / AdminPassword123!");
    }
  } catch (seedErr) {
    console.warn("Could not check/seed admin:", seedErr.message);
  }

  // Start listening first so the API is responsive
  app.listen(PORT, () => {
    console.log("==================================================");
    console.log(`  CERTIVERIFY Backend API Server Online           `);
    console.log(`  Listening on port: ${PORT}                      `);
    console.log(`  API Base URL:      http://localhost:${PORT}/api `);
    console.log("==================================================");
  });

  // Auto-deploy + seed blockchain in background (with retry)
  autoDeployBlockchain();
}

/**
 * Attempts to deploy the smart contract and seed sample certificates.
 * Retries up to 5 times with 3-second delays in case the Hardhat node
 * is still starting up.
 */
async function autoDeployBlockchain() {
  const { ensureContractDeployed } = require("./config/blockchain");
  const maxAttempts = 5;
  const retryDelay = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Blockchain] Auto-deploy attempt ${attempt}/${maxAttempts}...`);
      const deployed = await ensureContractDeployed();
      if (deployed) {
        console.log("[Blockchain] ✅ Smart contract ready. Sample certificates are on-chain.");
        return;
      } else {
        console.log(`[Blockchain] ⚠️  Node not reachable on attempt ${attempt}. Retrying in ${retryDelay / 1000}s...`);
      }
    } catch (err) {
      console.log(`[Blockchain] ⚠️  Attempt ${attempt} failed: ${err.message}`);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  console.log("[Blockchain] ⚠️  Could not connect to Hardhat node after all retries.");
  console.log("[Blockchain]    Verification will work once start-blockchain.bat is running.");
}

startServer();

module.exports = app;

