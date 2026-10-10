import React, { useState, useEffect } from 'react';
import {
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
  Key,
  ShieldCheck,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { api, User } from '../../api/client';

interface EnterpriseProfileViewProps {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
  onLogout: () => void;
}

export const EnterpriseProfileView: React.FC<EnterpriseProfileViewProps> = ({
  user,
  onUserUpdated,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');

  // Profile state
  const [fullName, setFullName] = useState<string>(user.full_name || '');
  const [companyName, setCompanyName] = useState<string>(user.company_name || '');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [savingPassword, setSavingPassword] = useState<boolean>(false);

  // Preferences state
  const [loginAlerts, setLoginAlerts] = useState<boolean>(true);
  const [depositReceipts, setDepositReceipts] = useState<boolean>(true);
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState<boolean>(true);
  const [usageReports, setUsageReports] = useState<boolean>(true);
  const [theme, setTheme] = useState<string>('dark');
  const [cleanNumbers, setCleanNumbers] = useState<boolean>(true);
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFullName(user.full_name || '');
    setCompanyName(user.company_name || '');
    loadPreferences();
  }, [user]);

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
      // Defaults apply
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
        full_name: fullName.trim(),
        company_name: companyName.trim(),
      });
      onUserUpdated(updated);
      setStatusMsg({ type: 'success', text: 'Enterprise profile updated successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'New password must contain at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New password and confirmation do not match.' });
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
      setStatusMsg({ type: 'success', text: 'Account password updated successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async (newPrefs: Partial<{
    login_alerts: boolean;
    deposit_receipts: boolean;
    low_balance_alerts: boolean;
    usage_reports: boolean;
    theme: string;
    clean_numbers: boolean;
  }>) => {
    setSavingPrefs(true);
    setStatusMsg(null);
    try {
      await api.updatePreferences({
        login_alerts: newPrefs.login_alerts ?? loginAlerts,
        deposit_receipts: newPrefs.deposit_receipts ?? depositReceipts,
        low_balance_alerts: newPrefs.low_balance_alerts ?? lowBalanceAlerts,
        usage_reports: newPrefs.usage_reports ?? usageReports,
        theme: newPrefs.theme ?? theme,
        clean_numbers: newPrefs.clean_numbers ?? cleanNumbers,
      });
      if (newPrefs.login_alerts !== undefined) setLoginAlerts(newPrefs.login_alerts);
      if (newPrefs.deposit_receipts !== undefined) setDepositReceipts(newPrefs.deposit_receipts);
      if (newPrefs.low_balance_alerts !== undefined) setLowBalanceAlerts(newPrefs.low_balance_alerts);
      if (newPrefs.usage_reports !== undefined) setUsageReports(newPrefs.usage_reports);
      if (newPrefs.theme !== undefined) setTheme(newPrefs.theme);
      if (newPrefs.clean_numbers !== undefined) setCleanNumbers(newPrefs.clean_numbers);
      setStatusMsg({ type: 'success', text: 'Preferences updated.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Enterprise Profile & Security
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage organization credentials, security controls, and transaction notifications.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Identity Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0D1322] to-[#0A0E18] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-2xl">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white">{user.full_name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {user.role}
              </span>
            </div>
            <div className="text-sm text-slate-400 mt-0.5">{user.email}</div>
            {user.company_name && (
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Building className="w-3.5 h-3.5" />
                <span>{user.company_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Member Since: {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">ID: {user.id.slice(0, 14)}...</span>
            <button
              onClick={handleCopyId}
              title="Copy User ID"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-3 transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/15 text-red-300 border border-red-500/30'
          }`}
        >
          {statusMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
        {[
          { id: 'profile', label: 'Organization & Profile', icon: Building },
          { id: 'security', label: 'Security & Access', icon: Lock },
          { id: 'notifications', label: 'Notification Settings', icon: Bell },
          { id: 'appearance', label: 'Preferences & UI', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id as any);
                setStatusMsg(null);
              }}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Organization & Profile */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-6">
          <div>
            <h3 className="font-heading text-base font-bold text-white">Legal Entity & Contact Details</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These details appear on official invoice receipts and enterprise SLA agreements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none transition-colors"
                placeholder="Account owner full name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Corporate Entity / Organization
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none transition-colors"
                placeholder="Enterprise legal business name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Contact Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-400 text-xs cursor-not-allowed outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Primary login email cannot be changed directly. Contact compliance for corporate domain migrations.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeSection === 'security' && (
        <form onSubmit={handleSavePassword} className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-6">
          <div>
            <h3 className="font-heading text-base font-bold text-white">Password & Authentication</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure your account with a strong password. An email notification will be dispatched on password rotation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none transition-colors"
                placeholder="Current account password"
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
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none transition-colors"
                placeholder="Minimum 8 characters"
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
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs outline-none transition-colors"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Notification Preferences */}
      {activeSection === 'notifications' && (
        <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-6">
          <div>
            <h3 className="font-heading text-base font-bold text-white">Email & Transaction Alerts</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select which notifications are dispatched to your registered email address.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 'login_alerts',
                title: 'New Sign-In Security Alerts',
                desc: 'Receive immediate alerts containing timestamp, IP address, and browser client details.',
                checked: loginAlerts,
                onChange: (v: boolean) => handleSavePreferences({ login_alerts: v }),
              },
              {
                id: 'deposit_receipts',
                title: 'Payment Receipts & Settlement Confirmations',
                desc: 'Receive official transaction receipts when wallet funds are settled via cards or bank transfers.',
                checked: depositReceipts,
                onChange: (v: boolean) => handleSavePreferences({ deposit_receipts: v }),
              },
              {
                id: 'low_balance_alerts',
                title: 'Low Balance Pre-emptive Notices',
                desc: 'Get notified when available token balance dips below the ₦500.00 threshold.',
                checked: lowBalanceAlerts,
                onChange: (v: boolean) => handleSavePreferences({ low_balance_alerts: v }),
              },
              {
                id: 'usage_reports',
                title: 'Weekly Usage & Forensic Audits',
                desc: 'Receive automated breakdowns of prompt and completion token consumption.',
                checked: usageReports,
                onChange: (v: boolean) => handleSavePreferences({ usage_reports: v }),
              },
            ].map((pref) => (
              <div
                key={pref.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80"
              >
                <div className="pr-4">
                  <div className="text-xs font-semibold text-white">{pref.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{pref.desc}</div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={pref.checked}
                    onChange={(e) => pref.onChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Preferences & Typography */}
      {activeSection === 'appearance' && (
        <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-6">
          <div>
            <h3 className="font-heading text-base font-bold text-white">Console Interface & Number Formatting</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize dashboard visual presentation and numeral rendering.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="pr-4">
                <div className="text-xs font-semibold text-white">Clean Numerical Display</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Eliminates slashed or dotted zeros in favor of clean modern sans-serif numbers (tabular-nums).
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={cleanNumbers}
                  onChange={(e) => handleSavePreferences({ clean_numbers: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Dashboard Theme</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Active environment styling.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  Sovereign Dark (Active)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
