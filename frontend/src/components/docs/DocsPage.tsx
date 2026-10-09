import React, { useState, useEffect } from 'react';
import { 
  Terminal, Copy, Check, ChevronRight, Search, 
  Cpu, Zap, Shield, Layers, Key, CreditCard, ArrowRight,
  Code2, Sparkles, Server, CheckCircle2, AlertTriangle, FileText,
  Globe, PhoneCall, Database, Clock
} from 'lucide-react';
import { formatNaira } from '../../utils/formatters';

interface DocsPageProps {
  onNavigateHome: () => void;
  onOpenConsole: () => void;
  onOpenPlayground: (modelId?: string) => void;
  onOpenDeposit: () => void;
  onContactSales?: () => void;
}

type SectionKey = 
  | 'overview' 
  | 'quickstart' 
  | 'auth' 
  | 'base-url'
  | 'errors' 
  | 'rate-limits'
  | 'models-overview' 
  | 'model-spark' 
  | 'model-core' 
  | 'model-reason' 
  | 'model-edge'
  | 'ref-chat' 
  | 'ref-models' 
  | 'ref-wallet' 
  | 'ref-deposit'
  | 'sdk-python' 
  | 'sdk-typescript' 
  | 'sdk-cursor' 
  | 'sdk-langchain' 
  | 'ent-nodes';

export const DocsPage: React.FC<DocsPageProps> = ({
  onNavigateHome,
  onOpenConsole,
  onOpenPlayground,
  onOpenDeposit,
  onContactSales
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLang, setActiveLang] = useState<'python' | 'typescript' | 'curl'>('python');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleDocsHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith('#docs/')) {
        const sec = hash.replace('#docs/', '') as SectionKey;
        setActiveSection(sec);
      }
    };
    handleDocsHash();
    window.addEventListener('hashchange', handleDocsHash);
    return () => window.removeEventListener('hashchange', handleDocsHash);
  }, []);

  const handleSelectSection = (id: SectionKey) => {
    setActiveSection(id);
    window.location.hash = `docs/${id}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  interface NavItem {
    id: SectionKey;
    label: string;
    icon: any;
    badge?: string;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: 'GETTING STARTED',
      items: [
        { id: 'overview' as SectionKey, label: 'Overview & Architecture', icon: Globe },
        { id: 'quickstart' as SectionKey, label: 'Quickstart (5 Mins)', icon: Zap },
        { id: 'auth' as SectionKey, label: 'Authentication & API Keys', icon: Key },
        { id: 'base-url' as SectionKey, label: 'Base URLs & Environments', icon: Server },
        { id: 'errors' as SectionKey, label: 'Error Codes & HTTP 402', icon: AlertTriangle },
        { id: 'rate-limits' as SectionKey, label: 'Rate Limits & Concurrency', icon: Layers },
      ]
    },
    {
      title: 'MODELS & BENCHMARKS',
      items: [
        { id: 'models-overview' as SectionKey, label: 'Model Lineup & Matrix', icon: Cpu },
        { id: 'model-spark' as SectionKey, label: 'Indunix 1 Spark (Sub-Second)', icon: Zap },
        { id: 'model-core' as SectionKey, label: 'Indunix 1 Core (Enterprise)', icon: Cpu },
        { id: 'model-reason' as SectionKey, label: 'Indunix 1 Reason (Deep Thought)', icon: Sparkles },
        { id: 'model-edge' as SectionKey, label: 'Indunix Edge (Local Node)', icon: Server },
      ]
    },
    {
      title: 'API REFERENCE',
      items: [
        { id: 'ref-chat' as SectionKey, label: 'POST /v1/chat/completions', icon: Terminal, badge: 'POST' },
        { id: 'ref-models' as SectionKey, label: 'GET /v1/models', icon: FileText, badge: 'GET' },
        { id: 'ref-wallet' as SectionKey, label: 'GET /api/billing/wallet', icon: CreditCard, badge: 'GET' },
        { id: 'ref-deposit' as SectionKey, label: 'POST /api/billing/deposit', icon: CreditCard, badge: 'POST' },
      ]
    },
    {
      title: 'SDKS & INTEGRATIONS',
      items: [
        { id: 'sdk-python' as SectionKey, label: 'Python (OpenAI SDK)', icon: Code2 },
        { id: 'sdk-typescript' as SectionKey, label: 'TypeScript & Node.js', icon: Code2 },
        { id: 'sdk-cursor' as SectionKey, label: 'Cursor & VS Code Setup', icon: Terminal },
        { id: 'sdk-langchain' as SectionKey, label: 'LangChain & LlamaIndex', icon: Layers },
      ]
    },
    {
      title: 'ENTERPRISE & SOVEREIGNTY',
      items: [
        { id: 'ent-nodes' as SectionKey, label: 'Dedicated On-Premise Leases', icon: Shield },
      ]
    }
  ];

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-[#06070A] text-[#F8FAFC]">
      {/* Sub-header / Breadcrumb Bar */}
      <div className="border-b border-white/[0.07] bg-[#0A0D14]/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between text-xs sticky top-16 sm:top-20 z-40">
        <div className="flex items-center gap-2 text-zinc-400">
          <button onClick={onNavigateHome} className="hover:text-white transition-colors">
            Indunix AI
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-200 font-medium">Documentation</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-emerald-400 font-mono capitalize">{activeSection.replace('-', ' ')}</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onOpenPlayground()}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Playground</span>
          </button>
          <button 
            onClick={onOpenConsole}
            className="btn-pill-primary text-xs !py-1 !px-3"
          >
            Console
          </button>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto flex">
        {/* Left Sidebar */}
        <aside className="w-72 shrink-0 border-r border-white/[0.07] bg-[#07090E]/60 backdrop-blur-xl hidden md:block min-h-[calc(100vh-7rem)] p-5 sticky top-28 self-start max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Navigation Tree */}
          <div className="space-y-6">
            {filteredGroups.map(group => (
              <div key={group.title}>
                <h4 className="text-[10px] font-mono font-semibold tracking-wider text-zinc-500 uppercase px-2 mb-2">
                  {group.title}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left ${
                          isActive 
                            ? 'bg-white/[0.08] text-white font-medium border border-white/[0.12] shadow-sm' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                            item.badge === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Direct Naira Top-up Banner */}
          <div className="mt-8 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Direct Naira Wallet</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Prepaid balance top-up in Nigerian Naira via cards, transfer, USSD, and OPay.
            </p>
            <button 
              onClick={onOpenDeposit}
              className="text-xs text-white underline hover:text-emerald-400 font-medium transition-colors"
            >
              Deposit credits now →
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-6 sm:p-10 lg:p-12 max-w-4xl space-y-12">
          {/* SECTION: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ARCHITECTURE & PLATFORM</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Indunix AI Sovereign API
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Indunix AI provides high-performance, frontier-grade reasoning and inference infrastructure natively priced and settled in Nigerian Naira (NGN). Built to eliminate the foreign exchange and dollar-card barrier for African developers and enterprises.
                </p>
              </div>

              {/* Core Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-xl border border-white/[0.08]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">100% OpenAI Drop-In</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Zero refactoring required. Simply configure <code className="text-emerald-400 font-mono bg-white/[0.04] px-1 py-0.5 rounded">base_url="https://api.indunixai.com/v1"</code> on your existing OpenAI SDK client.
                  </p>
                </div>

                <div className="glass-card p-5 rounded-xl border border-white/[0.08]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Direct Naira Settlements</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Top up instantly with Naira debit cards, bank transfers, USSD, and OPay. Exact ₦ billing per million tokens down to 2 decimal places.
                  </p>
                </div>

                <div className="glass-card p-5 rounded-xl border border-white/[0.08]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Frontier Model Tiers</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Access <strong className="text-zinc-200">Indunix 1 Spark</strong> (sub-second throughput), <strong className="text-zinc-200">Indunix 1 Core</strong> (enterprise reasoning), and <strong className="text-zinc-200">Indunix 1 Reason</strong> (deep thinking).
                  </p>
                </div>

                <div className="glass-card p-5 rounded-xl border border-white/[0.08]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Enterprise Air-Gapped Leases</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Deploy dedicated local private GPU inference clusters inside your physical data center with zero cloud data egress.
                  </p>
                </div>
              </div>

              {/* Base Endpoint Callout */}
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-zinc-400 block mb-1">PRODUCTION GATEWAY BASE URL</span>
                  <code className="text-sm sm:text-base font-mono text-emerald-400 font-bold">
                    https://api.indunixai.com/v1
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard('https://api.indunixai.com/v1', 'base_url')}
                  className="btn-pill-secondary flex items-center gap-1.5"
                >
                  {copiedKey === 'base_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'base_url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button 
                  onClick={() => setActiveSection('quickstart')}
                  className="btn-pill-primary flex items-center gap-2"
                >
                  <span>Follow 5-Minute Quickstart</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => onOpenPlayground()}
                  className="btn-pill-secondary"
                >
                  Test in Live Playground
                </button>
              </div>
            </div>
          )}

          {/* SECTION: QUICKSTART */}
          {activeSection === 'quickstart' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5-MINUTE INTEGRATION</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Quickstart Guide
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Make your first call to the Indunix AI API in under 5 minutes using Python, TypeScript, or raw cURL.
                </p>
              </div>

              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-base font-bold text-white">Generate Your Indunix API Key</h3>
                </div>
                <p className="text-xs text-zinc-400 ml-8 leading-relaxed">
                  Log in to the Developer Console, create a new API Key, and set it as an environment variable. New accounts receive ₦1,000.00 in free starter credits.
                </p>
                <div className="ml-8 p-3 rounded-lg bg-zinc-950 border border-white/[0.08] font-mono text-xs text-emerald-300 flex items-center justify-between">
                  <span>export INDUNIX_API_KEY="indunix-live-sk-YOUR_KEY_HERE"</span>
                  <button 
                    onClick={() => copyToClipboard('export INDUNIX_API_KEY="indunix-live-sk-YOUR_KEY_HERE"', 'export_cmd')}
                    className="text-zinc-500 hover:text-white"
                  >
                    {copiedKey === 'export_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-base font-bold text-white">Execute Streaming Chat Completion</h3>
                </div>

                <div className="ml-8">
                  <div className="flex items-center gap-1 border-b border-white/[0.08] pb-2 mb-3">
                    {(['python', 'typescript', 'curl'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                          activeLang === lang 
                            ? 'bg-white text-black font-semibold' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {lang === 'python' ? 'Python (OpenAI SDK)' : lang === 'typescript' ? 'TypeScript / Node' : 'cURL'}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0A0D14]">
                    <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                        <span className="ml-2 text-zinc-500 text-[11px]">
                          {activeLang === 'python' ? 'quickstart.py' : activeLang === 'typescript' ? 'quickstart.ts' : 'request.sh'}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          const code = activeLang === 'python' ? pythonQuickstart : activeLang === 'typescript' ? tsQuickstart : curlQuickstart;
                          copyToClipboard(code, 'quickstart_code');
                        }}
                        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        {copiedKey === 'quickstart_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'quickstart_code' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <pre className="p-4 text-xs font-mono overflow-x-auto text-zinc-300 leading-relaxed">
                      <code>
                        {activeLang === 'python' && pythonQuickstart}
                        {activeLang === 'typescript' && tsQuickstart}
                        {activeLang === 'curl' && curlQuickstart}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="text-base font-bold text-white">Inspect Streaming Output</h3>
                </div>
                <div className="ml-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">EXPECTED CONSOLE STREAM</div>
                  <div className="font-mono text-xs text-emerald-400 leading-relaxed">
                    [Indunix 1 Core Response]: Corporate quarterly revenue expanded by 14.2% year-over-year. Cash burn rate reduced by 22% with 18.5 months of operational runway...
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: AUTHENTICATION */}
          {activeSection === 'auth' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SECURITY & TOKENS</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Authentication & API Keys
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  The Indunix AI API uses Bearer Token authentication. All API requests must provide your secret key in the <code className="text-emerald-400 font-mono">Authorization</code> HTTP header.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] font-mono text-xs text-zinc-300">
                <span className="text-zinc-500">Authorization:</span> Bearer indunix-live-sk-18239abc...
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Key Security Specs</h3>
                <ul className="space-y-2.5 text-xs text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-200">Zero Raw Storage:</strong> Secret keys are shown once upon creation and stored exclusively as cryptographic SHA-256 hashes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-200">Prefix Identification:</strong> All live keys carry the prefix <code className="text-emerald-400 font-mono">indunix-live-sk-</code> for easy detection in secret scanning engines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-200">Instant Revocation:</strong> Revoke or cycle any key immediately in your Developer Console with sub-second propagation.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* SECTION: BASE URLS & ENVIRONMENTS */}
          {activeSection === 'base-url' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NETWORK & DOMAINS</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Base URLs & Environments
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  All requests must be directed to our high-availability sovereign edge gateway. We operate global points of presence optimized for African internet service providers.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-bold">PRODUCTION API GATEWAY</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE SLA 99.9%</span>
                  </div>
                  <code className="text-base font-mono text-white font-bold block">
                    https://api.indunixai.com/v1
                  </code>
                  <p className="text-xs text-zinc-400">
                    Use this base URL in your production applications, Cursor IDE, LangChain, or OpenAI SDK client.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 font-bold">HEALTH MONITORING ENDPOINT</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">PUBLIC</span>
                  </div>
                  <code className="text-sm font-mono text-zinc-300 block">
                    https://api.indunixai.com/health
                  </code>
                  <p className="text-xs text-zinc-400">
                    Returns HTTP 200 and JSON status report: <code className="text-emerald-400 font-mono">&#123;"status": "healthy", "service": "indunix-gateway"&#125;</code>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="font-bold">Sub-25ms Gateway Routing</div>
                <p className="text-zinc-300 font-sans leading-relaxed">
                  Traffic from Nigerian transit backbones (MTN, Airtel, Glo, Starlink, MainOne) routes with minimal round-trip latency through optimized Edge proxies.
                </p>
              </div>
            </div>
          )}

          {/* SECTION: ERROR CODES */}
          {activeSection === 'errors' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>HTTP STATUS CODES</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Error Codes & Handling
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Indunix AI returns standard HTTP response codes accompanied by structured JSON error payloads.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.04] border-b border-white/[0.08] font-mono text-zinc-400">
                    <tr>
                      <th className="p-3">Status Code</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Action Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-zinc-300 font-mono">
                    <tr>
                      <td className="p-3 text-emerald-400 font-bold">200 OK</td>
                      <td className="p-3 font-sans">Request completed successfully.</td>
                      <td className="p-3 font-sans text-zinc-500">None</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-amber-400 font-bold">400 Bad Request</td>
                      <td className="p-3 font-sans">Malformed JSON payload or unsupported parameter.</td>
                      <td className="p-3 font-sans">Verify parameter schema.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-red-400 font-bold">401 Unauthorized</td>
                      <td className="p-3 font-sans">Invalid, missing, or revoked API key.</td>
                      <td className="p-3 font-sans">Verify Bearer key in Console.</td>
                    </tr>
                    <tr className="bg-amber-500/[0.04]">
                      <td className="p-3 text-amber-400 font-bold">402 Insufficient Balance</td>
                      <td className="p-3 font-sans">Prepaid Naira wallet balance depleted.</td>
                      <td className="p-3 font-sans text-emerald-400 font-medium">Top up wallet in Naira.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-amber-400 font-bold">429 Rate Limit</td>
                      <td className="p-3 font-sans">Requests per minute (RPM) threshold exceeded.</td>
                      <td className="p-3 font-sans">Implement exponential backoff.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-red-400 font-bold">503 Service Standby</td>
                      <td className="p-3 font-sans">Upstream provider failover in progress.</td>
                      <td className="p-3 font-sans">Auto-retries within 500ms.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
                <div className="font-bold">Automated 402 Handling</div>
                <p className="text-zinc-300 leading-relaxed font-sans">
                  When a 402 is returned, your webhook or backend can automatically trigger a Naira top-up via <code className="font-mono text-emerald-400">POST /api/billing/deposit</code> to restore inference without service interruption.
                </p>
              </div>
            </div>
          )}

          {/* SECTION: RATE LIMITS */}
          {activeSection === 'rate-limits' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CONCURRENCY & THROTTLING</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Rate Limits & Concurrency
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Rate limits ensure platform stability and protect tenants against runaway concurrent loops. Every response returns headers detailing your real-time usage.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.04] border-b border-white/[0.08] font-mono text-zinc-400">
                    <tr>
                      <th className="p-3">Model</th>
                      <th className="p-3">Requests / Min (RPM)</th>
                      <th className="p-3">Tokens / Min (TPM)</th>
                      <th className="p-3">Concurrent SSE Streams</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-zinc-300 font-mono">
                    <tr>
                      <td className="p-3 text-emerald-400 font-bold">indunix-1-spark</td>
                      <td className="p-3">500 RPM</td>
                      <td className="p-3">500,000 TPM</td>
                      <td className="p-3">50 concurrent</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-cyan-400 font-bold">indunix-1-core</td>
                      <td className="p-3">300 RPM</td>
                      <td className="p-3">300,000 TPM</td>
                      <td className="p-3">30 concurrent</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-violet-400 font-bold">indunix-1-reason</td>
                      <td className="p-3">120 RPM</td>
                      <td className="p-3">150,000 TPM</td>
                      <td className="p-3">15 concurrent</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Rate Limit HTTP Headers</h3>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs space-y-1.5 text-zinc-300">
                  <div><span className="text-zinc-500">x-ratelimit-limit-requests:</span> 300</div>
                  <div><span className="text-zinc-500">x-ratelimit-remaining-requests:</span> 284</div>
                  <div><span className="text-zinc-500">x-ratelimit-reset-requests:</span> 14s</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: MODELS OVERVIEW */}
          {activeSection === 'models-overview' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PROPRIETARY MODEL LINEUP</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Model Catalog & Pricing
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Every model runs on the same API key and base URL. Billed strictly in Nigerian Naira to 2 decimal places.
                </p>
              </div>

              <div className="space-y-4">
                {/* Spark */}
                <div className="glass-card p-5 rounded-xl border border-white/[0.08] space-y-3 cursor-pointer hover:border-emerald-500/40 transition-colors" onClick={() => setActiveSection('model-spark')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-zinc-400">ULTRA-FAST & REAL-TIME</span>
                      <h3 className="text-lg font-bold text-white font-mono">indunix-1-spark</h3>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      ₦1,200.00 / 1M tokens
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Engineered for high-concurrency customer support, live voice transcription, classification, and sub-second chat.
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/[0.06]">
                    <span>Speed: <strong>160 tok/s</strong></span>
                    <span>Context: <strong>128,000 tokens</strong></span>
                    <span>TTFT: <strong>180ms</strong></span>
                  </div>
                </div>

                {/* Core */}
                <div className="glass-card p-5 rounded-xl border border-white/[0.08] space-y-3 cursor-pointer hover:border-emerald-500/40 transition-colors" onClick={() => setActiveSection('model-core')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-emerald-400">RECOMMENDED FLAGSHIP</span>
                      <h3 className="text-lg font-bold text-white font-mono">indunix-1-core</h3>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      ₦1,800.00 / 1M tokens
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Balanced enterprise powerhouse for complex multi-turn analysis, legal and financial risk audit, contract summarization, and coding.
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/[0.06]">
                    <span>Speed: <strong>95 tok/s</strong></span>
                    <span>Context: <strong>64,000 tokens</strong></span>
                    <span>Reasoning: <strong>Standard</strong></span>
                  </div>
                </div>

                {/* Reason */}
                <div className="glass-card p-5 rounded-xl border border-white/[0.08] space-y-3 cursor-pointer hover:border-violet-500/40 transition-colors" onClick={() => setActiveSection('model-reason')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-violet-400">DEEP CHAIN-OF-THOUGHT</span>
                      <h3 className="text-lg font-bold text-white font-mono">indunix-1-reason</h3>
                    </div>
                    <span className="text-sm font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                      ₦3,200.00 / 1M tokens
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Deep multi-step reasoning, mathematical proof, architecture planning, and forensic fraud auditing. Generates internal reasoning traces via <code className="text-zinc-300 font-mono">&lt;think&gt;</code> blocks.
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/[0.06]">
                    <span>Speed: <strong>55 tok/s</strong></span>
                    <span>Context: <strong>64,000 tokens</strong></span>
                    <span>Reasoning: <strong>Deep CoT</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: MODEL SPARK */}
          {activeSection === 'model-spark' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
                  <Zap className="w-3.5 h-3.5" />
                  <span>SUB-SECOND HIGH THROUGHPUT</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                  indunix-1-spark
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  The ideal choice for customer-facing applications requiring instantaneous response times. Delivers up to 160 tokens per second with sub-180ms Time-To-First-Token.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Pricing</span>
                  <span className="text-base font-bold text-emerald-400">₦1,200.00 / 1M</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Context Length</span>
                  <span className="text-base font-bold text-white">131,072 tokens</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Inference Speed</span>
                  <span className="text-base font-bold text-white">160 tokens / sec</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Best Use Cases</h3>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp and Telegram automated business support bots</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Live lead qualification and CRM ingestion pipelines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Real-time sentiment analysis and high-volume classification</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* SECTION: MODEL CORE */}
          {activeSection === 'model-core' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>RECOMMENDED ENTERPRISE FLAGSHIP</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                  indunix-1-core
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Our flagship general intelligence workhorse. Exceptional in synthesizing multi-page legal documents, evaluating RFPs, writing production code, and generating structured JSON.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Pricing</span>
                  <span className="text-base font-bold text-emerald-400">₦1,800.00 / 1M</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Context Length</span>
                  <span className="text-base font-bold text-white">65,536 tokens</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Inference Speed</span>
                  <span className="text-base font-bold text-white">95 tokens / sec</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Best Use Cases</h3>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Commercial contract evaluation and legal risk summarization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Full-stack software engineering copilots and IDE autocompletion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Executive board memos, quarterly financial reports, and structured JSON extraction</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* SECTION: MODEL REASON */}
          {activeSection === 'model-reason' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DEEP CHAIN-OF-THOUGHT</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                  indunix-1-reason
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Frontier cognitive reasoning model capable of generating internal deliberate reasoning steps wrapped in <code className="text-violet-400 font-mono">&lt;think&gt;...&lt;/think&gt;</code> blocks prior to final completion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Pricing</span>
                  <span className="text-base font-bold text-violet-400">₦3,200.00 / 1M</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Context Length</span>
                  <span className="text-base font-bold text-white">65,536 tokens</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-zinc-500 block mb-1">Deliberation</span>
                  <span className="text-base font-bold text-white">Multi-step CoT</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 space-y-1">
                <div className="font-bold">Chain-of-Thought Streaming</div>
                <p className="text-zinc-300 font-sans leading-relaxed">
                  When streaming chunks from <code className="text-violet-400 font-mono">indunix-1-reason</code>, internal deduction is emitted in real time within the <code className="text-violet-300 font-mono">&lt;think&gt;</code> tag, enabling transparent visibility into model logic.
                </p>
              </div>
            </div>
          )}

          {/* SECTION: MODEL EDGE */}
          {activeSection === 'model-edge' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-4">
                  <Server className="w-3.5 h-3.5" />
                  <span>AIR-GAPPED ON-PREMISE NODE</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                  indunix-edge-local
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Dedicated local hardware inference nodes provisioned on customer servers with absolute data sovereignty and zero cloud egress.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <h3 className="text-base font-bold text-white">Enterprise Deployment Consultation</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Indunix Edge is leased directly under custom enterprise contracts for regulated banking, defense, and healthcare institutions. We tailor the cluster to your hardware specifications (NVIDIA A100/H100, RTX 4090, or AMD ROCm).
                </p>
                <button
                  onClick={onContactSales}
                  className="btn-pill-primary text-xs flex items-center gap-2 !py-2.5 !px-5"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Talk to Enterprise Sales for Custom Quote</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION: CHAT COMPLETIONS SPEC */}
          {activeSection === 'ref-chat' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
                  <span className="font-bold">POST</span>
                  <span>/v1/chat/completions</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Chat Completions
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Creates a model response for the given conversation history. Fully supports Server-Sent Events (SSE) streaming.
                </p>
              </div>

              {/* Request Parameters */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Request Body</h3>
                <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.04] border-b border-white/[0.08] font-mono text-zinc-400">
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Required</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] text-zinc-300 font-mono">
                      <tr>
                        <td className="p-3 text-emerald-400 font-bold">model</td>
                        <td className="p-3 text-zinc-400">string</td>
                        <td className="p-3 text-emerald-400">Required</td>
                        <td className="p-3 font-sans text-xs">ID of the model to use: <code className="text-zinc-200">indunix-1-spark</code>, <code className="text-zinc-200">indunix-1-core</code>, or <code className="text-zinc-200">indunix-1-reason</code>.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-emerald-400 font-bold">messages</td>
                        <td className="p-3 text-zinc-400">array</td>
                        <td className="p-3 text-emerald-400">Required</td>
                        <td className="p-3 font-sans text-xs">A list of messages comprising the conversation so far. Each message contains <code className="text-zinc-200">role</code> and <code className="text-zinc-200">content</code>.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white">stream</td>
                        <td className="p-3 text-zinc-400">boolean</td>
                        <td className="p-3 text-zinc-500">Optional</td>
                        <td className="p-3 font-sans text-xs">If set to true, returns SSE chunk stream: <code className="text-zinc-200">data: &#123;...&#125;</code>. Default is false.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white">temperature</td>
                        <td className="p-3 text-zinc-400">number</td>
                        <td className="p-3 text-zinc-500">Optional</td>
                        <td className="p-3 font-sans text-xs">Sampling temperature between 0 and 2. Default: 0.7.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white">max_tokens</td>
                        <td className="p-3 text-zinc-400">integer</td>
                        <td className="p-3 text-zinc-500">Optional</td>
                        <td className="p-3 font-sans text-xs">The maximum number of tokens to generate.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* cURL Example */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono">cURL Request Example</h3>
                  <button
                    onClick={() => copyToClipboard(curlChatExample, 'curl_chat')}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'curl_chat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'curl_chat' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                  <code>{curlChatExample}</code>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: GET /v1/models */}
          {activeSection === 'ref-models' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
                  <span className="font-bold">GET</span>
                  <span>/v1/models</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  List Models
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Lists currently available models and description metadata. Compatible with the standard OpenAI Models API.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono">cURL Request</h3>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-emerald-300">
                  curl https://api.indunixai.com/v1/models
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono">Sample Response (200 OK)</h3>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-zinc-300 overflow-x-auto">
{`{
  "object": "list",
  "data": [
    {
      "id": "indunix-1-spark",
      "object": "model",
      "owned_by": "indunix-ai",
      "pricing_ngn_per_m": 1200.0,
      "context_window": 131072
    },
    {
      "id": "indunix-1-core",
      "object": "model",
      "owned_by": "indunix-ai",
      "pricing_ngn_per_m": 1800.0,
      "context_window": 65536
    },
    {
      "id": "indunix-1-reason",
      "object": "model",
      "owned_by": "indunix-ai",
      "pricing_ngn_per_m": 3200.0,
      "context_window": 65536
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: GET /api/billing/wallet */}
          {activeSection === 'ref-wallet' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
                  <span className="font-bold">GET</span>
                  <span>/api/billing/wallet</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Get Wallet Balance
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Returns your current real-time balance in Nigerian Naira (NGN), sign-up bonus credits, and ledger status.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono">cURL Request</h3>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-emerald-300">
                  curl https://api.indunixai.com/api/billing/wallet \<br />
                  &nbsp;&nbsp;-H "Authorization: Bearer YOUR_AUTH_TOKEN"
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono">Sample Response (200 OK)</h3>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-zinc-300 overflow-x-auto">
{`{
  "balance_ngn": 25000.00,
  "bonus_credits_ngn": 1000.00,
  "total_available_ngn": 26000.00,
  "currency": "NGN",
  "is_frozen": false
}`}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: POST /api/billing/deposit */}
          {activeSection === 'ref-deposit' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
                  <span className="font-bold">POST</span>
                  <span>/api/billing/deposit</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Initialize Naira Deposit
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Initializes an instant Naira checkout transaction via Paystack. Returns the redirect authorization URL.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono">Request Body</h3>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-zinc-300">
{`{
  "amount_ngn": 10000,
  "channel": "CARD"  // CARD, BANK_TRANSFER, USSD, OPAY
}`}
                </pre>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono">Sample Response (200 OK)</h3>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-zinc-300">
{`{
  "authorization_url": "https://checkout.paystack.com/0u1a9c8...",
  "reference": "DEP-1728472918-B9F2",
  "amount_ngn": 10000.00
}`}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: PYTHON SDK */}
          {activeSection === 'sdk-python' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PYTHON SDK QUICKSTART</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Python Integration
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Use the official <code className="text-emerald-400 font-mono">openai</code> Python library without modifications. Simply update your base URL.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">1. Install OpenAI Package</h3>
                <div className="p-3 rounded-lg bg-zinc-950 border border-white/[0.08] font-mono text-xs text-emerald-300">
                  pip install openai
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">2. Complete Python Example</h3>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                  <code>{pythonQuickstart}</code>
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: TYPESCRIPT SDK */}
          {activeSection === 'sdk-typescript' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>TYPESCRIPT & NODE.JS</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  TypeScript & Node.js
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Seamless integration with Node.js, Next.js, and browser edge runtimes using the official OpenAI TypeScript SDK.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">1. Install Package</h3>
                <div className="p-3 rounded-lg bg-zinc-950 border border-white/[0.08] font-mono text-xs text-emerald-300">
                  npm install openai
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">2. TypeScript Example</h3>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                  <code>{tsQuickstart}</code>
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: CURSOR & VS CODE */}
          {activeSection === 'sdk-cursor' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>IDE INTEGRATION</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Cursor & VS Code Setup
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Power your Cursor IDE AI assistant natively with Indunix AI models and pay in Naira instead of USD subscriptions.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Step-by-Step Configuration in Cursor</h3>
                <ol className="space-y-3 text-xs text-zinc-300 list-decimal list-inside leading-relaxed">
                  <li>Open Cursor Settings (<code className="font-mono bg-white/[0.04] px-1 py-0.5 rounded text-white">Cmd+,</code> or <code className="font-mono bg-white/[0.04] px-1 py-0.5 rounded text-white">Ctrl+,</code>) and navigate to <strong className="text-white">Models</strong>.</li>
                  <li>Under <strong className="text-white">OpenAI API Key</strong>, paste your Indunix secret key (<code className="text-emerald-400 font-mono">indunix-live-sk-...</code>).</li>
                  <li>Click <strong className="text-white">Override OpenAI Base URL</strong> and enter:</li>
                </ol>
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-white/[0.08] font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <span>https://api.indunixai.com/v1</span>
                  <button 
                    onClick={() => copyToClipboard('https://api.indunixai.com/v1', 'cursor_base')}
                    className="text-zinc-500 hover:text-white"
                  >
                    {copiedKey === 'cursor_base' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 leading-relaxed">
                  Under <strong className="text-zinc-200">Model Names</strong>, add <code className="text-emerald-400 font-mono">indunix-1-core</code> or <code className="text-violet-400 font-mono">indunix-1-reason</code> and toggle off default legacy models. Cursor will now execute all inline edits, chat, and composer commands via Indunix AI!
                </div>
              </div>
            </div>
          )}

          {/* SECTION: LANGCHAIN & LLAMAINDEX */}
          {activeSection === 'sdk-langchain' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-4">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>FRAMEWORKS & RAG</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  LangChain & LlamaIndex
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  Easily integrate Indunix AI into RAG agent pipelines and LangChain applications.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">LangChain Python Example</h3>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
{`from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# Initialize Indunix Chat model
llm = ChatOpenAI(
    model="indunix-1-core",
    openai_api_key="indunix-live-sk-YOUR_KEY",
    openai_api_base="https://api.indunixai.com/v1",
    temperature=0.2
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an enterprise financial intelligence assistant."),
    ("user", "{input}")
])

chain = prompt | llm
response = chain.invoke({"input": "Summarize key operational audit findings."})
print(response.content)`}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: ENTERPRISE DEDICATED LEASES */}
          {activeSection === 'ent-nodes' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
                  <Shield className="w-3.5 h-3.5" />
                  <span>MANAGED ON-PREMISE LEASES</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Dedicated On-Premise GPU Nodes
                </h1>
                <p className="mt-3 text-base text-zinc-400 leading-relaxed">
                  For regulated banks, fintechs, and enterprises with strict data sovereignty mandates. Indunix AI provisions local containerized model engines directly inside your physical infrastructure.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400 font-bold">SOVEREIGN AIR-GAPPED ARCHITECTURE</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ZERO CLOUD EGRESS
                  </span>
                </div>

                <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                  <p>
                    Every node operates as an isolated containerized pod deployed directly inside your corporate data center, physical rack, or private VPC.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                    <li>100% compliant with NDPR and local banking regulations</li>
                    <li>Guaranteed 99.99% high-availability enterprise SLA</li>
                    <li>Dedicated 24/7 Slack and WhatsApp engineering hotline</li>
                    <li>Custom monthly retainer negotiated based on your hardware profile</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onContactSales}
                    className="btn-pill-primary text-xs flex items-center gap-2 !py-2.5 !px-5"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Talk to Enterprise Sales — Request Custom Pricing</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Snippet templates
const pythonQuickstart = `import os
from openai import OpenAI

# 1. Initialize OpenAI client with Indunix Sovereign Gateway
client = OpenAI(
    api_key=os.environ.get("INDUNIX_API_KEY"),
    base_url="https://api.indunixai.com/v1"
)

# 2. Execute streaming request
response = client.chat.completions.create(
    model="indunix-1-core",
    messages=[
        {"role": "system", "content": "You are Indunix AI Sovereign Intelligence."},
        {"role": "user", "content": "Analyze our quarterly corporate cash runway."}
    ],
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)`;

const tsQuickstart = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.INDUNIX_API_KEY,
  baseURL: "https://api.indunixai.com/v1",
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "indunix-1-core",
    messages: [
      { role: "system", content: "You are Indunix AI Sovereign Intelligence." },
      { role: "user", content: "Summarize the corporate balance sheet risks." },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();`;

const curlQuickstart = `curl https://api.indunixai.com/v1/chat/completions \\
  -H "Authorization: Bearer $INDUNIX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "indunix-1-core",
    "messages": [
      {"role": "user", "content": "Analyze our operational performance"}
    ],
    "stream": true
  }'`;

const curlChatExample = `curl https://api.indunixai.com/v1/chat/completions \\
  -X POST \\
  -H "Authorization: Bearer indunix-live-sk-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "indunix-1-core",
    "messages": [
      {"role": "system", "content": "You are an enterprise AI assistant."},
      {"role": "user", "content": "Draft an executive summary"}
    ],
    "temperature": 0.7,
    "stream": false
  }'`;
