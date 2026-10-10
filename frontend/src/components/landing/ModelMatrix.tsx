import React from 'react';
import { Zap, Brain, Shield, Sparkles, Check, ArrowRight } from 'lucide-react';
import { formatNaira } from '../../utils/formatters';

interface ModelMatrixProps {
  onSelectModel: (modelId: string) => void;
  onContactSales?: () => void;
  pricingRateCard?: Record<string, { prompt_per_million: number; completion_per_million: number }>;
}

export const ModelMatrix: React.FC<ModelMatrixProps> = ({ onSelectModel, onContactSales, pricingRateCard }) => {
  const models = [
    {
      id: 'indunix-1-spark',
      name: 'Indunix 1 Spark',
      tagline: 'High-Concurrency Business Ops',
      badge: 'Sub-Second',
      color: 'emerald',
      pricing: pricingRateCard?.['indunix-1-spark']?.completion_per_million
        ? formatNaira(pricingRateCard['indunix-1-spark'].completion_per_million)
        : '₦1,200.00',
      period: 'per 1M tokens',
      context: '128k Context',
      description: 'Ultra-low latency engine for 24/7 corporate customer support bots, automated CRM intake, real-time lead qualification, and high-frequency business messaging.',
      capabilities: [
        'Sub-second first-token latency (<18ms)',
        'Automated enterprise customer service',
        'Real-time CRM & ticketing sync',
        'Instant Pay in Naira & billing optimized',
      ],
      recommendedFor: 'Customer Support, CRM Automation & High-Concurrency APIs'
    },
    {
      id: 'indunix-1-core',
      name: 'Indunix 1 Core',
      tagline: 'Enterprise Reasoning & Operations',
      badge: 'Most Popular',
      color: 'cyan',
      pricing: pricingRateCard?.['indunix-1-core']?.completion_per_million
        ? formatNaira(pricingRateCard['indunix-1-core'].completion_per_million)
        : '₦1,800.00',
      period: 'per 1M tokens',
      context: '64k Context',
      description: 'Our flagship corporate intelligence tier for drafting executive reports, analyzing commercial contracts, employee onboarding workflows, and operational decision-making.',
      capabilities: [
        'Comprehensive business & corporate context',
        'Commercial contract & RFP evaluation',
        'Executive memos & structured reports',
        'Full OpenAI SDK drop-in support',
      ],
      recommendedFor: 'Enterprise SaaS, Operations & Business Copilots'
    },
    {
      id: 'indunix-1-reason',
      name: 'Indunix 1 Reason',
      tagline: 'Executive Strategy & Financial Audit',
      badge: 'Deep Cognitive',
      color: 'violet',
      pricing: pricingRateCard?.['indunix-1-reason']?.completion_per_million
        ? formatNaira(pricingRateCard['indunix-1-reason'].completion_per_million)
        : '₦3,200.00',
      period: 'per 1M tokens',
      context: '64k Context',
      description: 'Extended deliberative reasoning model for forensic balance sheet audits, investment underwriting, board-level strategic planning, and regulatory compliance.',
      capabilities: [
        'Extended self-reflective <think> traces',
        'Corporate balance sheet & ledger reconciliation',
        'Risk underwriting & regulatory compliance',
        'Multi-scenario business forecasting',
      ],
      recommendedFor: 'Financial Underwriting, Forensic Audit & C-Suite Advisory'
    },
    {
      id: 'indunix-edge-local',
      name: 'Indunix Edge',
      tagline: 'On-Premise Sovereign Hardware',
      badge: 'Enterprise Custom',
      color: 'amber',
      pricing: 'Talk to Sales',
      period: 'custom SLA & dedicated node',
      context: 'Air-Gapped Node',
      description: 'Dedicated air-gapped inference engines deployed directly on customer hardware or private VPC clouds with zero cloud telemetry egress.',
      capabilities: [
        '100% On-Premise (Zero cloud data egress)',
        'Compliant with NDPR & sovereign banking laws',
        '99.99% Enterprise SLA guaranteed',
        'Dedicated 24/7 Slack / WhatsApp engineering bridge',
      ],
      recommendedFor: 'Banking, Regulated Financial Institutions & Enterprise Clouds'
    }
  ];

  return (
    <section id="models" className="py-24 border-t border-slate-850 bg-[#090D15]/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-750 text-slate-300 text-xs font-mono mb-3">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>PROPRIETARY RATE CARD</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Predictable Naira Pricing. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Zero FX Fluctuation.
            </span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Every model is accessible through the identical OpenAI-compatible endpoint. Select the tier tailored for your latency and cognitive requirements.
          </p>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {models.map((m) => (
            <div
              key={m.id}
              className={`glass-card rounded-2xl p-6 flex flex-col justify-between border ${
                m.id === 'indunix-1-core' ? 'border-emerald-500/40 shadow-glow-emerald bg-slate-900/60' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header Tag & Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    {m.context}
                  </span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    m.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    m.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    m.color === 'violet' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {m.badge}
                  </span>
                </div>

                {/* Model Title */}
                <h3 className="font-heading text-xl font-bold text-white mb-1">
                  {m.name}
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  {m.tagline}
                </p>

                {/* Price Display */}
                <div className="mb-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-3xl font-extrabold text-white font-mono">
                      {m.pricing}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono block mt-1">
                    {m.period}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  {m.description}
                </p>

                {/* Capabilities */}
                <div className="space-y-2.5 mb-8">
                  {m.capabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <div className="text-[11px] text-slate-500 font-mono mb-3">
                  Best for: {m.recommendedFor}
                </div>
                <button
                  onClick={() => {
                    if (m.id === 'indunix-edge-local' && onContactSales) {
                      onContactSales();
                    } else {
                      onSelectModel(m.id);
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    m.id === 'indunix-edge-local'
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : m.id === 'indunix-1-core'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <span>{m.id === 'indunix-edge-local' ? 'Talk to Enterprise Sales' : 'Test in Playground'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
