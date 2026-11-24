const { PDFDocument, rgb, StandardFonts } = require("../backend/node_modules/pdf-lib");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function createCertificatePDF(outputPath, studentName, studentId, degree, issueDate, gradeText = "FIRST CLASS WITH DISTINCTION") {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 Landscape
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // Background tint
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.98, 0.99),
  });

  // Double Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.05, 0.25, 0.5),
    borderWidth: 3,
  });

  page.drawRectangle({
    x: 26,
    y: 26,
    width: width - 52,
    height: height - 52,
    borderColor: rgb(0.02, 0.45, 0.8),
    borderWidth: 1,
  });

  // Institution Header
  page.drawText("STANFORD INSTITUTE OF TECHNOLOGY", {
    x: 180,
    y: height - 90,
    size: 26,
    font: fontTimes,
    color: rgb(0.05, 0.2, 0.45),
  });

  page.drawText("ACCREDITED DIVISION OF HIGHER LEARNING", {
    x: 290,
    y: height - 115,
    size: 11,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText("This is to certify that", {
    x: 345,
    y: height - 175,
    size: 14,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Student Name
  page.drawText(studentName.toUpperCase(), {
    x: 260,
    y: height - 225,
    size: 28,
    font: fontTimes,
    color: rgb(0.01, 0.35, 0.65),
  });

  // Student ID
  page.drawText(`Registration ID: ${studentId}`, {
    x: 340,
    y: height - 255,
    size: 12,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText("has fulfilled all academic requirements and is hereby conferred the degree of", {
    x: 185,
    y: height - 305,
    size: 13,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Degree
  page.drawText(degree, {
    x: 170,
    y: height - 345,
    size: 18,
    font: fontBold,
    color: rgb(0.05, 0.15, 0.35),
  });

  // Honors / Grade text
  page.drawText(`HONORS & DISTINCTION: ${gradeText}`, {
    x: 275,
    y: height - 380,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.5, 0.3),
  });

  page.drawText(`Conferred on: ${issueDate}`, {
    x: 350,
    y: height - 420,
    size: 11,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Signatures
  page.drawLine({
    start: { x: 100, y: 80 },
    end: { x: 260, y: 80 },
    thickness: 1,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("Dean of Academic Affairs", {
    x: 115,
    y: 65,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawLine({
    start: { x: 580, y: 80 },
    end: { x: 740, y: 80 },
    thickness: 1,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("Chancellor / President", {
    x: 605,
    y: 65,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  // Compute SHA-256
  const hash = crypto.createHash("sha256").update(pdfBytes).digest("hex");
  return { path: outputPath, hash, size: pdfBytes.length };
}

async function main() {
  const dir = path.join(__dirname, "../sample-certificates");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log("Generating sample authentic, tampered, revoked, and unregistered certificate PDFs...");

  // 1. Authentic Certificate
  const cert1 = await createCertificatePDF(
    path.join(dir, "Alex_Morgan_CS_Authentic.pdf"),
    "Alex Morgan",
    "STU-99214",
    "Bachelor of Science in Computer Science & Engineering",
    "2026-05-15",
    "FIRST CLASS WITH DISTINCTION"
  );

  // 2. Tampered Certificate (altered grade text)
  const cert2 = await createCertificatePDF(
    path.join(dir, "Alex_Morgan_CS_Tampered.pdf"),
    "Alex Morgan",
    "STU-99214",
    "Bachelor of Science in Computer Science & Engineering",
    "2026-05-15",
    "SUMMA CUM LAUDE - FORGED ALTERATION"
  );

  // 3. Revoked Certificate
  const cert3 = await createCertificatePDF(
    path.join(dir, "Sophia_Chen_MBA_Revoked.pdf"),
    "Sophia Chen",
    "STU-88102",
    "Master of Business Administration (Finance & Analytics)",
    "2025-06-20",
    "DISTINCTION"
  );

  // 4. Unregistered Certificate
  const cert4 = await createCertificatePDF(
    path.join(dir, "Unregistered_Certificate.pdf"),
    "David Miller",
    "STU-77005",
    "Bachelor of Arts in Media Communications",
    "2024-12-10",
    "SECOND CLASS"
  );

  const manifest = {
    authentic: cert1,
    tampered: cert2,
    revoked: cert3,
    unregistered: cert4,
  };

  fs.writeFileSync(path.join(dir, "certificates-manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("All sample certificate PDFs generated successfully!");
}

main().catch(console.error);
