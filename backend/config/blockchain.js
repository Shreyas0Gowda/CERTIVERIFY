const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_DATA_PATH = path.join(__dirname, "contractData.json");

let provider = null;
let contractData = null;
let _deploymentInProgress = false;

function getProvider() {
  // Always create a fresh provider — avoids stale connection after node restart
  try {
    return new ethers.JsonRpcProvider(RPC_URL);
  } catch (err) {
    console.warn("Could not initialize JsonRpcProvider:", err.message);
    return null;
  }
}

function loadContractData() {
  // Always re-read from disk so we pick up fresh deploys
  contractData = null;

  if (fs.existsSync(CONTRACT_DATA_PATH)) {
    try {
      contractData = JSON.parse(fs.readFileSync(CONTRACT_DATA_PATH, "utf8"));
      return contractData;
    } catch (e) {
      console.error("Failed to parse backend contractData.json:", e);
    }
  }

  const blockchainDeployedPath = path.join(__dirname, "../../blockchain/deployed-contract.json");
  if (fs.existsSync(blockchainDeployedPath)) {
    try {
      contractData = JSON.parse(fs.readFileSync(blockchainDeployedPath, "utf8"));
      return contractData;
    } catch (e) {
      console.error("Failed to parse blockchain deployed-contract.json:", e);
    }
  }

  return null;
}

function getContract(signerOrProvider) {
  const data = loadContractData();
  const activeProvider = signerOrProvider || getProvider();

  if (!data || !data.contractAddress || !data.abi) {
    throw new Error(
      "Contract deployment data not found. Please compile and deploy the smart contract first."
    );
  }

  return new ethers.Contract(data.contractAddress, data.abi, activeProvider);
}

/**
 * Ensures that the smart contract is deployed on the active Ethereum node
 * and that sample certificates are seeded. If the node was restarted,
 * this auto-deploys and auto-seeds seamlessly.
 */
async function ensureContractDeployed() {
  // Prevent concurrent deploy attempts
  if (_deploymentInProgress) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return true;
  }

  try {
    _deploymentInProgress = true;
    const prov = getProvider();
    if (!prov) return false;

    // Ping network to check connection
    const network = await prov.getNetwork();
    let data = loadContractData();
    let contractAddress = data?.contractAddress;

    let code = "0x";
    if (contractAddress) {
      try {
        code = await prov.getCode(contractAddress);
      } catch (e) {
        code = "0x";
      }
    }

    // If no contract deployed on this running node instance, auto-deploy it!
    if (code === "0x" || !contractAddress) {
      console.log("[Blockchain] Contract not detected on running Ethereum node. Auto-deploying CertificateVerification.sol...");

      const artifactPath = path.join(
        __dirname,
        "../../blockchain/artifacts/contracts/CertificateVerification.sol/CertificateVerification.json"
      );
      if (!fs.existsSync(artifactPath)) {
        console.warn("[Blockchain Warning] Contract artifact not found at:", artifactPath);
        _deploymentInProgress = false;
        return false;
      }

      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const baseDeployerWallet = new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        prov
      );
      const deployerWallet = new ethers.NonceManager(baseDeployerWallet);
      const ownerAddress = baseDeployerWallet.address;
      const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployerWallet);

      const newContract = await factory.deploy();
      await newContract.waitForDeployment();
      contractAddress = await newContract.getAddress();
      console.log(`[Blockchain] Contract deployed successfully to: ${contractAddress}`);

      const deploymentData = {
        network: "localhost",
        chainId: Number(network.chainId),
        contractAddress: contractAddress,
        ownerAddress: ownerAddress,
        deployedAt: new Date().toISOString(),
        abi: artifact.abi,
      };

      // Reset in-memory cache and write to disk
      contractData = deploymentData;
      fs.writeFileSync(CONTRACT_DATA_PATH, JSON.stringify(deploymentData, null, 2));

      // Sync frontend contractData
      const fePath = path.join(__dirname, "../../frontend/src/contracts/contractData.json");
      if (fs.existsSync(path.dirname(fePath))) {
        fs.writeFileSync(fePath, JSON.stringify(deploymentData, null, 2));
      }

      // Auto-register sample certificates from actual files on disk
      await seedLiveSampleCertificates(newContract, ownerAddress);
    }
    _deploymentInProgress = false;
    return true;
  } catch (err) {
    _deploymentInProgress = false;
    console.warn("[Blockchain Sync Notice] Could not connect to local node:", err.message);
    return false;
  }
}

/**
 * Reads the actual sample certificate PDF files from disk, calculates their
 * real SHA-256 hashes, registers them on-chain, and syncs the database store.
 */
async function seedLiveSampleCertificates(contractInstance, ownerAddress) {
  try {
    const samplesDir = path.join(__dirname, "../../sample-certificates");
    const storePath = path.join(__dirname, "../uploads/certiverify_store.json");
    const manifestPath = path.join(samplesDir, "certificates-manifest.json");

    const authenticPath = path.join(samplesDir, "Alex_Morgan_CS_Authentic.pdf");
    const revokedPath = path.join(samplesDir, "Sophia_Chen_MBA_Revoked.pdf");

    if (!fs.existsSync(authenticPath)) {
      console.warn("[Auto-Seed] Sample PDFs not found — skipping seed.");
      return;
    }

    // Hash actual PDF files from disk
    const authBuffer = fs.readFileSync(authenticPath);
    const authHash = crypto.createHash("sha256").update(authBuffer).digest("hex").toLowerCase();
    const authFileSize = authBuffer.length;

    // 1. Register Authentic Certificate on-chain
    console.log(`[Auto-Seed] Registering Alex Morgan (${authHash.slice(0, 12)}...) on-chain...`);
    const tx1 = await contractInstance.registerCertificate("CERT-2026-STAN-001", authHash);
    const r1 = await tx1.wait();

    // 2. Register & Revoke Revoked Certificate on-chain
    let revHash = "";
    let revFileSize = 0;
    let r2Hash = "0x0000000000000000000000000000000000000000000000000000000000000002";
    let r3Hash = "0x0000000000000000000000000000000000000000000000000000000000000003";

    if (fs.existsSync(revokedPath)) {
      const revBuffer = fs.readFileSync(revokedPath);
      revHash = crypto.createHash("sha256").update(revBuffer).digest("hex").toLowerCase();
      revFileSize = revBuffer.length;
      console.log(`[Auto-Seed] Registering & revoking Sophia Chen (${revHash.slice(0, 12)}...) on-chain...`);
      const tx2 = await contractInstance.registerCertificate("CERT-2025-MBA-089", revHash);
      const r2 = await tx2.wait();
      r2Hash = r2.hash;

      const reason = "Degree revoked due to academic thesis misconduct and honor code violation";
      const tx3 = await contractInstance.revokeCertificate(revHash, reason);
      const r3 = await tx3.wait();
      r3Hash = r3.hash;
    }

    // 3. Update backend fallback store with CORRECT hashes
    let store = { admins: [], certificates: [], verificationLogs: [] };
    if (fs.existsSync(storePath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(storePath, "utf8"));
        store.admins = existing.admins || [];
        store.verificationLogs = [];
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
        createdAt: new Date(),
      },
    ];

    if (revHash) {
      store.certificates.push({
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
        issuerWallet: ownerAddress.toLowerCase(),
        originalFileName: "Sophia_Chen_MBA_Revoked.pdf",
        fileSize: revFileSize,
        status: "revoked",
        revocationReason: "Degree revoked due to academic thesis misconduct and honor code violation",
        revocationTimestamp: new Date(),
        revocationTxHash: r3Hash,
        createdAt: new Date(),
      });
    }

    // Also update manifest with fresh hashes
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        manifest.authentic.hash = authHash;
        if (revHash) manifest.revoked.hash = revHash;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      } catch (e) {}
    }

    const storeDir = path.dirname(storePath);
    if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));

    console.log("[Auto-Seed] ✅ Sample certificates registered on blockchain and database synced!");
  } catch (err) {
    console.warn("[Auto-Seed Warning]", err.message);
  }
}

async function getBlockchainStatus() {
  try {
    await ensureContractDeployed();
    const prov = getProvider();
    const network = await prov.getNetwork();
    const blockNumber = await prov.getBlockNumber();
    const data = loadContractData();

    let owner = null;
    let contractOnline = false;

    if (data && data.contractAddress) {
      try {
        const contract = getContract(prov);
        owner = await contract.owner();
        contractOnline = true;
      } catch (err) {
        contractOnline = false;
      }
    }

    return {
      connected: true,
      rpcUrl: RPC_URL,
      chainId: Number(network.chainId),
      blockNumber: blockNumber,
      contractAddress: data?.contractAddress || null,
      contractOwner: owner || data?.ownerAddress || null,
      contractDeployed: contractOnline,
    };
  } catch (err) {
    return {
      connected: false,
      rpcUrl: RPC_URL,
      error: err.message,
      contractDeployed: false,
    };
  }
}

module.exports = {
  getProvider,
  loadContractData,
  getContract,
  getBlockchainStatus,
  ensureContractDeployed,
  seedLiveSampleCertificates,
};
