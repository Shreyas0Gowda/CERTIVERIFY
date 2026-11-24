import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  User,
  GraduationCap,
  Building,
  Hash,
  Clock,
  ExternalLink,
  RefreshCw,
  FileText,
  Share2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { calculateFileSHA256, copyToClipboard, truncateHash } from "../utils/crypto";
import { api } from "../services/api";

export default function VerifyPage() {
  const [file, setFile] = useState(null);
  const [calculatedHash, setCalculatedHash] = useState("");
  const [manualHash, setManualHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState("file"); // "file" or "hash"
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Auto-verify if hash query param is present
  useEffect(() => {
    const hashParam = searchParams.get("hash");
    if (hashParam && hashParam.trim().length === 64) {
      const clean = hashParam.trim().toLowerCase();
      setManualHash(clean);
      setCalculatedHash(clean);
      setActiveTab("hash");
      verifyDocument(null, clean);
    }
  }, [searchParams]);

  const handleCopy = (text, key) => {
    copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF certificate document (.pdf).");
      return;
    }

    setError(null);
    setVerificationResult(null);
    setFile(selectedFile);

    try {
      const hash = await calculateFileSHA256(selectedFile);
      setCalculatedHash(hash);
      verifyDocument(selectedFile, hash);
    } catch (err) {
      setError("Failed to compute SHA-256 hash from file: " + err.message);
    }
  };

  const verifyDocument = async (pdfFile, hash) => {
    setLoading(true);
    setError(null);

    try {
      let res;
      if (pdfFile) {
        const formData = new FormData();
        formData.append("certificateFile", pdfFile);
        formData.append("certificateHash", hash);
        res = await api.certificates.verify(formData);
      } else {
        res = await api.certificates.verify({ certificateHash: hash });
      }

      setVerificationResult(res);
    } catch (err) {
      console.error("Verification failed:", err);
      setError(err.message || "Failed to complete verification check.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (!manualHash.trim()) {
      setError("Please input a 64-character SHA-256 hash.");
      return;
    }
    const clean = manualHash.trim().toLowerCase();
    if (clean.length !== 64 || !/^[0-9a-f]{64}$/.test(clean)) {
      setError("Invalid SHA-256 format. Expected a 64-character hexadecimal string.");
      return;
    }
    setCalculatedHash(clean);
    verifyDocument(null, clean);
  };

  const handleReset = () => {
    setFile(null);
    setCalculatedHash("");
    setManualHash("");
    setVerificationResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Public Blockchain Verification Gateway</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Verify Academic Certificate
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Upload the official digital PDF credential to cross-examine its cryptographic signature against the Ethereum blockchain record.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900/80 border border-slate-800 p-1 rounded-xl flex gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("file")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "file"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Upload PDF Certificate
            </button>
            <button
              onClick={() => setActiveTab("hash")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "hash"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Verify by SHA-256 Hash
            </button>
          </div>
        </div>

        {/* Upload / Input Card */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl mb-8">
          {activeTab === "file" ? (
            <div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/40 hover:bg-slate-900/60 rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                />

                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 group-hover:border-cyan-400/40 transition-all">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <div className="text-sm font-semibold text-slate-200 mb-1">
                  {file ? file.name : "Click to select or drag and drop your PDF certificate"}
                </div>
                <p className="text-xs text-slate-400">
                  Supported format: Official PDF document (Max 15MB)
                </p>
                <p className="text-[11px] text-cyan-400/80 mt-3 font-mono">
                  SHA-256 calculated locally in your browser before query
                </p>
              </div>

              {file && (
                <div className="mt-4 flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">{file.name}</span>
                    <span className="text-slate-400 shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Enter 64-character Certificate SHA-256 Hash
                </label>
                <input
                  type="text"
                  value={manualHash}
                  onChange={(e) => setManualHash(e.target.value)}
                  placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex justify-end gap-3">
                {manualHash && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? "Querying Ledger..." : "Verify Hash"}</span>
                </button>
              </div>
            </form>
          )}

          {/* SHA-256 Preview Pill */}
          {calculatedHash && (
            <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400 shrink-0">Document Hash:</span>
                <span className="font-mono text-cyan-300 truncate">{calculatedHash}</span>
              </div>
              <button
                onClick={() => handleCopy(calculatedHash, "hash")}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors ml-2"
                title="Copy SHA-256 hash"
              >
                {copiedKey === "hash" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center backdrop-blur-md">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-1">
              Cross-Examining Ethereum Blockchain
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Querying smart contract <code className="text-cyan-400">verifyCertificate(hash)</code> on-chain...
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide">Verification Error</h4>
              <p className="text-xs text-rose-200/90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Result Display */}
        {verificationResult && !loading && (
          <div className="space-y-6">
            {/* Status 1: AUTHENTIC */}
            {verificationResult.status === "authentic" && (
              <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-glow-success">
                {/* Header Badge */}
                <div className="flex items-center gap-3 pb-6 border-b border-emerald-500/20 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mb-1">
                      Verified Authentic
                    </span>
                    <h3 className="text-xl font-bold text-white">Genuine Academic Credential</h3>
                    <p className="text-xs text-emerald-200/80">
                      This certificate document cryptographically matches an official registration record on the Ethereum blockchain ledger.
                    </p>
                  </div>
                </div>

                {/* Certificate Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Certificate Title</span>
                    </div>
                    <div className="font-semibold text-slate-100 text-sm">
                      {verificationResult.data.certificateTitle}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Student Name & ID</span>
                    </div>
                    <div className="font-semibold text-slate-100 text-sm">
                      {verificationResult.data.studentName} ({verificationResult.data.studentId})
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Building className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Issuing Institution</span>
                    </div>
                    <div className="font-semibold text-slate-100 text-sm">
                      {verificationResult.data.institution}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Department / Graduation Year</span>
                    </div>
                    <div className="font-semibold text-slate-100 text-sm">
                      {verificationResult.data.department} — Class of {verificationResult.data.graduationYear}
                    </div>
                  </div>
                </div>

                {/* Blockchain Proofs */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-[11px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-slate-400 font-sans font-semibold">
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>On-Chain Cryptographic Proofs</span>
                    </div>
                    <span className="text-emerald-400">Consensus Confirmed</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-400 font-sans">Certificate ID:</span>
                    <span className="text-slate-200 font-semibold">{verificationResult.data.certificateId}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-400 font-sans">Issuer Wallet (Contract Owner):</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 truncate max-w-xs">{verificationResult.data.issuerWallet}</span>
                      <button
                        onClick={() => handleCopy(verificationResult.data.issuerWallet, "issuer")}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedKey === "issuer" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-400 font-sans">Registration TX:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 truncate max-w-xs">
                        {verificationResult.data.blockchainTransactionHash}
                      </span>
                      <button
                        onClick={() => handleCopy(verificationResult.data.blockchainTransactionHash, "tx")}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedKey === "tx" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-400 font-sans">Verified At:</span>
                    <span className="text-slate-300 font-sans">{new Date(verificationResult.data.verifiedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status 2: INVALID / FORGED */}
            {verificationResult.status === "invalid" && (
              <div className="bg-gradient-to-b from-rose-950/40 to-slate-900/90 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-glow-danger">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full mb-1">
                      Verification Failed
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Certificate verification failed. No matching blockchain record was found.
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      The document you uploaded does not correspond to any authentic credential issued on the blockchain. This indicates the file has been forged, tampered with, altered in text/formatting, or was never issued by an authorized institution.
                    </p>

                    <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-2 mb-1 text-rose-400 font-sans font-semibold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Analyzed SHA-256 Fingerprint:</span>
                      </div>
                      <div className="text-slate-200 break-all">{calculatedHash}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status: BLOCKCHAIN ERROR */}
            {verificationResult.status === "error" && (
              <div className="bg-gradient-to-b from-orange-950/40 to-slate-900/90 border border-orange-500/40 rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full mb-1">
                      Blockchain Unreachable
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Cannot connect to the Ethereum blockchain node.
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      The verification system requires a running Hardhat local blockchain node. Please ensure all services are started.
                    </p>
                    <div className="p-3.5 bg-slate-950/80 border border-orange-900/40 rounded-xl text-xs space-y-1 text-slate-300">
                      <p className="font-semibold text-orange-300 mb-2">How to fix:</p>
                      <p>1. Run <code className="text-cyan-400 bg-slate-900 px-1 rounded">start-blockchain.bat</code> and wait for it to fully start</p>
                      <p>2. Run <code className="text-cyan-400 bg-slate-900 px-1 rounded">start-backend.bat</code> (watch for "Contract deployed" message)</p>
                      <p>3. Then try uploading your certificate again</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status 3: REVOKED */}
            {verificationResult.status === "revoked" && (
              <div className="bg-gradient-to-b from-amber-950/40 to-slate-900/90 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mb-1">
                      Certificate Revoked
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">
                      This certificate was previously registered but has been REVOKED.
                    </h3>
                    <p className="text-xs text-amber-200/90 leading-relaxed mb-4">
                      Although this credential was originally authentic, it was formally cancelled and rendered invalid on the blockchain ledger by the issuing institution.
                    </p>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                      <div className="text-slate-400 font-sans">
                        <strong>Revocation Justification:</strong>{" "}
                        <span className="text-amber-300 font-semibold">
                          {verificationResult.data.revocationReason || "Revoked by institutional authority"}
                        </span>
                      </div>
                      {verificationResult.data.certificateId && (
                        <div className="text-slate-400">
                          <strong>Certificate ID:</strong> {verificationResult.data.certificateId}
                        </div>
                      )}
                      {verificationResult.data.institution && (
                        <div className="text-slate-400">
                          <strong>Institution:</strong> {verificationResult.data.institution}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {verificationResult.status === "authentic" && (
                <>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/verify?hash=${calculatedHash}`;
                      handleCopy(shareUrl, "share");
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
                  >
                    {copiedKey === "share" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Shareable Verification Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-glow-sm transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print Official Verification Report</span>
                  </button>
                </>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Verify Another Certificate</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

