import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  User as UserIcon,
  Users,
  Coins,
  DollarSign,
  Tag,
  Key,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  PlusCircle,
  TrendingUp,
  Cpu,
  Server,
  LogOut,
  ArrowLeft,
  Sliders,
  Send,
  Eye,
  EyeOff,
  Sparkles,
  Percent,
  Clock,
  Megaphone,
  CreditCard,
  Building,
  ArrowUpRight,
  Wallet,
  Scale,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import {
  api,
  User,
  AdminUserItem,
  AdminPromoCampaigns,
  AdminModelPricingItem,
  AdminFinancialReport,
  DeepSeekLiveBalance,
} from '../../api/client';
import { formatNaira } from '../../utils/formatters';

interface AdminPageProps {
  onNavigateHome: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateHome }) => {
  // Authentication & Security Gate State
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('indunix_admin_token'));
  const [adminUser, setAdminUser] = useState<User | null>(() => api.getAdminUser());
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState<string>('indunixai');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Password Change Form
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [changePasswordLoading, setChangePasswordLoading] = useState<boolean>(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'metrics' | 'financials' | 'users' | 'pricing' | 'promos' | 'gateway'>('metrics');

  // Financials & Economics State
  const [financials, setFinancials] = useState<AdminFinancialReport | null>(null);
  const [financialsLoading, setFinancialsLoading] = useState<boolean>(false);
  const [savingFeePolicy, setSavingFeePolicy] = useState<boolean>(false);
  const [feeStrategy, setFeeStrategy] = useState<'absorb' | 'pass_through'>('absorb');
  const [feePercent, setFeePercent] = useState<number>(1.5);
  const [flatFeeNgn, setFlatFeeNgn] = useState<number>(100.0);
  const [feeCapNgn, setFeeCapNgn] = useState<number>(2000.0);
  const [fxRate, setFxRate] = useState<number>(1500.0);
  const [pingingDeepSeek, setPingingDeepSeek] = useState<boolean>(false);

  // Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(false);

  // Users Management
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [userSearch, setUserSearch] = useState<string>('');
  const [usersLoading, setUsersLoading] = useState<boolean>(false);

  // Credit Adjustment Modal
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<AdminUserItem | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>('5000');
  const [creditType, setCreditType] = useState<'bonus' | 'cash'>('bonus');
  const [creditReason, setCreditReason] = useState<string>('Enterprise promotional token grant');
  const [creditNotify, setCreditNotify] = useState<boolean>(true);
  const [adjustingCredit, setAdjustingCredit] = useState<boolean>(false);

  // Model Pricing
  const [pricing, setPricing] = useState<Record<string, AdminModelPricingItem>>({});
  const [pricingSaving, setPricingSaving] = useState<boolean>(false);

  // Promotions & Campaigns
  const [promos, setPromos] = useState<AdminPromoCampaigns>({
    signup_bonus_ngn: 1000.0,
    sale_active: false,
    sale_title: 'Independence Day AI Fest',
    sale_discount_percent: 0,
    sale_ends_at: '',
    banner_active: false,
    banner_text: '',
  });
  const [promosSaving, setPromosSaving] = useState<boolean>(false);

  // Gateway Keys
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [paystackSecret, setPaystackSecret] = useState<string>('');
  const [paystackPublic, setPaystackPublic] = useState<string>('');
  const [deepseekKey, setDeepseekKey] = useState<string>('');
  const [groqKey, setGroqKey] = useState<string>('');
  const [togetherKey, setTogetherKey] = useState<string>('');
  const [liveMode, setLiveMode] = useState<boolean>(false);
  const [gatewaySaving, setGatewaySaving] = useState<boolean>(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Check initial state
  useEffect(() => {
    if (adminUser?.must_change_password) {
      setMustChangePassword(true);
    } else if (adminToken) {
      loadAllAdminData();
    }
  }, [adminToken]);

  const loadAllAdminData = async () => {
    loadMetrics();
    loadFinancials();
    loadUsers();
    loadPricing();
    loadPromos();
    loadGatewayConfig();
  };

  const loadFinancials = async () => {
    setFinancialsLoading(true);
    try {
      const res = await api.getAdminFinancials();
      setFinancials(res);
      if (res.deposit_fee_settings) {
        setFeeStrategy(res.deposit_fee_settings.fee_strategy);
        setFeePercent(res.deposit_fee_settings.fee_percent);
        setFlatFeeNgn(res.deposit_fee_settings.flat_fee_ngn);
        setFeeCapNgn(res.deposit_fee_settings.fee_cap_ngn);
        setFxRate(res.deposit_fee_settings.fx_rate_usd_ngn);
      }
    } catch {
      // Ignored
    } finally {
      setFinancialsLoading(false);
    }
  };

  const handleSaveFeePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFeePolicy(true);
    try {
      await api.updateDepositFeeSettings({
        fee_strategy: feeStrategy,
        fee_percent: Number(feePercent),
        flat_fee_ngn: Number(flatFeeNgn),
        fee_cap_ngn: Number(feeCapNgn),
        fx_rate_usd_ngn: Number(fxRate),
      });
      showToast('success', `Deposit fee policy updated to ${feeStrategy === 'absorb' ? 'Absorb from Margin' : 'Pass-through to User'}.`);
      loadFinancials();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update fee policy');
    } finally {
      setSavingFeePolicy(false);
    }
  };

  const handlePingDeepSeek = async () => {
    setPingingDeepSeek(true);
    try {
      const liveBal = await api.refreshDeepSeekBalance();
      if (financials) {
        setFinancials({
          ...financials,
          deepseek_balance: liveBal,
          solvency_coverage_ratio: financials.user_liabilities_ngn > 0 ? Number((liveBal.balance_ngn / financials.user_liabilities_ngn).toFixed(2)) : 1.0,
        });
      }
      showToast('success', `DeepSeek ping: ${liveBal.message} ($${liveBal.total_balance.toFixed(2)} USD)`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to ping DeepSeek balance');
    } finally {
      setPingingDeepSeek(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await api.adminLogin({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });
      setAdminToken(res.access_token);
      setAdminUser(res.user);
      if (res.must_change_password) {
        setMustChangePassword(true);
      } else {
        setMustChangePassword(false);
        loadAllAdminData();
      }
    } catch (err: any) {
      setLoginError(err.message || 'Administrator login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setChangePasswordError('New password must contain at least 8 characters.');
      return;
    }
    if (newPassword === 'Password@26') {
      setChangePasswordError('Password cannot match the temporary default credential.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('Password and confirmation do not match.');
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError(null);
    try {
      const res = await api.adminChangeInitialPassword({ new_password: newPassword });
      setAdminToken(res.access_token);
      setAdminUser(res.user);
      setMustChangePassword(false);
      showToast('success', 'Security gate cleared. Permanent administrator password set.');
      loadAllAdminData();
    } catch (err: any) {
      setChangePasswordError(err.message || 'Password update failed.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleAdminLogout = () => {
    api.adminLogout();
    setAdminToken(null);
    setAdminUser(null);
    setMustChangePassword(false);
  };

  // Load Metrics
  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await api.getAdminMetrics();
      setMetrics(res);
    } catch {
      // Ignored
    } finally {
      setMetricsLoading(false);
    }
  };

  // Load Users
  const loadUsers = async (searchQuery = userSearch) => {
    setUsersLoading(true);
    try {
      const res = await api.getAdminUsers(searchQuery);
      setUsers(res.users);
      setTotalUsers(res.total);
    } catch {
      // Ignored
    } finally {
      setUsersLoading(false);
    }
  };

  // Load Pricing
  const loadPricing = async () => {
    try {
      const res = await api.getAdminPricing();
      setPricing(res.pricing || {});
    } catch {
      // Ignored
    }
  };

  // Save Pricing
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingSaving(true);
    try {
      await api.updateAdminPricing(pricing);
      showToast('success', 'Model pricing rate card updated and persisted.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update pricing');
    } finally {
      setPricingSaving(false);
    }
  };

  // Load Promos
  const loadPromos = async () => {
    try {
      const res = await api.getAdminPromos();
      setPromos(res);
    } catch {
      // Ignored
    }
  };

  // Save Promos
  const handleSavePromos = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromosSaving(true);
    try {
      const updated = await api.updateAdminPromos(promos);
      setPromos(updated);
      showToast('success', 'Promotional campaigns and bonuses updated.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update promotions');
    } finally {
      setPromosSaving(false);
    }
  };

  // Load Gateway Config
  const loadGatewayConfig = async () => {
    try {
      const res = await api.getAdminConfig();
      setGatewayConfig(res);
      setLiveMode(res.upstream?.live_production_mode ?? false);
    } catch {
      // Ignored
    }
  };

  // Save Gateway Config
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewaySaving(true);
    try {
      await api.updateAdminConfig({
        paystack_secret_key: paystackSecret.trim() || undefined,
        paystack_public_key: paystackPublic.trim() || undefined,
        deepseek_api_key: deepseekKey.trim() || undefined,
        groq_api_key: groqKey.trim() || undefined,
        together_api_key: togetherKey.trim() || undefined,
        live_production_mode: liveMode,
      });
      setPaystackSecret('');
      setDeepseekKey('');
      setGroqKey('');
      setTogetherKey('');
      await loadGatewayConfig();
      showToast('success', 'Gateway keys and provider credentials updated.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update gateway credentials');
    } finally {
      setGatewaySaving(false);
    }
  };

  // Adjust User Credits
  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCredit) return;
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('error', 'Enter a valid positive Naira amount.');
      return;
    }

    setAdjustingCredit(true);
    try {
      await api.adminAdjustCredits(selectedUserForCredit.id, {
        amount_ngn: amount,
        credit_type: creditType,
        reason: creditReason.trim() || 'Admin manual credit grant',
        notify_user: creditNotify,
      });
      showToast('success', `₦${amount.toLocaleString()} ${creditType} granted to ${selectedUserForCredit.email}.`);
      setSelectedUserForCredit(null);
      loadUsers();
      loadMetrics();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to adjust user credits.');
    } finally {
      setAdjustingCredit(false);
    }
  };

  // Toggle user freeze
  const handleToggleFreeze = async (userItem: AdminUserItem) => {
    try {
      await api.adminUpdateUserStatus(userItem.id, { is_frozen: !userItem.is_frozen });
      showToast('success', `User wallet ${!userItem.is_frozen ? 'frozen' : 'unfrozen'}.`);
      loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to toggle status.');
    }
  };

  // -------------------------------------------------------------
  // View 1: Admin Login Gate
  // -------------------------------------------------------------
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center p-4 relative selection:bg-emerald-500 selection:text-black">
        {/* Subtle background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-4 shadow-xl">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight">
              INDUNIX<span className="text-emerald-400">.AI</span> CONTROL
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Master System Administration Console
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-2xl backdrop-blur-md">
            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Administrator Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none transition-colors"
                    placeholder="indunixai or admin@indunixai.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Administrator Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none transition-colors"
                    placeholder="Enter security password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                <span>Authorize & Access Admin Console</span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <button
                onClick={onNavigateHome}
                className="hover:text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Site</span>
              </button>
              <span>Encrypted Session • HMAC SHA-512</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // View 2: Enforced First-Login Password Change Gate
  // -------------------------------------------------------------
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center p-4 relative selection:bg-amber-500 selection:text-black">
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-4 shadow-xl">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight">
              MANDATORY SECURITY GATE
            </h1>
            <p className="text-xs text-amber-300/80 mt-1 uppercase tracking-wider font-semibold">
              Initial Login Password Update Required
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#0D121F] border border-amber-500/30 shadow-2xl backdrop-blur-md">
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Default system deployment credentials detected for administrator <strong>indunixai</strong>. You must establish a new private administrator password before proceeding to platform controls.
            </p>

            {changePasswordError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{changePasswordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Administrator Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none transition-colors"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs outline-none transition-colors"
                  placeholder="Re-enter new administrator password"
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordLoading}
                className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {changePasswordLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Set Password & Unlock System</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <button
                onClick={handleAdminLogout}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Sign out and return later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // View 3: Complete Administrative Console Dashboard
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#07090E] text-[#F8FAFC] flex flex-col">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xl border ${
              toastMsg.type === 'success'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-red-500 text-white border-red-400'
            }`}
          >
            {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="h-16 px-6 border-b border-slate-800/80 bg-[#0A0E18] flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base tracking-tight text-white">
                  INDUNIX<span className="text-emerald-400">.AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  SYSTEM ADMIN
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                Sovereign Infrastructure Control Hub
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            title="Public Site"
            className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors hidden sm:flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </button>

          <button
            onClick={loadAllAdminData}
            title="Reload System Telemetry"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">indunixai</div>
              <div className="text-[10px] text-emerald-400">SUPERADMIN</div>
            </div>
            <button
              onClick={handleAdminLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-5 sm:p-8 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          {[
            { id: 'metrics', label: 'Platform Telemetry', icon: TrendingUp },
            { id: 'financials', label: 'Financials & Revenue', icon: DollarSign },
            { id: 'users', label: 'User Ledger & Credits', icon: Users },
            { id: 'pricing', label: 'Model Pricing Control', icon: Sliders },
            { id: 'promos', label: 'Promos & Campaign Engine', icon: Megaphone },
            { id: 'gateway', label: 'Gateway Keys & Providers', icon: Key },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isSel
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Panes */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-white">Platform Infrastructure Telemetry</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time ledger overview, sovereign request load, and active token metering across Nigeria.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Total Registered Users</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white clean-nums">
                    {metrics ? metrics.total_users.toLocaleString() : '...'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Verified developer accounts</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Total Ledger Balance (NGN)</span>
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 clean-nums">
                    {metrics ? formatNaira(metrics.total_ledger_balance_ngn) : '...'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Live customer deposited wallet funds</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Promotional Credits Issued</span>
                    <Tag className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-300 clean-nums">
                    {metrics ? formatNaira(metrics.total_bonus_issued_ngn) : '...'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Starter grants & admin bonuses active</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Metered Tokens Processed</span>
                    <Activity className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-white clean-nums">
                    {metrics ? metrics.total_tokens_metered.toLocaleString() : '...'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Prompt and completion tokens metered</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Total Gateway Inferences</span>
                    <Cpu className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white clean-nums">
                    {metrics ? metrics.total_requests_served.toLocaleString() : '...'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Sub-second inference executions</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Active Production Engine</span>
                    <Server className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-300">
                    {metrics?.live_production_mode ? 'Sovereign Live' : 'Sandbox Routing'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Upstream inference pipeline status</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANCIALS & REVENUE UNIT ECONOMICS */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-bold text-white">Financial Inflows, Revenue & Economics</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Live cash inflow accounting, Paystack transaction fees, wholesale API provider costs, and net profit margins.
                  </p>
                </div>

                <button
                  onClick={loadFinancials}
                  disabled={financialsLoading}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${financialsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Financials</span>
                </button>
              </div>

              {/* Top 5 High-Level Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* 1. Gross Inflow */}
                <div className="p-4 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Gross Cash Inflow</span>
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold text-white clean-nums">
                      {financials ? formatNaira(financials.gross_inflow_ngn) : '...'}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    {financials ? `${financials.deposit_count} deposits (Avg: ${formatNaira(financials.avg_deposit_amount_ngn)})` : 'Loading...'}
                  </div>
                </div>

                {/* 2. Gateway Fees */}
                <div className="p-4 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Gateway Fees (Paystack)</span>
                      <Receipt className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-amber-300 clean-nums">
                      {financials ? formatNaira(financials.gateway_fees_ngn) : '...'}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      financials?.deposit_fee_settings.fee_strategy === 'absorb'
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    }`}>
                      {financials?.deposit_fee_settings.fee_strategy === 'absorb' ? 'Absorbed by Indunix' : 'Paid by Users'}
                    </span>
                  </div>
                </div>

                {/* 3. Recognized Revenue */}
                <div className="p-4 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Recognized Revenue</span>
                      <Coins className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-xl font-bold text-sky-300 clean-nums">
                      {financials ? formatNaira(financials.recognized_revenue_ngn) : '...'}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    {financials ? `${financials.total_tokens_consumed.toLocaleString()} tokens billed` : 'From metered API usage'}
                  </div>
                </div>

                {/* 4. Upstream Wholesale Cost */}
                <div className="p-4 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Upstream COGS</span>
                      <Cpu className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-xl font-bold text-rose-300 clean-nums">
                      {financials ? formatNaira(financials.upstream_cogs_ngn) : '...'}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    {financials ? `$${financials.upstream_cogs_usd.toFixed(4)} USD @ ₦${financials.fx_rate_usd_ngn.toLocaleString()}/$` : 'DeepSeek/Groq provider cost'}
                  </div>
                </div>

                {/* 5. Net Profit & Margin */}
                <div className="p-4 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                      <span>Net Gross Profit</span>
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold text-emerald-400 clean-nums">
                      {financials ? formatNaira(financials.net_profit_ngn) : '...'}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {financials ? `${financials.net_margin_percent}% Net Margin` : '...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live DeepSeek Account Solvency & User Liabilities Card */}
              <div className="p-6 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-sm font-bold text-white">Live DeepSeek Upstream Account & Solvency</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          financials?.deepseek_balance.status === 'connected'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            financials?.deepseek_balance.status === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                          }`}></span>
                          {financials?.deepseek_balance.status === 'connected' ? 'Live API Connected' : 'Unset / Mock Sandbox'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Real-time upstream API balance query mapped against unspent user wallet liabilities.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handlePingDeepSeek}
                    disabled={pingingDeepSeek}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pingingDeepSeek ? 'animate-spin' : ''}`} />
                    <span>Ping DeepSeek API</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[11px] text-slate-400 block mb-1">DeepSeek Live Balance</span>
                    <div className="text-lg font-bold text-white clean-nums">
                      {financials ? `$${financials.deepseek_balance.total_balance.toFixed(2)} USD` : '...'}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-1">
                      ≈ {financials ? formatNaira(financials.deepseek_balance.balance_ngn) : '...'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[11px] text-slate-400 block mb-1">User Unspent Liabilities</span>
                    <div className="text-lg font-bold text-amber-300 clean-nums">
                      {financials ? formatNaira(financials.user_liabilities_ngn) : '...'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Total client cash sitting in wallets
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[11px] text-slate-400 block mb-1">Solvency Reserve Ratio</span>
                    <div className="text-lg font-bold text-purple-300 clean-nums">
                      {financials ? `${(financials.solvency_coverage_ratio * 100).toFixed(1)}%` : '...'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Upstream reserves vs total client deposits
                    </div>
                  </div>
                </div>

                {financials?.deepseek_balance.message && (
                  <p className="text-[11px] text-slate-500 font-mono">
                    Status: {financials.deepseek_balance.message}
                  </p>
                )}
              </div>

              {/* Deposit Fee Strategy Control */}
              <div className="p-6 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-heading text-sm font-bold text-white">Deposit Fee Accounting Policy</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure whether Paystack payment gateway fees are absorbed from profit margins or passed to the customer.
                  </p>
                </div>

                <form onSubmit={handleSaveFeePolicy} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Strategy Option A: Absorb */}
                    <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      feeStrategy === 'absorb'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="fee_strategy"
                        value="absorb"
                        checked={feeStrategy === 'absorb'}
                        onChange={() => setFeeStrategy('absorb')}
                        className="mt-1 text-emerald-500 focus:ring-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Absorb from Profit Margin</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                            Recommended for Growth
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Developers receive 100% of deposited Naira. Indunix AI absorbs the ~1.5% gateway fee from its ~80% token margin, eliminating user friction.
                        </p>
                      </div>
                    </label>

                    {/* Strategy Option B: Pass-Through */}
                    <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      feeStrategy === 'pass_through'
                        ? 'bg-blue-500/10 border-blue-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="fee_strategy"
                        value="pass_through"
                        checked={feeStrategy === 'pass_through'}
                        onChange={() => setFeeStrategy('pass_through')}
                        className="mt-1 text-blue-500 focus:ring-0"
                      />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white">Charge Gateway Fee to User</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Paystack gateway processing fee is deducted from the deposit or added at checkout, preserving 100% of Indunix token gross margin.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Fee Parameter Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Paystack Fee (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={feePercent}
                        onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Flat Fee (₦)
                      </label>
                      <input
                        type="number"
                        value={flatFeeNgn}
                        onChange={(e) => setFlatFeeNgn(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Fee Cap (₦)
                      </label>
                      <input
                        type="number"
                        value={feeCapNgn}
                        onChange={(e) => setFeeCapNgn(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        USD/NGN Exchange Benchmark (₦)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={fxRate}
                          onChange={(e) => setFxRate(parseFloat(e.target.value) || 1500)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={savingFeePolicy}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 transition-all flex items-center gap-1.5"
                        >
                          {savingFeePolicy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>Save Policy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Model-by-Model Unit Economics Table */}
              <div className="p-6 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-heading text-sm font-bold text-white">Model Unit Economics & Margin Breakdown</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Breakdown of retail Naira revenue vs upstream wholesale provider cost (DeepSeek) across sovereign models.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="py-3 px-4">Model Tier</th>
                        <th className="py-3 px-4">Inferences</th>
                        <th className="py-3 px-4">Tokens Metered</th>
                        <th className="py-3 px-4">Retail Revenue (Billed)</th>
                        <th className="py-3 px-4">Wholesale COGS (DeepSeek)</th>
                        <th className="py-3 px-4">Gross Profit</th>
                        <th className="py-3 px-4 text-right">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {financials?.model_economics && financials.model_economics.length > 0 ? (
                        financials.model_economics.map((item) => (
                          <tr key={item.model_id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white">{item.model_name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{item.model_id}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-300 clean-nums">
                              {item.requests.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-300 clean-nums">
                              {item.total_tokens.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-sky-400 font-bold clean-nums">
                              {formatNaira(item.retail_revenue_ngn)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-rose-400 clean-nums">
                              {formatNaira(item.upstream_cost_ngn)}
                              <span className="text-[10px] text-slate-500 ml-1">(${item.upstream_cost_usd.toFixed(4)})</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold clean-nums">
                              {formatNaira(item.gross_profit_ngn)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {item.margin_percent}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500">
                            No model inference data recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER LEDGER & BONUS CREDITS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-bold text-white">User Accounts & Wallet Ledgers</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage client wallets, issue promotional bonuses, or lock fraudulent developer keys.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        loadUsers(e.target.value);
                      }}
                      placeholder="Search email, name..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 w-52"
                    />
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl bg-[#0D121F] border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="py-3 px-4">User / Organization</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Available Funds</th>
                        <th className="py-3 px-4">Dedicated Account</th>
                        <th className="py-3 px-4">Keys / Tokens</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                            No users matched your query.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{u.full_name}</div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                              {u.company_name && (
                                <div className="text-[10px] text-slate-500">{u.company_name}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-emerald-400 clean-nums">
                                {formatNaira(u.total_available_ngn)}
                              </div>
                              <div className="text-[10px] text-slate-500 clean-nums">
                                Cash: ₦{u.balance_ngn.toLocaleString()} &bull; Bonus: ₦{u.bonus_credits_ngn.toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {u.dedicated_account_number ? (
                                <div>
                                  <div className="font-mono text-white text-xs">{u.dedicated_account_number}</div>
                                  <div className="text-[10px] text-slate-500">{u.dedicated_account_bank}</div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-600 font-mono">Not Assigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-white text-xs">{u.total_api_keys} keys</div>
                              <div className="text-[10px] text-slate-500 clean-nums">
                                {u.total_tokens.toLocaleString()} tokens
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => setSelectedUserForCredit(u)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                              >
                                + Grant Credit
                              </button>
                              <button
                                onClick={() => handleToggleFreeze(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                  u.is_frozen
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-400 hover:text-red-400'
                                }`}
                              >
                                {u.is_frozen ? 'Unfreeze' : 'Freeze'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODEL PRICING CONTROL */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-white">Dynamic Model Rate Card</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust per-million token rates in Nigerian Naira. Changes take effect across all token meter ledger deductions immediately.
                </p>
              </div>

              <form onSubmit={handleSavePricing} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(pricing).map(([modelId, rate]) => (
                    <div
                      key={modelId}
                      className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800 space-y-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-white">{rate.name || modelId}</span>
                          <span className="ml-2 font-mono text-[11px] text-slate-500">({modelId})</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                          1M Context Window
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Prompt Input Cost (₦ / 1M Tokens)
                          </label>
                          <input
                            type="number"
                            step="10"
                            value={rate.prompt_per_million}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setPricing({
                                ...pricing,
                                [modelId]: { ...rate, prompt_per_million: val },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 clean-nums"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Completion Output Cost (₦ / 1M Tokens)
                          </label>
                          <input
                            type="number"
                            step="10"
                            value={rate.completion_per_million}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setPricing({
                                ...pricing,
                                [modelId]: { ...rate, completion_per_million: val },
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 clean-nums"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={pricingSaving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-xl transition-all"
                  >
                    {pricingSaving ? 'Saving Rate Card...' : 'Save & Publish Rates'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: PROMOTIONS & CAMPAIGNS */}
          {activeTab === 'promos' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-white">Promotions & Campaign Engine</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure default sign-up credits, launch flash promotional discounts, and broadcast announcements.
                </p>
              </div>

              <form onSubmit={handleSavePromos} className="p-6 rounded-2xl bg-[#0D121F] border border-slate-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      New Developer Signup Starter Bonus (₦ NGN)
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={promos.signup_bonus_ngn}
                      onChange={(e) => setPromos({ ...promos, signup_bonus_ngn: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none clean-nums"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Credits automatically granted to wallet upon email or Google registration (Default ₦1,000.00).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Promotional Sale Discount (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="90"
                      value={promos.sale_discount_percent}
                      onChange={(e) => setPromos({ ...promos, sale_discount_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none clean-nums"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Percent discount deducted during token billing calculations.
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sale Campaign Title
                    </label>
                    <input
                      type="text"
                      value={promos.sale_title}
                      onChange={(e) => setPromos({ ...promos, sale_title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none"
                      placeholder="Independence Day Sovereign AI Fest"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80 md:col-span-2">
                    <div>
                      <div className="text-xs font-semibold text-white">Active Flash Sale State</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        When enabled, the discounted rate applies across API calls.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promos.sale_active}
                        onChange={(e) => setPromos({ ...promos, sale_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80 md:col-span-2">
                    <div>
                      <div className="text-xs font-semibold text-white">Public Site Announcement Banner</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Shows persistent banner message at top of public homepage and docs.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promos.banner_active}
                        onChange={(e) => setPromos({ ...promos, banner_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Announcement Banner Copy
                    </label>
                    <input
                      type="text"
                      value={promos.banner_text}
                      onChange={(e) => setPromos({ ...promos, banner_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none"
                      placeholder="⚡ Flash Sale: 20% off all Indunix AI sovereign models this weekend!"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800/80">
                  <button
                    type="submit"
                    disabled={promosSaving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-xl transition-all"
                  >
                    {promosSaving ? 'Updating Campaigns...' : 'Save Campaign Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: GATEWAY KEYS & INTEGRATIONS */}
          {activeTab === 'gateway' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-white">Payment & Upstream Provider Keys</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage active Paystack gateway keys and upstream provider credentials.
                </p>
              </div>

              <form onSubmit={handleSaveGateway} className="p-6 rounded-2xl bg-[#0D121F] border border-slate-800 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                    Paystack Naira Settlements (Parent Merchant: Esam Creative Technologies)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Paystack Secret Key (Current: {gatewayConfig?.payment?.secret_key_masked || 'Not Set'})
                      </label>
                      <input
                        type="password"
                        value={paystackSecret}
                        onChange={(e) => setPaystackSecret(e.target.value)}
                        placeholder="sk_live_... or sk_test_..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Paystack Public Key
                      </label>
                      <input
                        type="text"
                        value={paystackPublic || gatewayConfig?.payment?.public_key || ''}
                        onChange={(e) => setPaystackPublic(e.target.value)}
                        placeholder="pk_live_... or pk_test_..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
                    Upstream Provider API Credentials (Abstracted from Endpoints)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        DeepSeek API Key (Current: {gatewayConfig?.upstream?.deepseek_key_masked || 'Not Set'})
                      </label>
                      <input
                        type="password"
                        value={deepseekKey}
                        onChange={(e) => setDeepseekKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Groq API Key (Current: {gatewayConfig?.upstream?.groq_key_masked || 'Not Set'})
                      </label>
                      <input
                        type="password"
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        placeholder="gsk_..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Together AI API Key (Current: {gatewayConfig?.upstream?.together_key_masked || 'Not Set'})
                      </label>
                      <input
                        type="password"
                        value={togetherKey}
                        onChange={(e) => setTogetherKey(e.target.value)}
                        placeholder="tok_..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div>
                    <div className="text-xs font-semibold text-white">Live Production Mode</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Routes inferences directly to active GPU nodes instead of mock pipelines.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveMode}
                      onChange={(e) => setLiveMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800/80">
                  <button
                    type="submit"
                    disabled={gatewaySaving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-xl transition-all"
                  >
                    {gatewaySaving ? 'Updating Keys...' : 'Save & Encrypt Keys'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Credit Bonus Grant Modal */}
      {selectedUserForCredit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D121F] border border-slate-800 p-6 shadow-2xl animate-fadeIn">
            <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              Grant Credits: {selectedUserForCredit.full_name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Account: {selectedUserForCredit.email}
            </p>

            <form onSubmit={handleAdjustCredits} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Credit Amount (₦ NGN)
                </label>
                <input
                  type="number"
                  step="100"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 clean-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Credit Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreditType('bonus')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      creditType === 'bonus'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Promotional Bonus Credits
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditType('cash')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      creditType === 'cash'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Direct Cash Ledger Balance
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Audit Reason / Note
                </label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  required
                  placeholder="Reason for granting credit"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="creditNotify"
                  checked={creditNotify}
                  onChange={(e) => setCreditNotify(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="creditNotify" className="text-xs text-slate-400 cursor-pointer">
                  Dispatch credit confirmation email to user
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setSelectedUserForCredit(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustingCredit}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
                >
                  {adjustingCredit ? 'Processing...' : 'Apply Credit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
