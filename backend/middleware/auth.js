const jwt = require("jsonwebtoken");
const dbService = require("../services/dbService");

const JWT_SECRET = process.env.JWT_SECRET || "certiverify_jwt_super_secret_key_2026";

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Authentication token missing.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await dbService.findAdminByUsernameOrEmail(decoded.username || decoded.email);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User no longer exists.",
      });
    }

    req.user = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      walletAddress: admin.walletAddress,
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Administrator privileges required.",
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET,
};

