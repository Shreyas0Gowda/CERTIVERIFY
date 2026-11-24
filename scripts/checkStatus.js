const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function checkBlockchain() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 8545,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ up: true, blockNumber: parseInt(parsed.result, 16) });
          } catch (e) {
            resolve({ up: false, error: "Bad response" });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ up: false, error: e.message }));
    req.write(JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }));
    req.end();
  });
}

function checkBackend() {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: "127.0.0.1", port: 5000, path: "/api/blockchain/status", method: "GET" },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ up: true, data: JSON.parse(data) });
          } catch (e) {
            resolve({ up: false, error: "Bad response" });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ up: false, error: e.message }));
    req.end();
  });
}

async function getContractCode() {
  const contractDataPath = path.join(__dirname, "../backend/config/contractData.json");
  if (!fs.existsSync(contractDataPath)) return { error: "contractData.json not found" };

  const data = JSON.parse(fs.readFileSync(contractDataPath, "utf8"));
  const address = data.contractAddress;

  return new Promise((resolve) => {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getCode",
      params: [address, "latest"],
      id: 1,
    });
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 8545,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(d);
            resolve({
              address,
              hasCode: parsed.result && parsed.result !== "0x",
              codeLength: parsed.result ? parsed.result.length : 0,
            });
          } catch (e) {
            resolve({ error: e.message });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return "FILE NOT FOUND";
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  console.log("\n========================================");
  console.log("   CERTIVERIFY DIAGNOSTIC REPORT");
  console.log("========================================\n");

  // 1. Blockchain node
  console.log("1. BLOCKCHAIN NODE (http://127.0.0.1:8545)");
  const bc = await checkBlockchain();
  if (bc.up) {
    console.log("   ✅ RUNNING — Block number:", bc.blockNumber);
  } else {
    console.log("   ❌ NOT RUNNING —", bc.error);
    console.log("   ACTION: Run start-blockchain.bat first!\n");
  }

  // 2. Contract deployment
  console.log("\n2. SMART CONTRACT DEPLOYMENT");
  const contractDataPath = path.join(__dirname, "../backend/config/contractData.json");
  if (fs.existsSync(contractDataPath)) {
    const cd = JSON.parse(fs.readFileSync(contractDataPath, "utf8"));
    console.log("   contractData.json found");
    console.log("   Contract Address:", cd.contractAddress);
    if (bc.up) {
      const codeInfo = await getContractCode();
      if (codeInfo.hasCode) {
        console.log("   ✅ CONTRACT EXISTS on running node — code length:", codeInfo.codeLength);
      } else {
        console.log("   ❌ NO CONTRACT CODE at address — node was restarted!");
        console.log("   ACTION: Backend will auto-deploy on first API call");
      }
    }
  } else {
    console.log("   ❌ contractData.json MISSING");
  }

  // 3. PDF hashes
  console.log("\n3. SAMPLE CERTIFICATE HASHES (actual file hashes)");
  const samplesDir = path.join(__dirname, "../sample-certificates");
  const files = [
    "Alex_Morgan_CS_Authentic.pdf",
    "Alex_Morgan_CS_Tampered.pdf",
    "Sophia_Chen_MBA_Revoked.pdf",
    "Unregistered_Certificate.pdf",
  ];
  files.forEach((f) => {
    const h = computeFileHash(path.join(samplesDir, f));
    console.log(`   ${f}:`);
    console.log(`   Hash: ${h}\n`);
  });

  // 4. Database store hashes
  console.log("4. DATABASE STORE (certiverify_store.json)");
  const storePath = path.join(__dirname, "../backend/uploads/certiverify_store.json");
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
    if (store.certificates && store.certificates.length > 0) {
      store.certificates.forEach((c) => {
        const realHash = computeFileHash(
          path.join(samplesDir, c.originalFileName || "")
        );
        const matches = realHash === c.certificateHash;
        console.log(`   ${c.studentName} (${c.certificateId})`);
        console.log(`   DB Hash:   ${c.certificateHash}`);
        console.log(`   Real Hash: ${realHash}`);
        console.log(`   ${matches ? "✅ HASHES MATCH" : "❌ HASH MISMATCH — this is the bug!"}\n`);
      });
    } else {
      console.log("   ⚠️  No certificates in store — not seeded yet");
    }
  } else {
    console.log("   ⚠️  certiverify_store.json not found");
  }

  // 5. Backend
  console.log("5. BACKEND API (http://localhost:5000)");
  const be = await checkBackend();
  if (be.up) {
    console.log("   ✅ RUNNING");
    console.log("   Blockchain connected:", be.data.connected);
    console.log("   Contract deployed:", be.data.contractDeployed);
  } else {
    console.log("   ❌ NOT RUNNING —", be.error);
    console.log("   ACTION: Run start-backend.bat!\n");
  }

  console.log("\n========================================\n");
}

main().catch(console.error);

