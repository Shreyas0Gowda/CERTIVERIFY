# CERTIVERIFY: ACADEMIC PROJECT REPORT & VIVA DEFENSE GUIDE

---

## 1. PROJECT OVERVIEW FOR EVALUATORS

### Title
**CERTIVERIFY: A Decentralized Blockchain-Based Academic Certificate Verification System**

### Domain
Blockchain Engineering, Cryptography, Distributed Systems, Full-Stack Web Development (Web3)

### Executive Abstract
Traditional academic credentials suffer from centralized database vulnerabilities, insider manipulation, and high verification friction. **CERTIVERIFY** solves credential forgery by mathematically binding official digital certificate PDFs to 256-bit SHA-256 cryptographic fingerprints immutated on an Ethereum-compatible distributed ledger. 

The system leverages an authorized institutional smart contract (`CertificateVerification.sol`) governed by OpenZeppelin access controls. While human-readable student metadata is indexed off-chain for privacy and gas efficiency, the blockchain remains the unforgeable, decentralized single source of truth for authenticity and revocation state.

---

## 2. SYSTEM ARCHITECTURE & DATA FLOW

```
                          [ INSTITUTIONAL ADMIN ]
                                     |
              +----------------------+----------------------+
              |                                             |
     1. Fills Student Data                     2. Uploads Official PDF
              |                                             |
              v                                             v
     [ Form Validation ]                       [ SHA-256 Hash Digest ]
              |                                 (Local Web Crypto API)
              |                                             |
              +----------------------+----------------------+
                                     |
                                     v
                       [ Cryptographic Preview ]
                                     |
                                     v
                     [ MetaMask Wallet Approval ]
                 (Signs with Contract Owner Private Key)
                                     |
                     +---------------+---------------+
                     |                               |
                     v                               v
         [ Ethereum Blockchain ]             [ Database Ledger ]
       CertificateVerification.sol       (MongoDB / Persistent Store)
        * Maps Hash -> Struct               * Student Name, ID
        * Owner Authorization Guard         * Degree, Department
        * Emits CertificateRegistered       * Blockchain TX Hash
                     |                               |
                     +---------------+---------------+
                                     |
                                     v
                   =====================================
                   PUBLIC VERIFICATION FLOW (ZERO LOGIN)
                   =====================================
                                     |
                                     v
                       [ Verifier Uploads Any PDF ]
                                     |
                                     v
                       [ Calculate SHA-256 Hash ]
                                     |
                                     v
                     [ Query Blockchain Smart Contract ]
                       verifyCertificate(documentHash)
                                     |
            +------------------------+------------------------+
            |                        |                        |
            v                        v                        v
     [ Case A: MATCH ]       [ Case B: REVOKED ]     [ Case C: NO MATCH ]
       (isValid = true)        (isRevoked = true)      (isValid = false)
            |                        |                        |
            v                        v                        v
    GREEN: "AUTHENTIC"       ORANGE: "REVOKED"        RED: "INVALID / FORGED"
    Full Academic Proof      Revocation Reason        Hash Mismatch Alert
    Consensus Timestamp      On-Chain Block Time      Tamper Proof Warning
```

---

## 3. KEY ARCHITECTURAL DECISIONS

| Design Dimension | Traditional System | CertiVerify Solution | Engineering Rationale |
| :--- | :--- | :--- | :--- |
| **Source of Truth** | Centralized SQL Database | Ethereum Smart Contract | Prevents DBAs or hackers from quietly altering records. |
| **PDF Storage** | Stored on Server Disk | Kept by Student / Issuer | Storing large files on-chain costs excessive gas; storing hashes is $O(1)$ gas. |
| **Document Matching** | Filename / DB ID Lookup | SHA-256 Raw Byte Digest | If even 1 pixel or character in the PDF changes, the hash changes completely. |
| **Authorization** | Username / Password Session | MetaMask Private Key (ECDSA) | Smart contract verifies `msg.sender == owner` at the EVM protocol level. |
| **Revocation Model** | Row Deletion (`DELETE FROM`) | On-Chain State Mutation | Never delete history; permanently mark revoked with immutable timestamp & reason. |

---

## 4. TOP 15 VIVA & INTERVIEW QUESTIONS WITH TECHNICAL ANSWERS

### Q1: Why did you use SHA-256 for certificate verification?
**Answer:**
SHA-256 is a NIST-standardized cryptographic hash function producing a deterministic 256-bit (64-character hex) output. It possesses three crucial mathematical properties:
1. **Pre-image Resistance (One-Way):** Given a hash, it is computationally infeasible to reconstruct the original PDF document.
2. **Collision Resistance:** It is mathematically impossible (probability $\approx 10^{-77}$) for two different certificates to produce the exact same hash.
3. **Avalanche Effect:** Changing a single letter (e.g. changing grade "B" to "A") alters more than 50% of the output bits, making document tampering immediately detectable.

### Q2: Why don't you store the student's name and grade directly on the blockchain?
**Answer:**
For two vital reasons:
1. **Privacy & GDPR Compliance:** Public blockchains are transparent and immutable. Putting personal identifiable information (PII) like student names, grades, and birthdates on a public ledger violates data privacy rights and cannot be removed ("Right to be Forgotten").
2. **Gas Optimization:** Storing long strings on Ethereum storage (`SSTORE`) is extremely expensive (20,000 gas per 32-byte slot). By storing only the fixed-size 64-character SHA-256 digest, we keep gas costs minimal and constant $O(1)$.

### Q3: What prevents an attacker from claiming they issued a fake certificate?
**Answer:**
The smart contract implements the **OpenZeppelin Ownable** design pattern. The state variable `owner` is set to the institution's public address during deployment. 
The function:
```solidity
function registerCertificate(string calldata certificateId, string calldata certificateHash) external onlyOwner
```
enforces that `msg.sender == owner`. Any transaction initiated by an unauthorized wallet reverts with `OwnableUnauthorizedAccount` before any state is modified.

### Q4: How does the public verification work without requiring users to log in?
**Answer:**
Ethereum smart contract view functions (like `verifyCertificate(string calldata certificateHash)`) are read-only (`view`). They do not modify EVM state, require no gas fees, and do not require private key signing. Anyone can make a read call via the public JSON-RPC provider to query the ledger directly.

### Q5: What happens if someone modifies a single grade in the PDF?
**Answer:**
When the verifier uploads the modified PDF, the browser reads the file's raw array buffer via the Web Crypto API (`window.crypto.subtle.digest("SHA-256", buffer)`). Because of the cryptographic avalanche effect, the computed hash will be completely different from the authentic hash recorded during registration. The contract returns `isValid = false`, and the UI instantly flags it with a **Red "Verification Failed / Tampered"** alert.

### Q6: Can a revoked certificate ever be marked authentic again?
**Answer:**
No. Once `revokeCertificate(certificateHash, reason)` is executed by the owner:
- `cert.isRevoked` is set to `true`.
- In `verifyCertificate()`, if `cert.isRevoked == true`, it explicitly returns `(false, true, ...)` meaning `isValid = false` and `isRevoked = true`.
- The contract also prevents double-revocation by reverting with `CertificateAlreadyRevoked`.

### Q7: Why not just use digital signatures (asymmetric cryptography / PGP)?
**Answer:**
While digital signatures prove the issuer signed a file at some point, they have major limitations:
1. **No Decentralized Revocation:** If a signed certificate is later revoked, the signature remains mathematically valid unless verified against a centralized Revocation List (CRL/OCSP).
2. **Key Expiry:** If an institution rotates or loses its private signing key years later, past certificates may become unverifiable.
3. **Blockchain consensus provides an immutable audit trail** with exact block inclusion timestamps that cannot be forged.

### Q8: What database did you use, and what is its role?
**Answer:**
We used MongoDB with Mongoose schemas for human-readable application metadata (student name, roll number, course, department, and audit logs). 
However, **MongoDB is not the source of truth for authenticity**. The backend always queries the smart contract first. Even if an intruder hacked the database and injected a record, the system would verify against the blockchain and declare it **Invalid**.

### Q9: What happens if MongoDB is offline or unavailable?
**Answer:**
CertiVerify includes an automated fallback storage adapter (`certiverify_store.json`). If MongoDB is unreachable, the system automatically activates a persistent file-backed store so all CRUD operations and verification logging continue without downtime or crashes.

### Q10: How did you test the smart contract?
**Answer:**
We authored an automated test suite with Mocha, Chai, and Hardhat covering 18 unit tests and 10 end-to-end integration tests:
- Contract deployment & deployer ownership.
- Valid certificate registration & event emission (`CertificateRegistered`).
- Rejection of duplicate hashes and duplicate IDs.
- Rejection of unauthorized (non-owner) calls.
- Valid document verification.
- Unregistered / tampered document detection.
- Owner revocation with event emission (`CertificateRevoked`).
- Rejection of unauthorized revocation and double revocation.
- Hash array pagination and enumeration.

---

## 5. 5-MINUTE LIVE DEMO SCRIPT FOR EXAMINERS

Follow this exact sequence when presenting to your project examiner:

1. **Step 1: Open the Landing Page (`http://localhost:5173`)**
   - Point out the SaaS dark-navy interface, the tagline *"Trust Every Credential. Verify on Blockchain."*, and explain the 4-step workflow diagram.

2. **Step 2: Demonstrate Authentic Verification**
   - Navigate to `/verify`.
   - Drag and drop `sample-certificates/Alex_Morgan_CS_Authentic.pdf`.
   - Show the examiner the **Green "Verified Authentic"** card. Highlight the Certificate ID (`CERT-2026-STAN-001`), issuing institution, issuer wallet address, and the registration transaction hash.
   - Click **"Print Official Verification Report"** to show the print-ready verification proof.

3. **Step 3: Demonstrate Tamper Detection (The Wow Factor)**
   - Click "Verify Another Certificate".
   - Drag and drop `sample-certificates/Alex_Morgan_CS_Tampered.pdf` (where honors text was altered).
   - Show the examiner the **Red "Verification Failed"** alert. Explain that altering just one word in the PDF caused the SHA-256 hash to change, proving that the document was modified.

4. **Step 4: Demonstrate Admin Portal & MetaMask**
   - Navigate to `/login` and sign in with `admin` / `AdminPassword123!`.
   - Show the **Dashboard** metrics: Total Issued, Active, Revoked, and live Ethereum block height.
   - Show the **Wallet indicator** displaying the connected Hardhat Account #0 with the green "Contract Owner" pill.

5. **Step 5: Demonstrate Certificate Revocation**
   - Go to `/admin/certificates`.
   - Find a certificate and click the red trash/revoke icon.
   - Enter a justification: *"Degree revoked due to academic dishonesty"*.
   - Confirm the transaction in MetaMask.
   - Return to `/verify` and upload the revoked PDF &rarr; Show that it now displays an **Orange "Revoked"** warning with the exact revocation reason!

---

## 6. FUTURE ENHANCEMENTS & EXTENSIONS

1. **IPFS / Decentralized Storage:** Encrypting and pinning the certificate PDF to IPFS (InterPlanetary File System) or Filecoin for decentralized document storage.
2. **Zero-Knowledge Proofs (zk-SNARKs):** Allowing a graduate to mathematically prove they have a GPA $> 3.5$ without revealing their actual grades.
3. **Soulbound Tokens (EIP-5114 / ERC-721S):** Issuing non-transferable NFTs directly to student wallet addresses representing academic credentials.
4. **Multi-Sig Institutional Governance:** Requiring both the University Registrar and the Dean to co-sign before a degree is registered.

