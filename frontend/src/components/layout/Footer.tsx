import React from 'react';
import { Cpu, ExternalLink, Headphones, ShieldCheck, Terminal, BookOpen, CreditCard, Lock, Server, FileText } from 'lucide-react';
import { IndunixLogo } from '../common/IndunixLogo';

interface FooterProps {
  onOpenDocs?: (tab?: 'openai' | 'cursor' | 'frameworks' | 'security') => void;
  onOpenDeposit?: () => void;
  onOpenHelp?: () => void;
  onNavigateDocs?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
  onOpenLegal?: (tab: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDocs,
  onOpenDeposit,
  onOpenHelp,
  onNavigateDocs,
  onNavigatePrivacy,
  onNavigateTerms,
  onOpenLegal,
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrivacy = () => {
    if (onNavigatePrivacy) onNavigatePrivacy();
    else if (onOpenLegal) onOpenLegal('privacy');
  };

  const handleTerms = () => {
    if (onNavigateTerms) onNavigateTerms();
    else if (onOpenLegal) onOpenLegal('terms');
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[#05060A] text-zinc-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <IndunixLogo size={32} showText textSize="text-xl" />
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Sovereign high-speed AI infrastructure purpose-built for modern enterprises, agencies, and builders. Direct Naira settlements with zero FX barrier.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>Gateway API: Operational (99.98% SLA)</span>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onOpenHelp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs font-medium transition-colors"
              >
                <Headphones className="w-3.5 h-3.5 text-zinc-400" />
                <span>Help Desk & Support</span>
              </button>
            </div>
          </div>

          {/* Model Lineup */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-zinc-300 tracking-wider uppercase mb-4">
              Model Lineup
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => scrollTo('models')}
                  className="w-full text-left text-zinc-400 hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Indunix 1 Spark</span>
                  <span className="text-zinc-500 font-mono">₦1,200.00/M</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('models')}
                  className="w-full text-left text-zinc-400 hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Indunix 1 Core</span>
                  <span className="text-zinc-500 font-mono">₦1,800.00/M</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('models')}
                  className="w-full text-left text-zinc-400 hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Indunix 1 Reason</span>
                  <span className="text-zinc-500 font-mono">₦3,200.00/M</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('enterprise')}
                  className="w-full text-left text-zinc-400 hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Indunix Edge (Local)</span>
                  <span className="text-zinc-500 font-mono">On-Prem Lease</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Developers & Stack */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-zinc-300 tracking-wider uppercase mb-4 flex items-center justify-between">
              <span>Developers & Stack</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateDocs ? onNavigateDocs() : onOpenDocs?.('openai')}
                  className="text-zinc-400 hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                  <span>OpenAI SDK Compatibility</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateDocs ? onNavigateDocs() : onOpenDocs?.('cursor')}
                  className="text-zinc-400 hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Cursor & VS Code Setup</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateDocs ? onNavigateDocs() : onOpenDocs?.('frameworks')}
                  className="text-zinc-400 hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                  <span>LangChain & LlamaIndex Guides</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenDeposit}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5 text-emerald-400 font-medium"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Instant Pay in Naira Top-ups</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateDocs ? onNavigateDocs() : onOpenDocs?.('security')}
                  className="text-zinc-400 hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>HMAC SHA-512 Security</span>
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => onNavigateDocs ? onNavigateDocs() : onOpenDocs?.('openai')}
                  className="text-emerald-400 hover:underline transition-colors text-left flex items-center gap-1.5 font-mono text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Full Documentation (/docs) →</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Enterprise & Legal */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-zinc-300 tracking-wider uppercase mb-4">
              Enterprise & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => scrollTo('enterprise')}
                  className="text-zinc-400 hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <Server className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Dedicated On-Premise GPU Nodes</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handlePrivacy}
                  className="text-zinc-400 hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Privacy & Zero-Retention Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleTerms}
                  className="text-zinc-400 hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Terms of Service & SLA</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('models')}
                  className="text-zinc-400 hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Talk to Sales (Custom Quote)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenHelp}
                  className="text-zinc-300 hover:text-white transition-colors text-left flex items-center gap-1.5 font-medium"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  <span>24/7 Enterprise Help Desk</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 Indunix AI Infrastructure. All rights reserved.</p>
          <div className="flex items-center gap-4 sm:gap-6 font-mono text-[11px]">
            <button 
              onClick={() => onNavigateDocs ? onNavigateDocs() : onOpenDocs?.('openai')}
              className="hover:text-zinc-300 text-emerald-400 flex items-center gap-1"
            >
              <span>Documentation (/docs)</span>
            </button>
            <button 
              onClick={handlePrivacy}
              className="hover:text-zinc-300 text-zinc-400"
            >
              Privacy Policy
            </button>
            <button 
              onClick={handleTerms}
              className="hover:text-zinc-300 text-zinc-400"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
