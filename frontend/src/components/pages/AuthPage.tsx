import React, { useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Building, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Code2, 
  ArrowLeft,
  Eye,
  EyeOff,
  Coins
} from 'lucide-react';
import { api } from '../../api/client';
import { IndunixLogo } from '../common/IndunixLogo';

interface AuthPageProps {
  initialMode: 'login' | 'register';
  onSuccess: () => void;
  onNavigateHome: () => void;
  onSwitchMode?: (mode: 'login' | 'register') => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode,
  onSuccess,
  onNavigateHome,
  onSwitchMode,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError(null);
    if (onSwitchMode) onSwitchMode(newMode);
    window.location.hash = `#${newMode}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        await api.register({
          email,
          password,
          full_name: fullName || 'Enterprise Builder',
          company_name: companyName || undefined,
        });
      } else {
        await api.login({ email, password });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Mobile Bar */}
      <div className="lg:hidden p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-40">
        <div onClick={onNavigateHome} className="flex items-center gap-2 cursor-pointer">
          <IndunixLogo size={28} showText textSize="text-base" />
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-12 items-center justify-center gap-8 lg:gap-16">
        
        {/* LEFT COLUMN: Visual Showcase & Sovereign Trust Architecture */}
        <div className="hidden lg:flex flex-col flex-1 justify-center space-y-8 pr-4">
          <div onClick={onNavigateHome} className="inline-flex cursor-pointer group w-fit">
            <IndunixLogo size={40} showText textSize="text-2xl" />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sovereign AI Infrastructure Gateway</span>
            </div>
            
            <h1 className="font-heading text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              AI compute powered in <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Nigerian Naira</span>.
            </h1>

            <p className="text-slate-400 text-base max-w-xl leading-relaxed">
              Drop-in OpenAI-compatible gateway with zero foreign exchange fees, instant card and transfer settlements, sub-second low latency, and dedicated on-premise hardware leases.
            </p>
          </div>

          {/* Value Props Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
                <Coins className="w-4 h-4" />
                <span>₦1,000 Starter Grant</span>
              </div>
              <p className="text-xs text-slate-400">Instant test credits deposited directly upon registration.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-1">
                <Zap className="w-4 h-4" />
                <span>Sub-15ms Latency</span>
              </div>
              <p className="text-xs text-slate-400">Unbuffered streaming SSE completion pipeline.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero FX Blockades</span>
              </div>
              <p className="text-xs text-slate-400">Cards, bank transfer, USSD, and OPay direct checkout.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold mb-1">
                <Code2 className="w-4 h-4" />
                <span>Drop-In SDK</span>
              </div>
              <p className="text-xs text-slate-400">100% compatible with existing OpenAI codebases.</p>
            </div>
          </div>

          {/* Interactive Code Preview Box */}
          <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4 font-mono text-xs text-slate-300 max-w-lg shadow-xl shadow-black/40">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/70" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/70" />
                <span className="ml-2 text-slate-400">quickstart.py</span>
              </span>
              <span className="text-emerald-400">api.indunixai.com</span>
            </div>
            <pre className="pt-3 text-[12px] leading-relaxed overflow-x-auto text-emerald-300">
              <span className="text-purple-400">from</span> openai <span className="text-purple-400">import</span> OpenAI<br/>
              client = OpenAI(<br/>
              &nbsp;&nbsp;base_url=<span className="text-cyan-300">"https://api.indunixai.com/v1"</span>,<br/>
              &nbsp;&nbsp;api_key=<span className="text-amber-300">"indunix-live-sk-..."</span><br/>
              )<br/>
              <span className="text-slate-500"># Direct Naira settled inference</span>
            </pre>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Enterprise Form Card */}
        <div className="w-full max-w-md">
          <div className="relative bg-[#0E131F]/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/20">
            
            {/* Top Navigation Back link */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>

              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>SSL Secured</span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="mb-6">
              <h2 className="font-heading text-2xl font-bold text-white tracking-tight">
                {mode === 'register' ? 'Create Developer Account' : 'Welcome to Developer Console'}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {mode === 'register'
                  ? 'Sign up in under 60 seconds. Receive ₦1,000.00 in free starter API credits instantly.'
                  : 'Access your API keys, monitor usage analytics, and manage Naira deposits.'}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-900/80 border border-slate-800 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`py-2 text-xs font-medium rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-slate-800 text-white shadow font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className={`py-2 text-xs font-medium rounded-lg transition-all relative ${
                  mode === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Register</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-950/20 text-[10px] font-bold">
                  +₦1,000
                </span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Chukwuma Adeleke"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Company / Organization <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Apex Fintech Ltd"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Corporate or Personal Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  {mode === 'login' && (
                    <span className="text-[11px] text-emerald-400 hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>{mode === 'register' ? 'Claim ₦1,000.00 & Create Account' : 'Enter Developer Console'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Registration Guarantee Badge */}
            {mode === 'register' ? (
              <div className="mt-5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  ₦1,000 promo credit is automatically credited upon verification. No credit card required to start testing.
                </span>
              </div>
            ) : (
              <div className="mt-5 text-center text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  onClick={() => handleModeChange('register')}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Register (+₦1,000 Credits)
                </button>
              </div>
            )}

            {/* Legal Footnote */}
            <div className="mt-6 pt-5 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
              By proceeding, you agree to Indunix AI's{' '}
              <button onClick={onOpenTerms} className="text-slate-400 hover:text-white underline">Terms</button>{' '}
              and{' '}
              <button onClick={onOpenPrivacy} className="text-slate-400 hover:text-white underline">Privacy Policy</button>.
            </div>

          </div>
        </div>

      </div>

      {/* Global Minimal Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 bg-[#07090E]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Indunix AI Infrastructure. All rights reserved.</span>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <button onClick={onOpenPrivacy} className="hover:text-white transition-colors">Privacy</button>
            <button onClick={onOpenTerms} className="hover:text-white transition-colors">Terms of Service</button>
            <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
