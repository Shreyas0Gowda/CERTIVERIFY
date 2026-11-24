const { ethers } = require("../blockchain/node_modules/hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function seedData() {
  console.log("==================================================");
  console.log("  SEEDING FULL CERTIFICATE SUITE TO BLOCKCHAIN    ");
  console.log("==================================================");

  const [owner] = await ethers.getSigners();
  console.log(`Issuer Account: ${owner.address}`);

  const CertificateVerification = await ethers.getContractFactory("CertificateVerification");
  const contract = await CertificateVerification.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`Contract deployed at: ${contractAddress}`);

  const manifestPath = path.join(__dirname, "../sample-certificates/certificates-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // 1. Register Authentic Certificate (Alex Morgan)
  const authenticPdfBuffer = fs.readFileSync(manifest.authentic.path);
  const authenticHash = crypto.createHash("sha256").update(authenticPdfBuffer).digest("hex");
  const tx1 = await contract.connect(owner).registerCertificate("CERT-2026-STAN-001", authenticHash);
  const receipt1 = await tx1.wait();
  console.log(`[Authentic] CERT-2026-STAN-001 registered (TX: ${receipt1.hash.slice(0, 16)}...)`);

  // 2. Register and then Revoke Certificate (Sophia Chen)
  const revokedPdfBuffer = fs.readFileSync(manifest.revoked.path);
  const revokedHash = crypto.createHash("sha256").update(revokedPdfBuffer).digest("hex");
  const tx2 = await contract.connect(owner).registerCertificate("CERT-2025-MBA-089", revokedHash);
  const receipt2 = await tx2.wait();
  console.log(`[Revoked Base] CERT-2025-MBA-089 registered (TX: ${receipt2.hash.slice(0, 16)}...)`);

  const revokeReason = "Degree revoked due to academic thesis misconduct and honor code violation";
  const revokeTx = await contract.connect(owner).revokeCertificate(revokedHash, revokeReason);
  const revokeReceipt = await revokeTx.wait();
  console.log(`[Revoked] CERT-2025-MBA-089 revoked on-chain (TX: ${revokeReceipt.hash.slice(0, 16)}...)`);

  // Update persistent fallback store
  const storePath = path.join(__dirname, "../backend/uploads/certiverify_store.json");
  let store = { admins: [], certificates: [], verificationLogs: [] };
  if (fs.existsSync(storePath)) {
    try {
      store = JSON.parse(fs.readFileSync(storePath, "utf8"));
    } catch (e) {}
  }

  // Cert 1
  const cert1 = {
    _id: "cert_seed_1",
    certificateId: "CERT-2026-STAN-001",
    certificateHash: authenticHash,
    studentName: "Alex Morgan",
    studentId: "STU-99214",
    institution: "Stanford Institute of Technology",
    certificateTitle: "Bachelor of Science in Computer Science & Engineering",
    department: "Computer Science & Engineering",
    graduationYear: 2026,
    issueDate: "2026-05-15",
    blockchainTransactionHash: receipt1.hash,
    issuerWallet: owner.address.toLowerCase(),
    originalFileName: "Alex_Morgan_CS_Authentic.pdf",
    fileSize: authenticPdfBuffer.length,
    status: "authentic",
    createdAt: new Date(Date.now() - 86400000 * 2),
  };

  // Cert 2
  const cert2 = {
    _id: "cert_seed_2",
    certificateId: "CERT-2025-MBA-089",
    certificateHash: revokedHash,
    studentName: "Sophia Chen",
    studentId: "STU-88102",
    institution: "Stanford Institute of Technology",
    certificateTitle: "Master of Business Administration (Finance & Analytics)",
    department: "School of Management",
    graduationYear: 2025,
    issueDate: "2025-06-20",
    blockchainTransactionHash: receipt2.hash,
    issuerWallet: owner.address.toLowerCase(),
    originalFileName: "Sophia_Chen_MBA_Revoked.pdf",
    fileSize: revokedPdfBuffer.length,
    status: "revoked",
    revocationReason: revokeReason,
    revocationTimestamp: new Date(),
    revocationTxHash: revokeReceipt.hash,
    createdAt: new Date(Date.now() - 86400000 * 10),
  };

  store.certificates = [cert1, cert2];

  // Logs
  store.verificationLogs = [
    {
      _id: "log_1",
      certificateHash: authenticHash,
      verificationResult: "authentic",
      certificateId: "CERT-2026-STAN-001",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      notes: "Verified authentic on-chain",
      verifiedAt: new Date(Date.now() - 3600000),
    },
    {
      _id: "log_2",
      certificateHash: revokedHash,
      verificationResult: "revoked",
      certificateId: "CERT-2025-MBA-089",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      notes: "Revoked certificate identified on-chain",
      verifiedAt: new Date(Date.now() - 1800000),
    },
  ];

  const storeDir = path.dirname(storePath);
  if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));

  // Update contractData.json in backend & frontend
  const artifactPath = path.join(__dirname, "../blockchain/artifacts/contracts/CertificateVerification.sol/CertificateVerification.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const deploymentData = {
      network: "localhost",
      chainId: 31337,
      contractAddress: contractAddress,
      ownerAddress: owner.address,
      deployedAt: new Date().toISOString(),
      abi: artifact.abi,
    };

    fs.writeFileSync(path.join(__dirname, "../backend/config/contractData.json"), JSON.stringify(deploymentData, null, 2));
    fs.writeFileSync(path.join(__dirname, "../frontend/src/contracts/contractData.json"), JSON.stringify(deploymentData, null, 2));
  }

  console.log("==================================================");
  console.log("  SEED COMPLETED! ALL 4 SCENARIOS ARE READY!      ");
  console.log("==================================================");
}

seedData().catch(console.error);
