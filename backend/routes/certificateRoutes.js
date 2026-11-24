const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const certificateController = require("../controllers/certificateController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { upload, hashUploadedFile } = require("../middleware/upload");

// Rate limiter for public verification endpoint: 100 requests per 15 minutes per IP
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many verification requests from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public verification route
router.post(
  "/verify",
  verifyLimiter,
  upload.single("certificateFile"),
  hashUploadedFile,
  certificateController.verifyCertificate
);

// Protected routes (Admin only)
router.post(
  "/register",
  authenticateToken,
  requireAdmin,
  upload.single("certificateFile"),
  hashUploadedFile,
  certificateController.registerCertificate
);

router.get("/", authenticateToken, requireAdmin, certificateController.getCertificates);
router.get("/:id", certificateController.getCertificateById);
router.post("/:id/revoke", authenticateToken, requireAdmin, certificateController.revokeCertificate);

module.exports = router;

