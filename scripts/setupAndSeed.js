/**
 * CERTIVERIFY — Full Setup & Resync Script
 * Usage:
 *   1. Run start-blockchain.bat (keep it open, wait for "Started HTTP..." message)
 *   2. In a NEW terminal: node scripts/setupAndSeed.js
 *   3. Then run start-backend.bat and start-frontend.bat
 */

const { ethers } = require("../backend/node_modules/ethers");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const RPC_URL = "http://127.0.0.1:8545";
// Hardhat Account #0 — only valid for local dev
const DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex").toLowerCase();
}

async function main() {
  console.log("\n==============================================");
  console.log("   CERTIVERIFY — Setup & Blockchain Seed");
  console.log("==============================================\n");

  // Connect to Hardhat node
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  try {
    const network = await provider.getNetwork();
    const block = await provider.getBlockNumber();
    console.log(`✅ Connected to Ethereum node — Chain ID: ${network.chainId}, Block: ${block}`);
  } catch (err) {
    console.error("❌ FAILED to connect to blockchain node:", err.message);
    console.error("   Make sure start-blockchain.bat is running first!\n");
    process.exit(1);
  }

  const baseWallet = new ethers.Wallet(DEPLOYER_KEY, provider);
  const wallet = new ethers.NonceManager(baseWallet);
  const ownerAddress = baseWallet.address;
  console.log(`   Deployer: ${ownerAddress}\n`);

  // Load compiled artifact
  const artifactPath = path.join(
    __dirname,
    "../blockchain/artifacts/contracts/CertificateVerification.sol/CertificateVerification.json"
  );
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Contract artifact not found at:", artifactPath);
    console.error("   Run: cd blockchain && npx hardhat compile\n");
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  console.log("✅ Contract artifact loaded\n");

  // Deploy contract with NonceManager
  console.log("🚀 Deploying CertificateVerification.sol...");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const deployedContract = await factory.deploy();
  await deployedContract.waitForDeployment();
  const contractAddress = await deployedContract.getAddress();
  console.log(`✅ Contract deployed at: ${contractAddress}\n`);

  // Sample PDF hashes
  const samplesDir = path.join(__dirname, "../sample-certificates");
  const authenticPath = path.join(samplesDir, "Alex_Morgan_CS_Authentic.pdf");
  const revokedPath = path.join(samplesDir, "Sophia_Chen_MBA_Revoked.pdf");

  if (!fs.existsSync(authenticPath)) {
    console.error("❌ Sample PDFs not found — run: node scripts/generateCertificates.js");
    process.exit(1);
  }

  const authHash = sha256File(authenticPath);
  const revHash = sha256File(revokedPath);
  const authFileSize = fs.statSync(authenticPath).size;
  const revFileSize = fs.statSync(revokedPath).size;

  console.log("📋 PDF hashes from disk:");
  console.log(`   Alex Morgan (Authentic): ${authHash}`);
  console.log(`   Sophia Chen (Revoked):   ${revHash}\n`);

  // Register authentic certificate
  console.log("📝 Registering Alex Morgan (Authentic) on-chain...");
  const tx1 = await deployedContract.registerCertificate("CERT-2026-STAN-001", authHash);
  const r1 = await tx1.wait();
  console.log(`✅ Registered — TX: ${r1.hash}\n`);

  // Register Sophia Chen (Revoked) on-chain
  console.log("📝 Registering Sophia Chen on-chain...");
  const tx2 = await deployedContract.registerCertificate("CERT-2025-MBA-089", revHash);
  const r2 = await tx2.wait();
  console.log(`✅ Registered — TX: ${r2.hash}`);

  const revReason = "Degree revoked due to academic thesis misconduct and honor code violation";
  const tx3 = await deployedContract.revokeCertificate(revHash, revReason);
  const r3 = await tx3.wait();
  console.log(`✅ Revoked   — TX: ${r3.hash}\n`);

  // Verify results on-chain
  console.log("🔍 Verifying on-chain results...");
  const [v1IsValid, v1IsRevoked] = await deployedContract.verifyCertificate(authHash);
  const [v2IsValid, v2IsRevoked] = await deployedContract.verifyCertificate(revHash);
  const authPass = v1IsValid && !v1IsRevoked;
  const revPass = !v2IsValid && v2IsRevoked;
  console.log(`   Alex Morgan  — isValid: ${v1IsValid}, isRevoked: ${v1IsRevoked}  ${authPass ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Sophia Chen  — isValid: ${v2IsValid}, isRevoked: ${v2IsRevoked}  ${revPass ? "✅ PASS" : "❌ FAIL"}\n`);

  if (!authPass || !revPass) {
    console.error("❌ On-chain verification failed! Something went wrong.");
    process.exit(1);
  }

  // Build contractData
  const deploymentData = {
    network: "localhost",
    chainId: 31337,
    contractAddress,
    ownerAddress: ownerAddress,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  // Write backend contractData.json
  const backendContractPath = path.join(__dirname, "../backend/config/contractData.json");
  fs.writeFileSync(backendContractPath, JSON.stringify(deploymentData, null, 2));
  console.log("✅ Written: backend/config/contractData.json");

  // Write frontend contractData.json
  const frontendContractPath = path.join(__dirname, "../frontend/src/contracts/contractData.json");
  if (fs.existsSync(path.dirname(frontendContractPath))) {
    fs.writeFileSync(frontendContractPath, JSON.stringify(deploymentData, null, 2));
    console.log("✅ Written: frontend/src/contracts/contractData.json");
  }

  // Update certiverify_store.json with CORRECT hashes + real TX hashes
  const storePath = path.join(__dirname, "../backend/uploads/certiverify_store.json");
  let store = { admins: [], certificates: [], verificationLogs: [] };
  if (fs.existsSync(storePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(storePath, "utf8"));
      store.admins = existing.admins || [];
    } catch (e) {}
  }

  store.certificates = [
    {
      _id: "cert_seed_1",
      certificateId: "CERT-2026-STAN-001",
      certificateHash: authHash,
      studentName: "Alex Morgan",
      studentId: "STU-99214",
      institution: "Stanford Institute of Technology",
      certificateTitle: "Bachelor of Science in Computer Science & Engineering",
      department: "Computer Science & Engineering",
      graduationYear: 2026,
      issueDate: "2026-05-15",
      blockchainTransactionHash: r1.hash,
      issuerWallet: ownerAddress.toLowerCase(),
      originalFileName: "Alex_Morgan_CS_Authentic.pdf",
      fileSize: authFileSize,
      status: "authentic",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "cert_seed_2",
      certificateId: "CERT-2025-MBA-089",
      certificateHash: revHash,
      studentName: "Sophia Chen",
      studentId: "STU-88102",
      institution: "Stanford Institute of Technology",
      certificateTitle: "Master of Business Administration (Finance & Analytics)",
      department: "School of Management",
      graduationYear: 2025,
      issueDate: "2025-06-20",
      blockchainTransactionHash: r2.hash,
      issuerWallet: ownerAddress.toLowerCase(),
      originalFileName: "Sophia_Chen_MBA_Revoked.pdf",
      fileSize: revFileSize,
      status: "revoked",
      revocationReason: revReason,
      revocationTimestamp: new Date().toISOString(),
      revocationTxHash: r3.hash,
      createdAt: new Date().toISOString(),
    },
  ];
  store.verificationLogs = [];

  if (!fs.existsSync(path.dirname(storePath))) {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
  }
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  console.log("✅ Written: backend/uploads/certiverify_store.json");

  console.log("\n==============================================");
  console.log("   ✅ ALL DONE! CertiVerify fully synced.");
  console.log("==============================================");
  console.log("\nNow run:");
  console.log("  → start-backend.bat");
  console.log("  → start-frontend.bat");
  console.log("\nTest certificates in sample-certificates/:");
  console.log("  🟢 Alex_Morgan_CS_Authentic.pdf    → AUTHENTIC");
  console.log("  🔴 Alex_Morgan_CS_Tampered.pdf     → INVALID");
  console.log("  🟠 Sophia_Chen_MBA_Revoked.pdf     → REVOKED");
  console.log("  🔴 Unregistered_Certificate.pdf    → INVALID\n");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
