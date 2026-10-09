import React, { useState } from 'react';
import { ShieldCheck, Server, Lock, Clock, CheckCircle, ArrowRight, Building2, Send } from 'lucide-react';

export const EnterpriseSection: React.FC = () => {
  const [inquirySent, setInquirySent] = useState(false);
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyEmail) return;
    setInquirySent(true);
  };

  return (
    <section id="enterprise" className="py-24 border-t border-slate-800 bg-[#070A10] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-750 text-slate-300 text-xs font-mono mb-3">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>MANAGED ENTERPRISE PROVISIONING</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Private On-Premise AI for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Regulated Enterprises.
            </span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Eliminate cloud data leakage risks. We deploy air-gapped local model leases directly to your hardware with fixed monthly retainers in Naira.
          </p>
        </div>

        {/* Enterprise Production Deployment Showcase */}
        <div className="glass-panel rounded-2xl border border-emerald-500/30 p-8 sm:p-10 mb-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  ENTERPRISE PRODUCTION DEPLOYMENT
                </span>
                <span className="text-xs font-mono text-slate-400">
                  AMD EPYC™ Dedicated Node
                </span>
              </div>

              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                Dedicated On-Premise Enterprise AI
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed">
                Operating high-volume commercial operations, financial risk underwriting, and customer intelligence with Indunix AI. We provision a dedicated, air-gapped <span className="text-emerald-400 font-semibold">Indunix Edge</span> engine directly inside the corporate private server environment with zero cloud telemetry leakage.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400">Deployment</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">Air-Gapped Edge</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400">Monthly Volume</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">50M Tokens</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-400">Billing Structure</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">Fixed ₦ Retainer</div>
                </div>
              </div>
            </div>

            {/* Enterprise Telemetry Pill Showcase */}
            <div className="lg:col-span-5 p-6 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Node Heartbeat Telemetry</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE LEASE
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                <div>License: <span className="text-white">INDUNIX-ENT-SOVEREIGN-2026-V1</span></div>
                <div>Node Fingerprint: <span className="text-white">AMD-EPYC-9654-SERVER-NODE-01</span></div>
                <div>Lease Cycle: <span className="text-emerald-400">24-Hour Cryptographic Token</span></div>
                <div>Compliance: <span className="text-white">NDPR / Data Sovereignty Certified</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-heading text-lg font-bold text-white">
              Zero Cloud Data Leakage
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proprietary models run completely on-premise on your dedicated bare-metal or private cloud infrastructure. Sensitive corporate and customer data never leaves Nigerian sovereign borders.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-heading text-lg font-bold text-white">
              Guaranteed 99.9% SLAs
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mission-critical uptime guarantees with 24/7 dedicated engineering bridge via Slack or WhatsApp, and on-site hardware maintenance.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-heading text-lg font-bold text-white">
              Fixed Monthly Naira Retainers
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Eliminate unexpected compute spikes. Predictable monthly corporate invoices from ₦350,000.00 to ₦1,500,000.00/month with VAT compliant receipts.
            </p>
          </div>
        </div>

        {/* Enterprise Lead Consultation Form */}
        <div className="max-w-2xl mx-auto glass-panel rounded-2xl border border-slate-750 p-6 sm:p-8 text-center">
          <Building2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-2">
            Schedule an Enterprise AI Architecture Review
          </h3>
          <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
            Discuss on-premise model leases, hardware specs, and high-concurrency corporate intelligence pipelines with our senior infrastructure engineers.
          </p>

          {inquirySent ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Inquiry received! Our enterprise solutions team will contact you within 2 hours.</span>
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="email"
                required
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="Work email address"
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <span>Request Review</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
