const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateVerification Smart Contract", function () {
  let certVerify;
  let owner;
  let unauthorizedAccount;
  let studentAccount;

  const sampleCertId1 = "CERT-2026-CS-001";
  const sampleHash1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const sampleCertId2 = "CERT-2026-EE-002";
  const sampleHash2 = "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb";
  const nonExistentHash = "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce";

  beforeEach(async function () {
    [owner, unauthorizedAccount, studentAccount] = await ethers.getSigners();

    const CertificateVerification = await ethers.getContractFactory("CertificateVerification");
    certVerify = await CertificateVerification.deploy();
    await certVerify.waitForDeployment();
  });

  describe("Deployment and Ownership", function () {
    it("should set the deployer as the initial owner", async function () {
      expect(await certVerify.owner()).to.equal(owner.address);
    });

    it("should start with 0 total certificates", async function () {
      const total = await certVerify.getTotalCertificates();
      expect(Number(total)).to.equal(0);
    });
  });

  describe("Certificate Registration", function () {
    it("should allow the owner to register a valid certificate and record event", async function () {
      const tx = await certVerify.connect(owner).registerCertificate(sampleCertId1, sampleHash1);
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);
      const total = await certVerify.getTotalCertificates();
      expect(Number(total)).to.equal(1);
      expect(await certVerify.isCertificateRegistered(sampleHash1)).to.be.true;
    });

    it("should reject registration from an unauthorized account (non-owner)", async function () {
      let threw = false;
      try {
        await certVerify.connect(unauthorizedAccount).registerCertificate(sampleCertId1, sampleHash1);
      } catch (err) {
        threw = true;
        expect(err.message).to.match(/OwnableUnauthorizedAccount|revert/);
      }
      expect(threw).to.be.true;
    });

    it("should reject duplicate certificate hash", async function () {
      await certVerify.connect(owner).registerCertificate(sampleCertId1, sampleHash1);

      let threw = false;
      try {
        await certVerify.connect(owner).registerCertificate("CERT-DIFF-ID", sampleHash1);
      } catch (err) {
        threw = true;
        expect(err.message).to.match(/CertificateAlreadyRegistered|revert/);
      }
      expect(threw).to.be.true;
    });

    it("should reject duplicate certificate ID", async function () {
      await certVerify.connect(owner).registerCertificate(sampleCertId1, sampleHash1);

      let threw = false;
      try {
        await certVerify.connect(owner).registerCertificate(sampleCertId1, sampleHash2);
      } catch (err) {
        threw = true;
        expect(err.message).to.match(/CertificateIdAlreadyExists|revert/);
      }
      expect(threw).to.be.true;
    });

    it("should reject empty certificateId or empty certificateHash", async function () {
      let threwEmptyId = false;
      try {
        await certVerify.connect(owner).registerCertificate("", sampleHash1);
      } catch (err) {
        threwEmptyId = true;
        expect(err.message).to.match(/InvalidInput|revert/);
      }
      expect(threwEmptyId).to.be.true;

      let threwEmptyHash = false;
      try {
        await certVerify.connect(owner).registerCertificate(sampleCertId1, "");
      } catch (err) {
        threwEmptyHash = true;
        expect(err.message).to.match(/InvalidInput|revert/);
      }
      expect(threwEmptyHash).to.be.true;
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await certVerify.connect(owner).registerCertificate(sampleCertId1, sampleHash1);
    });

    it("should verify an authentic certificate as valid and not revoked", async function () {
      const [isValid, isRevoked, certId, issuer, issueTimestamp] =
        await certVerify.verifyCertificate(sampleHash1);

      expect(isValid).to.be.true;
      expect(isRevoked).to.be.false;
      expect(certId).to.equal(sampleCertId1);
      expect(issuer).to.equal(owner.address);
      expect(Number(issueTimestamp)).to.be.greaterThan(0);
    });

    it("should return false for an unregistered/non-existent certificate hash", async function () {
      const [isValid, isRevoked, certId, issuer, issueTimestamp] =
        await certVerify.verifyCertificate(nonExistentHash);

      expect(isValid).to.be.false;
      expect(isRevoked).to.be.false;
      expect(certId).to.equal("");
      expect(issuer).to.equal(ethers.ZeroAddress);
      expect(Number(issueTimestamp)).to.equal(0);
    });

    it("should allow public caller (anyone without login) to verify certificates", async function () {
      const [isValid] = await certVerify.connect(studentAccount).verifyCertificate(sampleHash1);
      expect(isValid).to.be.true;
    });
  });

  describe("Certificate Details Retrieval", function () {
    beforeEach(async function () {
      await certVerify.connect(owner).registerCertificate(sampleCertId1, sampleHash1);
    });

    it("should retrieve full certificate details by hash", async function () {
      const cert = await certVerify.getCertificate(sampleHash1);
      expect(cert.certificateId).to.equal(sampleCertId1);
      expect(cert.certificateHash).to.equal(sampleHash1);
      expect(cert.issuer).to.equal(owner.address);
      expect(cert.isRevoked).to.be.false;
      expect(cert.exists).to.be.true;
    });

    it("should retrieve full certificate details by certificate ID", async function () {
      const cert = await certVerify.getCertificateById(sampleCertId1);
      expect(cert.certificateId).to.equal(sampleCertId1);
      expect(cert.certificateHash).to.equal(sampleHash1);
    });

    it("should revert if fetching non-existent certificate", async function () {
      let threwHash = false;
      try {
        await certVerify.getCertificate(nonExistentHash);
      } catch (err) {
        threwHash = true;
        expect(err.message).to.match(/CertificateNotFound|revert/);
      }
      expect(threwHash).to.be.true;

      let threwId = false;
      try {
        await certVerify.getCertificateById("INVALID-ID");
      } catch (err) {
        threwId = true;
        expect(err.message).to.match(/CertificateNotFound|revert/);
      }
      expect(threwId).to.be.true;
    });
  });

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await certVerify.connect(owner).registerCertificate(sampleCertId1, sampleHash1);
    });

    it("should allow owner to revoke certificate with a reason", async function () {
      const reason = "Degree revoked due to academic dishonesty";

      const tx = await certVerify.connect(owner).revokeCertificate(sampleHash1, reason);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const [isValid, isRevoked] = await certVerify.verifyCertificate(sampleHash1);
      expect(isValid).to.be.false;
      expect(isRevoked).to.be.true;

      const cert = await certVerify.getCertificate(sampleHash1);
      expect(cert.isRevoked).to.be.true;
      expect(cert.revocationReason).to.equal(reason);
      expect(Number(cert.revocationTimestamp)).to.be.greaterThan(0);
    });

    it("should reject revocation attempt by unauthorized account", async function () {
      let threw = false;
      try {
        await certVerify.connect(unauthorizedAccount).revokeCertificate(sampleHash1, "Fraud");
      } catch (err) {
        threw = true;
        expect(err.message).to.match(/OwnableUnauthorizedAccount|revert/);
      }
      expect(threw).to.be.true;
    });

    it("should reject revocation of a certificate that does not exist", async function () {
      let threw = false;
      try {
        await certVerify.connect(owner).revokeCertificate(nonExistentHash, "Reason");
      } catch (err) {
        threw = true;
        expect(err.message).to.match(/CertificateNotFound|revert/);
      }
      expect(threw).to.be.true;
    });

    it("should reject double revocation of an already revoked certificate", async function () {
      await certVerify.connect(owner).revokeCertificate(sampleHash1, "First revocation");

      let threw = false;
      try {
        await certVerify.connect(owner).revokeCertificate(sampleHash1, "Second attempt");
      } catch (err) {
        threw = true;
        expect(err.message).to.match(/CertificateAlreadyRevoked|revert/);
      }
      expect(threw).to.be.true;
    });
  });

  describe("Enumeration and Pagination", function () {
    it("should support pagination of registered hashes", async function () {
      await certVerify.connect(owner).registerCertificate(sampleCertId1, sampleHash1);
      await certVerify.connect(owner).registerCertificate(sampleCertId2, sampleHash2);

      const total = await certVerify.getTotalCertificates();
      expect(Number(total)).to.equal(2);

      const page1 = await certVerify.getCertificateHashes(0, 1);
      expect(page1.length).to.equal(1);
      expect(page1[0]).to.equal(sampleHash1);

      const page2 = await certVerify.getCertificateHashes(1, 1);
      expect(page2.length).to.equal(1);
      expect(page2[0]).to.equal(sampleHash2);

      const all = await certVerify.getCertificateHashes(0, 10);
      expect(all.length).to.equal(2);
    });
  });
});
