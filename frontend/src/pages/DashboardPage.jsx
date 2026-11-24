import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck,
  ShieldCheck,
  XCircle,
  FilePlus,
  Files,
  Cpu,
  Wallet,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from "lucide-react";
import { api } from "../services/api";
import { useWallet } from "../context/WalletContext";
import { truncateHash } from "../utils/crypto";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { account, isContractOwner, isHardhatNetwork, contractData, connectWallet } = useWallet();

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.dashboard.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Institutional Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time synchronization across Ethereum ledger and institutional database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh Metrics</span>
          </button>

          <Link
            to="/admin/register"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm transition-all"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Issue Certificate</span>
          </Link>
        </div>
      </div>

      {/* Wallet / Network Status Notification */}
      {!account ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300">MetaMask Wallet Disconnected</h4>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Connect your institutional administrator wallet to sign on-chain registrations and revocations.
              </p>
            </div>
          </div>
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-xl transition-all shrink-0"
          >
            Connect MetaMask
          </button>
        </div>
      ) : !isContractOwner ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90">
            <span className="font-bold text-amber-300">Wallet Connected, but not Contract Owner:</span> The currently connected address (<code className="font-mono">{truncateHash(account, 6, 4)}</code>) is not the owner of the deployed smart contract. Only the owner (<code className="font-mono">{truncateHash(contractData?.ownerAddress, 6, 4)}</code>) can sign on-chain certificate registrations.
          </div>
        </div>
      ) : null}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Issued */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Issued</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-cyan-400">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? "..." : stats?.totalIssued ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
            <span>Permanent on-chain certificates</span>
          </div>
        </div>

        {/* Total Active */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Active & Valid</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? "..." : stats?.totalActive ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Authentic credentials in circulation</span>
          </div>
        </div>

        {/* Total Revoked */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Revoked Credentials</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? "..." : stats?.totalRevoked ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
            <span>Invalidated on-chain</span>
          </div>
        </div>

        {/* Total Verifications Logged */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Verification Inquiries</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? "..." : stats?.totalVerified ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            <span>Public audit checks logged</span>
          </div>
        </div>
      </div>

      {/* Network & Node Telemetry */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Ethereum Node & Smart Contract Status</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Consensus Synchronized</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-slate-400 font-sans text-[11px] mb-1">Network / Chain ID</div>
            <div className="text-slate-200 font-semibold">
              Hardhat Localhost ({stats?.blockchain?.chainId || 31337})
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-slate-400 font-sans text-[11px] mb-1">Latest Block Height</div>
            <div className="text-cyan-400 font-semibold">
              #{stats?.blockchain?.blockNumber ?? "0"}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-slate-400 font-sans text-[11px] mb-1">Smart Contract Address</div>
            <div className="text-slate-200 truncate">
              {stats?.blockchain?.contractAddress
                ? truncateHash(stats.blockchain.contractAddress, 8, 6)
                : "Not Deployed"}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-slate-400 font-sans text-[11px] mb-1">Authorized Issuer Address</div>
            <div className="text-cyan-300 truncate">
              {stats?.blockchain?.contractOwner
                ? truncateHash(stats.blockchain.contractOwner, 8, 6)
                : "Unknown"}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Tables: Recent Registrations & Recent Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Certificates */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Recent Certificate Registrations</h3>
            <Link
              to="/admin/certificates"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading registrations...</div>
          ) : stats?.recentCertificates?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentCertificates.map((cert) => (
                <div
                  key={cert._id || cert.certificateId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="overflow-hidden">
                    <div className="font-semibold text-slate-100 truncate">{cert.studentName}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {cert.certificateTitle} • {cert.certificateId}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        cert.status === "authentic"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {cert.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No certificates registered yet. Click "Issue Certificate" to register the first one!
            </div>
          )}
        </div>

        {/* Recent Verifications Log */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Recent Public Verifications</h3>
            <span className="text-[11px] text-slate-400 font-mono">Live Auditing</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading audit trail...</div>
          ) : stats?.recentVerifications?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentVerifications.map((log) => (
                <div
                  key={log._id || Math.random()}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs"
                >
                  <div className="overflow-hidden">
                    <div className="font-mono text-cyan-300 truncate text-[11px]">
                      {truncateHash(log.certificateHash, 10, 8)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      IP: {log.ipAddress || "127.0.0.1"} • {new Date(log.verifiedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        log.verificationResult === "authentic"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : log.verificationResult === "revoked"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {log.verificationResult}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No verification queries logged yet. Test by verifying a document on the public verification page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

