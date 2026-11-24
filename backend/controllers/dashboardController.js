const dbService = require("../services/dbService");
const { getBlockchainStatus } = require("../config/blockchain");

exports.getStats = async (req, res) => {
  try {
    const stats = await dbService.getDashboardStats();
    const blockchainStatus = await getBlockchainStatus();

    res.json({
      success: true,
      data: {
        ...stats,
        blockchain: blockchainStatus,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard metrics: " + error.message,
    });
  }
};

