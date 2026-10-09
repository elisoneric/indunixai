import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
  const [googleLoading, setGoogleLoading] = useState(false);
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
          full_name: fullName || 'Enterprise Developer',
          company_name: companyName || undefined,
        });
      } else {
        await api.login({ email, password });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      // Check if user already provided an email in input or use Google standard prompt
      const targetEmail = email.trim() || prompt("Enter your Google Account email to continue with Google:", "developer@indunixai.com");
      if (!targetEmail) {
        setGoogleLoading(false);
        return;
      }

      await api.googleAuth({
        email: targetEmail,
        full_name: fullName.trim() || targetEmail.split('@')[0],
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again or use email.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ECECF1] flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300 antialiased font-sans">
      
      {/* Top Header Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Indunix AI</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          {mode === 'login' ? (
            <>
              <span className="text-zinc-500">Don't have an account?</span>
              <button
                onClick={() => handleModeChange('register')}
                className="text-white hover:text-emerald-400 font-medium transition-colors"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              <span className="text-zinc-500">Already have an account?</span>
              <button
                onClick={() => handleModeChange('login')}
                className="text-white hover:text-emerald-400 font-medium transition-colors"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Centered Minimal Form (OpenAI Pattern) */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[380px] space-y-6">
          
          {/* Centered Brand Mark & Clean Heading */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <IndunixLogo size={36} />
            </div>
            
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {mode === 'register' ? 'Create your account' : 'Welcome back'}
            </h1>
            
            <p className="text-xs text-zinc-400">
              {mode === 'register'
                ? 'Sign up to get ₦1,000 in free starter API credits.'
                : 'Log in with your Indunix account to continue.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs text-center leading-relaxed">
              {error}
            </div>
          )}

          {/* Social Sign-In (Continue with Google - First & Prominent) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-2.5 px-4 rounded-lg border border-zinc-800 bg-[#0d0d0d] hover:bg-zinc-900 text-zinc-200 hover:text-white font-medium text-xs flex items-center justify-center gap-3 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {/* Google 4-Color SVG Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Minimal 'OR' Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-850" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-[#000000] px-2 text-zinc-500 font-medium">OR</span>
            </div>
          </div>

          {/* Clean Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Full name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Company name <span className="text-zinc-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">Password</label>
                {mode === 'login' && (
                  <span className="text-[11px] text-zinc-400 hover:text-white cursor-pointer transition-colors">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-[#0d0d0d] border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-tight transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <span>{mode === 'register' ? 'Create account' : 'Continue'}</span>
              )}
            </button>
          </form>

          {/* Terms Footer */}
          <div className="text-center text-[11px] text-zinc-500 leading-relaxed pt-2">
            By continuing, you agree to Indunix AI's{' '}
            <button onClick={onOpenTerms} className="text-zinc-400 hover:text-white underline">Terms of Use</button>{' '}
            and{' '}
            <button onClick={onOpenPrivacy} className="text-zinc-400 hover:text-white underline">Privacy Policy</button>.
          </div>

        </div>
      </main>

      {/* Global Minimal Bottom Bar */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-3 border-t border-zinc-900">
        <div>&copy; {new Date().getFullYear()} Indunix AI. All rights reserved.</div>
        <div className="flex items-center gap-4 text-zinc-500">
          <button onClick={onOpenPrivacy} className="hover:text-zinc-300 transition-colors">Privacy policy</button>
          <span>&bull;</span>
          <button onClick={onOpenTerms} className="hover:text-zinc-300 transition-colors">Terms of service</button>
          <span>&bull;</span>
          <a href="/docs" className="hover:text-zinc-300 transition-colors">Documentation</a>
        </div>
      </footer>

    </div>
  );
};
