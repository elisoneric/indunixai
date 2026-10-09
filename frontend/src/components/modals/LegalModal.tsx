import React, { useState } from 'react';
import { X, Shield, FileText, Lock, CheckCircle2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: 'privacy' | 'terms';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [tab, setTab] = useState<'privacy' | 'terms'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#090D16] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              {tab === 'privacy' ? <Shield className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {tab === 'privacy' ? 'Privacy & Data Sovereignty Policy' : 'Terms of Service & API Agreement'}
              </h3>
              <p className="text-xs text-zinc-400">Indunix AI Infrastructure Standard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium">
              <button
                onClick={() => setTab('privacy')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tab === 'privacy' ? 'bg-white/[0.12] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Privacy
              </button>
              <button
                onClick={() => setTab('terms')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tab === 'terms' ? 'bg-white/[0.12] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Terms
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm text-zinc-300 leading-relaxed custom-scrollbar">
          {tab === 'privacy' ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  1. Zero Data Retention & No-Training Policy
                </h4>
                <p className="text-zinc-400 text-xs">
                  Indunix AI operates under a strict Sovereign Data Charter. Your prompts, completions, embeddings, and corporate documents sent to <code className="text-emerald-400 font-mono">api.indunixai.com/v1</code> are processed in memory and are never stored or used to train foundation models.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  2. Encryption in Transit & Rest
                </h4>
                <p className="text-zinc-400 text-xs">
                  All communications to the Indunix AI gateway are secured using TLS 1.3 cryptographic protocols. API keys are stored as non-recoverable SHA-256 salted hashes in our sovereign database ledger.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  3. Payment Security & Processing
                </h4>
                <p className="text-zinc-400 text-xs">
                  All credit and top-up transactions are processed via Paystack with 256-bit bank-grade encryption. Indunix AI never stores your credit card details or bank account credentials. Billing operations and merchant settlements are securely processed under license by Esam Creative Technologies.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  4. On-Premise Air-Gapped Deployments
                </h4>
                <p className="text-zinc-400 text-xs">
                  For enterprise customers using Indunix Edge Local, all inference remains on physical customer hardware with zero outbound telemetry egress.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h4 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  1. Service Level & OpenAI Drop-In Compatibility
                </h4>
                <p className="text-zinc-400 text-xs">
                  Indunix AI provides an OpenAI-compatible API gateway. We maintain a 99.9% uptime SLA for production endpoints with sub-second response times on standard models.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  2. Direct Naira Metering & Billing
                </h4>
                <p className="text-zinc-400 text-xs">
                  Tokens are metered per-request against the published rate card in Nigerian Naira (NGN). Wallet balances do not expire, and prepaid credits are deducted atomically per token used.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  3. API Key Responsibility & Spend Limits
                </h4>
                <p className="text-zinc-400 text-xs">
                  You are solely responsible for securing your secret keys. Indunix AI provides granular spend limits and instant key revocation tools inside the Developer Console.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  4. Governing Law & Entity
                </h4>
                <p className="text-zinc-400 text-xs">
                  Indunix AI services are governed by relevant sovereign commercial laws. Commercial billing and merchant administration are managed by Esam Creative Technologies.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sovereign Compliance Standard 2026</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
