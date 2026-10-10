import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { api, User } from '../../api/client';
import { formatNaira } from '../../utils/formatters';
import { downloadPdfReceipt } from '../../utils/receiptGenerator';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<'checkout' | 'virtual_account'>('checkout');
  const [amount, setAmount] = useState<number>(5000);
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  // Dedicated Virtual Account state
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

  // KYC provisioning fields if required by Paystack
  const [phone, setPhone] = useState<string>('');
  const [ninOrBvn, setNinOrBvn] = useState<string>('');
  const [provisioning, setProvisioning] = useState<boolean>(false);

  // Transaction verification & confirmation state
  const [pendingTx, setPendingTx] = useState<{
    reference: string;
    authorization_url: string;
    amount_ngn: number;
    public_key?: string;
  } | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ amount: number; reference: string } | null>(null);

  // Preset amounts
  const presetAmounts = [2500, 5000, 10000, 25000, 50000];

  // Keyboard accessibility: Escape to close, Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (!loading && !verifying && !pendingTx && !successInfo && activeTab === 'checkout') {
          handlePaystackCheckout();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, activeTab, loading, verifying, pendingTx, successInfo, amount]);

  // Auto-poll transaction status every 4 seconds while pendingTx is active
  useEffect(() => {
    if (!pendingTx || successInfo) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.verifyTransaction(pendingTx.reference);
        if (res.status === 'success') {
          setSuccessInfo({
            amount: res.amount_ngn || pendingTx.amount_ngn,
            reference: pendingTx.reference,
          });
          setPendingTx(null);
          onSuccess();
        }
      } catch {
        // Continue polling silently
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [pendingTx, successInfo, onSuccess]);

  // Fetch virtual account when switching to Virtual Account tab
  useEffect(() => {
    if (isOpen && activeTab === 'virtual_account' && !virtualAccount) {
      loadVirtualAccount();
    }
  }, [isOpen, activeTab]);

  const loadVirtualAccount = async () => {
    setLoadingVirtual(true);
    setError(null);
    try {
      const data = await api.getVirtualAccount();
      setVirtualAccount(data);
      if (data.error && !data.requires_kyc) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to fetch dedicated virtual account');
    } finally {
      setLoadingVirtual(false);
    }
  };

  const handleProvisionKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid Nigerian phone number (e.g. 08038984606).');
      return;
    }
    if (!ninOrBvn || ninOrBvn.trim().length < 11) {
      setError('Please provide a valid 11-digit NIN or BVN.');
      return;
    }
    setProvisioning(true);
    setError(null);
    try {
      const res = await api.provisionVirtualAccount({
        phone: phone.trim(),
        nin_or_bvn: ninOrBvn.trim(),
      });
      setVirtualAccount(res);
      if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to provision dedicated account with Paystack.');
    } finally {
      setProvisioning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const [syncingTransfers, setSyncingTransfers] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [manualTransferRef, setManualTransferRef] = useState('');

  const handleSyncTransfers = async (refOverride?: string) => {
    setSyncingTransfers(true);
    setSyncNotice(null);
    setError(null);
    try {
      const targetRef = refOverride !== undefined ? refOverride : (manualTransferRef.trim() || undefined);
      const res = await api.syncBankTransfers(targetRef);
      if (res.status === 'success') {
        if (res.credited_count > 0) {
          setSyncNotice(res.message || `Successfully credited ${res.credited_count} transfer(s) (+₦${res.total_credited_ngn.toLocaleString()}) to your wallet!`);
          setManualTransferRef('');
          onSuccess();
        } else {
          setSyncNotice(res.message || 'All bank transfers are up to date. No pending uncredited transfers found.');
          onSuccess();
        }
      } else {
        setError(res.message || 'Could not locate or credit transfer with this reference.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to sync bank transfers at this time.');
    } finally {
      setSyncingTransfers(false);
    }
  };

  // Launch Paystack in New Tab and await confirmation
  const handlePaystackCheckout = async () => {
    if (amount < 1000) {
      setError('Minimum deposit is ₦1,000.00');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const initRes = await api.initializeDeposit(amount, 'CARD');
      setPendingTx(initRes);
      setLoading(false);

      if (initRes.authorization_url) {
        // Open Paystack checkout directly in a new tab without white-screen iframe issues
        window.open(initRes.authorization_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setError(err.message || 'Payment initialization failed');
      setLoading(false);
    }
  };

  // Strictly verify transaction with Paystack API
  const handleVerifyPayment = async (reference: string, expectedAmount: number) => {
    setVerifying(true);
    setError(null);
    try {
      const res = await api.verifyTransaction(reference);
      if (res.status === 'success') {
        setSuccessInfo({
          amount: res.amount_ngn || expectedAmount,
          reference: reference,
        });
        setPendingTx(null);
        onSuccess();
      } else {
        setError(res.error || res.message || 'Payment confirmation has not yet been received from Paystack.');
      }
    } catch (err: any) {
      setError(err.message || 'Transaction verification check error. Please retry in a few moments.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0E131F] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
          title="Close (Esc)"
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
              Successfully credited <span className="font-bold text-emerald-400 clean-nums">{formatNaira(successInfo.amount)}</span> to your Indunix wallet.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 text-xs font-mono text-slate-400 border border-slate-800 clean-nums">
              Reference: {successInfo.reference}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() =>
                  downloadPdfReceipt({
                    reference: successInfo.reference,
                    amount_ngn: successInfo.amount,
                    customerName: user?.full_name,
                    customerEmail: user?.email,
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Official PDF Receipt</span>
              </button>

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
          </div>
        ) : pendingTx ? (
          <div className="py-4 space-y-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-white">
                Payment Session Active
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Paystack checkout has opened in a new tab. Complete your payment and your wallet will credit automatically.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2 clean-nums">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Due:</span>
                <span className="text-white font-bold">{formatNaira(pendingTx.amount_ngn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Reference:</span>
                <span className="text-emerald-400 font-mono text-[11px]">{pendingTx.reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Gateway Status:</span>
                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block"></span>
                  Listening for Settlement...
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {pendingTx.authorization_url && (
                <button
                  type="button"
                  onClick={() => window.open(pendingTx.authorization_url, '_blank', 'noopener,noreferrer')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Reopen Paystack Checkout in New Tab</span>
                </button>
              )}

              <button
                onClick={() => handleVerifyPayment(pendingTx.reference, pendingTx.amount_ngn)}
                disabled={verifying}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Paystack...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>I Have Completed Payment — Verify Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPendingTx(null);
                  setError(null);
                }}
                className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 font-medium text-xs transition-all"
              >
                Cancel or Choose Another Amount
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="text-center mb-5">
              <h3 className="font-heading text-2xl font-bold text-white">
                Add Funds to Naira Wallet
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero FX conversion charges. Automated wallet credits and instant invoice delivery.
              </p>
            </div>

            {/* Deposit Method Tabs */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
              <button
                onClick={() => setActiveTab('checkout')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'checkout'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Instant Checkout</span>
              </button>
              <button
                onClick={() => setActiveTab('virtual_account')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'virtual_account'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Dedicated Virtual NUBAN</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: PAYSTACK INSTANT CHECKOUT */}
            {activeTab === 'checkout' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Select Deposit Amount (NGN)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {presetAmounts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAmount(p)}
                        className={`py-2 px-1 text-xs clean-nums font-bold rounded-lg border transition-all ${
                          amount === p
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        ₦{p.toLocaleString()}.00
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm clean-nums text-slate-400">₦</span>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="Custom amount"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm clean-nums text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 clean-nums mt-1 block">
                    Minimum deposit: ₦1,000.00
                  </span>
                </div>

                {/* Instant Checkout Button */}
                <button
                  onClick={handlePaystackCheckout}
                  disabled={loading || amount < 1000}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <span>Pay {formatNaira(amount)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-500">
                  Online payments
                </p>
              </div>
            )}

            {/* TAB 2: DEDICATED VIRTUAL ACCOUNT (BANK TRANSFER) */}
            {activeTab === 'virtual_account' && (
              <div className="space-y-4">
                {loadingVirtual ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                    <p className="text-xs">Fetching dedicated virtual account...</p>
                  </div>
                ) : virtualAccount?.account_number ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs text-slate-400">Assigned Bank</span>
                        <span className="text-xs font-bold text-white">{virtualAccount.bank_name || 'Wema Bank'}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs text-slate-400">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-base clean-nums font-bold text-emerald-400 tracking-wider">
                            {virtualAccount.account_number}
                          </span>
                          <button
                            onClick={() => copyToClipboard(virtualAccount.account_number || '')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Copy Account Number"
                          >
                            {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Beneficiary Name</span>
                        <span className="text-xs font-bold text-slate-200">{virtualAccount.account_name}</span>
                      </div>
                    </div>

                    {syncNotice && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{syncNotice}</span>
                      </div>
                    )}

                    {/* Optional Reference Verification */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-300">Transferred Already? (Optional Reference)</span>
                        <span className="text-[10px] text-slate-500">Paystack / Bank Ref</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualTransferRef}
                          onChange={(e) => setManualTransferRef(e.target.value)}
                          placeholder="e.g. T4891029482 or Session ID"
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSyncTransfers(manualTransferRef.trim())}
                          disabled={syncingTransfers || !manualTransferRef.trim()}
                          className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-40 whitespace-nowrap"
                        >
                          Verify Ref
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSyncTransfers()}
                        disabled={syncingTransfers}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncingTransfers ? 'animate-spin' : ''}`} />
                        <span>{syncingTransfers ? 'Checking for Bank Transfers...' : 'Auto-Sync & Credit Recent Transfers'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={onSuccess}
                        className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 font-medium text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Done & Return to Console</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Provisioning KYC Form if Paystack requires identification */
                  <form onSubmit={handleProvisionKYC} className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Request Dedicated Virtual Account (NUBAN)</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        To generate an official dedicated Nigerian bank account under CBN guidelines, enter your phone and NIN or BVN.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        required
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs clean-nums text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        National Identity Number (NIN) or BVN (11 Digits)
                      </label>
                      <input
                        type="text"
                        maxLength={11}
                        value={ninOrBvn}
                        onChange={(e) => setNinOrBvn(e.target.value)}
                        placeholder="11-digit NIN or BVN"
                        required
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs clean-nums text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={provisioning || !ninOrBvn}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                    >
                      {provisioning ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                      ) : (
                        <span>Generate Dedicated NUBAN</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
