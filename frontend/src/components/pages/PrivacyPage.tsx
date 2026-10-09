import React from 'react';
import { Shield, Lock, CheckCircle2, FileText, ArrowLeft, Globe, ShieldAlert } from 'lucide-react';

interface PrivacyPageProps {
  onNavigateHome: () => void;
  onNavigateTerms: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigateHome, onNavigateTerms }) => {
  return (
    <div className="min-h-screen bg-[#06070A] text-[#F8FAFC]">
      {/* Subheader Breadcrumbs */}
      <div className="border-b border-white/[0.07] bg-[#0A0D14]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between text-xs sticky top-16 sm:top-20 z-40">
        <div className="flex items-center gap-2 text-zinc-400">
          <button onClick={onNavigateHome} className="hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Indunix AI</span>
          </button>
          <span className="text-zinc-600">/</span>
          <span className="text-emerald-400 font-medium">Privacy Policy</span>
        </div>

        <button
          onClick={onNavigateTerms}
          className="text-xs text-zinc-400 hover:text-white transition-colors font-medium flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-zinc-500" />
          <span>View Terms of Service →</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Document Header */}
        <div className="border-b border-white/[0.08] pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>SOVEREIGN DATA CHARTER</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Privacy & Data Sovereignty Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-zinc-400">
            <span>Effective Date: October 2026</span>
            <span>•</span>
            <span>Compliance Standard: NDPR / ISO 27001 Aligned</span>
            <span>•</span>
            <span>Version: 2.4.0</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>1. Zero Data Retention & No-Training Policy</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Indunix AI operates under a strict Sovereign Data Guarantee. When you submit text, code, corporate documents, or multimodal prompts to our gateway (<code className="text-emerald-400 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">api.indunixai.com/v1</code>):
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 text-xs sm:text-sm pl-2">
              <li><strong className="text-white">In-Memory Execution:</strong> Prompts and completions are processed ephemerally in active memory and are immediately purged following response completion.</li>
              <li><strong className="text-white">Zero Model Training:</strong> Your corporate data, intellectual property, and user inputs are strictly never used to train, retrain, fine-tune, or calibrate any base or frontier models.</li>
              <li><strong className="text-white">Log Anonymization:</strong> Platform telemetry logs retain exclusively request token counters, response latency, and billing records. Full prompt payloads are never saved to persistent disks.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>2. Cryptographic Security & Key Custody</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Security is enforced at every layer of the Indunix network:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">In-Transit Encryption</h3>
                <p className="text-xs text-zinc-400">
                  All HTTP traffic and Server-Sent Events (SSE) connections require TLS 1.3 cryptographic protocols with modern cipher suites.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Salted SHA-256 Hashing</h3>
                <p className="text-xs text-zinc-400">
                  API keys (<code className="text-emerald-400 font-mono">indunix-live-sk-</code>) are shown exactly once. Our database stores only non-reversible salted cryptographic hashes.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>3. Payment Processing & Corporate Administration</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Indunix AI allows African developers and corporate enterprises to top up account wallets natively in Nigerian Naira (NGN):
            </p>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                All credit and wallet transactions are processed via Paystack using bank-grade 256-bit encryption. Indunix AI does not store credit card numbers, bank PINs, or confidential banking credentials on its servers.
              </p>
              <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-white/[0.06] text-xs text-zinc-400">
                <span className="text-zinc-300 font-medium">Merchant Administration:</span> Billing operations, merchant settlements, and sovereign corporate licensing are securely processed under license by <strong className="text-zinc-200">Esam Creative Technologies</strong>.
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <span>4. Air-Gapped On-Premise Deployments</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              For commercial banks, financial regulators, and healthcare enterprises utilizing <strong className="text-white">Indunix Edge</strong>:
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Model inference runtimes are physically deployed onto the client's internal servers or private VPC cloud. In these deployments, all prompt and completion data remains 100% within the client's local network perimeter with zero outbound telemetry egress.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>5. Regulatory Compliance & Data Rights</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              We comply with the Nigeria Data Protection Regulation (NDPR) and international data sovereignty mandates. You hold absolute ownership over your account profile, API configurations, and billing history. You may request account deletion or data exports at any time by contacting our data protection officer.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-zinc-400">
              For privacy inquiries and regulatory audit requests, contact: <a href="mailto:privacy@indunixai.com" className="text-emerald-400 underline font-mono">privacy@indunixai.com</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
