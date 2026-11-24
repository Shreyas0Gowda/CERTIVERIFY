import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Key,
  FileText,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LandingPage() {
  const features = [
    {
      icon: Lock,
      title: "Cryptographic Tamper-Resistance",
      description:
        "Every certificate is permanently bound to its unique SHA-256 digital fingerprint recorded on the blockchain ledger. Altering a single character alters the hash.",
    },
    {
      icon: Cpu,
      title: "Smart Contract Authorization",
      description:
        "Only the verified institutional administrator wallet (smart contract owner) can issue or revoke certificates. Eliminates unauthorized credential creation.",
    },
    {
      icon: Search,
      title: "Instant Public Verification",
      description:
        "Anyone—including employers, universities, and background check agencies—can upload a PDF and verify authenticity in milliseconds without creating an account.",
    },
    {
      icon: Database,
      title: "Decentralized Trust Model",
      description:
        "Authentication relies directly on Ethereum consensus, not on proprietary private database silos that can be quietly altered or breached.",
    },
    {
      icon: FileCheck,
      title: "Revocation Tracking",
      description:
        "Institutions can permanently record certificate revocations on-chain with detailed reasoning, preventing revoked credentials from passing as valid.",
    },
    {
      icon: Key,
      title: "Privacy by Design",
      description:
        "Confidential student records are kept off the public ledger. Only cryptographic SHA-256 hashes and necessary verification proofs reside on-chain.",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Document Hash Generation",
      description:
        "The issuing institution uploads the official PDF certificate. The system computes a 256-bit SHA-256 cryptographic digest directly from the raw document bytes.",
    },
    {
      step: "02",
      title: "Smart Contract Registration",
      description:
        "The authorized administrator signs a blockchain transaction via MetaMask, permanently immutating the certificate hash into the Ethereum smart contract.",
    },
    {
      step: "03",
      title: "Document Verification",
      description:
        "Any verifier uploads the candidate PDF. The browser calculates its SHA-256 hash and validates it against the smart contract state.",
    },
    {
      step: "04",
      title: "Authenticity Verdict",
      description:
        "The system immediately returns an unforgeable verdict: Authentic, Invalid (forged/tampered), or Revoked, alongside immutable on-chain timestamps.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 lg:px-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-600/20 via-cyan-500/15 to-transparent blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-cyan-400 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ethereum Smart Contract Verification Standard</span>
          </div>

          {/* Master Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.12]">
            Academic Credentials. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-blue-500 bg-clip-text text-transparent">
              Verified. Secured. Trusted.
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Verify academic certificates instantly with blockchain-powered authentication. Eliminate forgery, eradicate fake degrees, and empower employers with tamper-proof cryptographic proofs.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/verify"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-base shadow-glow-md hover:scale-[1.02] transition-all duration-200"
            >
              <FileCheck className="w-5 h-5" />
              <span>Verify Certificate</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base transition-all duration-200"
            >
              <Lock className="w-5 h-5 text-slate-400" />
              <span>Administrator Login</span>
            </Link>
          </div>

          {/* Trust stats pill */}
          <div className="mt-14 pt-8 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-left">
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-slate-400">Tamper Resistant</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">&lt; 1 sec</div>
              <div className="text-xs text-slate-400">Verification Speed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">SHA-256</div>
              <div className="text-xs text-slate-400">Cryptographic Standard</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Zero Trust</div>
              <div className="text-xs text-slate-400">Decentralized Security</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 lg:px-8 border-t border-slate-800/80 bg-[#060b18]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              How CERTIVERIFY Works
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Four streamlined steps bridging institutional administration and zero-knowledge public verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, i) => (
              <div
                key={i}
                className="relative bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all group"
              >
                <div className="text-4xl font-black text-slate-800 group-hover:text-cyan-500/30 transition-colors mb-4">
                  {st.step}
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">{st.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{st.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Core Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Engineered for Institutional Integrity
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Combining Web3 distributed ledger immutability with modern, enterprise-grade UX.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-brand-500/40 hover:bg-slate-900/70 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blockchain Security Architecture Section */}
      <section id="security" className="py-20 px-4 lg:px-8 border-t border-slate-800/80 bg-[#060b18]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Security Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-6">
              Why Traditional Databases Fail & How Blockchain Solves It
            </h2>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <p>
                In conventional university setups, student records sit in centralized SQL databases. An insider, an unauthorized DBA, or a network intruder can quietly inject or alter degree records without leaving an unforgeable trace.
              </p>
              <p>
                With <strong className="text-white">CERTIVERIFY</strong>, the certificate document itself is hashed with the SHA-256 mathematical algorithm. If an attacker modifies even a single comma or student grade inside the PDF, its cryptographic digest changes completely.
              </p>
              <p>
                Because the hash is stored on an Ethereum-compatible distributed ledger governed by the <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">CertificateVerification.sol</code> smart contract, no single party can alter past records.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                Solidity 0.8.20
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                OpenZeppelin Ownable Access Control
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                SHA-256 Digest Verification
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 font-mono text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-slate-300 font-sans font-medium">Verification Algorithm</span>
              </div>
              <span className="text-cyan-400">Smart Contract Proof</span>
            </div>
            <pre className="overflow-x-auto text-slate-300 leading-5">
{`// 1. Calculate document hash locally
hash = SHA256(certificate_pdf_raw_bytes)

// 2. Query Smart Contract (Decentralized State)
(bool isValid, bool isRevoked, string certId, address issuer) = 
    CertificateVerification.verifyCertificate(hash);

// 3. Mathematical Proof Evaluation
if (isValid && !isRevoked) {
    status = "AUTHENTIC";      // Tamper-proof genuine
} else if (isRevoked) {
    status = "REVOKED";        // Officially invalidated
} else {
    status = "INVALID_FORGERY"; // Document mismatch
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Verification CTA Banner */}
      <section className="py-20 px-4 lg:px-8 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-brand-900/60 via-slate-900 to-cyan-950/60 border border-brand-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-glow-md">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Have a certificate to verify?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8">
            Upload the official PDF document to query the blockchain ledger and verify its authenticity in seconds.
          </p>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-semibold text-sm shadow-glow-sm hover:scale-105 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Launch Public Verification</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

