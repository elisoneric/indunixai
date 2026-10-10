import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Lock,
  Bell,
  Palette,
  LogOut,
  Check,
  Shield,
  Copy,
  Building,
  Mail,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { api, User } from '../../api/client';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdated: (updatedUser: User) => void;
  onLogout: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'theme'>('profile');

  // Profile fields
  const [fullName, setFullName] = useState<string>(user.full_name || '');
  const [companyName, setCompanyName] = useState<string>(user.company_name || '');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [savingPassword, setSavingPassword] = useState<boolean>(false);

  // Preferences fields
  const [loginAlerts, setLoginAlerts] = useState<boolean>(true);
  const [depositReceipts, setDepositReceipts] = useState<boolean>(true);
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState<boolean>(true);
  const [usageReports, setUsageReports] = useState<boolean>(true);
  const [theme, setTheme] = useState<string>('dark');
  const [cleanNumbers, setCleanNumbers] = useState<boolean>(true);
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      setFullName(user.full_name || '');
      setCompanyName(user.company_name || '');
      setStatusMsg(null);
      loadPreferences();
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, user]);


  const loadPreferences = async () => {
    try {
      const prefs = await api.getPreferences();
      if (prefs) {
        setLoginAlerts(prefs.login_alerts ?? true);
        setDepositReceipts(prefs.deposit_receipts ?? true);
        setLowBalanceAlerts(prefs.low_balance_alerts ?? true);
        setUsageReports(prefs.usage_reports ?? true);
        setTheme(prefs.theme || 'dark');
        setCleanNumbers(prefs.clean_numbers ?? true);
      }
    } catch {
      // use defaults
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMsg(null);
    try {
      const updated = await api.updateProfile({
        full_name: fullName,
        company_name: companyName,
      });
      onUserUpdated(updated);
      setStatusMsg({ type: 'success', text: 'Profile details updated successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setSavingPassword(true);
    setStatusMsg(null);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMsg({ type: 'success', text: 'Password changed successfully. Security alert dispatched.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setStatusMsg(null);
    try {
      await api.updatePreferences({
        login_alerts: loginAlerts,
        deposit_receipts: depositReceipts,
        low_balance_alerts: lowBalanceAlerts,
        usage_reports: usageReports,
        theme: theme,
        clean_numbers: cleanNumbers,
      });
      setStatusMsg({ type: 'success', text: 'Preferences saved.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0D111C] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-base">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white leading-tight">
                Account & Preferences
              </h3>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-red-500/15 text-red-300 border-red-500/30'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800/80 bg-slate-950 px-6 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'profile'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'password'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password & Security</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'notifications'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Email Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'theme'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Display</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company / Organization
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enterprise legal business name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Corporate / Login Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-300 clean-nums">{user.id}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Subscription Tier</span>
                  <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] border border-emerald-500/20">
                    {user.role} (Sovereign NGN)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {savingProfile ? (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PASSWORD & SECURITY */}
          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Setting a strong password ensures uninterrupted access via standard email sign-in, even if third-party OAuth providers experience downtime.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Password (optional if registered via Google)
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {savingPassword ? (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: NOTIFICATIONS & EMAIL PREFERENCES */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Configure automated transactional notifications delivered to <strong>{user.email}</strong>.
              </p>

              <div className="space-y-3">
                {[
                  {
                    id: 'login',
                    title: 'Login & Session Security Alerts',
                    desc: 'Instant notice with IP and device telemetry when a new session logs in.',
                    checked: loginAlerts,
                    setter: setLoginAlerts,
                  },
                  {
                    id: 'deposits',
                    title: 'Payment & Wallet Credit Receipts',
                    desc: 'Official receipt and updated Naira balance immediately upon successful Paystack deposit.',
                    checked: depositReceipts,
                    setter: setDepositReceipts,
                  },
                  {
                    id: 'low_balance',
                    title: 'Low Balance Warning Alerts',
                    desc: 'Prompt email alert when available wallet credits fall below ₦500.00.',
                    checked: lowBalanceAlerts,
                    setter: setLowBalanceAlerts,
                  },
                  {
                    id: 'reports',
                    title: 'Weekly Usage & Token Digests',
                    desc: 'Summary of total completion requests, token volume, and model breakdown.',
                    checked: usageReports,
                    setter: setUsageReports,
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <div className="pr-4">
                      <div className="text-xs font-semibold text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-400"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {savingPrefs ? (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <span>Save Alert Preferences</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: THEME & DISPLAY PREFERENCES */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Console Theme & Palette
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'dark', label: 'Deep Obsidian', border: 'border-emerald-500', bg: 'bg-[#06070A]' },
                    { id: 'cyber', label: 'Cyber Emerald', border: 'border-teal-500', bg: 'bg-[#080E14]' },
                    { id: 'midnight', label: 'Midnight Slate', border: 'border-slate-500', bg: 'bg-[#0B0F19]' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        theme === t.id
                          ? 'border-emerald-400 bg-emerald-500/10 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-lg ${t.bg} border border-slate-800 mb-2 flex items-center justify-center`}>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-xs font-semibold">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Clean Modern Numbers</div>
                    <div className="text-[11px] text-slate-400">
                      Disables dotted zeros across currency, latencies, and token counters.
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {savingPrefs ? (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <span>Save Theme Settings</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Sign Out Action */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Indunix Sovereign Cloud • Nigeria
          </span>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
