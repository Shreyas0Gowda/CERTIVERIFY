import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  Files,
  ShieldCheck,
  LogOut,
  Wallet,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  User,
  Activity,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { truncateHash } from "../utils/crypto";

export default function AdminLayout() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const {
    account,
    isContractOwner,
    isHardhatNetwork,
    connectWallet,
    connecting,
    switchToHardhatNetwork,
    contractData,
  } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login", { replace: true });
    return null;
  }

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      description: "Overview & system statistics",
    },
    {
      name: "Register Certificate",
      path: "/admin/register",
      icon: FilePlus,
      description: "Issue new certificate on-chain",
    },
    {
      name: "Certificate Records",
      path: "/admin/certificates",
      icon: Files,
      description: "Search, filter & revoke",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070d1e] flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#060b18] flex flex-col justify-between fixed inset-y-0 z-40 hidden md:flex">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800/60">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-glow-sm">
                <div className="w-full h-full bg-[#070d1e] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                  CERTIVERIFY
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Admin Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-600/15 text-cyan-400 border border-brand-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-850 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <div className="flex-1">
                    <div>{item.name}</div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Quick Shortcuts */}
          <div className="px-4 pt-4 border-t border-slate-800/40">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
              External
            </div>
            <Link
              to="/verify"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                <span>Public Verification</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.username}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-cyan-400 border border-brand-500/20">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl py-2 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#070d1e]/85 border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Link to="/" className="text-cyan-400 font-extrabold text-base flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5" />
                <span>CERTIVERIFY</span>
              </Link>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Smart Contract:</span>
              <span className="font-mono text-slate-300">
                {contractData?.address ? truncateHash(contractData.address, 6, 4) : "Connecting..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Network indicator */}
            {account && !isHardhatNetwork && (
              <button
                onClick={switchToHardhatNetwork}
                className="flex items-center gap-1 text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/25 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Switch to 31337</span>
              </button>
            )}

            {/* Wallet Button */}
            {account ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-slate-200">{truncateHash(account, 6, 4)}</span>
                {isContractOwner ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold">
                    Contract Owner
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">
                    Non-Owner
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={connecting}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-brand-600 to-cyan-600 text-white rounded-xl shadow-glow-sm hover:opacity-90 transition-all"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{connecting ? "Connecting..." : "Connect MetaMask"}</span>
              </button>
            )}

            {/* Mobile links */}
            <div className="flex md:hidden items-center gap-2">
              <Link to="/admin/dashboard" className="p-2 text-slate-300 hover:text-white">
                <LayoutDashboard className="w-4 h-4" />
              </Link>
              <Link to="/admin/register" className="p-2 text-slate-300 hover:text-white">
                <FilePlus className="w-4 h-4" />
              </Link>
              <Link to="/admin/certificates" className="p-2 text-slate-300 hover:text-white">
                <Files className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

