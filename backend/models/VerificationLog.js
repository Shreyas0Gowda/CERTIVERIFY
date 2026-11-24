const mongoose = require("mongoose");

const verificationLogSchema = new mongoose.Schema(
  {
    certificateHash: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    verificationResult: {
      type: String,
      enum: ["authentic", "invalid", "revoked", "error"],
      required: true,
    },
    certificateId: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    userAgent: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VerificationLog", verificationLogSchema);

