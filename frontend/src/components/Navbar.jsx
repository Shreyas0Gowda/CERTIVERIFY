import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Wallet, Lock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { truncateHash } from "../utils/crypto";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { account, isContractOwner, isHardhatNetwork, connectWallet, connecting, switchToHardhatNetwork } = useWallet();
  const location = useLocation();

  const isPublicPage = location.pathname === "/" || location.pathname === "/verify";

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#070d1e]/80 border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300">
            <div className="w-full h-full bg-[#070d1e] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                CERTIVERIFY
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-brand-500/10 text-cyan-400 border border-brand-500/20 rounded-full">
                Web3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Trust Every Credential. Verify on Blockchain.</p>
          </div>
        </Link>

        {/* Center Links (Public) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-full p-1 text-sm">
          <Link
            to="/verify"
            className={`px-4 py-1.5 rounded-full font-medium transition-all ${
              location.pathname === "/verify"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Verify Certificate
          </Link>
          <a
            href="/#how-it-works"
            className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium transition-all"
          >
            How It Works
          </a>
          <a
            href="/#security"
            className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium transition-all"
          >
            Blockchain Security
          </a>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Network Warning if connected to wrong chain */}
          {account && !isHardhatNetwork && (
            <button
              onClick={switchToHardhatNetwork}
              className="hidden lg:flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
              title="Click to switch to Hardhat Localhost Network (31337)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Switch to Localhost</span>
            </button>
          )}

          {/* Web3 Wallet Pill */}
          {account ? (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-300">{truncateHash(account, 6, 4)}</span>
              {isContractOwner && (
                <span className="text-[10px] bg-brand-500/20 text-cyan-300 border border-brand-500/30 px-1.5 py-0.5 rounded font-medium">
                  Owner
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-200 transition-all hover:border-slate-600"
            >
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
            </button>
          )}

          {/* Admin Status / Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 bg-gradient-to-r from-brand-600 to-cyan-600 text-white rounded-xl shadow-glow-sm hover:opacity-95 transition-all"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Portal</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

