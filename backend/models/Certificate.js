const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: [true, "Certificate ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    certificateHash: {
      type: String,
      required: [true, "Certificate SHA-256 hash is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, "Student ID/Roll number is required"],
      trim: true,
    },
    institution: {
      type: String,
      required: [true, "Institution name is required"],
      trim: true,
    },
    certificateTitle: {
      type: String,
      required: [true, "Certificate title is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    graduationYear: {
      type: Number,
      required: [true, "Graduation year is required"],
    },
    issueDate: {
      type: String,
      required: [true, "Issue date is required"],
    },
    blockchainTransactionHash: {
      type: String,
      required: [true, "Blockchain transaction hash is required"],
      trim: true,
    },
    issuerWallet: {
      type: String,
      required: [true, "Issuer wallet address is required"],
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["authentic", "revoked"],
      default: "authentic",
    },
    revocationReason: {
      type: String,
      default: "",
    },
    revocationTimestamp: {
      type: Date,
    },
    revocationTxHash: {
      type: String,
      default: "",
    },
    originalFileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching & filtering
certificateSchema.index({ studentName: "text", certificateId: "text", institution: "text" });

module.exports = mongoose.model("Certificate", certificateSchema);

