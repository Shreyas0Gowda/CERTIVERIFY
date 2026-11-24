import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, User, ArrowRight, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("AdminPassword123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const { account, connectWallet, connecting, isContractOwner } = useWallet();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-brand-500 to-blue-600" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 mx-auto mb-4 shadow-glow-sm">
                <div className="w-full h-full bg-[#070d1e] rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Administrator Portal</h1>
              <p className="text-xs text-slate-400 mt-1.5">
                Sign in to manage on-chain certificates and institution records
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-6 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username or Institutional Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin or admin@certiverify.edu"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Administrator Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm hover:scale-[1.01] transition-all"
              >
                <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Wallet Integration Section */}
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-slate-400">Institutional Wallet</span>
                {account ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Not Connected</span>
                )}
              </div>

              {account ? (
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="font-mono text-cyan-300 text-[11px] truncate">{account}</div>
                  {isContractOwner && (
                    <span className="text-[10px] bg-brand-500/20 text-cyan-300 border border-brand-500/30 px-1.5 py-0.5 rounded font-semibold shrink-0 ml-2">
                      Contract Owner
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={connecting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
                >
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{connecting ? "Connecting..." : "Connect MetaMask Wallet"}</span>
                </button>
              )}
            </div>

            {/* Default Dev Credentials Callout */}
            <div className="mt-6 p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-[11px] text-slate-400">
              <span className="text-cyan-400 font-semibold block mb-0.5">Demo Admin Credentials:</span>
              Username: <code className="text-slate-300">admin</code> | Password: <code className="text-slate-300">AdminPassword123!</code>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

