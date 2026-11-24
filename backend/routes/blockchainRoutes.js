const express = require("express");
const router = express.Router();
const { getBlockchainStatus, loadContractData } = require("../config/blockchain");

router.get("/status", async (req, res) => {
  try {
    const status = await getBlockchainStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/contract-abi", (req, res) => {
  try {
    const data = loadContractData();
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Smart contract not deployed yet.",
      });
    }
    res.json({
      success: true,
      contractAddress: data.contractAddress,
      ownerAddress: data.ownerAddress,
      chainId: data.chainId,
      abi: data.abi,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

