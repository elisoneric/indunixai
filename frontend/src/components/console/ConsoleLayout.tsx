import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Key,
  Activity,
  CreditCard,
  Server,
  Zap,
  LogOut,
  ArrowLeft,
  Cpu,
  User as UserIcon,
  ShieldAlert,
  Settings,
  RefreshCw,
  ChevronDown,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { User, Wallet, UsageSummary, ApiKeyItem, TransactionItem, UsageLogItem } from '../../api/client';
import { formatNaira } from '../../utils/formatters';
import { DashboardOverview } from './DashboardOverview';
import { KeyManager } from './KeyManager';
import { UsageLogsView } from './UsageLogsView';
import { BillingView } from './BillingView';
import { EnterpriseView } from './EnterpriseView';
import { AdminManagementView } from './AdminManagementView';
import { LivePlayground } from '../landing/LivePlayground';
import { ProfileSettingsModal } from '../modals/ProfileSettingsModal';

interface ConsoleLayoutProps {
  user: User;
  wallet: Wallet | null;
  summary: UsageSummary | null;
  keys: ApiKeyItem[];
  transactions: TransactionItem[];
  logs: UsageLogItem[];
  onOpenDeposit: () => void;
  onRefreshData: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

export const ConsoleLayout: React.FC<ConsoleLayoutProps> = ({
  user,
  wallet,
  summary,
  keys,
  transactions,
  logs,
  onOpenDeposit,
  onRefreshData,
  onLogout,
  onNavigateHome,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'logs' | 'billing' | 'enterprise' | 'playground' | 'admin'>('overview');
  const [logFilter, setLogFilter] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'logs', label: 'Request & Usage Logs', icon: Activity },
    { id: 'billing', label: 'Billing & Deposits', icon: CreditCard },
    { id: 'enterprise', label: 'Enterprise Edge', icon: Server },
    { id: 'playground', label: 'Live Playground', icon: Zap },
    { id: 'admin', label: 'Admin & Gateway Keys', icon: ShieldAlert },
  ];

  const currentNavItem = navItems.find((n) => n.id === activeTab) || navItems[0];
  const CurrentIcon = currentNavItem.icon;

  return (
    <div className="min-h-screen bg-[#080B11] text-[#F8FAFC] flex flex-col md:flex-row">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: Fixed height on desktop, sticky, with profile anchored at bottom */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0A0E18] border-r border-slate-800/80 flex flex-col justify-between shrink-0 z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Scrollable Navigation Section */}
        <div className="flex-1 overflow-y-auto">
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading font-extrabold text-lg tracking-tight text-white">
                  INDUNIX<span className="text-emerald-400">.AI</span>
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">Console v1.0</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onNavigateHome}
                title="Return to Public Site"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: USER PROFILE FIXED AT BOTTOM (NO SCROLL NEEDED) */}
        <div className="shrink-0 p-4 border-t border-slate-800/80 bg-[#0A0E18] space-y-2 mt-auto">
          <div
            onClick={() => setIsProfileOpen(true)}
            title="Click to view profile & preference settings"
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen(true);
                }}
                title="Account Settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cleaner Top Header with Section Dropdown & Mobile Responsiveness */}
        <header className="h-14 px-4 sm:px-6 border-b border-slate-800/80 bg-[#080B11]/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Clean Section Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-850 text-white font-heading font-semibold text-xs sm:text-sm transition-all"
              >
                <CurrentIcon className="w-4 h-4 text-emerald-400" />
                <span>{currentNavItem.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isNavDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsNavDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1.5 w-56 rounded-xl bg-[#0D121F] border border-slate-800 shadow-2xl p-1.5 z-30 space-y-0.5 animate-fadeIn">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isSel = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id as any);
                            setIsNavDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                            isSel
                              ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Refresh Button to fetch new records */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Records"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Wallet Balance Widget */}
            <div
              onClick={onOpenDeposit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 cursor-pointer transition-all shadow-sm group"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Credits:</span>
              <span className="text-xs font-bold text-emerald-300 clean-nums">
                {wallet ? formatNaira(wallet.total_available_ngn) : '₦1,000.00'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                + Deposit
              </span>
            </div>
          </div>
        </header>

        {/* Tab Content Body */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              wallet={wallet}
              summary={summary}
              onOpenDeposit={onOpenDeposit}
              onNavigateToKeys={() => setActiveTab('keys')}
            />
          )}

          {activeTab === 'keys' && (
            <KeyManager
              keys={keys}
              onRefresh={onRefreshData}
            />
          )}

          {activeTab === 'logs' && (
            <UsageLogsView
              logs={logs}
              onRefresh={onRefreshData}
              selectedFilter={logFilter}
              onFilterChange={setLogFilter}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView
              transactions={transactions}
              wallet={wallet}
              onOpenDeposit={onOpenDeposit}
              onRefresh={onRefreshData}
            />
          )}

          {activeTab === 'enterprise' && (
            <EnterpriseView user={user} />
          )}

          {activeTab === 'playground' && (
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold text-white">
                Live Interactive Gateway Playground
              </h2>
              <LivePlayground onRefreshWallet={onRefreshData} />
            </div>
          )}

          {activeTab === 'admin' && (
            <AdminManagementView />
          )}
        </main>
      </div>

      {/* Profile & Preferences Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUserUpdated={onUserUpdated}
        onLogout={onLogout}
      />
    </div>
  );
};
