# CERTIVERIFY
> **"Trust Every Credential. Verify on Blockchain."**

A complete, production-grade, decentralized academic certificate verification system engineered to eliminate academic credential forgery using Ethereum smart contracts, cryptographic SHA-256 binary fingerprinting, and tamper-resistant distributed ledger records.

---

## 1. PROJECT OVERVIEW & PROBLEM STATEMENT

### The Problem
Academic certificate forgery and fake degrees represent a multi-billion dollar illicit market. Conventional verification methods suffer from severe vulnerabilities:
- **Centralized Database Vulnerabilities**: Records stored in institutional SQL databases can be quietly altered, injected, or wiped by compromised credentials or rogue database administrators.
- **Manual Verification Latency**: Traditional background checks take days to weeks, requiring manual emails and phone calls to university registrar offices.
- **Document Tampering**: High-quality forged PDFs and physical diplomas look indistinguishable from originals without mathematical proofs.

### The Solution: CertiVerify
CertiVerify implements mathematical, cryptographic immutability:
1. Every certificate document is hashed using the industry-standard **SHA-256** algorithm directly from its raw bytes.
2. The resulting 64-character hexadecimal digest is permanently recorded in an **Ethereum Solidity smart contract** (`CertificateVerification.sol`).
3. Only the verified contract owner (the institutional administrator's wallet) has cryptographic authorization to issue or revoke certificates.
4. Anyone—employers, institutions, or students—can upload a candidate PDF to immediately compare its mathematical digest against the blockchain ledger.
5. If even a single punctuation mark, student name letter, or grade is altered, the SHA-256 hash completely changes, instantly triggering an **INVALID / FORGERY** verdict.

---

## 2. ARCHITECTURE & SYSTEM DESIGN

```
+-----------------------------------------------------------------------------------+
|                                 USER / VERIFIER                                   |
|   (Uploads PDF / Enters SHA-256 Hash on Public Gateway - No Login Required)       |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        REACT FRONTEND (Vite + Tailwind CSS)                       |
|   * Web Crypto API (In-browser raw byte SHA-256 computation)                     |
|   * Ethers.js v6 (MetaMask Wallet Connector & Web3 Provider)                      |
|   * SaaS Dark-Navy Design System (Tailwind, Lucide React, Glassmorphism)          |
+-----------------------------------------------------------------------------------+
             |                                                  |
             | REST API Requests                                | JSON-RPC (eth_call /
             | (/api/certificates/verify)                       |  eth_sendTransaction)
             v                                                  v
+-----------------------------------------+    +------------------------------------+
|       EXPRESS.JS BACKEND GATEWAY        |    |       ETHEREUM BLOCKCHAIN          |
|   * JWT & Bcrypt Administrator Auth     |    |   * CertificateVerification.sol    |
|   * Multer Raw-Buffer SHA-256 Validation|    |   * OpenZeppelin Ownable Access    |
|   * Rate Limiter & Audit Logger         |    |   * On-chain Hash & Status Mapping |
|   * Mongoose Models + Embedded Fallback |    |   * Events: Registered & Revoked   |
+-----------------------------------------+    +------------------------------------+
                     |                                          ^
                     | Queries Blockchain as Source of Truth    |
                     +------------------------------------------+
```

---

## 3. TECHNOLOGY STACK

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, React Router v6, Ethers.js v6 |
| **Backend API** | Node.js, Express.js, JWT, Bcrypt.js, Multer, Express-Rate-Limit, PDF-Lib |
| **Blockchain** | Solidity `^0.8.20`, Hardhat, OpenZeppelin Contracts, Mocha, Chai, Ethers.js |
| **Database** | MongoDB & Mongoose (with built-in offline persistent JSON fallback) |
| **Cryptography** | SHA-256 (Web Crypto API in frontend, Node.js `crypto` in backend) |

---

## 4. PROJECT FOLDER STRUCTURE

```
Blockchain/
├── backend/
│   ├── config/
│   │   ├── db.js                     # MongoDB connection & offline fallback store
│   │   ├── blockchain.js             # Ethers provider & contract integration
│   │   └── contractData.json         # Deployed contract address & ABI
│   ├── controllers/
│   │   ├── authController.js         # Admin JWT login & profile
│   │   ├── certificateController.js  # Registration, on-chain verify & revocation
│   │   └── dashboardController.js    # System telemetry & stats
│   ├── middleware/
│   │   ├── auth.js                   # JWT & admin role guard
│   │   └── upload.js                 # Multer PDF filter & buffer hashing
│   ├── models/
│   │   ├── Admin.js                  # Institutional administrator schema
│   │   ├── Certificate.js            # Certificate metadata & tx hash schema
│   │   └── VerificationLog.js        # Audit trail logging schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── certificateRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── blockchainRoutes.js
│   ├── scripts/
│   │   └── seedAdmin.js              # Auto-seeds default admin credentials
│   └── server.js                     # Express app gateway entrypoint
├── blockchain/
│   ├── contracts/
│   │   └── CertificateVerification.sol # Solidity smart contract
│   ├── scripts/
│   │   └── deploy.js                 # Deployment script (exports address & ABI)
│   ├── test/
│   │   └── CertificateVerification.test.js # 18 Hardhat unit test cases
│   └── hardhat.config.js             # Hardhat network configuration (Chain 31337)
├── frontend/
│   ├── src/
│   │   ├── components/               # Navbar, Footer, Status indicators
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Admin session provider
│   │   │   └── WalletContext.jsx     # MetaMask Ethers.js connector
│   │   ├── layouts/
│   │   │   └── AdminLayout.jsx       # Admin sidebar & topbar workspace
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Public landing page with hero & features
│   │   │   ├── VerifyPage.jsx        # Public drag-and-drop verification
│   │   │   ├── LoginPage.jsx         # Admin authentication
│   │   │   ├── DashboardPage.jsx     # Real-time statistics & telemetry
│   │   │   ├── RegisterPage.jsx      # 9-step registration & MetaMask signing
│   │   │   └── CertificatesListPage.jsx # Registry table, search, filters & revoke
│   │   ├── services/
│   │   │   └── api.js                # REST API client
│   │   ├── utils/
│   │   │   └── crypto.js             # Web Crypto API SHA-256 calculation
│   │   └── App.jsx                   # React Router routing
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
├── sample-certificates/              # Generated PDF test certificates
│   ├── Alex_Morgan_CS_Authentic.pdf
│   ├── Alex_Morgan_CS_Tampered.pdf
│   ├── Unregistered_Certificate.pdf
│   └── certificates-manifest.json
├── scripts/
│   ├── generateCertificates.js       # Generates authentic & tampered PDFs
│   └── testEndToEnd.js               # 10 automated end-to-end integration tests
├── .env.example
├── package.json
└── README.md
```

---

## 5. SMART CONTRACT SPECIFICATION (`CertificateVerification.sol`)

The smart contract is written in Solidity `0.8.20` and leverages OpenZeppelin's `Ownable` pattern:

### Core Data Structure
```solidity
struct Certificate {
    string certificateId;          // Human-readable ID (e.g. CERT-2026-CS-001)
    string certificateHash;        // 64-char lowercase SHA-256 hex string
    address issuer;                // Admin wallet that registered the certificate
    uint256 issueTimestamp;        // Block timestamp of registration
    bool isRevoked;                // Revocation status flag
    uint256 revocationTimestamp;   // Block timestamp of revocation (if revoked)
    string revocationReason;       // Justification recorded on-chain
    bool exists;                   // Exists guard flag
}
```

### Functions
- `registerCertificate(string certificateId, string certificateHash)`: Only contract owner. Prevents duplicate hashes and duplicate IDs. Emits `CertificateRegistered`.
- `verifyCertificate(string certificateHash)`: Public view function. Returns `(isValid, isRevoked, certificateId, issuer, issueTimestamp)`.
- `getCertificate(string certificateHash)`: Retrieves full certificate struct. Reverts if not found.
- `getCertificateById(string certificateId)`: Retrieves full certificate struct by certificate ID.
- `revokeCertificate(string certificateHash, string reason)`: Only contract owner. Marks certificate revoked and records reason. Emits `CertificateRevoked`.
- `getTotalCertificates()`: Returns total count of issued certificates.
- `getCertificateHashes(uint256 offset, uint256 limit)`: Paginated enumeration of certificate hashes.

---

## 6. QUICK START GUIDE (WINDOWS POWERSHELL)

### Prerequisites
- Node.js (v18, v20, or v22+ recommended)
- Google Chrome or Brave Browser with **MetaMask** extension installed

---

### Step 1: Start the Local Ethereum Blockchain
In **Terminal 1**, run:
```powershell
cd c:\Users\Shreyas\Downloads\Blockchain\blockchain
npx hardhat node
```
This starts an Ethereum JSON-RPC node on `http://127.0.0.1:8545/` with 20 funded test accounts (10,000 ETH each).

---

### Step 2: Deploy the Smart Contract
In **Terminal 2**, deploy the contract to the local network:
```powershell
cd c:\Users\Shreyas\Downloads\Blockchain\blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*This automatically compiles `CertificateVerification.sol`, deploys it to the network, and writes the deployment address and ABI to `deployed-contract.json`, `backend/config/contractData.json`, and `frontend/src/contracts/contractData.json`.*

---

### Step 3: Start the Backend API
In **Terminal 3**, run:
```powershell
cd c:\Users\Shreyas\Downloads\Blockchain\backend
npm start
```
The API server will launch on `http://localhost:5000`.
- If MongoDB is installed locally on `mongodb://127.0.0.1:27017`, it connects automatically.
- If MongoDB is not running, CertiVerify automatically enables its robust persistent JSON fallback storage (`certiverify_store.json`), allowing full operation without setting up a database server.
- Default administrator account is seeded automatically:
  - **Username**: `admin`
  - **Password**: `AdminPassword123!`

---

### Step 4: Start the React Frontend
In **Terminal 4**, start the Vite dev server:
```powershell
cd c:\Users\Shreyas\Downloads\Blockchain\frontend
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 7. METAMASK CONFIGURATION GUIDE

To interact with the smart contract as an institutional administrator:

1. Open **MetaMask** in your browser.
2. Click the Network dropdown (top left) and choose **Add Network** -> **Add a network manually**.
3. Enter the following parameters:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. Click **Save** and switch to `Hardhat Localhost`.
5. Import the **Deployer Account** (the smart contract owner):
   - In MetaMask, click the Account avatar -> **Add account or hardware wallet** -> **Import account**.
   - Paste the private key for Hardhat Account #0:
     ```
     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
     ```
   - Account Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Balance: `10000 ETH`
6. Log in to CertiVerify at `http://localhost:5173/login` using `admin` / `AdminPassword123!`.
7. Click **Connect MetaMask** in the navbar to connect your imported account!

---

## 8. TESTING & QUALITY ASSURANCE

### 1. Smart Contract Unit Tests (Mocha & Chai)
Run the 18 automated unit tests:
```powershell
cd c:\Users\Shreyas\Downloads\Blockchain\blockchain
npx hardhat test
```
**Test Coverage**:
- Deployer & ownership verification
- Successful registration & event emission
- Non-owner unauthorized registration rejection
- Duplicate certificate hash rejection
- Duplicate certificate ID rejection
- Empty input validation
- Public caller verification
- Non-existent hash lookup handling
- Certificate retrieval by hash & ID
- Owner revocation with justification & event emission
- Unauthorized revocation rejection
- Double revocation rejection
- Pagination of certificate hashes

---

### 2. Comprehensive End-to-End System Integration Tests
Execute the 10-step full workflow test:
```powershell
cd c:\Users\Shreyas\Downloads\Blockchain\blockchain
npx hardhat run ../scripts/testEndToEnd.js
```
**Scenarios Tested**:
1. **TEST 1**: Register a valid certificate on-chain (`CERT-2026-STAN-001`).
2. **TEST 2**: Upload exact authentic PDF for verification (`Alex_Morgan_CS_Authentic.pdf`). Result: `AUTHENTIC`.
3. **TEST 3**: Upload modified/tampered PDF (`Alex_Morgan_CS_Tampered.pdf`). Result: `INVALID`.
4. **TEST 4**: Upload completely unrelated PDF (`Unregistered_Certificate.pdf`). Result: `INVALID`.
5. **TEST 5**: Attempt duplicate certificate hash registration. Result: `REVERTED`.
6. **TEST 6**: Attempt registration from unauthorized wallet. Result: `REVERTED`.
7. **TEST 7**: Revoke an existing certificate with justification. Result: `CONFIRMED`.
8. **TEST 8**: Verify a revoked certificate. Result: `REVOKED`.
9. **TEST 9**: Attempt double revocation of revoked certificate. Result: `REVERTED`.
10. **TEST 10**: Verify contract state counts and pagination indices. Result: `VALIDATED`.

---

## 9. API REFERENCE

### Authentication
- `POST /api/auth/login`: Authenticates administrator with username/email & password. Returns JWT token.
- `GET /api/auth/me`: Validates session token and returns admin profile.
- `POST /api/auth/wallet`: Links connected MetaMask wallet address to administrator profile.

### Verification (Public)
- `POST /api/certificates/verify`:
  - Accepts multipart PDF file upload (`certificateFile`) or JSON `{ certificateHash }`.
  - Rate limited (100 requests per 15 min per IP).
  - Queries blockchain smart contract first.
  - Returns `{ status: "authentic" | "invalid" | "revoked", data: {...} }`.

### Certificate Management (Admin Only)
- `POST /api/certificates/register`: Accepts PDF and metadata, verifies on-chain transaction receipt, and stores metadata in database.
- `GET /api/certificates`: Retrieves paginated list of certificates with search query and filters.
- `GET /api/certificates/:id`: Retrieves full certificate record by ID or hash, combining database metadata and live on-chain state.
- `POST /api/certificates/:id/revoke`: Records revocation transaction hash and reason in database.

### Dashboard & Telemetry
- `GET /api/dashboard/stats`: Returns live counts (total issued, active, revoked, verifications logged), recent registrations, and node telemetry.
- `GET /api/blockchain/status`: Returns current RPC URL, chain ID, latest block height, contract address, and owner address.
- `GET /api/blockchain/contract-abi`: Returns deployed contract ABI and address.

---

## 10. TROUBLESHOOTING

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **MetaMask says "Wrong Network"** | MetaMask is connected to Ethereum Mainnet or Sepolia instead of Localhost. | Click the "Switch to Localhost" button in the navbar or select `Hardhat Localhost` in MetaMask (Chain ID `31337`). |
| **MetaMask says "Nonce too high"** | Local Hardhat node was restarted while MetaMask cached old account nonces. | In MetaMask, go to Settings -> Advanced -> **Clear activity tab data**. |
| **Registration rejected: Non-Owner** | Connected wallet is not Hardhat Account #0 (`0xf39Fd6...`). | Import Account #0 private key (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`) into MetaMask. |
| **MongoDB not running** | Local `mongod` service is not installed or stopped. | No action required! CertiVerify will automatically enable its robust persistent JSON fallback store. |
| **File type error during upload** | Uploaded file is an image or document rather than a PDF. | Convert the document to a standard `.pdf` before uploading. |

---

## 11. LICENSE & CREDITS
Developed as an advanced academic project for blockchain-based certificate verification and academic credential integrity.
Open-source under the MIT License.

