import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Key,
  CreditCard,
  Cpu,
  Save,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  Layers,
  Lock,
  Copy,
  ExternalLink,
  Zap,
  Server
} from 'lucide-react';
import { api } from '../../api/client';
import { formatNaira } from '../../utils/formatters';

export const AdminManagementView: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [paystackSecretKey, setPaystackSecretKey] = useState('');
  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [togetherApiKey, setTogetherApiKey] = useState('');
  const [liveMode, setLiveMode] = useState(true);

  // Visibility toggles
  const [showSecret, setShowSecret] = useState(false);
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [cfg, met] = await Promise.all([
        api.getAdminConfig().catch(() => null),
        api.getAdminMetrics().catch(() => null),
      ]);
      if (cfg) {
        setConfig(cfg);
        setPaystackPublicKey(cfg.payment?.public_key || '');
        setLiveMode(cfg.upstream?.live_production_mode ?? true);
      }
      if (met) {
        setMetrics(met);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load admin settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updatePayload: any = {
        live_production_mode: liveMode,
      };
      if (paystackSecretKey.trim()) updatePayload.paystack_secret_key = paystackSecretKey.trim();
      if (paystackPublicKey.trim()) updatePayload.paystack_public_key = paystackPublicKey.trim();
      if (deepseekApiKey.trim()) updatePayload.deepseek_api_key = deepseekApiKey.trim();
      if (groqApiKey.trim()) updatePayload.groq_api_key = groqApiKey.trim();
      if (togetherApiKey.trim()) updatePayload.together_api_key = togetherApiKey.trim();

      const res = await api.updateAdminConfig(updatePayload);
      setSuccessMsg(res.message || 'Admin configuration saved and applied successfully.');
      setPaystackSecretKey('');
      setDeepseekApiKey('');
      setGroqApiKey('');
      setTogetherApiKey('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating configuration');
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = 'https://api.indunixai.com/api/billing/webhook';
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>PLATFORM ROOT ADMINISTRATION</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">
            Admin Management & Gateway Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage live payment settlement keys, upstream AI model connections, and system-wide ledger reserves.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* System Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Registered Users</span>
            <div className="text-2xl font-bold text-white font-mono">{metrics.total_users}</div>
            <span className="text-[10px] text-slate-500 font-mono">{metrics.total_keys} API keys generated</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">System Ledger Balance</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {formatNaira(metrics.total_ledger_balance_ngn)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Bonus Issued: {formatNaira(metrics.total_bonus_issued_ngn)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Total Tokens Metered</span>
            <div className="text-2xl font-bold text-cyan-300 font-mono">
              {(metrics.total_tokens_metered / 1_000_000).toFixed(2)}M
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{metrics.total_requests_served} API requests</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Production Mode</span>
            <div className="text-lg font-bold text-emerald-400 font-mono flex items-center gap-2 pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{metrics.live_production_mode ? 'LIVE PRODUCTION' : 'SANDBOX / TEST'}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">HMAC SHA-512 Enforced</span>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Payment Settlement Configuration */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Pay in Naira Gateway (Paystack Configuration)
                </h3>
                <p className="text-xs text-slate-400">
                  Configure live production keys for instant customer wallet funding in Naira.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Active Currency: NGN (₦)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paystack Secret Key */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-300">
                  Live Secret Key (sk_live_...)
                </label>
                {config?.payment?.secret_key_masked && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Current: <code className="text-emerald-400">{config.payment.secret_key_masked}</code>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  placeholder="Enter new live secret key (sk_live_...)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Never shared publicly. Used for server-to-server transaction initializations and webhooks.
              </span>
            </div>

            {/* Paystack Public Key */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-300">
                  Live Public Key (pk_live_...)
                </label>
                {config?.payment?.public_key && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Active
                  </span>
                )}
              </div>
              <input
                type="text"
                value={paystackPublicKey}
                onChange={(e) => setPaystackPublicKey(e.target.value)}
                placeholder="Enter public key (pk_live_...)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Used by frontend checkout overlays to tokenize debit card and bank transfers.
              </span>
            </div>
          </div>

          {/* Webhook Endpoint Display */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px]">Paystack Webhook Listener Endpoint:</span>
              <span className="text-white font-semibold">https://api.indunixai.com/api/billing/webhook</span>
            </div>
            <button
              type="button"
              onClick={copyWebhookUrl}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedWebhook ? 'Copied' : 'Copy Webhook URL'}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Upstream AI Model Providers */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Upstream AI Providers & Routing Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Credentials for underlying model providers (Completely abstracted from clients).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={liveMode}
                  onChange={(e) => setLiveMode(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="font-bold text-white">Live Production Routing</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DeepSeek Key */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-300">
                  DeepSeek API Key (Indunix 1 Core & Reason)
                </label>
                {config?.upstream?.deepseek_key_masked && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Current: <code className="text-cyan-400">{config.upstream.deepseek_key_masked}</code>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showDeepseek ? 'text' : 'password'}
                  value={deepseekApiKey}
                  onChange={(e) => setDeepseekApiKey(e.target.value)}
                  placeholder="Enter DeepSeek API Key (sk-...)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowDeepseek(!showDeepseek)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showDeepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Routes Indunix 1 Core (V3) and Indunix 1 Reason (R1) requests.
              </span>
            </div>

            {/* Groq Key */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-300">
                  Groq API Key (Indunix 1 Spark)
                </label>
                {config?.upstream?.groq_key_masked && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Current: <code className="text-emerald-400">{config.upstream.groq_key_masked}</code>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showGroq ? 'text' : 'password'}
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="Enter Groq API Key (gsk_...)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGroq(!showGroq)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Routes Indunix 1 Spark sub-second token streaming.
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save & Apply Platform Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
