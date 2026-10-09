import React, { useState } from 'react';
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
  PlusCircle,
  User as UserIcon,
  ShieldAlert,
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
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'logs' | 'billing' | 'enterprise' | 'playground' | 'admin'>('overview');
  const [logFilter, setLogFilter] = useState<string>('');

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'logs', label: 'Request & Usage Logs', icon: Activity },
    { id: 'billing', label: 'Billing & Deposits', icon: CreditCard },
    { id: 'enterprise', label: 'Enterprise Edge', icon: Server },
    { id: 'playground', label: 'Live Playground', icon: Zap },
    { id: 'admin', label: 'Admin & Gateway Keys', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[#080B11] text-[#F8FAFC] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0A0E18] border-r border-slate-800/80 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
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

            <button
              onClick={onNavigateHome}
              title="Return to Public Site"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
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

        {/* Sidebar Footer: User Card */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                {user.full_name?.charAt(0) || 'D'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-white truncate">{user.full_name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-6 border-b border-slate-800/80 bg-[#080B11]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Environment:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              LIVE NIGERIA (NGN)
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Balance Widget */}
            <div 
              onClick={onOpenDeposit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 cursor-pointer transition-all shadow-sm group"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-400">Credits:</span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {wallet ? formatNaira(wallet.total_available_ngn) : '₦1,000.00'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                + Deposit
              </span>
            </div>
          </div>
        </header>

        {/* Tab Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
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
    </div>
  );
};
