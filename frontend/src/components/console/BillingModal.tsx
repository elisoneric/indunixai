import React, { useState } from 'react';
import { X, CreditCard, Building, Smartphone, CheckCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { formatNaira } from '../../utils/formatters';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(5000);
  const [channel, setChannel] = useState<string>('CARD');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ amount: number; reference: string } | null>(null);

  if (!isOpen) return null;

  const presetAmounts = [2500, 5000, 10000, 25000, 50000];

  const handleDeposit = async () => {
    if (amount < 1000) {
      setError('Minimum deposit is ₦1,000');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Initialize Naira deposit
      const initRes = await api.initializeDeposit(amount, channel);
      
      // 2. In demo environment, execute instant simulated verification so wallet updates immediately!
      await api.verifyDemoDeposit(initRes.reference);

      setSuccessInfo({
        amount: initRes.amount_ngn,
        reference: initRes.reference,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Deposit initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0E131F] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {successInfo ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white">
              Naira Deposit Confirmed!
            </h3>
            <p className="text-sm text-slate-300">
              Successfully credited <span className="font-bold text-emerald-400">{formatNaira(successInfo.amount)}</span> to your Indunix wallet.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 text-xs font-mono text-slate-400 border border-slate-800">
              Reference: {successInfo.reference}
            </div>
            <button
              onClick={() => {
                setSuccessInfo(null);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
            >
              Done & Return to Console
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-2 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Instant Pay in Naira (NGN)</span>
              </div>
              <h3 className="font-heading text-2xl font-bold text-white">
                Top Up Naira Wallet
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Prepaid credits never expire. Usable across all Indunix model tiers.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Quick Amount Select */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Select Amount (NGN)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`py-2 px-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                      amount === p
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ₦{p.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-mono text-slate-400">₦</span>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Custom amount"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                Minimum deposit: ₦1,000.00
              </span>
            </div>

            {/* Payment Channel */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'CARD', label: 'Debit Cards (Mastercard, Visa, Verve)', icon: CreditCard },
                  { id: 'BANK_TRANSFER', label: 'Direct Bank Transfer', icon: Building },
                  { id: 'USSD', label: 'USSD Quick Dial', icon: Smartphone },
                  { id: 'OPAY', label: 'OPay Wallet & Mobile', icon: Zap },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChannel(item.id)}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        channel === item.id
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleDeposit}
              disabled={loading || amount < 1000}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>Pay {formatNaira(amount)} in Naira</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
