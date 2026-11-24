const Admin = require("../models/Admin");
const Certificate = require("../models/Certificate");
const VerificationLog = require("../models/VerificationLog");
const { isDbConnected, fallbackStore, saveFallbackStore } = require("../config/db");
const bcrypt = require("bcryptjs");

class DbService {
  // --- Admin Operations ---

  async findAdminByUsernameOrEmail(identifier) {
    if (isDbConnected()) {
      return await Admin.findOne({
        $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
      });
    }

    const lower = identifier.toLowerCase();
    const admin = fallbackStore.admins.find(
      (a) => a.username.toLowerCase() === lower || a.email.toLowerCase() === lower
    );
    if (!admin) return null;

    // Attach comparePassword helper
    return {
      ...admin,
      comparePassword: async (pwd) => bcrypt.compare(pwd, admin.passwordHash),
    };
  }

  async createAdmin(data) {
    if (isDbConnected()) {
      const existing = await Admin.findOne({
        $or: [{ username: data.username }, { email: data.email }],
      });
      if (existing) return existing;
      return await Admin.create(data);
    }

    const existing = fallbackStore.admins.find(
      (a) => a.username === data.username || a.email === data.email
    );
    if (existing) return existing;

    const newAdmin = {
      _id: "admin_" + Date.now(),
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      walletAddress: (data.walletAddress || "").toLowerCase(),
      role: data.role || "admin",
      createdAt: new Date(),
    };
    fallbackStore.admins.push(newAdmin);
    saveFallbackStore();
    return newAdmin;
  }

  // --- Certificate Operations ---

  async findCertificateById(certId) {
    if (isDbConnected()) {
      return await Certificate.findOne({ certificateId: certId });
    }
    return fallbackStore.certificates.find((c) => c.certificateId === certId) || null;
  }

  async findCertificateByHash(hash) {
    const cleanHash = hash.toLowerCase().trim();
    if (isDbConnected()) {
      return await Certificate.findOne({ certificateHash: cleanHash });
    }
    return fallbackStore.certificates.find((c) => c.certificateHash === cleanHash) || null;
  }

  async createCertificate(data) {
    const cleanData = {
      ...data,
      certificateHash: data.certificateHash.toLowerCase().trim(),
      issuerWallet: (data.issuerWallet || "").toLowerCase().trim(),
      status: "authentic",
      createdAt: new Date(),
    };

    if (isDbConnected()) {
      return await Certificate.create(cleanData);
    }

    const existing = fallbackStore.certificates.find(
      (c) =>
        c.certificateHash === cleanData.certificateHash ||
        c.certificateId === cleanData.certificateId
    );
    if (existing) {
      throw new Error("Duplicate certificate ID or Hash already exists in database");
    }

    const newDoc = {
      _id: "cert_" + Date.now(),
      ...cleanData,
    };
    fallbackStore.certificates.push(newDoc);
    saveFallbackStore();
    return newDoc;
  }

  async revokeCertificate(certificateHash, reason, txHash) {
    const cleanHash = certificateHash.toLowerCase().trim();
    const updateFields = {
      status: "revoked",
      revocationReason: reason || "Revoked by issuer",
      revocationTimestamp: new Date(),
      revocationTxHash: txHash || "",
    };

    if (isDbConnected()) {
      return await Certificate.findOneAndUpdate(
        { certificateHash: cleanHash },
        { $set: updateFields },
        { new: true }
      );
    }

    const cert = fallbackStore.certificates.find((c) => c.certificateHash === cleanHash);
    if (cert) {
      Object.assign(cert, updateFields);
      saveFallbackStore();
    }
    return cert;
  }

  async getCertificates(query = {}) {
    const { search, institution, status, page = 1, limit = 50 } = query;

    if (isDbConnected()) {
      const filter = {};
      if (status && status !== "all") filter.status = status;
      if (institution && institution !== "all") filter.institution = new RegExp(institution, "i");
      if (search) {
        filter.$or = [
          { studentName: new RegExp(search, "i") },
          { certificateId: new RegExp(search, "i") },
          { studentId: new RegExp(search, "i") },
          { certificateTitle: new RegExp(search, "i") },
        ];
      }

      const total = await Certificate.countDocuments(filter);
      const certificates = await Certificate.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      return { certificates, total, page: Number(page), pages: Math.ceil(total / limit) };
    }

    let list = [...fallbackStore.certificates];
    if (status && status !== "all") {
      list = list.filter((c) => c.status === status);
    }
    if (institution && institution !== "all") {
      list = list.filter((c) =>
        c.institution.toLowerCase().includes(institution.toLowerCase())
      );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.studentName?.toLowerCase().includes(q) ||
          c.certificateId?.toLowerCase().includes(q) ||
          c.studentId?.toLowerCase().includes(q) ||
          c.certificateTitle?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      certificates: paginated,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit) || 1,
    };
  }

  // --- Verification Logs ---

  async logVerification(data) {
    const logItem = {
      certificateHash: data.certificateHash?.toLowerCase().trim() || "",
      verificationResult: data.verificationResult,
      certificateId: data.certificateId || null,
      ipAddress: data.ipAddress || "127.0.0.1",
      userAgent: data.userAgent || "",
      notes: data.notes || "",
      verifiedAt: new Date(),
    };

    if (isDbConnected()) {
      try {
        return await VerificationLog.create(logItem);
      } catch (err) {
        console.warn("Could not write verification log to DB:", err.message);
      }
    }

    fallbackStore.verificationLogs.push({ _id: "log_" + Date.now(), ...logItem });
    saveFallbackStore();
    return logItem;
  }

  // --- Dashboard Statistics ---

  async getDashboardStats() {
    if (isDbConnected()) {
      const totalIssued = await Certificate.countDocuments();
      const totalRevoked = await Certificate.countDocuments({ status: "revoked" });
      const totalVerified = await VerificationLog.countDocuments();
      const recentCertificates = await Certificate.find()
        .sort({ createdAt: -1 })
        .limit(5);
      const recentVerifications = await VerificationLog.find()
        .sort({ verifiedAt: -1 })
        .limit(5);

      return {
        totalIssued,
        totalRevoked,
        totalActive: totalIssued - totalRevoked,
        totalVerified,
        recentCertificates,
        recentVerifications,
      };
    }

    const totalIssued = fallbackStore.certificates.length;
    const totalRevoked = fallbackStore.certificates.filter((c) => c.status === "revoked").length;
    const totalVerified = fallbackStore.verificationLogs.length;
    const recentCertificates = [...fallbackStore.certificates]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    const recentVerifications = [...fallbackStore.verificationLogs]
      .sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt))
      .slice(0, 5);

    return {
      totalIssued,
      totalRevoked,
      totalActive: totalIssued - totalRevoked,
      totalVerified,
      recentCertificates,
      recentVerifications,
    };
  }
}

module.exports = new DbService();

