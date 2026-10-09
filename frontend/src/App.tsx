import React, { useState, useEffect } from 'react';
import { api, User, Wallet, UsageSummary, ApiKeyItem, TransactionItem, UsageLogItem } from './api/client';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/landing/Hero';
import { ModelMatrix } from './components/landing/ModelMatrix';
import { LivePlayground } from './components/landing/LivePlayground';
import { PricingCalculator } from './components/landing/PricingCalculator';
import { EnterpriseSection } from './components/landing/EnterpriseSection';
import { QuickstartDocs } from './components/landing/QuickstartDocs';
import { DocsPage } from './components/docs/DocsPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { TermsPage } from './components/pages/TermsPage';
import { AuthPage } from './components/pages/AuthPage';
import { AuthModal } from './components/auth/AuthModal';
import { BillingModal } from './components/modals/BillingModal';
import { DeveloperDocsModal } from './components/modals/DeveloperDocsModal';
import { HelpDeskModal } from './components/modals/HelpDeskModal';
import { EnterpriseContactModal } from './components/modals/EnterpriseContactModal';
import { ConsoleLayout } from './components/console/ConsoleLayout';

export function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'console' | 'docs' | 'privacy' | 'terms' | 'auth'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [logs, setLogs] = useState<UsageLogItem[]>([]);

  // Modals & Pages
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [docsTab, setDocsTab] = useState<'openai' | 'cursor' | 'frameworks' | 'security'>('openai');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isSalesContactOpen, setIsSalesContactOpen] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('indunix-1-core');

  // Handle URL paths, subdomains, and route state
  useEffect(() => {
    const handleRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const host = window.location.hostname.toLowerCase();

      // Automatically strip legacy hash #console or #docs in favor of clean URLs
      if (hash === '#console' || hash === '#/console') {
        window.history.replaceState(null, '', '/console');
      } else if (hash === '#docs' || hash.startsWith('#docs/') || hash.startsWith('#/docs')) {
        window.history.replaceState(null, '', '/docs');
      } else if (hash === '#privacy') {
        window.history.replaceState(null, '', '/privacy');
      } else if (hash === '#terms') {
        window.history.replaceState(null, '', '/terms');
      } else if (hash === '#login') {
        window.history.replaceState(null, '', '/login');
      } else if (hash === '#register' || hash === '#signup') {
        window.history.replaceState(null, '', '/register');
      }

      const activePath = window.location.pathname.toLowerCase();

      if (host.startsWith('docs.') || activePath === '/docs' || hash === '#docs') {
        setCurrentPage('docs');
      } else if (host.startsWith('console.') || host.startsWith('app.') || activePath === '/console' || hash === '#console') {
        setCurrentPage('console');
      } else if (activePath === '/privacy' || hash === '#privacy') {
        setCurrentPage('privacy');
      } else if (activePath === '/terms' || hash === '#terms') {
        setCurrentPage('terms');
      } else if (activePath === '/login' || hash === '#login') {
        setAuthMode('login');
        setCurrentPage('auth');
      } else if (activePath === '/register' || activePath === '/signup' || hash === '#register' || hash === '#signup') {
        setAuthMode('register');
        setCurrentPage('auth');
      } else {
        setCurrentPage('landing');
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);
    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, []);

  const handleNavigate = (page: 'landing' | 'console' | 'docs' | 'privacy' | 'terms' | 'auth') => {
    if (page === 'console' && !user) {
      handleOpenAuth('login');
      return;
    }
    
    setCurrentPage(page);
    const host = window.location.hostname.toLowerCase();

    if (page === 'docs') {
      if (!host.startsWith('docs.')) {
        window.history.pushState(null, '', '/docs');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'console') {
      if (!host.startsWith('console.') && !host.startsWith('app.')) {
        window.history.pushState(null, '', '/console');
      }
    } else if (page === 'privacy') {
      window.history.pushState(null, '', '/privacy');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'terms') {
      window.history.pushState(null, '', '/terms');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'auth') {
      window.history.pushState(null, '', `/${authMode}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  // Load user data on startup
  const refreshUserData = async () => {
    const savedUser = api.getUser();
    if (savedUser) {
      setUser(savedUser);
      try {
        const [w, s, k, t, l] = await Promise.all([
          api.getWallet().catch(() => null),
          api.getSummary().catch(() => null),
          api.getKeys().catch(() => []),
          api.getTransactions().catch(() => []),
          api.getLogs().catch(() => []),
        ]);
        if (w) setWallet(w);
        if (s) setSummary(s);
        setKeys(k);
        setTransactions(t);
        setLogs(l);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setCurrentPage('auth');
    window.location.hash = `#${mode}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDocsModal = (tab?: 'openai' | 'cursor' | 'frameworks' | 'security') => {
    if (tab) setDocsTab(tab);
    setIsDocsOpen(true);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setWallet(null);
    setSummary(null);
    setKeys([]);
    setTransactions([]);
    setLogs([]);
    handleNavigate('landing');
  };

  const handleSelectModelFromMatrix = (modelId: string) => {
    setSelectedModelId(modelId);
    if (currentPage !== 'landing') {
      handleNavigate('landing');
      setTimeout(() => {
        document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#06070A] text-[#F8FAFC]">
      {currentPage === 'console' && user ? (
        /* Authenticated Developer Console View */
        <ConsoleLayout
          user={user}
          wallet={wallet}
          summary={summary}
          keys={keys}
          transactions={transactions}
          logs={logs}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onRefreshData={refreshUserData}
          onLogout={handleLogout}
          onNavigateHome={() => handleNavigate('landing')}
          onUserUpdated={(updated) => setUser(updated)}
        />
      ) : currentPage === 'docs' ? (
        /* Dedicated Full Documentation Page View (/docs) */
        <div className="flex flex-col min-h-screen">
          <Navbar
            user={user}
            wallet={wallet}
            onOpenAuth={handleOpenAuth}
            onOpenDeposit={() => {
              if (user) {
                setIsDepositOpen(true);
              } else {
                handleOpenAuth('register');
              }
            }}
            onNavigate={(p) => handleNavigate(p as any)}
            currentPage="docs"
            onOpenDocs={() => handleNavigate('docs')}
            onOpenHelp={() => setIsHelpOpen(true)}
          />

          <main className="flex-1 pt-16">
            <DocsPage
              onNavigateHome={() => handleNavigate('landing')}
              onOpenConsole={() => handleNavigate('console')}
              onOpenPlayground={(m) => handleSelectModelFromMatrix(m || 'indunix-1-core')}
              onOpenDeposit={() => {
                if (user) {
                  setIsDepositOpen(true);
                } else {
                  handleOpenAuth('register');
                }
              }}
              onContactSales={() => setIsSalesContactOpen(true)}
            />
          </main>

          <Footer
            onOpenDocs={handleOpenDocsModal}
            onOpenDeposit={() => {
              if (user) {
                setIsDepositOpen(true);
              } else {
                handleOpenAuth('register');
              }
            }}
            onOpenHelp={() => setIsHelpOpen(true)}
            onNavigateDocs={() => handleNavigate('docs')}
            onNavigatePrivacy={() => handleNavigate('privacy')}
            onNavigateTerms={() => handleNavigate('terms')}
          />
        </div>
      ) : currentPage === 'privacy' ? (
        /* Dedicated Full Privacy Policy Page View (/privacy) */
        <div className="flex flex-col min-h-screen">
          <Navbar
            user={user}
            wallet={wallet}
            onOpenAuth={handleOpenAuth}
            onOpenDeposit={() => {
              if (user) {
                setIsDepositOpen(true);
              } else {
                handleOpenAuth('register');
              }
            }}
            onNavigate={(p) => handleNavigate(p as any)}
            currentPage="landing"
            onOpenDocs={() => handleNavigate('docs')}
            onOpenHelp={() => setIsHelpOpen(true)}
          />

          <main className="flex-1 pt-16">
            <PrivacyPage
              onNavigateHome={() => handleNavigate('landing')}
              onNavigateTerms={() => handleNavigate('terms')}
            />
          </main>

          <Footer
            onOpenDocs={handleOpenDocsModal}
            onOpenDeposit={() => {
              if (user) {
                setIsDepositOpen(true);
              } else {
                handleOpenAuth('register');
              }
            }}
            onOpenHelp={() => setIsHelpOpen(true)}
            onNavigateDocs={() => handleNavigate('docs')}
            onNavigatePrivacy={() => handleNavigate('privacy')}
            onNavigateTerms={() => handleNavigate('terms')}
          />
        </div>
      ) : currentPage === 'terms' ? (
        /* Dedicated Full Terms of Service Page View (/terms) */
        <div className="flex flex-col min-h-screen">
          <Navbar
            user={user}
            wallet={wallet}
            onOpenAuth={handleOpenAuth}
            onOpenDeposit={() => {
              if (user) {
                setIsDepositOpen(true);
              } else {
                handleOpenAuth('register');
              }
            }}
            onNavigate={(p) => handleNavigate(p as any)}
            currentPage="landing"
            onOpenDocs={() => handleNavigate('docs')}
            onOpenHelp={() => setIsHelpOpen(true)}
          />

          <main className="flex-1 pt-16">
            <TermsPage
              onNavigateHome={() => handleNavigate('landing')}
              onNavigatePrivacy={() => handleNavigate('privacy')}
            />
          </main>

          <Footer
            onOpenDocs={handleOpenDocsModal}
            onOpenDeposit={() => {
              if (user) {
                setIsDepositOpen(true);
              } else {
                handleOpenAuth('register');
              }
            }}
            onOpenHelp={() => setIsHelpOpen(true)}
            onNavigateDocs={() => handleNavigate('docs')}
            onNavigatePrivacy={() => handleNavigate('privacy')}
            onNavigateTerms={() => handleNavigate('terms')}
          />
        </div>
      ) : currentPage === 'auth' ? (
        /* Dedicated Full-Page Auth Experience (/login & /register) */
        <AuthPage
          initialMode={authMode}
          onSuccess={() => {
            refreshUserData();
            handleNavigate('console');
          }}
          onNavigateHome={() => handleNavigate('landing')}
          onSwitchMode={(mode) => setAuthMode(mode)}
          onOpenPrivacy={() => handleNavigate('privacy')}
          onOpenTerms={() => handleNavigate('terms')}
        />
      ) : (
        /* Public Landing Page View */
        <div className="flex flex-col min-h-screen">
          <Navbar
            user={user}
            wallet={wallet}
            onOpenAuth={handleOpenAuth}
            onOpenDeposit={() => {
              if (user) {
                setIsDepositOpen(true);
              } else {
                handleOpenAuth('register');
              }
            }}
            onNavigate={(p) => handleNavigate(p as any)}
            currentPage="landing"
            onOpenDocs={() => handleNavigate('docs')}
            onOpenHelp={() => setIsHelpOpen(true)}
          />

          <main className="flex-1 pt-16">
            <Hero
              onStartFree={() => {
                if (user) {
                  handleNavigate('console');
                } else {
                  handleOpenAuth('register');
                }
              }}
              onExploreEnterprise={() => {
                setIsSalesContactOpen(true);
              }}
              onReadDocs={() => handleNavigate('docs')}
            />

            <ModelMatrix 
              onSelectModel={handleSelectModelFromMatrix} 
              onContactSales={() => setIsSalesContactOpen(true)}
            />

            <LivePlayground
              selectedModelId={selectedModelId}
              onRefreshWallet={refreshUserData}
            />

            <PricingCalculator
              onStartFree={() => {
                if (user) {
                  handleNavigate('console');
                } else {
                  handleOpenAuth('register');
                }
              }}
            />

            <EnterpriseSection />

            <QuickstartDocs onOpenFullDocs={() => handleNavigate('docs')} />
          </main>

          <Footer
            onOpenDocs={handleOpenDocsModal}
            onOpenDeposit={() => {
              if (user) {
                setIsDepositOpen(true);
              } else {
                handleOpenAuth('register');
              }
            }}
            onOpenHelp={() => setIsHelpOpen(true)}
            onNavigateDocs={() => handleNavigate('docs')}
            onNavigatePrivacy={() => handleNavigate('privacy')}
            onNavigateTerms={() => handleNavigate('terms')}
          />
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          refreshUserData();
          handleNavigate('console');
        }}
      />

      {/* Pay in Naira Deposit Modal */}
      <BillingModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={() => {
          refreshUserData();
        }}
        user={user}
      />

      {/* Developer Docs & SDK Integration Modal */}
      <DeveloperDocsModal
        isOpen={isDocsOpen}
        initialTab={docsTab}
        onClose={() => setIsDocsOpen(false)}
        onOpenFullDocs={() => handleNavigate('docs')}
      />

      {/* Help Desk & Technical Support Modal */}
      <HelpDeskModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Talk to Enterprise Sales Modal */}
      <EnterpriseContactModal
        isOpen={isSalesContactOpen}
        onClose={() => setIsSalesContactOpen(false)}
      />
    </div>
  );
}

export default App;
