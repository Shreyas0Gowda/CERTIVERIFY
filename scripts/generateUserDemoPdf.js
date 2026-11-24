const { PDFDocument, rgb, StandardFonts } = require("../backend/node_modules/pdf-lib");
const fs = require("fs");
const path = require("path");

async function generateDemoPdf() {
  console.log("Generating CERTIVERIFY User Demo Guide PDF...");

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTitle = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const pageWidth = 595.28; // A4 Portrait
  const pageHeight = 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  // Modern Color Palette
  const cNavy = rgb(0.03, 0.05, 0.12);
  const cHeaderBg = rgb(0.06, 0.11, 0.22);
  const cCyan = rgb(0.02, 0.65, 0.85);
  const cBlue = rgb(0.08, 0.42, 0.82);
  const cDark = rgb(0.12, 0.16, 0.24);
  const cGray = rgb(0.38, 0.44, 0.52);
  const cLightBg = rgb(0.96, 0.97, 0.99);
  const cBorder = rgb(0.82, 0.86, 0.92);
  const cGreen = rgb(0.05, 0.62, 0.38);
  const cRed = rgb(0.85, 0.2, 0.25);
  const cOrange = rgb(0.92, 0.55, 0.1);
  const cWhite = rgb(1, 1, 1);

  let currentPage = null;
  let currentY = 0;
  let pageNumber = 0;

  function newPage(addHeader = true) {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pageNumber++;
    currentY = pageHeight - margin;

    if (addHeader) {
      currentPage.drawText("CERTIVERIFY — LIVE USER DEMO & TESTING MANUAL", {
        x: margin,
        y: pageHeight - 28,
        size: 7.5,
        font: fontBold,
        color: cCyan,
      });

      currentPage.drawText("PROJECT DEMONSTRATION GUIDE", {
        x: pageWidth - margin - 150,
        y: pageHeight - 28,
        size: 7.5,
        font: fontRegular,
        color: cGray,
      });

      currentPage.drawLine({
        start: { x: margin, y: pageHeight - 34 },
        end: { x: pageWidth - margin, y: pageHeight - 34 },
        thickness: 0.5,
        color: cBorder,
      });

      // Bottom footer
      currentPage.drawLine({
        start: { x: margin, y: 34 },
        end: { x: pageWidth - margin, y: 34 },
        thickness: 0.5,
        color: cBorder,
      });

      currentPage.drawText("Blockchain-Based Academic Certificate Verification System", {
        x: margin,
        y: 22,
        size: 7.5,
        font: fontRegular,
        color: cGray,
      });

      currentPage.drawText(`Page ${pageNumber}`, {
        x: pageWidth - margin - 35,
        y: 22,
        size: 7.5,
        font: fontBold,
        color: cGray,
      });

      currentY = pageHeight - margin - 15;
    }
  }

  function checkY(needed) {
    if (currentY - needed < margin + 30) {
      newPage();
    }
  }

  function drawSectionHeader(title, subtitle) {
    checkY(55);
    currentY -= 10;
    
    // Colored pill tag
    currentPage.drawRectangle({
      x: margin,
      y: currentY - 2,
      width: 4,
      height: 18,
      color: cCyan,
    });

    currentPage.drawText(title.toUpperCase(), {
      x: margin + 10,
      y: currentY + 2,
      size: 13,
      font: fontBold,
      color: cNavy,
    });
    currentY -= 16;

    if (subtitle) {
      currentPage.drawText(subtitle, {
        x: margin + 10,
        y: currentY,
        size: 8.5,
        font: fontRegular,
        color: cGray,
      });
      currentY -= 14;
    }
    currentY -= 6;
  }

  function drawCard(title, lines, borderColor = cBorder, bgColor = cLightBg) {
    const lineHeight = 13;
    const padding = 10;
    const cardHeight = padding * 2 + 16 + lines.length * lineHeight;
    checkY(cardHeight + 10);

    currentPage.drawRectangle({
      x: margin,
      y: currentY - cardHeight,
      width: contentWidth,
      height: cardHeight,
      color: bgColor,
      borderColor: borderColor,
      borderWidth: 1,
    });

    currentPage.drawText(title, {
      x: margin + padding,
      y: currentY - padding - 10,
      size: 10,
      font: fontBold,
      color: cNavy,
    });

    let lineY = currentY - padding - 24;
    for (const line of lines) {
      currentPage.drawText(line, {
        x: margin + padding + 6,
        y: lineY,
        size: 8.5,
        font: fontRegular,
        color: cDark,
      });
      lineY -= lineHeight;
    }

    currentY -= (cardHeight + 10);
  }

  function drawStep(stepNum, stepTitle, details) {
    const lines = Array.isArray(details) ? details : [details];
    const lineHeight = 13;
    const needed = 28 + lines.length * lineHeight;
    checkY(needed);

    // Number bubble
    currentPage.drawRectangle({
      x: margin,
      y: currentY - 16,
      width: 20,
      height: 18,
      color: cHeaderBg,
    });

    currentPage.drawText(stepNum.toString(), {
      x: margin + 6,
      y: currentY - 12,
      size: 9,
      font: fontBold,
      color: cCyan,
    });

    currentPage.drawText(stepTitle, {
      x: margin + 28,
      y: currentY - 11,
      size: 10,
      font: fontBold,
      color: cNavy,
    });

    currentY -= 22;

    for (const l of lines) {
      currentPage.drawText(l, {
        x: margin + 28,
        y: currentY,
        size: 8.5,
        font: fontRegular,
        color: cDark,
      });
      currentY -= lineHeight;
    }
    currentY -= 4;
  }

  // ==================== PAGE 1 ====================
  newPage(false);

  // Cover Banner
  currentPage.drawRectangle({
    x: 0,
    y: pageHeight - 160,
    width: pageWidth,
    height: 160,
    color: cHeaderBg,
  });

  currentPage.drawText("CERTIVERIFY", {
    x: margin,
    y: pageHeight - 55,
    size: 28,
    font: fontTitle,
    color: cWhite,
  });

  currentPage.drawText("Blockchain-Based Academic Certificate Verification System", {
    x: margin,
    y: pageHeight - 80,
    size: 13,
    font: fontBold,
    color: cCyan,
  });

  currentPage.drawText("COMPREHENSIVE LIVE USER DEMONSTRATION & TESTING MANUAL", {
    x: margin,
    y: pageHeight - 105,
    size: 9,
    font: fontRegular,
    color: rgb(0.8, 0.9, 1),
  });

  currentPage.drawText("Step-by-step practical presentation script for College Viva, Lab Evaluation & Final Reviews", {
    x: margin,
    y: pageHeight - 122,
    size: 8,
    font: fontRegular,
    color: rgb(0.65, 0.75, 0.9),
  });

  currentY = pageHeight - 180;

  drawSectionHeader("Part 1: Quick Start & System Initialization", "How to boot the entire full-stack blockchain dApp in one click");

  drawCard("System Launchers (In your root project directory: c:\\Users\\Shreyas\\Downloads\\Blockchain)", [
    "• Option A (Recommended): Double-click 'start-all.bat' (or 'setup.bat').",
    "• Automatically starts the Hardhat local Ethereum node on http://127.0.0.1:8545.",
    "• Automatically starts the Express.js Backend REST API on http://localhost:5000.",
    "• Automatically launches the React.js Vite Frontend Interface on http://localhost:5173.",
    "• Keep the 3 background command prompt windows open while presenting.",
  ], cBlue, rgb(0.94, 0.97, 1.0));

  drawSectionHeader("Part 2: Demo Scenario 1 — Public Certificate Verification", "Zero-login public portal accessible by any employer or embassy worldwide");

  drawStep("1", "Open the Public Verification Gateway", [
    "• Open Google Chrome or any browser and navigate to: http://localhost:5173/verify",
    "• Explain to evaluators: 'No login or account is required. Anyone in the world can verify in 2 seconds.'",
    "• Point out the local client-side hashing notice: document never leaks sensitive data to unverified endpoints."
  ]);

  drawStep("2", "Test Case A: Authentic Credential [GREEN - AUTHENTIC]", [
    "• Folder location: c:\\Users\\Shreyas\\Downloads\\Blockchain\\sample-certificates\\",
    "• Drag and drop 'Alex_Morgan_CS_Authentic.pdf' into the upload card.",
    "• Expected Screen Result: Green verified card with badge 'VERIFIED AUTHENTIC'.",
    "• Shows: Student Name: Alex Morgan | Institution: Stanford | Degree: B.S. in Computer Science.",
    "• Cryptographic Proofs: Issuer Wallet (Contract Owner) & Ethereum Transaction Hash.",
    "• Live Action: Click 'Shareable Verification Link' and 'Print Official Verification Report'."
  ]);

  drawStep("3", "Test Case B: Tampered / Forged Credential [RED - FAILED]", [
    "• Drag and drop 'Alex_Morgan_CS_Tampered.pdf'.",
    "• Context for Examiners: 'This PDF was forged by changing just one grade from First Class to Summa Cum Laude.'",
    "• Expected Screen Result: Red warning card with badge 'VERIFICATION FAILED'.",
    "• Explanation: 'The cryptographic SHA-256 Avalanche Effect altered the hash completely. The altered hash",
    "  has no matching record on the blockchain, immediately catching the forgery.'"
  ]);

  // ==================== PAGE 2 ====================
  newPage();

  drawStep("4", "Test Case C: Revoked Credential [ORANGE - REVOKED]", [
    "• Drag and drop 'Sophia_Chen_MBA_Revoked.pdf'.",
    "• Expected Screen Result: Orange badge 'CERTIFICATE REVOKED'.",
    "• Highlights: Confirms the document was originally authentic, but was formally cancelled on-chain.",
    "• Shows Revocation Reason: 'Degree revoked due to academic thesis misconduct and honor code violation.'",
    "• Key Viva Concept: 'On-chain revocation maintains a permanent audit trail. History is never erased.'"
  ]);

  drawStep("5", "Test Case D: Unregistered / Fake Certificate [RED - FAILED]", [
    "• Drag and drop 'Unregistered_Certificate.pdf'.",
    "• Expected Screen Result: Red badge 'VERIFICATION FAILED'. No ledger entry found."
  ]);

  drawSectionHeader("Part 3: Demo Scenario 2 — University Admin Issuance", "Demonstrating how an academic institution issues a real degree on Ethereum");

  drawStep("1", "Administrator Authentication", [
    "• Open the Admin Login portal: http://localhost:5173/login",
    "• Enter credentials: Username: 'admin'  |  Password: 'AdminPassword123!'",
    "• Security features to mention: Bcrypt password hashing (salt rounds: 10) & JWT token session."
  ]);

  drawStep("2", "Review Live Dashboard Metrics", [
    "• Explain the real-time analytics: Total Issued, Active Degrees, Revoked, and Total Audit Queries.",
    "• Highlight the live Ethereum connection status card showing Chain ID 31337."
  ]);

  drawStep("3", "Issue a Brand New Certificate (/admin/register)", [
    "• Navigate to 'Issue Certificate' in the sidebar navigation.",
    "• Type in ANY real or sample student details (these do NOT need to be specific!):",
    "    - Student Name: 'Shreyas' (or any name you choose)",
    "    - Student ID: 'STU-2026-991'   |   Certificate ID: 'CERT-2026-VTU-001'",
    "    - University: 'Visvesvaraya Technological University'",
    "    - Degree: 'Bachelor of Engineering in Information Science & Engineering'",
    "• Upload File: Pick ANY PDF document on your computer.",
    "• Notice: The browser computes the 64-character SHA-256 fingerprint locally in real time!",
    "• Click 'Register Certificate on Blockchain'.",
    "• Result: The smart contract registers the hash and returns the confirmed transaction ID!"
  ]);

  drawStep("4", "Verify Your New Certificate Live on Public Portal", [
    "• Open an Incognito window and visit http://localhost:5173/verify.",
    "• Drag and drop the exact same PDF you just issued.",
    "• Result: Instant [GREEN - AUTHENTIC] showing your custom student name and university!"
  ]);

  // ==================== PAGE 3 ====================
  newPage();

  drawSectionHeader("Part 4: Demo Scenario 3 — Disciplinary On-Chain Revocation", "Cancelling a degree due to malpractice while retaining the permanent record");

  drawStep("1", "Locate Certificate in Management Portal", [
    "• In the Admin Sidebar, click 'Certificates' (http://localhost:5173/admin/certificates).",
    "• Use the live search bar to search for 'Shreyas' (or your student name).",
    "• The table displays the Certificate ID, Student ID, SHA-256 Fingerprint, and active status."
  ]);

  drawStep("2", "Execute On-Chain Revocation", [
    "• Click the red 'Revoke' button next to the certificate row.",
    "• In the modal, provide a formal disciplinary note:",
    "    Reason: 'Testing on-chain revocation demo: Academic misconduct during final semester.'",
    "• Click 'Confirm Revocation'.",
    "• Result: An Ethereum transaction permanently updates 'isRevoked = true' on the smart contract."
  ]);

  drawStep("3", "Verify the Live Status Change on Public Gateway", [
    "• Switch back to the public verify gateway (http://localhost:5173/verify).",
    "• Upload the same PDF once again.",
    "• Result: The document is no longer green! It now displays [ORANGE - REVOKED]",
    "  together with your exact cancellation reason!"
  ]);

  drawSectionHeader("Part 5: Demo Scenario 4 — Audit Records & Regulatory CSV Export", "Institutional audit compliance for college inspections and accreditors");

  drawStep("1", "Export Regulatory Audit Report", [
    "• On the '/admin/certificates' page, click the 'Export CSV' button.",
    "• A comprehensive '.csv' audit spreadsheet downloads immediately.",
    "• Contains: Certificate ID, Student Name, Roll No, Hash, Status, Issue Date & Blockchain TX Hash.",
    "• Explain to examiners: 'This enables compliance audits by UGC, AICTE, and university registrars.'"
  ]);

  drawSectionHeader("Part 6: Evaluator Questions & Answers Cheat Sheet", "High-frequency Viva questions and model technical responses");

  drawCard("Q1: Why not store the entire PDF file directly on the Ethereum blockchain?", [
    "Answer: Storing raw PDF files on-chain is computationally prohibitive (gas costs would be hundreds of",
    "dollars per MB) and violates data privacy laws (GDPR / FERPA). Instead, we store only the 32-byte",
    "SHA-256 cryptographic fingerprint on-chain, keeping student personal information safely off-chain."
  ], cBlue);

  drawCard("Q2: What prevents an attacker from altering a grade in an authentic PDF?", [
    "Answer: The cryptographic Avalanche Effect. Modifying even a single character in the PDF changes the",
    "computed SHA-256 hash completely. When checked against the blockchain, the altered hash finds zero match."
  ], cBlue);

  drawCard("Q3: What if the local MongoDB database crashes or is wiped?", [
    "Answer: The blockchain remains the immutable Single Source of Truth. The smart contract independently",
    "confirms whether the certificate hash is valid, revoked, and who issued it, regardless of database state."
  ], cBlue);

  // Save to root directory
  const outputDir = path.join(__dirname, "..");
  const outputPath = path.join(outputDir, "CERTIVERIFY_User_Demo_Guide.pdf");
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`✅ Demo Guide PDF generated successfully at: ${outputPath}`);
}

generateDemoPdf().catch(console.error);
