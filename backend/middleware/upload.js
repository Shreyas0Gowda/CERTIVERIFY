const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".pdf" || file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF documents (.pdf) are supported."), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: fileFilter,
});

/**
 * Middleware that hashes the uploaded file buffer using SHA-256
 */
function hashUploadedFile(req, res, next) {
  if (!req.file || !req.file.buffer) {
    return next();
  }

  try {
    const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    req.fileHash = hash.toLowerCase();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate cryptographic SHA-256 hash from file.",
      error: error.message,
    });
  }
}

module.exports = {
  upload,
  hashUploadedFile,
};

