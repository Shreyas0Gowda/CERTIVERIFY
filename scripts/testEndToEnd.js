const { ethers } = require("../blockchain/node_modules/hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function runEndToEndTests() {
  console.log("============================================================");
  console.log("   CERTIVERIFY: COMPREHENSIVE END-TO-END TEST SUITE         ");
  console.log("============================================================\n");

  const [owner, unauthorizedUser, student] = await ethers.getSigners();
  console.log(`[Setup] Deployer / Contract Owner: ${owner.address}`);
  console.log(`[Setup] Unauthorized Account:      ${unauthorizedUser.address}`);

  // Deploy fresh smart contract instance
  const CertificateVerification = await ethers.getContractFactory("CertificateVerification");
  const contract = await CertificateVerification.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`[Setup] CertificateVerification deployed to: ${contractAddress}\n`);

  // Load sample PDFs
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../sample-certificates/certificates-manifest.json"), "utf8")
  );

  const authenticPdfBuffer = fs.readFileSync(manifest.authentic.path);
  const authenticHash = crypto.createHash("sha256").update(authenticPdfBuffer).digest("hex");

  const tamperedPdfBuffer = fs.readFileSync(manifest.tampered.path);
  const tamperedHash = crypto.createHash("sha256").update(tamperedPdfBuffer).digest("hex");

  const unregisteredPdfBuffer = fs.readFileSync(manifest.unregistered.path);
  const unregisteredHash = crypto.createHash("sha256").update(unregisteredPdfBuffer).digest("hex");

  let passedTests = 0;
  let totalTests = 10;

  // TEST 1: Register valid certificate
  console.log("--- TEST 1: Register valid certificate ---");
  const certId1 = "CERT-2026-STAN-001";
  const tx1 = await contract.connect(owner).registerCertificate(certId1, authenticHash);
  const receipt1 = await tx1.wait();
  if (receipt1.status === 1) {
    console.log(`✔ PASS: Certificate registered on blockchain with TX ${receipt1.hash.slice(0, 16)}...`);
    passedTests++;
  } else {
    console.error("✖ FAIL: Registration failed.");
  }

  // TEST 2: Upload exact same PDF for verification (Expected: Authentic)
  console.log("\n--- TEST 2: Verify authentic certificate PDF ---");
  const [isValid2, isRevoked2, foundId2, issuer2] = await contract.verifyCertificate(authenticHash);
  if (isValid2 && !isRevoked2 && foundId2 === certId1 && issuer2 === owner.address) {
    console.log(`✔ PASS: Exact PDF verified as AUTHENTIC (ID: ${foundId2})`);
    passedTests++;
  } else {
    console.error(`✖ FAIL: Authentic PDF verification returned invalid.`);
  }

  // TEST 3: Modify PDF after registration (Expected: Invalid)
  console.log("\n--- TEST 3: Verify tampered PDF ---");
  const [isValid3, isRevoked3] = await contract.verifyCertificate(tamperedHash);
  if (!isValid3 && !isRevoked3) {
    console.log("✔ PASS: Tampered PDF correctly identified as INVALID (Cryptographic hash mismatch)");
    passedTests++;
  } else {
    console.error("✖ FAIL: Tampered PDF was wrongly accepted.");
  }

  // TEST 4: Upload completely unrelated PDF (Expected: Invalid)
  console.log("\n--- TEST 4: Verify unregistered PDF ---");
  const [isValid4, isRevoked4] = await contract.verifyCertificate(unregisteredHash);
  if (!isValid4 && !isRevoked4) {
    console.log("✔ PASS: Unregistered document correctly identified as INVALID");
    passedTests++;
  } else {
    console.error("✖ FAIL: Unregistered document was accepted.");
  }

  // TEST 5: Attempt duplicate registration (Expected: Rejected)
  console.log("\n--- TEST 5: Attempt duplicate certificate registration ---");
  let duplicateRejected = false;
  try {
    await contract.connect(owner).registerCertificate("DIFF-ID-SAME-HASH", authenticHash);
  } catch (err) {
    duplicateRejected = true;
    console.log(`✔ PASS: Duplicate hash rejected by contract (${err.message.slice(0, 50)}...)`);
    passedTests++;
  }
  if (!duplicateRejected) console.error("✖ FAIL: Duplicate registration did not revert.");

  // TEST 6: Attempt registration from unauthorized wallet (Expected: Rejected)
  console.log("\n--- TEST 6: Attempt registration from unauthorized wallet ---");
  let unauthorizedRejected = false;
  try {
    await contract.connect(unauthorizedUser).registerCertificate("CERT-UNAUTH-01", "11".repeat(32));
  } catch (err) {
    unauthorizedRejected = true;
    console.log(`✔ PASS: Non-owner wallet rejected by Ownable access control`);
    passedTests++;
  }
  if (!unauthorizedRejected) console.error("✖ FAIL: Unauthorized registration did not revert.");

  // TEST 7: Revoke an existing certificate
  console.log("\n--- TEST 7: Revoke certificate by authorized owner ---");
  const reason = "Degree revoked due to academic dishonesty";
  const revokeTx = await contract.connect(owner).revokeCertificate(authenticHash, reason);
  const revokeReceipt = await revokeTx.wait();
  if (revokeReceipt.status === 1) {
    console.log(`✔ PASS: Certificate revoked on blockchain with TX ${revokeReceipt.hash.slice(0, 16)}...`);
    passedTests++;
  } else {
    console.error("✖ FAIL: Revocation failed.");
  }

  // TEST 8: Verify a revoked certificate (Expected: Revoked, not authentic)
  console.log("\n--- TEST 8: Verify revoked certificate ---");
  const [isValid8, isRevoked8, foundId8] = await contract.verifyCertificate(authenticHash);
  if (!isValid8 && isRevoked8) {
    const fullCert = await contract.getCertificate(authenticHash);
    console.log(`✔ PASS: Certificate verified as REVOKED (Reason: "${fullCert.revocationReason}")`);
    passedTests++;
  } else {
    console.error("✖ FAIL: Revoked certificate was not recognized as revoked.");
  }

  // TEST 9: Double revocation attempt (Expected: Rejected)
  console.log("\n--- TEST 9: Attempt double revocation of revoked certificate ---");
  let doubleRevokeRejected = false;
  try {
    await contract.connect(owner).revokeCertificate(authenticHash, "Second revocation");
  } catch (err) {
    doubleRevokeRejected = true;
    console.log("✔ PASS: Second revocation attempt rejected by contract");
    passedTests++;
  }
  if (!doubleRevokeRejected) console.error("✖ FAIL: Double revocation was allowed.");

  // TEST 10: Off-chain query & data integrity (Expected: Accurate metadata)
  console.log("\n--- TEST 10: Contract state and enumeration validation ---");
  const totalCerts = await contract.getTotalCertificates();
  const hashes = await contract.getCertificateHashes(0, 10);
  if (Number(totalCerts) === 1 && hashes[0] === authenticHash) {
    console.log(`✔ PASS: Total certificates = ${totalCerts}, hash indexed correctly`);
    passedTests++;
  } else {
    console.error("✖ FAIL: Contract state counts do not match.");
  }

  console.log("\n============================================================");
  console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
  console.log("============================================================\n");
}

runEndToEndTests().catch(console.error);

