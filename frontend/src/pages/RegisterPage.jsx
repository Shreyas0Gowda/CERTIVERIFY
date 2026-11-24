import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Hash,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Wallet,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { calculateFileSHA256, copyToClipboard, truncateHash } from "../utils/crypto";
import { api } from "../services/api";

export default function RegisterPage() {
  const { account, isContractOwner, isHardhatNetwork, registerCertificateOnChain, connectWallet, switchToHardhatNetwork } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    certificateId: `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    studentName: "",
    studentId: "",
    institution: "Stanford Institute of Technology",
    certificateTitle: "Bachelor of Science in Computer Science & Engineering",
    department: "Computer Science & Engineering",
    graduationYear: new Date().getFullYear(),
    issueDate: new Date().toISOString().split("T")[0],
  });

  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [hashing, setHashing] = useState(false);
  const [step, setStep] = useState(1); // 1: Fill Form & Upload, 2: Preview & Sign, 3: Success Receipt
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const fileInputRef = useRef(null);

  const handleCopy = (text, key) => {
    copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only official PDF files (.pdf) are permitted.");
      return;
    }

    setError(null);
    setFile(selectedFile);
    setHashing(true);

    try {
      const hash = await calculateFileSHA256(selectedFile);
      setFileHash(hash);
    } catch (err) {
      setError("Failed to compute SHA-256 hash: " + err.message);
    } finally {
      setHashing(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.certificateId.trim()) return "Certificate ID is required.";
    if (!formData.studentName.trim()) return "Student name is required.";
    if (!formData.studentId.trim()) return "Student ID is required.";
    if (!formData.institution.trim()) return "Institution name is required.";
    if (!formData.certificateTitle.trim()) return "Certificate title is required.";
    if (!file) return "Please upload the digital certificate PDF.";
    if (!fileHash) return "Document SHA-256 hash calculation is pending.";
    return null;
  };

  const handleProceedToPreview = (e) => {
    e.preventDefault();
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleConfirmAndSign = async () => {
    if (!account) {
      setError("Please connect your MetaMask administrator wallet before registering.");
      return;
    }

    if (!isContractOwner) {
      setError("Your connected MetaMask wallet is not the owner of the smart contract. Only the smart contract owner can register certificates.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // Step 6 & 7: Trigger MetaMask to sign registerCertificate(certificateId, certificateHash)
      setStatusMessage("Please approve the registration transaction in MetaMask...");
      const chainReceipt = await registerCertificateOnChain(formData.certificateId, fileHash);

      setStatusMessage("Blockchain transaction confirmed! Synchronizing application metadata with database...");

      // Step 8: Save application metadata in database
      const formPayload = new FormData();
      formPayload.append("certificateFile", file);
      formPayload.append("certificateHash", fileHash);
      formPayload.append("certificateId", formData.certificateId);
      formPayload.append("studentName", formData.studentName);
      formPayload.append("studentId", formData.studentId);
      formPayload.append("institution", formData.institution);
      formPayload.append("certificateTitle", formData.certificateTitle);
      formPayload.append("department", formData.department);
      formPayload.append("graduationYear", formData.graduationYear);
      formPayload.append("issueDate", formData.issueDate);
      formPayload.append("blockchainTransactionHash", chainReceipt.transactionHash);
      formPayload.append("issuerWallet", account);

      const dbRes = await api.certificates.register(formPayload);

      // Step 9: Display successful registration receipt
      setReceipt({
        ...formData,
        certificateHash: fileHash,
        blockchainTransactionHash: chainReceipt.transactionHash,
        blockNumber: chainReceipt.blockNumber,
        issuerWallet: account,
        registeredAt: new Date().toISOString(),
      });

      setStep(3);
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === 4001 || err.message?.includes("user rejected")) {
        setError("MetaMask transaction was rejected by user.");
      } else if (err.message?.includes("CertificateAlreadyRegistered")) {
        setError("This certificate hash is already registered on the blockchain.");
      } else if (err.message?.includes("CertificateIdAlreadyExists")) {
        setError("This Certificate ID is already taken. Please choose a different ID.");
      } else {
        setError(err.message || "Failed to complete on-chain registration.");
      }
    } finally {
      setSubmitting(false);
      setStatusMessage("");
    }
  };

  const handleResetForNew = () => {
    setFormData({
      certificateId: `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: "",
      studentId: "",
      institution: "Stanford Institute of Technology",
      certificateTitle: "Bachelor of Science in Computer Science & Engineering",
      department: "Computer Science & Engineering",
      graduationYear: new Date().getFullYear(),
      issueDate: new Date().toISOString().split("T")[0],
    });
    setFile(null);
    setFileHash("");
    setStep(1);
    setReceipt(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Issue & Register Certificate</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically bind an academic degree to the Ethereum blockchain ledger.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 ${
            step >= 1
              ? "bg-brand-500/10 border-brand-500/30 text-cyan-400"
              : "bg-slate-900/40 border-slate-800 text-slate-400"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">
            1
          </span>
          <span>Details & PDF Upload</span>
        </div>

        <div
          className={`p-3 rounded-xl border flex items-center gap-2 ${
            step >= 2
              ? "bg-brand-500/10 border-brand-500/30 text-cyan-400"
              : "bg-slate-900/40 border-slate-800 text-slate-400"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Cryptographic Preview</span>
        </div>

        <div
          className={`p-3 rounded-xl border flex items-center gap-2 ${
            step === 3
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-slate-900/40 border-slate-800 text-slate-400"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">
            3
          </span>
          <span>Blockchain Receipt</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-300">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold uppercase tracking-wider text-rose-300">Action Required</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* STEP 1: FORM & UPLOAD */}
      {step === 1 && (
        <form onSubmit={handleProceedToPreview} className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-800">
              1. Candidate & Credential Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Certificate Identifier</label>
                <input
                  type="text"
                  name="certificateId"
                  required
                  value={formData.certificateId}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Student Full Name</label>
                <input
                  type="text"
                  name="studentName"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Student ID / Roll No</label>
                <input
                  type="text"
                  name="studentId"
                  required
                  placeholder="e.g. STU-99214"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Issuing Institution</label>
                <input
                  type="text"
                  name="institution"
                  required
                  value={formData.institution}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1.5">Degree / Certificate Title</label>
                <input
                  type="text"
                  name="certificateTitle"
                  required
                  value={formData.certificateTitle}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Graduation Year</label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Issue Date</label>
                  <input
                    type="date"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-800">
              2. Upload Official PDF Certificate
            </h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950/40 hover:bg-slate-900/60 rounded-xl p-8 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              />

              <div className="w-12 h-12 mx-auto rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div className="text-xs font-semibold text-slate-200">
                {file ? file.name : "Click to select the official PDF certificate"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Raw byte SHA-256 fingerprint will be generated immediately
              </p>
            </div>

            {/* Generated Hash Preview */}
            {hashing ? (
              <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Computing SHA-256 digest from binary bytes...</span>
              </div>
            ) : fileHash ? (
              <div className="mt-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-slate-400 shrink-0">Generated SHA-256 Digest:</span>
                    <span className="font-mono text-cyan-300 truncate">{fileHash}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(fileHash, "hash")}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    {copiedKey === "hash" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm transition-all"
            >
              <span>Proceed to Cryptographic Preview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: PREVIEW & SIGN */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-brand-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Verification Confirmation
                </span>
                <h3 className="text-lg font-bold text-white">Review Before On-Chain Immuration</h3>
              </div>
              <span className="text-xs bg-brand-500/10 text-cyan-400 border border-brand-500/20 px-2.5 py-1 rounded-full font-mono">
                {formData.certificateId}
              </span>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Student Candidate</span>
                <span className="font-semibold text-slate-100">{formData.studentName} ({formData.studentId})</span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Awarded Credential</span>
                <span className="font-semibold text-slate-100">{formData.certificateTitle}</span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Institution & Department</span>
                <span className="font-semibold text-slate-100">{formData.institution} — {formData.department}</span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Graduation Year / Issue Date</span>
                <span className="font-semibold text-slate-100">Class of {formData.graduationYear} • {formData.issueDate}</span>
              </div>
            </div>

            {/* Cryptographic Hash Preview */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 mb-6">
              <div className="text-cyan-400 font-sans font-semibold text-[11px] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span>Payload SHA-256 Digest to be permanently stored on-chain:</span>
              </div>
              <div className="text-slate-200 break-all bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                {fileHash}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                Signer Wallet: <span className="text-cyan-300 font-mono">{account || "Not Connected"}</span>
              </div>
            </div>

            {/* Transaction Execution Status */}
            {submitting && (
              <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-cyan-300 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
              >
                Back to Edit
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmAndSign}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm hover:scale-[1.01] transition-all"
              >
                <Wallet className="w-4 h-4" />
                <span>{submitting ? "Signing & Mining..." : "Confirm & Sign in MetaMask"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SUCCESS RECEIPT */}
      {step === 3 && receipt && (
        <div className="bg-slate-900/50 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-glow-success space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-emerald-500/20">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Registration Confirmed
              </span>
              <h3 className="text-xl font-bold text-white">Certificate Permanently Immutated On-Chain</h3>
              <p className="text-xs text-emerald-200/80">
                The cryptographic hash is recorded in smart contract storage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 font-sans block mb-1">Certificate ID</span>
              <span className="text-slate-100 font-bold">{receipt.certificateId}</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 font-sans block mb-1">Candidate</span>
              <span className="text-slate-100 font-sans font-semibold">{receipt.studentName} ({receipt.studentId})</span>
            </div>

            <div className="sm:col-span-2 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 font-sans mb-1">
                <span>Ethereum Transaction Hash</span>
                <button onClick={() => handleCopy(receipt.blockchainTransactionHash, "tx")} className="hover:text-white">
                  {copiedKey === "tx" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-cyan-300 break-all text-[11px]">{receipt.blockchainTransactionHash}</div>
            </div>

            <div className="sm:col-span-2 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 font-sans mb-1">
                <span>Document SHA-256 Digest</span>
                <button onClick={() => handleCopy(receipt.certificateHash, "h")} className="hover:text-white">
                  {copiedKey === "h" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-slate-200 break-all text-[11px]">{receipt.certificateHash}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={handleResetForNew}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Issue Another Certificate
            </button>

            <button
              onClick={() => navigate("/admin/certificates")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-semibold text-xs shadow-glow-sm"
            >
              <span>View All Registered Certificates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

