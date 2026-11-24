const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// We can test against the backend API
// First let's require backend express app directly
const app = require("../backend/server");
const PORT = 5055; // Use test port

function sha256File(fp) {
  return crypto.createHash("sha256").update(fs.readFileSync(fp)).digest("hex").toLowerCase();
}

async function verifyHash(port, hash) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ certificateHash: hash });
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/certificates/verify",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: "Failed to parse json", raw: data });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log("\n==============================================");
  console.log("   AUTOMATED VERIFICATION OF 4 SAMPLE PDFS");
  console.log("==============================================\n");

  const server = app.listen(PORT, async () => {
    console.log(`Test API Server listening on port ${PORT}...`);

    const samplesDir = path.join(__dirname, "../sample-certificates");
    const testCases = [
      {
        file: "Alex_Morgan_CS_Authentic.pdf",
        expectedStatus: "authentic",
        label: "Authentic Certificate",
      },
      {
        file: "Alex_Morgan_CS_Tampered.pdf",
        expectedStatus: "invalid",
        label: "Tampered Certificate",
      },
      {
        file: "Sophia_Chen_MBA_Revoked.pdf",
        expectedStatus: "revoked",
        label: "Revoked Certificate",
      },
      {
        file: "Unregistered_Certificate.pdf",
        expectedStatus: "invalid",
        label: "Unregistered Certificate",
      },
    ];

    let allPassed = true;

    for (const tc of testCases) {
      const filePath = path.join(samplesDir, tc.file);
      const hash = sha256File(filePath);
      const result = await verifyHash(PORT, hash);

      const pass = result.status === tc.expectedStatus;
      console.log(`\nDocument: ${tc.file} (${tc.label})`);
      console.log(`  SHA-256:  ${hash}`);
      console.log(`  Result:   Status="${result.status}" | Message="${result.message}"`);
      console.log(`  Expected: Status="${tc.expectedStatus}"`);
      console.log(`  Verdict:  ${pass ? "✅ PASS" : "❌ FAIL"}`);

      if (!pass) allPassed = false;
    }

    server.close(() => {
      console.log("\n==============================================");
      if (allPassed) {
        console.log("   🎉 ALL 4 CERTIFICATES VERIFIED 100% CORRECTLY!");
      } else {
        console.log("   ❌ SOME VERIFICATIONS FAILED!");
      }
      console.log("==============================================\n");
      process.exit(allPassed ? 0 : 1);
    });
  });
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

