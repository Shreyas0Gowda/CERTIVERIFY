const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

router.get("/stats", authenticateToken, requireAdmin, dashboardController.getStats);

module.exports = router;

