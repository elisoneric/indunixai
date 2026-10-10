import React, { useState, useEffect } from 'react';
import { 
  Server, ShieldCheck, Cpu, PhoneCall, CheckCircle2, 
  Building2, Mail, Phone, ArrowRight, Lock, Clock, Sparkles
} from 'lucide-react';
import { api, EnterpriseContract, User } from '../../api/client';
import { formatNaira, formatDate } from '../../utils/formatters';

interface EnterpriseViewProps {
  user?: User;
}

export const EnterpriseView: React.FC<EnterpriseViewProps> = ({ user }) => {
  const [contracts, setContracts] = useState<EnterpriseContract[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [deploymentType, setDeploymentType] = useState('On-Premise GPU Node (Air-Gapped)');
  const [estimatedVolume, setEstimatedVolume] = useState('25M - 100M tokens/month');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await api.getContracts();
      setContracts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !companyName || !email || !phone) {
      setError('Please provide your name, company, work email, and direct phone number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.submitEnterpriseInquiry({
        full_name: fullName,
        company_name: companyName,
        email,
        phone,
        deployment_type: deploymentType,
        estimated_volume: estimatedVolume,
        notes: notes || undefined
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-3">
          <Server className="w-3.5 h-3.5" />
          <span>ENTERPRISE AIR-GAPPED & DEDICATED INFRASTRUCTURE</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
          On-Premise Hardware Nodes & Enterprise Leases
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          For commercial banks, fintechs, healthcare providers, and high-security enterprises requiring air-gapped on-premise model execution with zero cloud telemetry egress.
        </p>
      </div>

      {/* If there are real active contracts */}
      {contracts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-mono font-semibold text-zinc-300 uppercase tracking-wider">
            Active Dedicated Infrastructure Contracts
          </h3>
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="glass-panel rounded-2xl border border-emerald-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    Active Enterprise Node
                  </span>
                  <h4 className="font-heading text-2xl font-bold text-white mt-1">
                    {contract.organization_name}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    Contact: {contract.contact_email}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400 uppercase">Monthly Retainer</span>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {formatNaira(contract.fixed_monthly_retainer_ngn)} / mo
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Contract Status</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {contract.contract_status}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Included Tokens</span>
                  <span className="font-bold text-white">
                    {(contract.monthly_included_tokens / 1_000_000).toFixed(0)}M / month
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Active Until</span>
                  <span className="font-bold text-white">
                    {formatDate(contract.active_until)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Enterprise Inquiry & Talk to Sales Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Value Pillars */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Sovereignty & Architecture</span>
            </h3>

            <div className="space-y-3.5 text-xs text-zinc-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Zero Cloud Egress:</strong> Model weights and inference kernels run 100% locally on physical customer hardware or isolated VPCs.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">NDPR & CBN Regulatory Compliance:</strong> Tailored for Nigerian financial institutions and sensitive data governance.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Dedicated 24/7 Slack & Phone Bridge:</strong> Direct SLA hotline with senior AI infrastructure engineers.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Custom Retainers:</strong> Bespoke token volume commitments and high-availability clustered failover.
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <PhoneCall className="w-4 h-4" />
              <span>Direct Sales Process</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Enterprise nodes require specialized compute profiling. Submit your details and our Enterprise Engineering team will call you within 24 hours to provide a custom deployment plan.
            </p>
          </div>
        </div>

        {/* Right Column: Talk to Sales Form */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0A0D14] border border-white/[0.08] shadow-2xl">
            {submitted ? (
              <div className="py-10 text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white font-heading">
                  Inquiry Received!
                </h3>
                <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-white">{fullName}</strong>. Our Enterprise Solutions Director has received your request for <strong className="text-white">{companyName}</strong> and will call you at <strong className="text-emerald-400">{phone}</strong> within 24 hours.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setNotes('');
                    }}
                    className="btn-pill-secondary text-xs"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div className="border-b border-white/[0.08] pb-4 mb-4">
                  <h3 className="text-lg font-bold text-white font-heading">
                    Talk to Enterprise Sales
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Fill out the form below to receive a custom quote and schedule a technical call.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Lead officer full name"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Company / Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enterprise legal entity name"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Official business email address"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Direct Phone Number / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Direct contact phone number"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Deployment Architecture
                    </label>
                    <select
                      value={deploymentType}
                      onChange={(e) => setDeploymentType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="On-Premise GPU Node (Air-Gapped)">On-Premise GPU Node (Air-Gapped)</option>
                      <option value="Private VPC Dedicated Cloud">Private VPC Dedicated Cloud</option>
                      <option value="Dedicated High-Throughput API Gateway">Dedicated High-Throughput API Gateway</option>
                      <option value="Hybrid On-Prem + Cloud Fallback">Hybrid On-Prem + Cloud Fallback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Estimated Monthly Volume
                    </label>
                    <select
                      value={estimatedVolume}
                      onChange={(e) => setEstimatedVolume(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="10M - 25M tokens/month">10M - 25M tokens/month</option>
                      <option value="25M - 100M tokens/month">25M - 100M tokens/month</option>
                      <option value="100M - 500M tokens/month">100M - 500M tokens/month</option>
                      <option value="500M+ tokens/month (Custom Cluster)">500M+ tokens/month (Custom Cluster)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Infrastructure Specifications or Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide details about your server hardware, regulatory requirements, or use case..."
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <span>Submit Enterprise Request — Talk to Sales</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
