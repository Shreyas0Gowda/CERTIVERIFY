const jwt = require("jsonwebtoken");
const dbService = require("../services/dbService");
const { JWT_SECRET } = require("../middleware/auth");

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both username/email and password.",
      });
    }

    const admin = await dbService.findAdminByUsernameOrEmail(identifier);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Administrator account not found.",
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Password is incorrect.",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Authentication successful.",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        walletAddress: admin.walletAddress || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred during login.",
      error: error.message,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const admin = await dbService.findAdminByUsernameOrEmail(req.user.username);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    res.json({
      success: true,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        walletAddress: admin.walletAddress || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "Wallet address is required." });
    }

    const admin = await dbService.findAdminByUsernameOrEmail(req.user.username);
    if (admin) {
      admin.walletAddress = walletAddress.toLowerCase();
    }

    res.json({
      success: true,
      message: "Admin wallet linked successfully.",
      walletAddress: walletAddress.toLowerCase(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

