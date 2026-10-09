import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  PlusCircle,
  Copy,
  Check,
  Building,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { TransactionItem, Wallet, api } from '../../api/client';
import { formatNaira, formatDate } from '../../utils/formatters';
import { downloadPdfReceipt } from '../../utils/receiptGenerator';

interface BillingViewProps {
  transactions: TransactionItem[];
  wallet: Wallet | null;
  onOpenDeposit: () => void;
  onRefresh: () => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  transactions,
  wallet,
  onOpenDeposit,
  onRefresh,
}) => {
  const [virtualAccount, setVirtualAccount] = useState<{
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    currency?: string;
    is_assigned?: boolean;
    requires_kyc?: boolean;
    error?: string;
  } | null>(null);
  const [loadingVirtual, setLoadingVirtual] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  useEffect(() => {
    loadVirtualAccount();
  }, []);

  const loadVirtualAccount = async () => {
    setLoadingVirtual(true);
    try {
      const data = await api.getVirtualAccount();
      setVirtualAccount(data);
    } catch {
      // ignore
    } finally {
      setLoadingVirtual(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleDownloadPdf = (tx: TransactionItem) => {
    downloadPdfReceipt({
      reference: tx.reference,
      amount_ngn: tx.amount_ngn,
      channel: tx.channel,
      date: formatDate(tx.created_at),
      status: tx.status,
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-white">
            Billing & Naira Payments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Prepaid credit transactions and dedicated NUBAN settlements.
          </p>
        </div>

        <button
          onClick={onOpenDeposit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Deposit Naira Credits</span>
        </button>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400">Total Available Balance</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white clean-nums mt-1">
            {wallet ? formatNaira(wallet.total_available_ngn) : '₦1,000.00'}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            Combined cash & promo credits
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400">Cash Deposit Balance</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 clean-nums mt-1">
            {wallet ? formatNaira(wallet.balance_ngn) : '₦0.00'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Prepaid in Naira
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400">Sign-up Promo Credits</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 clean-nums mt-1">
            {wallet ? formatNaira(wallet.bonus_credits_ngn) : '₦1,000.00'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Auto-granted upon registration
          </span>
        </div>
      </div>

      {/* Dedicated Virtual NUBAN Account Card */}
      {virtualAccount?.account_number && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0C1220] to-slate-950 border border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <span>Dedicated Bank Transfer Account</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active NUBAN
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Transfer to this dedicated account to credit your wallet instantly.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenDeposit}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Instant Card/USSD Deposit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">Bank Name</span>
              <span className="text-sm font-bold text-white">{virtualAccount.bank_name || 'Wema Bank'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">Account Number</span>
                <span className="text-lg font-bold text-emerald-400 clean-nums tracking-wider">
                  {virtualAccount.account_number}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(virtualAccount.account_number || '')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy Account Number"
              >
                {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">Beneficiary Name</span>
              <span className="text-sm font-bold text-slate-200 truncate block">
                {virtualAccount.account_name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-white">
            Payment & Top-Up Ledger
          </h3>
          <span className="text-xs text-slate-400 clean-nums">
            {transactions.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Reference ID</th>
                <th className="py-3 px-6">Amount (NGN)</th>
                <th className="py-3 px-6">Channel</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-6 text-slate-400 clean-nums">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="py-4 px-6 text-white font-semibold clean-nums">
                      {tx.reference}
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-400 clean-nums">
                      {formatNaira(tx.amount_ngn)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {tx.channel}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : tx.status === 'PENDING'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {tx.status === 'SUCCESS' ? (
                        <button
                          onClick={() => handleDownloadPdf(tx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF Receipt</span>
                        </button>
                      ) : (
                        <button
                          onClick={onOpenDeposit}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Payment</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
