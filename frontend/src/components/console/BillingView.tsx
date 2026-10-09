import React from 'react';
import { CreditCard, Download, PlusCircle, CheckCircle, Clock, ShieldCheck, FileText } from 'lucide-react';
import { TransactionItem, Wallet } from '../../api/client';
import { formatNaira, formatDate } from '../../utils/formatters';

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
  const downloadReceipt = (tx: TransactionItem) => {
    // Generates a formatted text receipt for corporate expense reports
    const receiptContent = `=====================================================
            INDUNIX AI TECHNOLOGIES LIMITED
       OFFICIAL PAYMENT RECEIPT & TAX INVOICE
=====================================================
Receipt Reference: ${tx.reference}
Date:              ${formatDate(tx.created_at)}
Settlement Method: Instant Pay in Naira (NGN Sovereign)
Payment Channel:   ${tx.channel}
Payment Status:    ${tx.status}

-----------------------------------------------------
Item Description:
Indunix Sovereign AI Prepaid API Computing Credits
-----------------------------------------------------
Amount Paid:       ${formatNaira(tx.amount_ngn)}
VAT (7.5% Incl.):  ${formatNaira(tx.amount_ngn * 0.075)}
Settlement Engine: api.indunixai.com
Merchant:          Indunix AI Technologies Ltd
Corporate Address: Victoria Island, Lagos, Nigeria
=====================================================
`;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Indunix_Receipt_${tx.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
            Prepaid credit transactions processed directly with Pay in Naira.
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
          <span className="text-xs font-mono text-slate-400">Total Available Balance</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
            {wallet ? formatNaira(wallet.total_available_ngn) : '₦1,000.00'}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            Combined cash & promo credits
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-mono text-slate-400">Cash Deposit Balance</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 font-mono mt-1">
            {wallet ? formatNaira(wallet.balance_ngn) : '₦0.00'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Prepaid in Naira
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-mono text-slate-400">Sign-up Promo Credits</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            {wallet ? formatNaira(wallet.bonus_credits_ngn) : '₦1,000.00'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Auto-granted upon registration
          </span>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-white">
            Payment & Top-Up Ledger
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {transactions.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Reference ID</th>
                <th className="py-3 px-6">Amount (NGN)</th>
                <th className="py-3 px-6">Channel</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Receipt</th>
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
                    <td className="py-4 px-6 text-slate-400">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="py-4 px-6 text-white font-semibold">
                      {tx.reference}
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-400">
                      {formatNaira(tx.amount_ngn)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {tx.channel}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : tx.status === 'PENDING'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {tx.status === 'SUCCESS' && (
                        <button
                          onClick={() => downloadReceipt(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt</span>
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
