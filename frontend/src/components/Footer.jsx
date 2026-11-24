import React from "react";
import { ShieldCheck, Github, ExternalLink, Cpu, CheckCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#050914] text-slate-400 py-12 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Col */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5">
              <div className="w-full h-full bg-[#070d1e] rounded-[6px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-extrabold text-lg text-white">CERTIVERIFY</span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
            A production-ready decentralized academic credential verification system. Powered by Ethereum smart contracts, cryptographic SHA-256 fingerprinting, and tamper-resistant distributed ledger records.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>Hardhat Localhost 31337 Online</span>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-4">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/verify" className="hover:text-cyan-400 transition-colors">Public Verification</a>
            </li>
            <li>
              <a href="/login" className="hover:text-cyan-400 transition-colors">Institutional Admin</a>
            </li>
            <li>
              <a href="/#how-it-works" className="hover:text-cyan-400 transition-colors">Verification Flow</a>
            </li>
            <li>
              <a href="/#security" className="hover:text-cyan-400 transition-colors">Security Architecture</a>
            </li>
          </ul>
        </div>

        {/* Technology Highlights */}
        <div>
          <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-4">Tech Architecture</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Solidity Smart Contracts (0.8.20)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
              <span>SHA-256 Cryptographic Hashing</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hardhat & Ethers.js v6 Web3</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>React 18 + Tailwind CSS</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© {new Date().getFullYear()} CERTIVERIFY. Academic Credential Verification System.</p>
        <p className="flex items-center gap-1 text-slate-400">
          <span>Final Year Blockchain Engineering Project</span>
        </p>
      </div>
    </footer>
  );
}

