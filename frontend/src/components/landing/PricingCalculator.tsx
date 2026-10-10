import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatNaira } from '../../utils/formatters';

interface PricingCalculatorProps {
  onStartFree: () => void;
  pricingRateCard?: Record<string, { prompt_per_million: number; completion_per_million: number }>;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ onStartFree, pricingRateCard }) => {
  const [dailyRequests, setDailyRequests] = useState<number>(1500);
  const [tokensPerRequest, setTokensPerRequest] = useState<number>(1200);

  // Monthly computations (30 days)
  const monthlyRequests = dailyRequests * 30;
  const monthlyTokens = monthlyRequests * tokensPerRequest;

  // Indunix 1 Core dynamic rate per 1M tokens
  const coreRate = pricingRateCard?.['indunix-1-core']?.completion_per_million || 1800;
  const indunixMonthlyNgn = (monthlyTokens / 1_000_000) * coreRate;

  // Traditional manual business operations cost: ~₦150 per operational task/ticket
  const humanCostPerDoc = 150;
  const humanMonthlyNgn = monthlyRequests * humanCostPerDoc;

  // Savings
  const savingsNgn = Math.max(0, humanMonthlyNgn - indunixMonthlyNgn);
  const percentageSaved = humanMonthlyNgn > 0 ? Math.round((savingsNgn / humanMonthlyNgn) * 100) : 95;

  return (
    <section id="pricing" className="py-24 border-t border-slate-800 bg-[#090D15]/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>TRANSPARENT NAIRA ROI CALCULATOR</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Cut Business Operational Costs by {percentageSaved}%.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Compare Indunix automated business intelligence against traditional manual corporate administrative, support, and reporting team overhead in Nigerian Naira.
          </p>
        </div>

        {/* Calculator Widget */}
        <div className="max-w-4xl mx-auto glass-panel rounded-2xl border border-slate-750 p-6 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders Area */}
            <div className="lg:col-span-7 space-y-8">
              {/* Slider 1: Daily Requests */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-200">
                    Daily Business Operations / Customer Inquiries:
                  </label>
                  <span className="font-mono text-lg font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    {dailyRequests.toLocaleString()} / day
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="15000"
                  step="100"
                  value={dailyRequests}
                  onChange={(e) => setDailyRequests(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                  <span>100 requests/day</span>
                  <span>5,000 requests/day</span>
                  <span>15,000 requests/day</span>
                </div>
              </div>

              {/* Slider 2: Average tokens per document */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-200">
                    Average Tokens per Business Task / Request:
                  </label>
                  <span className="font-mono text-sm font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-lg">
                    {tokensPerRequest.toLocaleString()} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="4000"
                  step="100"
                  value={tokensPerRequest}
                  onChange={(e) => setTokensPerRequest(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                  <span>400 (Customer Chat / Triage)</span>
                  <span>1,500 (Executive Memo / Report)</span>
                  <span>4,000 (Comprehensive Financial Audit)</span>
                </div>
              </div>

              {/* Monthly Volume Summary Pill */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Monthly Processed Tokens:</span>
                <span className="text-white font-bold text-sm">
                  {(monthlyTokens / 1_000_000).toFixed(2)} Million Tokens
                </span>
              </div>
            </div>

            {/* Comparison Results Card */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col justify-between shadow-glow-emerald">
              <div className="space-y-6">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                    Indunix AI Monthly Spend
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono mt-1">
                    {formatNaira(indunixMonthlyNgn)}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Based on Indunix 1 Core (₦1,800.00/1M tokens)
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                    Traditional Manual Operations Cost
                  </span>
                  <div className="text-xl font-bold text-slate-400 line-through font-mono mt-1">
                    {formatNaira(humanMonthlyNgn)}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Estimated at ₦150.00/task manual corporate handling
                  </span>
                </div>

                {/* Savings Pill */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Monthly Net Savings:</span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                    {formatNaira(savingsNgn)} / month
                  </div>
                </div>
              </div>

              <button
                onClick={onStartFree}
                className="w-full mt-6 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <span>Claim ₦1,000.00 Free Credits</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
