import React from 'react';
import { Terminal, Zap, BookOpen, HelpCircle, ArrowRight } from 'lucide-react';
import { formatNaira } from '../../utils/formatters';
import { IndunixLogo } from '../common/IndunixLogo';

interface NavbarProps {
  user: any;
  wallet: any;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenDocs?: () => void;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  wallet,
  onOpenAuth,
  onOpenDeposit,
  onNavigate,
  currentPage,
  onOpenDocs,
  onOpenHelp,
}) => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 glass-header duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - Grok/x.ai Sleek Style */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group shrink-0 select-none"
        >
          <IndunixLogo size={32} showText textSize="text-lg" />
        </div>

        {/* Center Nav Links - Grok/x.ai Single-row Clean Typography */}
        <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-zinc-400">
          <button
            onClick={() => onNavigate('landing')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              currentPage === 'landing' ? 'text-white bg-white/[0.06] font-semibold' : 'hover:text-white'
            }`}
          >
            Overview
          </button>
          
          <a
            href="#models"
            onClick={(e) => {
              if (currentPage !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => document.getElementById('models')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            }}
            className="px-3 py-1.5 rounded-full hover:text-white transition-colors"
          >
            Models
          </a>

          <a
            href="#playground"
            onClick={(e) => {
              if (currentPage !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            }}
            className="px-3 py-1.5 rounded-full hover:text-white transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Playground</span>
          </a>

          <a
            href="#pricing"
            onClick={(e) => {
              if (currentPage !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            }}
            className="px-3 py-1.5 rounded-full hover:text-white transition-colors"
          >
            Pricing
          </a>

          <a
            href="#enterprise"
            onClick={(e) => {
              if (currentPage !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => document.getElementById('enterprise')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            }}
            className="px-3 py-1.5 rounded-full hover:text-white transition-colors"
          >
            Enterprise
          </a>

          {/* Dedicated Docs Page Link */}
          <button
            onClick={() => onNavigate('docs')}
            className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
              currentPage === 'docs' ? 'text-white bg-white/[0.08] font-semibold border border-white/[0.12]' : 'hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Docs</span>
          </button>
        </nav>

        {/* Right CTA Actions - Grok-Style Pill Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Help Desk soft pill */}
          <button
            onClick={onOpenHelp}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Help Desk</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Wallet Pill */}
              <div 
                onClick={onOpenDeposit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-all"
                title="Deposit Naira credits"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-medium text-emerald-300">
                  {wallet ? formatNaira(wallet.total_available_ngn) : '₦1,000.00'}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 hover:text-white ml-0.5">
                  + Top Up
                </span>
              </div>

              {/* Console Button */}
              <button
                onClick={() => onNavigate('console')}
                className={`btn-pill-primary flex items-center gap-1.5 ${
                  currentPage === 'console' ? 'ring-2 ring-emerald-400' : ''
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Sign In
              </button>
              
              <button
                onClick={() => onOpenAuth('register')}
                className="btn-pill-primary flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.18)]"
              >
                <span>Get API Key</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
