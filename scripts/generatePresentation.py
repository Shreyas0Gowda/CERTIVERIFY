import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Colors
    BG_DARK = RGBColor(7, 13, 30)       # #070d1e
    CARD_BG = RGBColor(15, 23, 42)      # #0f172a
    CARD_BORDER = RGBColor(30, 41, 59)  # #1e293b
    CYAN = RGBColor(6, 182, 212)        # #06b6d4
    EMERALD = RGBColor(16, 185, 129)    # #10b981
    ROSE = RGBColor(244, 63, 94)        # #f43f5e
    AMBER = RGBColor(245, 158, 11)      # #f59e0b
    TEXT_WHITE = RGBColor(248, 250, 252)# #f8fafc
    TEXT_MUTED = RGBColor(148, 163, 184)# #94a3b8

    blank_layout = prs.slide_layouts[6]

    def add_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, tag_text, title_text, subtitle_text=None):
        # Tag
        tb_tag = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.4))
        p_tag = tb_tag.text_frame.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = CYAN

        # Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.8))
        p_title = tb_title.text_frame.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

        if subtitle_text:
            tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.55), Inches(11.7), Inches(0.5))
            p_sub = tb_sub.text_frame.paragraphs[0]
            p_sub.text = subtitle_text
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, title, points, accent_color=CYAN):
        # Card Background
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1.5)

        # Card Title
        tb = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.2), width - Inches(0.5), Inches(0.5))
        p = tb.text_frame.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = accent_color

        # Card Content Points
        tb_content = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.7), width - Inches(0.5), height - Inches(0.8))
        tf = tb_content.text_frame
        tf.word_wrap = True
        
        for i, pt in enumerate(points):
            if i == 0:
                p_item = tf.paragraphs[0]
            else:
                p_item = tf.add_paragraph()
            p_item.text = f"• {pt}"
            p_item.font.size = Pt(12)
            p_item.font.color.rgb = TEXT_WHITE
            p_item.space_after = Pt(8)

    # ==================== SLIDE 1: TITLE SLIDE ====================
    s1 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s1)

    # Big Badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(3.2), Inches(0.45))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(16, 42, 70)
    badge.line.color.rgb = CYAN
    p_b = badge.text_frame.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = "🛡️ WEB3 & SMART CONTRACTS"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = CYAN

    # Main Title
    tb1 = s1.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11.7), Inches(1.6))
    p1 = tb1.text_frame.paragraphs[0]
    p1.text = "CERTIVERIFY"
    p1.font.size = Pt(50)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE

    p2 = tb1.text_frame.add_paragraph()
    p2.text = "Blockchain-Based Academic Certificate Verification System"
    p2.font.size = Pt(24)
    p2.font.bold = True
    p2.font.color.rgb = CYAN

    # Tagline
    tb_tagline = s1.shapes.add_textbox(Inches(0.8), Inches(4.0), Inches(11.7), Inches(0.8))
    ptag = tb_tagline.text_frame.paragraphs[0]
    ptag.text = '"Trust Every Credential. Verify on Blockchain."'
    ptag.font.size = Pt(16)
    ptag.font.italic = True
    ptag.font.color.rgb = TEXT_MUTED

    # Bottom Info Card
    foot_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.2), Inches(11.733), Inches(1.3))
    foot_card.fill.solid()
    foot_card.fill.fore_color.rgb = CARD_BG
    foot_card.line.color.rgb = CARD_BORDER
    tb_foot = s1.shapes.add_textbox(Inches(1.0), Inches(5.35), Inches(11.3), Inches(1.0))
    tf_f = tb_foot.text_frame
    pf1 = tf_f.paragraphs[0]
    pf1.text = "🎓 Final Year Engineering Project / College Technical Presentation"
    pf1.font.size = Pt(14)
    pf1.font.bold = True
    pf1.font.color.rgb = TEXT_WHITE

    pf2 = tf_f.add_paragraph()
    pf2.text = "Tech Stack: Ethereum Smart Contracts (Solidity) • React (Vite) • Node.js / Express • SHA-256 Cryptography"
    pf2.font.size = Pt(12)
    pf2.font.color.rgb = CYAN
    pf2.space_before = Pt(4)

    # ==================== SLIDE 2: THE PROBLEM ====================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s2)
    add_header(s2, "Problem Statement", "Why Do We Need This Project?", "Academic credential forgery is a massive global crisis threatening universities and employers.")

    add_card(s2, Inches(0.8), Inches(2.2), Inches(3.64), Inches(4.5),
             "1. Easy Document Forgery",
             [
                 "Modern design tools (Photoshop, online PDF editors) allow anyone to forge a fake degree in minutes.",
                 "Altered grades, student names, and university logos look 100% genuine on paper or digital PDFs.",
                 "HR teams and admissions officers cannot tell real documents from fake ones with the naked eye."
             ], ROSE)

    add_card(s2, Inches(4.84), Inches(2.2), Inches(3.64), Inches(4.5),
             "2. Slow, Manual Verification",
             [
                 "Traditional verification takes 2 to 4 weeks.",
                 "Companies must send emails, postal letters, or make phone calls to university registrar offices.",
                 "High operational burden and administrative costs for academic institutions globally."
             ], AMBER)

    add_card(s2, Inches(8.88), Inches(2.2), Inches(3.64), Inches(4.5),
             "3. Centralized Database Risks",
             [
                 "Traditional university SQL databases are vulnerable to hacking, insider tampering, and server crashes.",
                 "A rogue admin or hacker with DB access can easily insert or modify graduation records.",
                 "Single Point of Failure (SPOF) with zero public transparency or cryptographic audit trail."
             ], CYAN)

    # ==================== SLIDE 3: THE SOLUTION ====================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s3)
    add_header(s3, "The Solution", "Why Blockchain Technology?", "Blockchain provides a decentralized, permanent, and tamper-resistant truth machine.")

    add_card(s3, Inches(0.8), Inches(2.2), Inches(2.7), Inches(4.5),
             "🔒 Immutability",
             [
                 "Once a certificate hash is recorded on the blockchain, it is mathematically locked.",
                 "No one—not even system administrators or university presidents—can alter or falsify history."
             ], EMERALD)

    add_card(s3, Inches(3.8), Inches(2.2), Inches(2.7), Inches(4.5),
             "⚡ Instant Verification",
             [
                 "Employers can verify any certificate in less than 2 seconds.",
                 "No need to contact the university or pay expensive third-party verification agencies."
             ], CYAN)

    add_card(s3, Inches(6.8), Inches(2.2), Inches(2.7), Inches(4.5),
             "👁️ Public Transparency",
             [
                 "Anyone in the world can independently check authenticity directly against the Ethereum ledger.",
                 "Zero dependence on proprietary third-party intermediaries."
             ], AMBER)

    add_card(s3, Inches(9.8), Inches(2.2), Inches(2.7), Inches(4.5),
             "🛡️ Privacy by Design",
             [
                 "Student personal data and heavy PDF files are NEVER stored on the public blockchain.",
                 "Only the unique SHA-256 fingerprint is recorded on-chain, preserving student GDPR privacy."
             ], TEXT_WHITE)

    # ==================== SLIDE 4: HOW IT WORKS (CORE CONCEPT) ====================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s4)
    add_header(s4, "Core Mechanism", "How Does CertiVerify Work? (In 3 Simple Steps)", "Demystifying cryptographic hashing and smart contract validation.")

    add_card(s4, Inches(0.8), Inches(2.2), Inches(3.64), Inches(4.5),
             "Step 1: Hash Generation",
             [
                 "When the university issues a PDF certificate, the system computes its SHA-256 fingerprint.",
                 "Example: Alex_Morgan.pdf produces: 970e34df3e25cf7a...",
                 "Avalanche Effect: Changing even a single dot, letter, or grade changes the entire hash completely."
             ], CYAN)

    add_card(s4, Inches(4.84), Inches(2.2), Inches(3.64), Inches(4.5),
             "Step 2: On-Chain Issuance",
             [
                 "The authorized university admin connects MetaMask wallet.",
                 "Smart contract function registerCertificate(id, hash) permanently writes the hash to Ethereum.",
                 "A verifiable Ethereum Transaction Hash (TX ID) is generated as public proof."
             ], EMERALD)

    add_card(s4, Inches(8.88), Inches(2.2), Inches(3.64), Inches(4.5),
             "Step 3: Instant Public Check",
             [
                 "An employer drags & drops the candidate's PDF into the portal.",
                 "The browser computes the SHA-256 hash locally and queries the smart contract.",
                 "If hash matches on-chain record: VERIFIED AUTHENTIC! If altered: VERIFICATION FAILED."
             ], TEXT_WHITE)

    # ==================== SLIDE 5: SYSTEM ARCHITECTURE ====================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s5)
    add_header(s5, "Architecture", "Complete Full-Stack System Architecture", "Production-grade decoupled architecture connecting Web2 convenience with Web3 security.")

    add_card(s5, Inches(0.8), Inches(2.2), Inches(2.7), Inches(4.5),
             "🎨 Frontend Layer",
             [
                 "React.js (Vite 5)",
                 "Tailwind CSS (Glassmorphism & SaaS Design)",
                 "Ethers.js v6 for direct blockchain communication",
                 "Local Web Crypto API for client-side SHA-256 calculation"
             ], CYAN)

    add_card(s5, Inches(3.8), Inches(2.2), Inches(2.7), Inches(4.5),
             "⚙️ Backend API Layer",
             [
                 "Node.js & Express.js REST API",
                 "JWT Authentication & bcrypt password hashing for administrators",
                 "Multer PDF file validation",
                 "Automatic contract deploy & seeding resilience engine"
             ], AMBER)

    add_card(s5, Inches(6.8), Inches(2.2), Inches(2.7), Inches(4.5),
             "⛓️ Blockchain Layer",
             [
                 "Solidity 0.8.20 Smart Contract",
                 "Ethereum EVM compatible",
                 "Hardhat local node (Chain ID 31337)",
                 "OpenZeppelin Ownable Access Control"
             ], EMERALD)

    add_card(s5, Inches(9.8), Inches(2.2), Inches(2.7), Inches(4.5),
             "💾 Off-Chain Storage",
             [
                 "MongoDB with Mongoose ORM",
                 "JSON persistent file-backed fallback store",
                 "Stores human-readable metadata (student name, roll number, course) safely off-chain"
             ], TEXT_WHITE)

    # ==================== SLIDE 6: SMART CONTRACT DETAILS ====================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s6)
    add_header(s6, "Smart Contract", "Inside CertificateVerification.sol", "The Solidity smart contract acting as the immutable digital registrar.")

    add_card(s6, Inches(0.8), Inches(2.2), Inches(5.65), Inches(4.5),
             "Key Functions & Capabilities",
             [
                 "registerCertificate(certId, hash): Registers a unique certificate hash on-chain. Emits CertificateRegistered event. Only callable by Contract Owner.",
                 "verifyCertificate(hash): Public view function. Returns (isValid, isRevoked, certId, issuer, issueTimestamp). Free to call (0 gas cost!).",
                 "revokeCertificate(hash, reason): Formally cancels a credential with a recorded audit reason. Emits CertificateRevoked event.",
                 "isCertificateRegistered(hash): Fast duplicate registration check preventing double-issuance."
             ], CYAN)

    add_card(s6, Inches(6.85), Inches(2.2), Inches(5.65), Inches(4.5),
             "Security & Optimization Features",
             [
                 "OpenZeppelin Ownable: Strict role-based permissioning prevents unauthorized parties from issuing degrees.",
                 "Duplicate Prevention: Contract rejects identical hashes, preventing identity theft or duplicate credential issuance.",
                 "Custom Error Reverts: Saves gas and provides clear error messages on transaction revert.",
                 "Permanent State History: Even revoked certificates remain on-chain with their cancellation reason—history can never be wiped."
             ], EMERALD)

    # ==================== SLIDE 7: LIVE DEMO SCENARIOS ====================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s7)
    add_header(s7, "Testing & Demonstration", "The 3 Real-World Demonstration Scenarios", "Our system was rigorously tested across all 3 academic verification situations.")

    add_card(s7, Inches(0.8), Inches(2.2), Inches(3.64), Inches(4.5),
             "🟢 Scenario 1: Authentic",
             [
                 "File: Alex_Morgan_CS_Authentic.pdf",
                 "Action: Dropped into /verify portal.",
                 "Hash matches exact on-chain record.",
                 "Result: VERIFIED AUTHENTIC.",
                 "Displays student name, degree, issuer wallet, issue date, and on-chain transaction ID."
             ], EMERALD)

    add_card(s7, Inches(4.84), Inches(2.2), Inches(3.64), Inches(4.5),
             "🔴 Scenario 2: Tampered / Forged",
             [
                 "File: Alex_Morgan_CS_Tampered.pdf",
                 "Modification: Single grade text altered ('First Class' changed to 'Summa Cum Laude').",
                 "Hash changes entirely due to SHA-256 avalanche effect.",
                 "Result: VERIFICATION FAILED.",
                 "Warning banner: Document does not match ledger!"
             ], ROSE)

    add_card(s7, Inches(8.88), Inches(2.2), Inches(3.64), Inches(4.5),
             "🟠 Scenario 3: Revoked Degree",
             [
                 "File: Sophia_Chen_MBA_Revoked.pdf",
                 "Context: Candidate previously graduated, but university cancelled degree due to thesis plagiarism.",
                 "Result: CERTIFICATE REVOKED.",
                 "Shows revocation timestamp and reason: 'Academic thesis misconduct violation'."
             ], AMBER)

    # ==================== SLIDE 8: SYSTEM MODULES ====================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s8)
    add_header(s8, "Modules & Features", "Application Modules Overview", "A complete enterprise-grade credential management and verification platform.")

    add_card(s8, Inches(0.8), Inches(2.2), Inches(5.65), Inches(2.1),
             "1. Public Verification Portal (/verify)",
             [
                 "Accessible by anyone worldwide without registration or login.",
                 "Instant drag-and-drop PDF verification or direct 64-character hash query.",
                 "Shareable verification URLs & official printable verification reports."
             ], CYAN)

    add_card(s8, Inches(6.85), Inches(2.2), Inches(5.65), Inches(2.1),
             "2. Administrator Portal (/admin)",
             [
                 "Protected JWT-based administrative dashboard with real-time statistics.",
                 "Shows total certificates issued, active credentials, and audit verification count.",
                 "MetaMask wallet integration for cryptographic signing."
             ], EMERALD)

    add_card(s8, Inches(0.8), Inches(4.6), Inches(5.65), Inches(2.1),
             "3. Certificate Issuance Portal (/admin/register)",
             [
                 "Form for university registrars: Student Name, Roll No, Degree, Year.",
                 "Automatic client-side PDF SHA-256 fingerprint computation.",
                 "Submits transaction to Ethereum blockchain and syncs database."
             ], AMBER)

    add_card(s8, Inches(6.85), Inches(4.6), Inches(5.65), Inches(2.1),
             "4. Certificate Management & Audit (/admin/certificates)",
             [
                 "Searchable table with filters for student name, roll number, and department.",
                 "One-click on-chain revocation with custom justification notes.",
                 "Export full audit records to CSV for university regulatory compliance."
             ], TEXT_WHITE)

    # ==================== SLIDE 9: REAL-WORLD IMPACT ====================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s9)
    add_header(s9, "Future Scope & Impact", "Real-World Impact & Future Horizons", "Transforming education credentialing into a trustless digital economy.")

    add_card(s9, Inches(0.8), Inches(2.2), Inches(5.65), Inches(4.5),
             "Real-World Impact Today",
             [
                 "Zero Verification Fraud: Eliminates forged degrees from job markets, hospitals, engineering firms, and civil services.",
                 "Zero Operational Delay: Employers verify background credentials in seconds instead of waiting weeks for college responses.",
                 "Global Accessibility: International universities and visa embassies can verify Indian or foreign degrees instantly.",
                 "Cost Savings: Saves universities millions of dollars in manual background verification correspondence."
             ], EMERALD)

    add_card(s9, Inches(6.85), Inches(2.2), Inches(5.65), Inches(4.5),
             "Future Enhancements",
             [
                 "Soulbound Tokens (SBTs / ERC-5192): Non-transferable digital credentials bound to the student's personal Web3 identity.",
                 "IPFS Integration: Storing encrypted certificate copies on the InterPlanetary File System for decentralized document hosting.",
                 "DigiLocker & National Academic Depository (NAD) Integration: Direct sync with government digital identity registries.",
                 "Multi-University Consortium Blockchain: A shared national academic network governed by accredited educational boards."
             ], CYAN)

    # ==================== SLIDE 10: CONCLUSION & Q&A ====================
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s10)

    # Badge
    b10 = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(2.8), Inches(0.45))
    b10.fill.solid()
    b10.fill.fore_color.rgb = RGBColor(16, 42, 70)
    b10.line.color.rgb = CYAN
    pb10 = b10.text_frame.paragraphs[0]
    pb10.alignment = PP_ALIGN.CENTER
    pb10.text = "🎯 PROJECT CONCLUSION"
    pb10.font.size = Pt(11)
    pb10.font.bold = True
    pb10.font.color.rgb = CYAN

    # Title
    tb10 = s10.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11.7), Inches(1.2))
    p10 = tb10.text_frame.paragraphs[0]
    p10.text = "Thank You! Questions & Answers"
    p10.font.size = Pt(40)
    p10.font.bold = True
    p10.font.color.rgb = TEXT_WHITE

    # Summary Card
    sum_card = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.6), Inches(11.733), Inches(2.9))
    sum_card.fill.solid()
    sum_card.fill.fore_color.rgb = CARD_BG
    sum_card.line.color.rgb = CARD_BORDER

    tb_sum = s10.shapes.add_textbox(Inches(1.1), Inches(3.8), Inches(11.1), Inches(2.5))
    tf_s = tb_sum.text_frame
    tf_s.word_wrap = True

    ps1 = tf_s.paragraphs[0]
    ps1.text = "Summary of Project Achievements:"
    ps1.font.size = Pt(16)
    ps1.font.bold = True
    ps1.font.color.rgb = CYAN
    ps1.space_after = Pt(10)

    items = [
        "✅ Implemented full-stack dApp: Solidity Smart Contract + React Vite + Node.js Express + MongoDB.",
        "✅ Solved degree forgery with mathematical immutability through SHA-256 cryptographic hashing.",
        "✅ Demonstrated 100% test pass rate across Authentic, Tampered, and Revoked scenarios.",
        "✅ Preserved student privacy by storing sensitive student PII off-chain while anchoring cryptographic proofs on-chain."
    ]

    for item in items:
        p_it = tf_s.add_paragraph()
        p_it.text = item
        p_it.font.size = Pt(13)
        p_it.font.color.rgb = TEXT_WHITE
        p_it.space_after = Pt(6)

    # Save
    out_path = os.path.join(os.path.dirname(__file__), "CERTIVERIFY_Presentation.pptx")
    prs.save(out_path)
    print(f"Presentation generated successfully at: {out_path}")

if __name__ == "__main__":
    create_deck()

