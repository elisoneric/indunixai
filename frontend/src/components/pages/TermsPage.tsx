import React from 'react';
import { FileText, CheckCircle2, Shield, ArrowLeft, CreditCard, Scale, AlertCircle } from 'lucide-react';

interface TermsPageProps {
  onNavigateHome: () => void;
  onNavigatePrivacy: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigateHome, onNavigatePrivacy }) => {
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
          <span className="text-emerald-400 font-medium">Terms of Service</span>
        </div>

        <button
          onClick={onNavigatePrivacy}
          className="text-xs text-zinc-400 hover:text-white transition-colors font-medium flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5 text-zinc-500" />
          <span>View Privacy Policy →</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Document Header */}
        <div className="border-b border-white/[0.08] pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
            <Scale className="w-3.5 h-3.5" />
            <span>COMMERCIAL AGREEMENT</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Terms of Service & API Agreement
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-zinc-400">
            <span>Effective Date: October 2026</span>
            <span>•</span>
            <span>Applicable to: API Gateway, Developer Console & Edge Nodes</span>
            <span>•</span>
            <span>Version: 2.1.0</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>1. Agreement & OpenAI Drop-In SLA</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              By registering an account, generating an API key, or accessing <code className="text-emerald-400 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">api.indunixai.com/v1</code>, you agree to these Terms. Indunix AI provides an OpenAI-compatible API gateway delivering sub-second response times and high-throughput model inferencing.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-zinc-300 leading-relaxed">
              <strong className="text-white">Service Level Commitment:</strong> We maintain a target 99.9% uptime SLA for public cloud gateway endpoints, with automated failover routing across distributed inference clusters.
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>2. Direct Naira Metering & Atomic Ledger</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Token usage is metered and charged strictly in Nigerian Naira (NGN) per request:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 text-xs sm:text-sm pl-2">
              <li><strong className="text-white">Published Rate Card:</strong> Incurred costs reflect exact token counts multiplied by published rates (e.g. ₦1,200.00/1M tokens for Spark, ₦1,800.00/1M tokens for Core, ₦3,200.00/1M tokens for Reason).</li>
              <li><strong className="text-white">Non-Expiring Credits:</strong> Prepaid Naira balances deposited into your wallet do not expire and remain active indefinitely.</li>
              <li><strong className="text-white">Atomic Deduction:</strong> Deductions occur atomically per completed HTTP/SSE request. If wallet balance is insufficient, the gateway returns HTTP 402 with structured payment instructions.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>3. API Key Responsibility & Spend Limits</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              You are solely responsible for securing all API keys issued under your account. Indunix AI provides granular monthly spend limits and instant key deletion via the Developer Console. We are not liable for unauthorized usage resulting from leaked keys in public repositories or insecure client-side applications.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-400" />
              <span>4. Acceptable Use Policy</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              You agree not to use Indunix AI services for:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-300 text-xs sm:text-sm pl-2">
              <li>Generating harmful, fraudulent, or legally prohibited content under Nigerian and international laws.</li>
              <li>Attacking, reverse-engineering, or destabilizing platform inference clusters or other tenant workloads.</li>
              <li>Attempting to bypass rate limiting or cryptographically forged telemetry tokens.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <span>5. Corporate Entity & Merchant Operations</span>
            </h2>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Indunix AI services and infrastructure are provided under relevant commercial sovereign charters. Commercial billing, payment gateway processing (via Paystack), and corporate administration are managed by <strong className="text-zinc-200">Esam Creative Technologies</strong>.
              </p>
              <div className="text-xs text-zinc-400">
                Any legal disputes or enterprise contractual escalations shall be subject to applicable commercial jurisdiction and laws.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
