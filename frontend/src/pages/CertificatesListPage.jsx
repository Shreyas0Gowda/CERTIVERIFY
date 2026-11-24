import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Files,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Trash2,
  RefreshCw,
  ShieldAlert,
  FilePlus,
  Clock,
  Download,
} from "lucide-react";
import { api } from "../services/api";
import { useWallet } from "../context/WalletContext";
import { truncateHash, copyToClipboard } from "../utils/crypto";

export default function CertificatesListPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState("all");
  const [total, setTotal] = useState(0);

  // Revocation modal state
  const [revokingCert, setRevokingCert] = useState(null);
  const [revocationReason, setRevocationReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState(null);

  // Details modal state
  const [selectedCert, setSelectedCert] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const { account, isContractOwner, revokeCertificateOnChain } = useWallet();

  const handleCopy = (text, key) => {
    copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.certificates.getAll({
        search,
        status: statusFilter,
        institution: institutionFilter,
        limit: 100,
      });
      if (res.success) {
        setCertificates(res.certificates || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter, institutionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCertificates();
  };

  const handleRevokeConfirm = async () => {
    if (!revokingCert) return;
    if (!account) {
      setRevokeError("Please connect your authorized administrator wallet to execute revocation.");
      return;
    }
    if (!isContractOwner) {
      setRevokeError("Only the smart contract owner can execute revocations on the blockchain.");
      return;
    }

    setRevokeError(null);
    setRevoking(true);

    try {
      // 1. Sign revocation transaction on Ethereum smart contract
      const reason = revocationReason.trim() || "Revoked by institutional authority";
      const receipt = await revokeCertificateOnChain(revokingCert.certificateHash, reason);

      // 2. Synchronize with backend database
      await api.certificates.revoke(revokingCert.certificateId, {
        reason,
        blockchainTransactionHash: receipt.transactionHash,
      });

      // 3. Refresh list and close modal
      setRevokingCert(null);
      setRevocationReason("");
      fetchCertificates();
    } catch (err) {
      console.error("Revocation failed:", err);
      setRevokeError(err.message || "Failed to complete revocation on the blockchain.");
    } finally {
      setRevoking(false);
    }
  };

  const exportToCSV = () => {
    if (!certificates.length) return;
    const headers = [
      "Certificate ID",
      "Student Name",
      "Student ID",
      "Institution",
      "Certificate Title",
      "Department",
      "Graduation Year",
      "Status",
      "SHA-256 Hash",
      "Blockchain Transaction",
    ];
    const rows = certificates.map((c) => [
      `"${c.certificateId}"`,
      `"${c.studentName}"`,
      `"${c.studentId}"`,
      `"${c.institution}"`,
      `"${c.certificateTitle}"`,
      `"${c.department}"`,
      c.graduationYear,
      c.status,
      `"${c.certificateHash}"`,
      `"${c.blockchainTransactionHash}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `CertiVerify_Registry_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Certificate Registry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered credentials, view immutable transaction receipts, or execute revocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={certificates.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white font-medium transition-all"
            title="Export registry to CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <Link
            to="/admin/register"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm transition-all"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Issue New Certificate</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, certificate ID, student roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="authentic">Authentic Only</option>
              <option value="revoked">Revoked Only</option>
            </select>
          </div>

          <button
            onClick={fetchCertificates}
            className="p-2 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Certificate ID</th>
                <th className="py-3.5 px-4">Candidate & Degree</th>
                <th className="py-3.5 px-4">Institution</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">SHA-256 Digest</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading certificate ledger records...</span>
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No certificates found matching your criteria.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert._id || cert.certificateId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {cert.certificateId}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{cert.studentName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {cert.certificateTitle} ({cert.studentId})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{cert.institution}</div>
                      <div className="text-[10px] text-slate-400">Class of {cert.graduationYear}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {cert.status === "authentic" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Authentic</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Revoked</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-300">
                      <div className="flex items-center gap-1.5">
                        <span>{truncateHash(cert.certificateHash, 6, 4)}</span>
                        <button
                          onClick={() => handleCopy(cert.certificateHash, cert._id)}
                          className="text-slate-400 hover:text-white"
                          title="Copy full SHA-256 hash"
                        >
                          {copiedKey === cert._id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Full Credentials & Proof"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {cert.status === "authentic" && (
                          <button
                            onClick={() => {
                              setRevokingCert(cert);
                              setRevocationReason("");
                              setRevokeError(null);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                            title="Revoke Certificate on Blockchain"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVOCATION MODAL */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b132b] border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Revoke Academic Certificate</h3>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  This action will permanently record a revocation transaction on the Ethereum blockchain.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
              <div>
                <strong className="text-slate-300">Candidate:</strong> {revokingCert.studentName}
              </div>
              <div>
                <strong className="text-slate-300">Certificate ID:</strong> {revokingCert.certificateId}
              </div>
              <div className="font-mono text-[11px] truncate text-slate-400">
                <strong>Hash:</strong> {revokingCert.certificateHash}
              </div>
            </div>

            {revokeError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {revokeError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Revocation Justification / Reason *
              </label>
              <textarea
                rows="3"
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                placeholder="e.g. Degree revoked due to academic misconduct or administrative error..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={revoking}
                onClick={() => setRevokingCert(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={handleRevokeConfirm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-glow-danger transition-all"
              >
                {revoking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing Transaction...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Revocation on Chain</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Files className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Certificate Ledger Record</h3>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Certificate ID</span>
                <span className="font-semibold text-slate-200 font-mono">{selectedCert.certificateId}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Status</span>
                <span className={selectedCert.status === "authentic" ? "text-emerald-400 font-bold uppercase" : "text-rose-400 font-bold uppercase"}>
                  {selectedCert.status}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Student Name</span>
                <span className="font-semibold text-slate-200">{selectedCert.studentName}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Student ID</span>
                <span className="font-semibold text-slate-200">{selectedCert.studentId}</span>
              </div>
              <div className="col-span-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Degree Title</span>
                <span className="font-semibold text-slate-200">{selectedCert.certificateTitle}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Institution</span>
                <span className="font-semibold text-slate-200">{selectedCert.institution}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Graduation Year / Date</span>
                <span className="font-semibold text-slate-200">
                  {selectedCert.graduationYear} • {selectedCert.issueDate}
                </span>
              </div>
            </div>

            {/* Cryptographic Proof Details */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-400 font-sans block text-[11px]">SHA-256 Hash:</span>
                <div className="text-cyan-300 break-all text-[11px]">{selectedCert.certificateHash}</div>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-[11px]">Blockchain TX Hash:</span>
                <div className="text-slate-300 break-all text-[11px]">{selectedCert.blockchainTransactionHash}</div>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-[11px]">Issuer Wallet:</span>
                <div className="text-slate-300 break-all text-[11px]">{selectedCert.issuerWallet}</div>
              </div>
              {selectedCert.status === "revoked" && (
                <div className="pt-2 border-t border-slate-800 text-rose-300">
                  <span className="font-bold font-sans block text-[11px]">Revocation Reason:</span>
                  <div className="font-sans">{selectedCert.revocationReason || "Revoked by issuer"}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

