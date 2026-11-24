const { ethers } = require("../backend/node_modules/ethers");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const RPC_URL = "http://127.0.0.1:8545";
const DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

function sha256File(fp) {
  return crypto.createHash("sha256").update(fs.readFileSync(fp)).digest("hex").toLowerCase();
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    const block = await provider.getBlockNumber();
    console.log("Connected. Block:", block);
    
    const code = await provider.getCode(CONTRACT_ADDRESS);
    console.log("Code at address:", code === "0x" ? "NONE (need to deploy)" : "EXISTS (length " + code.length + ")");
  } catch(e) {
    console.log("Cannot connect:", e.message);
    process.exit(1);
  }

  const artifactPath = path.join(__dirname, "../blockchain/artifacts/contracts/CertificateVerification.sol/CertificateVerification.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

  const samplesDir = path.join(__dirname, "../sample-certificates");
  const authHash = sha256File(path.join(samplesDir, "Alex_Morgan_CS_Authentic.pdf"));
  const revHash = sha256File(path.join(samplesDir, "Sophia_Chen_MBA_Revoked.pdf"));

  console.log("\nPDF Hashes:");
  console.log("  Alex Morgan (Authentic):", authHash);
  console.log("  Sophia Chen (Revoked):  ", revHash);

  // Check what's already registered
  const isAuthRegistered = await contract.isCertificateRegistered(authHash);
  const isRevRegistered = await contract.isCertificateRegistered(revHash);
  console.log("\nOn-chain status:");
  console.log("  Alex Morgan registered:", isAuthRegistered);
  console.log("  Sophia Chen registered:", isRevRegistered);

  const storePath = path.join(__dirname, "../backend/uploads/certiverify_store.json");
  let store = { admins: [], certificates: [], verificationLogs: [] };
  if (fs.existsSync(storePath)) {
    try { store = JSON.parse(fs.readFileSync(storePath, "utf8")); } catch(e) {}
  }

  let r1Hash = "0x0000000000000000000000000000000000000000000000000000000000000001";
  let r2Hash = "0x0000000000000000000000000000000000000000000000000000000000000002";
  let r3Hash = "0x0000000000000000000000000000000000000000000000000000000000000003";

  if (!isAuthRegistered) {
    console.log("\nRegistering Alex Morgan...");
    const tx1 = await contract.registerCertificate("CERT-2026-STAN-001", authHash);
    const r1 = await tx1.wait();
    r1Hash = r1.hash;
    console.log("  TX:", r1Hash);
  } else {
    console.log("\nAlex Morgan already registered — skipping.");
    const certData = await contract.getCertificate(authHash);
    console.log("  Certificate ID on-chain:", certData.certificateId);
  }

  if (!isRevRegistered) {
    console.log("Registering Sophia Chen...");
    const tx2 = await contract.registerCertificate("CERT-2025-MBA-089", revHash);
    const r2 = await tx2.wait();
    r2Hash = r2.hash;
    
    console.log("Revoking Sophia Chen...");
    const tx3 = await contract.revokeCertificate(revHash, "Degree revoked due to academic thesis misconduct and honor code violation");
    const r3 = await tx3.wait();
    r3Hash = r3.hash;
    console.log("  Revocation TX:", r3Hash);
  } else {
    console.log("Sophia Chen already registered — checking revocation...");
    const [isValid, isRevoked] = await contract.verifyCertificate(revHash);
    if (!isRevoked) {
      console.log("  Revoking now...");
      const tx3 = await contract.revokeCertificate(revHash, "Degree revoked due to academic thesis misconduct and honor code violation");
      const r3 = await tx3.wait();
      r3Hash = r3.hash;
    } else {
      console.log("  Already revoked.");
    }
  }

  // Final verification
  console.log("\nFINAL ON-CHAIN VERIFICATION:");
  const [v1Valid, v1Rev] = await contract.verifyCertificate(authHash);
  const [v2Valid, v2Rev] = await contract.verifyCertificate(revHash);
  console.log("  Alex Morgan  — isValid:", v1Valid, "isRevoked:", v1Rev, v1Valid && !v1Rev ? "PASS" : "FAIL");
  console.log("  Sophia Chen  — isValid:", v2Valid, "isRevoked:", v2Rev, !v2Valid && v2Rev ? "PASS" : "FAIL");

  // Update store
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
      blockchainTransactionHash: r1Hash,
      issuerWallet: wallet.address.toLowerCase(),
      originalFileName: "Alex_Morgan_CS_Authentic.pdf",
      fileSize: fs.statSync(path.join(samplesDir, "Alex_Morgan_CS_Authentic.pdf")).size,
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
      blockchainTransactionHash: r2Hash,
      issuerWallet: wallet.address.toLowerCase(),
      originalFileName: "Sophia_Chen_MBA_Revoked.pdf",
      fileSize: fs.statSync(path.join(samplesDir, "Sophia_Chen_MBA_Revoked.pdf")).size,
      status: "revoked",
      revocationReason: "Degree revoked due to academic thesis misconduct and honor code violation",
      revocationTimestamp: new Date().toISOString(),
      revocationTxHash: r3Hash,
      createdAt: new Date().toISOString(),
    }
  ];

  // Update contractData.json
  const contractDataPath = path.join(__dirname, "../backend/config/contractData.json");
  const existing = JSON.parse(fs.readFileSync(contractDataPath, "utf8"));
  existing.contractAddress = CONTRACT_ADDRESS;
  fs.writeFileSync(contractDataPath, JSON.stringify(existing, null, 2));
  
  const feContractPath = path.join(__dirname, "../frontend/src/contracts/contractData.json");
  if (fs.existsSync(feContractPath)) {
    fs.writeFileSync(feContractPath, JSON.stringify(existing, null, 2));
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  console.log("\nStore and contractData updated.");
  console.log("\nDone! Now start the backend and frontend.");
}

main().catch(e => { console.error("FAIL:", e.message); process.exit(1); });

