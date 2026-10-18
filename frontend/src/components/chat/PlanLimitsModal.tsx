import React, { useState } from 'react';
import { 
  X, Check, Sparkles, Zap, Brain, Shield, Terminal, 
  ArrowRight, CreditCard, Lock, RefreshCw, Layers 
} from 'lucide-react';
import { ChatLimits } from '../../api/client';
import { formatNaira } from '../../utils/formatters';

interface PlanLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  limits: ChatLimits | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
  onNavigateToConsole: () => void;
  user: any;
}

export const PlanLimitsModal: React.FC<PlanLimitsModalProps> = ({
  isOpen,
  onClose,
  limits,
  onOpenAuth,
  onOpenDeposit,
  onNavigateToConsole,
  user,
}) => {
  const currentTier = limits?.tier || (user ? 'free' : 'guest');
  const [selectedTab, setSelectedTab] = useState<'guest' | 'free' | 'pro' | 'api'>(
    currentTier === 'pro' ? 'pro' : currentTier === 'free' ? 'free' : 'guest'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#090D16] border border-white/[0.1] shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>Indunix AI Access Tiers & Limits</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                  Current: {currentTier.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Transparent compute quotas, model access rights, and developer APIs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier Selector Pills - Claude/ChatGPT Style */}
        <div className="px-6 pt-5 pb-3 bg-black/40 border-b border-white/[0.06]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <button
              onClick={() => setSelectedTab('guest')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'guest'
                  ? 'bg-white/[0.12] text-white shadow-sm font-semibold border border-white/[0.1]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              <span>Guest Tier</span>
              {currentTier === 'guest' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
              )}
            </button>

            <button
              onClick={() => setSelectedTab('free')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'free'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm font-semibold border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Standard Free</span>
              {currentTier === 'free' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
              )}
            </button>

            <button
              onClick={() => setSelectedTab('pro')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'pro'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white shadow-sm font-semibold border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-teal-400" />
              <span>Pro Plan</span>
              {currentTier === 'pro' && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 ml-1" />
              )}
            </button>

            <button
              onClick={() => setSelectedTab('api')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'api'
                  ? 'bg-purple-500/20 text-purple-300 shadow-sm font-semibold border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Developer API</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Quota Gauge Bar */}
          {limits && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Your Active Usage Quota
                </div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>{limits.tier === 'pro' ? 'Unlimited High-Throughput Compute' : `${limits.remaining_messages} / ${limits.messages_limit} Prompts Available`}</span>
                  <span className="text-zinc-500 font-normal">({limits.reset_interval})</span>
                </div>
              </div>

              {limits.tier === 'guest' ? (
                <div className="w-full sm:w-48 bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (limits.remaining_messages / limits.messages_limit) * 100)}%` }}
                  />
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-xs text-zinc-400">Available Credits: </span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {formatNaira(limits.total_available_ngn)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tier Detail Views */}
          {selectedTab === 'guest' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Guest Access</span>
                    <span className="text-xs font-normal text-zinc-400">No account required</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Immediate trial for exploring Indunix AI models in real-time. Anonymous sessions are rate-limited and stored locally in your browser.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">Free</div>
                  <div className="text-[11px] text-zinc-400 font-mono">10 prompts / session</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Eligible Models</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    <strong className="text-zinc-200">Indunix 1 Spark</strong> & <strong className="text-zinc-200">Indunix 1 Core</strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Streaming</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Sub-second SSE token streaming directly from edge compute nodes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Conversation Persistence</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Active chat saved locally for the session. Seamlessly migrated upon free registration.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-zinc-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <span>Reasoning & Long History</span>
                  </div>
                  <p className="text-zinc-500 pl-6">
                    Indunix 1 Reason, multi-device cloud history, and export require free signup.
                  </p>
                </div>
              </div>

              {!user && (
                <div className="pt-4 flex items-center justify-between border-t border-white/[0.06]">
                  <span className="text-xs text-zinc-400">Want permanent history and ₦1,000 promo credit?</span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth('register');
                    }}
                    className="btn-pill-primary text-xs !py-2 !px-4 flex items-center gap-2"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'free' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Standard Free Account</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ₦1,000 Sign-Up Grant
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Ideal for developers, researchers, and professionals who need an everyday sovereign AI assistant with persistent cloud history.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">₦0.00 / mo</div>
                  <div className="text-[11px] text-zinc-400 font-mono">50 prompts / day</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Full Conversation Sync</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Multi-device encrypted conversation history, search, pin, and markdown export.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>50 Free Prompts Daily</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Refreshes daily for fast document parsing, text generation, and code explanation.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>₦1,000 Bonus Wallet Credits</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Use bonus credits for additional gateway queries or test developer API keys.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-zinc-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <span>Advanced Reasoning (Pro)</span>
                  </div>
                  <p className="text-zinc-500 pl-6">
                    Chain-of-thought mathematical proof & deep forensic audit requires Pro top-up.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/[0.06]">
                <span className="text-xs text-zinc-400">Ready to unlock Indunix 1 Reason?</span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenDeposit();
                  }}
                  className="btn-pill-primary text-xs !py-2 !px-4 flex items-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Top Up with Naira (Upgrade to Pro)</span>
                </button>
              </div>
            </div>
          )}

          {selectedTab === 'pro' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Indunix Pro Tier</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      Frontier Intelligence
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    For enterprise executives, data scientists, and power users who need high-throughput reasoning, complex financial audits, and prioritized inference.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400 font-mono">Usage & Funded</div>
                  <div className="text-[11px] text-zinc-400 font-mono">Pay directly in Naira</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 text-xs">
                  <div className="font-semibold text-emerald-300 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    <span>Indunix 1 Reason Included</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Full access to extended chain-of-thought reasoning, mathematical proof, and contract audit.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Unlimited Quota Capacity</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Zero daily message throttling. Billed transparently from your Naira wallet balance.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Prioritized Inference Engine</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Sub-15ms sub-second routing queue across high-concurrency Lagos edge nodes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Direct Naira Settlements</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Pay with Card, Bank Transfer, or Dedicated NUBAN Virtual Account. No FX markup.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/[0.06]">
                <span className="text-xs text-zinc-400">
                  {user ? 'Fund your wallet to activate Pro reasoning models.' : 'Sign in to activate Pro.'}
                </span>
                <button
                  onClick={() => {
                    onClose();
                    if (!user) {
                      onOpenAuth('login');
                    } else {
                      onOpenDeposit();
                    }
                  }}
                  className="btn-pill-primary text-xs !py-2 !px-4 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{user ? 'Fund Wallet (Top Up Naira)' : 'Sign In to Upgrade'}</span>
                </button>
              </div>
            </div>
          )}

          {selectedTab === 'api' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Developer API Platform</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      OpenAI SDK Compatible
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Deploy programmatic API keys directly in Python, Node.js, LangChain, or Cursor IDE. Dedicated endpoint <code className="text-purple-400 font-mono text-[11px] bg-white/[0.04] px-1 py-0.5 rounded">api.indunixai.com/v1</code>.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-white font-mono">From ₦1,200 / M</div>
                  <div className="text-[11px] text-zinc-400 font-mono">Per token consumption</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    <span>Drop-in OpenAI SDK Replacement</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Just set <code className="font-mono text-zinc-300">base_url="https://api.indunixai.com/v1"</code> and use your Indunix key.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    <span>Programmatic Key Controls</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Create revocable keys, monthly spend ceilings, and real-time telemetry logs.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    <span>Multi-Provider Key Pooling</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Zero downtime with automatic 429 rotation and sub-15ms edge routing latency.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    <span>On-Premise Model Leases</span>
                  </div>
                  <p className="text-zinc-400 pl-6">
                    Air-gapped enterprise local server licenses with cryptographic 24-hour leasing.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/[0.06]">
                <span className="text-xs text-zinc-400">Manage keys, telemetry, and view sample code in Developer Console.</span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToConsole();
                  }}
                  className="btn-pill-primary text-xs !py-2 !px-4 flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Open Developer Console</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
