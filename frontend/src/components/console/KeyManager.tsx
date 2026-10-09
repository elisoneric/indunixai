import React, { useState } from 'react';
import { Key, Plus, Copy, Check, AlertTriangle, Trash2, Power, ShieldAlert, Sparkles } from 'lucide-react';
import { ApiKeyItem, CreatedApiKeyResponse, api } from '../../api/client';
import { formatNaira, formatDate } from '../../utils/formatters';

interface KeyManagerProps {
  keys: ApiKeyItem[];
  onRefresh: () => void;
}

export const KeyManager: React.FC<KeyManagerProps> = ({ keys, onRefresh }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  
  // Secret Reveal Modal (shown exactly once!)
  const [secretResult, setSecretResult] = useState<CreatedApiKeyResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setKeyError(null);

    try {
      const limitVal = monthlyLimit ? parseFloat(monthlyLimit) : undefined;
      const res = await api.createKey(name, limitVal);
      setSecretResult(res);
      setIsCreateOpen(false);
      setName('');
      setMonthlyLimit('');
      onRefresh();
    } catch (err: any) {
      setKeyError(err.message || 'Failed to create key');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      setKeyError(null);
      await api.toggleKey(id);
      onRefresh();
    } catch (err: any) {
      setKeyError(err.message || 'Failed to update key status');
    }
  };

  const confirmRevokeKey = async () => {
    if (!keyToRevoke) return;
    try {
      setKeyError(null);
      await api.deleteKey(keyToRevoke);
      setKeyToRevoke(null);
      onRefresh();
    } catch (err: any) {
      setKeyError(err.message || 'Failed to revoke key');
    }
  };

  const copySecret = () => {
    if (secretResult) {
      navigator.clipboard.writeText(secretResult.secret_key);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Inline Error Banner */}
      {keyError && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-center justify-between">
          <span>{keyError}</span>
          <button onClick={() => setKeyError(null)} className="text-red-400 hover:text-white font-bold ml-3">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-white">
            API Key Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Keys authenticate your calls to <code className="text-emerald-400 font-mono">https://api.indunixai.com/v1</code>. Do not share your secret keys in public client applications.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Keys Table Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Key Name</th>
                <th className="py-3.5 px-6">Prefix Identifier</th>
                <th className="py-3.5 px-6">Spend This Month</th>
                <th className="py-3.5 px-6">Spend Ceiling</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Created</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No API keys generated yet. Click "Generate New API Key" above.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {k.name}
                    </td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">
                      {k.key_prefix}...
                    </td>
                    <td className="py-4 px-6">
                      {formatNaira(k.current_month_spend_ngn)}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {k.monthly_spend_limit_ngn ? formatNaira(k.monthly_spend_limit_ngn) : 'Unlimited'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        k.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {k.is_active ? 'ACTIVE' : 'REVOKED'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {formatDate(k.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleToggle(k.id)}
                        title={k.is_active ? 'Disable Key' : 'Enable Key'}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setKeyToRevoke(k.id)}
                        title="Delete Key Permanently"
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-400 hover:text-red-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create API Key */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0E131F] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-heading text-xl font-bold text-white mb-1">
              Generate Indunix API Key
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Create a secret key for backend microservices or IDE integration.
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Key Friendly Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="API Key Name"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Monthly Spend Ceiling (NGN, Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="Monthly limit in Naira (Leave blank for unlimited)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Prevents unexpected usage beyond this Naira limit.
                </span>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  {loading ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Secret Reveal (SHOWN EXACTLY ONCE!) */}
      {secretResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E131F] border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Save Your Secret Key Now
                </h3>
                <p className="text-xs text-amber-300/90">
                  {secretResult.warning}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                Full Secret API Key (Bearer Token)
              </span>
              <div className="flex items-center justify-between gap-3 font-mono text-xs text-emerald-400 bg-slate-900 p-3 rounded-lg select-all break-all">
                <span>{secretResult.secret_key}</span>
                <button
                  onClick={copySecret}
                  className="shrink-0 p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-md transition-colors"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300">
              ⚠️ For security reasons, Indunix stores only the SHA-256 cryptographic hash of this key. If you lose this key, you will have to generate a new one.
            </div>

            <button
              onClick={() => setSecretResult(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
            >
              I Have Saved My Secret Key Securely
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirm Key Revocation */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0E131F] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-heading text-lg font-bold text-white">Revoke API Key?</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Any application or script using this API key will immediately receive 401 Unauthorized responses. This action cannot be reversed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setKeyToRevoke(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Keep Key
              </button>
              <button
                type="button"
                onClick={confirmRevokeKey}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30"
              >
                Revoke Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
