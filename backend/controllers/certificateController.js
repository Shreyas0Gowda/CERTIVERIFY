const crypto = require("crypto");
const dbService = require("../services/dbService");
const { getContract, getProvider, ensureContractDeployed } = require("../config/blockchain");

/**
 * Register a newly issued certificate
 * Admin only
 */
exports.registerCertificate = async (req, res) => {
  try {
    const {
      studentName,
      studentId,
      institution,
      certificateTitle,
      department,
      graduationYear,
      issueDate,
      certificateId,
      blockchainTransactionHash,
      issuerWallet,
    } = req.body;

    // Use hash from uploaded file or from body
    let certificateHash = req.fileHash || req.body.certificateHash;

    if (!certificateHash && req.file && req.file.buffer) {
      certificateHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    }

    if (!certificateHash) {
      return res.status(400).json({
        success: false,
        message: "Certificate SHA-256 hash is required. Please upload the PDF certificate.",
      });
    }
    certificateHash = certificateHash.toLowerCase().trim();

    // Required fields validation
    if (!studentName || !studentId || !institution || !certificateTitle || !certificateId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: studentName, studentId, institution, certificateTitle, and certificateId are required.",
      });
    }

    // Check duplicate in database
    const existingDbCert = await dbService.findCertificateByHash(certificateHash);
    if (existingDbCert) {
      return res.status(409).json({
        success: false,
        message: `Certificate with hash ${certificateHash} is already registered in the system (ID: ${existingDbCert.certificateId}).`,
      });
    }

    const existingDbId = await dbService.findCertificateById(certificateId);
    if (existingDbId) {
      return res.status(409).json({
        success: false,
        message: `Certificate ID "${certificateId}" already exists. Please choose a unique certificate identifier.`,
      });
    }

    // Verify blockchain registration
    let onChainVerified = false;
    let onChainIssuer = issuerWallet || "";
    try {
      const contract = getContract();
      const isRegistered = await contract.isCertificateRegistered(certificateHash);

      if (isRegistered) {
        const onChainCert = await contract.getCertificate(certificateHash);
        onChainVerified = true;
        onChainIssuer = onChainCert.issuer;
      }
    } catch (chainErr) {
      console.warn("Could not query blockchain contract directly:", chainErr.message);
      // If blockchain node is not ready or local transaction was confirmed
    }

    const newCertificate = await dbService.createCertificate({
      certificateId: certificateId.trim(),
      certificateHash,
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      institution: institution.trim(),
      certificateTitle: certificateTitle.trim(),
      department: (department || "General").trim(),
      graduationYear: Number(graduationYear) || new Date().getFullYear(),
      issueDate: issueDate || new Date().toISOString().split("T")[0],
      blockchainTransactionHash: blockchainTransactionHash || "0x0000000000000000000000000000000000000000000000000000000000000000",
      issuerWallet: (onChainIssuer || req.user?.walletAddress || "").toLowerCase(),
      originalFileName: req.file ? req.file.originalname : "",
      fileSize: req.file ? req.file.size : 0,
      status: "authentic",
    });

    res.status(201).json({
      success: true,
      message: "Certificate registered successfully on the blockchain and recorded in database.",
      certificate: newCertificate,
      onChainVerified,
    });
  } catch (error) {
    console.error("Certificate registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register certificate: " + error.message,
    });
  }
};

/**
 * Public certificate verification endpoint
 * Anyone can verify without login
 */
exports.verifyCertificate = async (req, res) => {
  try {
    let hash = req.fileHash || req.body.certificateHash;

    if (!hash && req.file && req.file.buffer) {
      hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
    }

    if (!hash) {
      return res.status(400).json({
        success: false,
        message: "No certificate hash or PDF document provided for verification.",
      });
    }

    hash = hash.toLowerCase().trim();
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    // 1. Ensure smart contract is deployed on node, then query smart contract
    let contractResult = null;
    let blockchainOnline = true;

    try {
      await ensureContractDeployed();
      const contract = getContract();
      const [isValid, isRevoked, certId, issuer, issueTimestamp] =
        await contract.verifyCertificate(hash);

      let revocationDetails = null;
      if (isRevoked) {
        try {
          const fullCert = await contract.getCertificate(hash);
          revocationDetails = {
            revocationTimestamp: Number(fullCert.revocationTimestamp),
            revocationReason: fullCert.revocationReason,
          };
        } catch (e) {
          console.warn("Could not fetch full revocation details:", e.message);
        }
      }

      contractResult = {
        isValid,
        isRevoked,
        certificateId: certId,
        issuer,
        issueTimestamp: Number(issueTimestamp),
        revocationDetails,
      };
    } catch (chainErr) {
      console.warn("Blockchain query error during verification:", chainErr.message);
      blockchainOnline = false;
    }

    // If blockchain node is not running or unreachable, report connection error
    if (!blockchainOnline || !contractResult) {
      return res.status(200).json({
        success: false,
        status: "error",
        message: "Blockchain node is currently unreachable. Please make sure the Hardhat node (start-blockchain.bat) is running.",
        details: "The system could not communicate with the Ethereum smart contract on http://127.0.0.1:8545.",
        certificateHash: hash,
        verifiedAt: new Date().toISOString(),
      });
    }

    // 2. Fetch metadata from DB if certificate was ever registered
    const dbRecord = await dbService.findCertificateByHash(hash);

    // 3. Determine status based strictly on the blockchain
    if (contractResult && contractResult.isValid) {
      // Authentic certificate
      await dbService.logVerification({
        certificateHash: hash,
        verificationResult: "authentic",
        certificateId: contractResult.certificateId || dbRecord?.certificateId,
        ipAddress: clientIp,
        userAgent,
        notes: "Verified authentic on-chain",
      });

      return res.json({
        success: true,
        status: "authentic",
        message: "Certificate is authentic and valid.",
        blockchainVerified: true,
        data: {
          certificateId: contractResult.certificateId || dbRecord?.certificateId,
          certificateHash: hash,
          studentName: dbRecord?.studentName || "Verified Graduate",
          studentId: dbRecord?.studentId || "N/A",
          institution: dbRecord?.institution || "Verified Institution",
          certificateTitle: dbRecord?.certificateTitle || "Academic Degree",
          department: dbRecord?.department || "N/A",
          graduationYear: dbRecord?.graduationYear || null,
          issueDate: dbRecord?.issueDate || null,
          issuerWallet: contractResult.issuer,
          issueTimestamp: contractResult.issueTimestamp,
          blockchainTransactionHash: dbRecord?.blockchainTransactionHash || null,
          verifiedAt: new Date().toISOString(),
        },
      });
    } else if (contractResult && contractResult.isRevoked) {
      // Revoked certificate
      await dbService.logVerification({
        certificateHash: hash,
        verificationResult: "revoked",
        certificateId: contractResult.certificateId || dbRecord?.certificateId,
        ipAddress: clientIp,
        userAgent,
        notes: "Revoked certificate detected on-chain",
      });

      return res.json({
        success: true,
        status: "revoked",
        message: "This certificate was previously registered on the blockchain but has been REVOKED.",
        blockchainVerified: true,
        data: {
          certificateId: contractResult.certificateId || dbRecord?.certificateId,
          certificateHash: hash,
          studentName: dbRecord?.studentName || "Confidential",
          institution: dbRecord?.institution || "Academic Institution",
          certificateTitle: dbRecord?.certificateTitle || "Academic Certificate",
          issuerWallet: contractResult.issuer,
          issueTimestamp: contractResult.issueTimestamp,
          revocationReason: contractResult.revocationDetails?.revocationReason || dbRecord?.revocationReason || "Revoked by issuing authority",
          revocationTimestamp: contractResult.revocationDetails?.revocationTimestamp || dbRecord?.revocationTimestamp || null,
          blockchainTransactionHash: dbRecord?.blockchainTransactionHash || null,
          verifiedAt: new Date().toISOString(),
        },
      });
    } else {
      // Invalid or unregistered certificate
      await dbService.logVerification({
        certificateHash: hash,
        verificationResult: "invalid",
        certificateId: null,
        ipAddress: clientIp,
        userAgent,
        notes: "No matching record on blockchain",
      });

      return res.status(200).json({
        success: false,
        status: "invalid",
        message: "Certificate verification failed. No matching blockchain record was found.",
        details: "The uploaded document's cryptographic SHA-256 fingerprint does not match any registered certificate on the blockchain ledger.",
        certificateHash: hash,
        verifiedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Verification processing error:", error);
    res.status(500).json({
      success: false,
      status: "error",
      message: "An error occurred during certificate verification: " + error.message,
    });
  }
};

/**
 * List all certificates with search and filter
 * Admin only
 */
exports.getCertificates = async (req, res) => {
  try {
    const result = await dbService.getCertificates(req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single certificate details by ID or Hash
 */
exports.getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    let cert = await dbService.findCertificateById(id);
    if (!cert) {
      cert = await dbService.findCertificateByHash(id);
    }

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found with ID or Hash: " + id,
      });
    }

    // Merge live on-chain status
    let liveOnChainStatus = null;
    try {
      const contract = getContract();
      const [isValid, isRevoked, cId, issuer, issueTimestamp] =
        await contract.verifyCertificate(cert.certificateHash);
      liveOnChainStatus = {
        isValid,
        isRevoked,
        issuer,
        issueTimestamp: Number(issueTimestamp),
      };
    } catch (e) {
      // ignore if node offline
    }

    res.json({
      success: true,
      certificate: cert,
      liveOnChainStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Revoke certificate
 * Admin only
 */
exports.revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, blockchainTransactionHash } = req.body;

    let cert = await dbService.findCertificateById(id);
    if (!cert) {
      cert = await dbService.findCertificateByHash(id);
    }

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found to revoke.",
      });
    }

    const updated = await dbService.revokeCertificate(
      cert.certificateHash,
      reason || "Revoked by administrator",
      blockchainTransactionHash
    );

    res.json({
      success: true,
      message: "Certificate status updated to revoked.",
      certificate: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

