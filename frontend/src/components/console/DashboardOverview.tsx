import React, { useState } from 'react';
import { Wallet as WalletIcon, PlusCircle, ArrowUpRight, Zap, Copy, Check, TrendingUp, Clock, Terminal, Activity } from 'lucide-react';
import { formatNaira, formatTokens } from '../../utils/formatters';
import { Wallet, UsageSummary } from '../../api/client';

interface DashboardOverviewProps {
  wallet: Wallet | null;
  summary: UsageSummary | null;
  onOpenDeposit: () => void;
  onNavigateToKeys: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  wallet,
  summary,
  onOpenDeposit,
  onNavigateToKeys,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const curlCode = `curl https://api.indunixai.com/v1/chat/completions \\
  -H "Authorization: Bearer indunix-live-sk-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "indunix-1-core", "messages": [{"role": "user", "content": "Hello Indunix"}]}'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Developer Console Overview
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Production Gateway Endpoint: <code className="text-emerald-400 font-mono">https://api.indunixai.com/v1</code>
          </p>
        </div>

        <button
          onClick={onOpenDeposit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Deposit Naira Credits</span>
        </button>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prominent Wallet Balance Card (5 columns) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#0A0F1D] border border-emerald-500/40 shadow-glow-emerald flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <WalletIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                  Naira Wallet Ledger
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                NGN Native
              </span>
            </div>

            {/* Total Balance */}
            <div className="mb-4">
              <span className="text-xs text-slate-400 font-mono">Total Available Credits</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1">
                {wallet ? formatNaira(wallet.total_available_ngn) : '₦1,000.00'}
              </div>
            </div>

            {/* Breakdown Sub-card */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs font-mono mb-6">
              <div className="flex items-center justify-between text-slate-400">
                <span>Deposited Cash Balance:</span>
                <span className="text-white font-semibold">
                  {wallet ? formatNaira(wallet.balance_ngn) : '₦0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Sign-up Bonus Credits:</span>
                <span className="font-semibold">
                  {wallet ? formatNaira(wallet.bonus_credits_ngn) : '₦1,000.00'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenDeposit}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Top Up & Pay in Naira (Cards, Transfer, USSD, OPay)</span>
          </button>
        </div>

        {/* 30-Day Metrics Summary (7 columns) */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">Total Requests (30d)</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {summary ? summary.total_requests.toLocaleString() : '0'}
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-2">
              Success rate: 100%
            </span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">Tokens Processed</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {summary ? formatTokens(summary.total_tokens) : '0'}
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-2">
              Prompt & Completion
            </span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">Total Spend (NGN)</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {summary ? formatNaira(summary.total_spend_ngn) : '₦0.00'}
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-2">
              Deducted from prepaid credits
            </span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">Average Latency</span>
              <Clock className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {summary && summary.avg_latency_ms > 0 ? `${summary.avg_latency_ms}ms` : '<18ms'}
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-2">
              Sub-15ms proxy overhead
            </span>
          </div>
        </div>
      </div>

      {/* Quickstart Snippet Banner */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading text-sm font-bold text-white">
              Instant cURL Gateway Quickstart
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToKeys}
              className="text-xs text-emerald-400 hover:underline font-mono"
            >
              Get API Key →
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
        <pre className="p-4 rounded-xl bg-slate-950 text-xs font-mono text-emerald-300 overflow-x-auto">
          <code>{curlCode}</code>
        </pre>
      </div>

      {/* Model Consumption Breakdown */}
      {summary && summary.model_breakdown && Object.keys(summary.model_breakdown).length > 0 && (
        <div className="glass-panel rounded-2xl border border-slate-800 p-6">
          <h3 className="font-heading text-sm font-bold text-white mb-4">
            Token Breakdown by Model Tier
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(summary.model_breakdown).map(([modName, stats]) => (
              <div key={modName} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs font-bold text-white font-heading">{modName}</div>
                <div className="text-lg font-extrabold text-emerald-400 font-mono mt-1">
                  {formatTokens(stats.tokens)} tokens
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800">
                  <span>{stats.requests} requests</span>
                  <span>{formatNaira(stats.spend_ngn)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
