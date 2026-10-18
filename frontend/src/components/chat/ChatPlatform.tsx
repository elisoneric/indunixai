import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Plus, Search, MoreHorizontal, Edit2, Pin, PinOff,
  Trash2, Download, Send, Square, Sparkles, Zap, Brain, Shield,
  Terminal, ArrowRight, User as UserIcon, Check, Copy, RefreshCw,
  Menu, X, ChevronDown, Layers, LogOut, ArrowLeft, AlertCircle, ExternalLink
} from 'lucide-react';
import { api, ChatLimits, ConversationItem, ChatMessageItem, User, Wallet } from '../../api/client';
import { IndunixLogo } from '../common/IndunixLogo';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { PlanLimitsModal } from './PlanLimitsModal';
import { formatNaira } from '../../utils/formatters';

interface ChatPlatformProps {
  user: User | null;
  wallet: Wallet | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
  onNavigate: (page: string) => void;
}

export const ChatPlatform: React.FC<ChatPlatformProps> = ({
  user,
  wallet,
  onOpenAuth,
  onOpenDeposit,
  onNavigate,
}) => {
  // Chat state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('indunix-1-core');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [limits, setLimits] = useState<ChatLimits | null>(null);
  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputPrompt]);

  // Load guest session or user chat data on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        // If unauthenticated, ensure guest session exists
        if (!user && !localStorage.getItem('indunix_guest_token')) {
          await api.getOrCreateGuestSession();
        }

        // If user just logged in and has a pending guest session, migrate
        if (user && localStorage.getItem('indunix_guest_token')) {
          await api.migrateGuestConversations();
        }

        await loadLimits();
        await loadConversations();
      } catch (err) {
        console.warn('Chat init error:', err);
      }
    };

    initChat();
  }, [user]);

  const loadLimits = async () => {
    try {
      const data = await api.getChatLimits();
      setLimits(data);
    } catch (e) {
      console.warn('Failed to load limits:', e);
    }
  };

  const loadConversations = async (q?: string) => {
    try {
      const convs = await api.getChatConversations(q);
      setConversations(convs);
      // If we don't have an active conversation, or active conversation was deleted, pick the first one or leave empty for new chat
      if (convs.length > 0 && !activeConversationId) {
        loadConversationMessages(convs[0].id);
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    }
  };

  const loadConversationMessages = async (id: string) => {
    try {
      setActiveConversationId(id);
      const conv = await api.getChatConversation(id);
      setMessages(conv.messages || []);
      if (conv.model) {
        setSelectedModel(conv.model);
      }
      setErrorMessage(null);
    } catch (e) {
      console.warn('Failed to load messages:', e);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setErrorMessage(null);
    setInputPrompt('');
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    textareaRef.current?.focus();
  };

  const handleSelectModel = (modelId: string) => {
    // Pro check for indunix-1-reason
    if (modelId === 'indunix-1-reason') {
      const isPro = limits?.can_use_reasoning || limits?.tier === 'pro';
      if (!isPro) {
        setIsModelDropdownOpen(false);
        setIsLimitsModalOpen(true);
        return;
      }
    }
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isStreaming) return;

    // Check limits
    if (limits && limits.remaining_messages <= 0 && limits.tier !== 'pro') {
      setIsLimitsModalOpen(true);
      return;
    }

    // Reason model check
    if (selectedModel === 'indunix-1-reason' && limits && !limits.can_use_reasoning && limits.tier !== 'pro') {
      setIsLimitsModalOpen(true);
      return;
    }

    setErrorMessage(null);
    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Append optimistic user message
    const tempUserMsg: ChatMessageItem = {
      id: `temp_user_${Date.now()}`,
      conversation_id: activeConversationId || '',
      role: 'user',
      content: promptToSend,
      model: selectedModel,
      created_at: new Date().toISOString(),
    };

    const updatedHistory = [...messages, tempUserMsg];
    setMessages(updatedHistory);
    setIsStreaming(true);
    setStreamingContent('');

    abortControllerRef.current = new AbortController();

    const formattedMessages = updatedHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let streamBuffer = '';
    let serverConversationId = activeConversationId;

    await api.streamChat(
      {
        conversation_id: activeConversationId || undefined,
        model: selectedModel,
        messages: formattedMessages,
        temperature: 0.7,
      },
      (meta) => {
        if (meta.conversation_id && !serverConversationId) {
          serverConversationId = meta.conversation_id;
          setActiveConversationId(meta.conversation_id);
        }
      },
      (chunk) => {
        streamBuffer += chunk;
        setStreamingContent(streamBuffer);
      },
      async () => {
        setIsStreaming(false);

        // Parse think tags if present
        let cleanText = streamBuffer;
        let reasoningText: string | undefined = undefined;
        if (cleanText.includes('<think>') && cleanText.includes('</think>')) {
          const parts = cleanText.split('</think>');
          reasoningText = parts[0].replace('<think>', '').trim();
          cleanText = parts[1].trim();
        }

        const assistantMsg: ChatMessageItem = {
          id: `asst_${Date.now()}`,
          conversation_id: serverConversationId || '',
          role: 'assistant',
          content: cleanText,
          reasoning_content: reasoningText,
          model: selectedModel,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');

        // Reload limits and conversations list
        await loadLimits();
        await loadConversations();
      },
      (err) => {
        setIsStreaming(false);
        setStreamingContent('');
        setErrorMessage(err);
      },
      abortControllerRef.current.signal
    );
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleRenameConversation = async (id: string) => {
    if (!editingTitleText.trim()) return;
    try {
      await api.updateChatConversation(id, { title: editingTitleText.trim() });
      setEditingTitleId(null);
      await loadConversations();
    } catch (e) {
      console.warn('Failed to rename:', e);
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      await api.updateChatConversation(id, { is_pinned: !currentPin });
      setActiveMenuId(null);
      await loadConversations();
    } catch (e) {
      console.warn('Failed to pin:', e);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await api.deleteChatConversation(id);
      setActiveMenuId(null);
      if (activeConversationId === id) {
        handleNewChat();
      }
      await loadConversations();
    } catch (e) {
      console.warn('Failed to delete:', e);
    }
  };

  const handleExportConversation = async (id: string, format: 'markdown' | 'json') => {
    try {
      const data = await api.exportChatConversation(id, format);
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
        type: format === 'json' ? 'application/json' : 'text/markdown',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `indunix_chat_${id.slice(0, 8)}.${format === 'json' ? 'json' : 'md'}`;
      a.click();
      URL.revokeObjectURL(url);
      setActiveMenuId(null);
    } catch (e) {
      console.warn('Failed to export:', e);
    }
  };

  // Keyboard shortcut Ctrl/Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.is_pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.is_pinned);

  // Group unpinned by recency
  const todayConversations: ConversationItem[] = [];
  const yesterdayConversations: ConversationItem[] = [];
  const olderConversations: ConversationItem[] = [];

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  unpinnedConversations.forEach((c) => {
    const d = new Date(c.updated_at);
    if (d > oneDayAgo) {
      todayConversations.push(c);
    } else if (d > twoDaysAgo) {
      yesterdayConversations.push(c);
    } else {
      olderConversations.push(c);
    }
  });

  const starterCards = [
    {
      title: 'Financial & Operational Risk Audit',
      desc: 'Calculate debt service coverage, OPEX burn rate, and draft board memorandum.',
      model: 'indunix-1-core',
      prompt: 'Perform a forensic financial risk assessment: Annual Revenue: ₦640,000,000, Operating Margin: 18%, Overdue Receivables: ₦94,000,000 (45 days overdue). Calculate burn runway and provide an executive treasury recovery plan.',
    },
    {
      title: 'Fast Sovereign API Architecture',
      desc: 'Build high-concurrency microservices using standard OpenAI Python SDK.',
      model: 'indunix-1-spark',
      prompt: 'Write an asynchronous Python FastAPI service that integrates Indunix AI at api.indunixai.com/v1 with streaming completions, API key rate-limiting, and error fallback.',
    },
    {
      title: 'Commercial Contract Liability Review',
      desc: 'Identify aggressive indemnification clauses and recommend balanced redlines.',
      model: 'indunix-1-core',
      prompt: 'Review this vendor agreement clause: "Client agrees to indemnify Provider against all direct, indirect, consequential, and punitive liabilities with zero liability cap." Analyze legal risk and draft an executive counter-clause.',
    },
    {
      title: 'Enterprise Incident Triage & SLA Triage',
      desc: 'Automate customer support escalations with sub-second response times.',
      model: 'indunix-1-spark',
      prompt: 'Customer incident: "Payment gateway webhook returned 504 gateway timeout for high-volume transactions during peak hours." Categorize SLA tier, draft an immediate executive client notification, and summarize technical incident post-mortem steps.',
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07090E] text-zinc-100 font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Collapsible Left Sidebar - Claude / ChatGPT Style */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 sm:w-80 bg-[#0A0D15] border-r border-white/[0.08] transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between gap-2">
          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            title="Return to Indunix AI Homepage"
          >
            <IndunixLogo size={26} showText textSize="text-base" />
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CHAT
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('landing')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Back to IndunixAI.com"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Button & Search */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] text-xs font-semibold text-white transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.05]">
              ⌘K
            </span>
          </button>

          {/* Plan Limit Status Badge - User Requirement Switcher */}
          <div
            onClick={() => setIsLimitsModalOpen(true)}
            className="w-full p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${limits?.tier === 'pro' ? 'bg-teal-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  {limits?.tier === 'pro' ? 'PRO PLAN' : limits?.tier === 'free' ? 'FREE TIER' : 'GUEST CHAT'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium group-hover:underline flex items-center gap-0.5">
                Limits <ChevronDown className="w-3 h-3" />
              </span>
            </div>

            {/* Quota Progress Meter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>{limits?.tier === 'pro' ? 'Unlimited Compute' : `${limits?.remaining_messages ?? 10} prompts left`}</span>
                {limits?.tier === 'guest' && (
                  <span className="text-emerald-400 text-[10px]">Free Trial</span>
                )}
              </div>
              {limits && limits.tier !== 'pro' && (
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((limits.remaining_messages || 0) / (limits.messages_limit || 10)) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Search Conversations Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List (Date Grouped) */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 text-xs">
          {pinnedConversations.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Pinned
              </div>
              <div className="space-y-0.5">
                {pinnedConversations.map((c) => renderConversationItem(c))}
              </div>
            </div>
          )}

          {todayConversations.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Today
              </div>
              <div className="space-y-0.5">
                {todayConversations.map((c) => renderConversationItem(c))}
              </div>
            </div>
          )}

          {yesterdayConversations.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Yesterday
              </div>
              <div className="space-y-0.5">
                {yesterdayConversations.map((c) => renderConversationItem(c))}
              </div>
            </div>
          )}

          {olderConversations.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Previous 7 Days
              </div>
              <div className="space-y-0.5">
                {olderConversations.map((c) => renderConversationItem(c))}
              </div>
            </div>
          )}

          {conversations.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-xs px-4">
              <MessageSquare className="w-8 h-8 mx-auto text-zinc-600 mb-2 opacity-50" />
              <p>No conversations yet.</p>
              <p className="text-[11px] text-zinc-600 mt-1">Start chatting to see your history here.</p>
            </div>
          )}
        </div>

        {/* Sidebar Footer / User Profile & Platform Links */}
        <div className="p-3 border-t border-white/[0.06] bg-black/30 space-y-2">
          {/* Developer API Console Link */}
          <button
            onClick={() => onNavigate('console')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Developer API Console</span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </button>

          {/* User Account / Guest Sign In Card */}
          {user ? (
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{user.full_name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    {wallet ? formatNaira(wallet.total_available_ngn) : '₦1,000.00'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onOpenDeposit}
                  className="px-2 py-1 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20"
                  title="Top Up Naira Credits"
                >
                  + Top Up
                </button>
                <button
                  onClick={() => api.logout()}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Visiting as Guest</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {limits?.remaining_messages ?? 10} left
                </span>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full btn-pill-primary text-xs !py-1.5 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <span>Free Sign Up (₦1,000 Bonus)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#07090E] relative">
        {/* Chat Top Header */}
        <header className="h-14 border-b border-white/[0.08] px-4 flex items-center justify-between bg-[#080B12]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Model Selector Dropdown - Claude Style */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-xs font-semibold text-white transition-all select-none"
              >
                {selectedModel === 'indunix-1-reason' ? (
                  <Brain className="w-3.5 h-3.5 text-teal-400" />
                ) : selectedModel === 'indunix-1-spark' ? (
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {selectedModel === 'indunix-1-reason'
                    ? 'Indunix 1 Reason'
                    : selectedModel === 'indunix-1-spark'
                    ? 'Indunix 1 Spark'
                    : 'Indunix 1 Core'}
                </span>
                {selectedModel === 'indunix-1-reason' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    PRO
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {/* Model Dropdown Menu */}
              {isModelDropdownOpen && (
                <div 
                  className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#0D111A] border border-white/[0.12] shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                    Select Sovereign Model
                  </div>

                  {/* Indunix 1 Core */}
                  <div
                    onClick={() => handleSelectModel('indunix-1-core')}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedModel === 'indunix-1-core'
                        ? 'bg-white/[0.08] border border-white/[0.12]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Indunix 1 Core</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Standard</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Flagship intelligence, complex PDF document parsing, structured analysis.
                      </p>
                    </div>
                  </div>

                  {/* Indunix 1 Spark */}
                  <div
                    onClick={() => handleSelectModel('indunix-1-spark')}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedModel === 'indunix-1-spark'
                        ? 'bg-white/[0.08] border border-white/[0.12]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Indunix 1 Spark</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Ultra-Fast</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Sub-second latency, 128k context, high-throughput extraction.
                      </p>
                    </div>
                  </div>

                  {/* Indunix 1 Reason (Pro) */}
                  <div
                    onClick={() => handleSelectModel('indunix-1-reason')}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedModel === 'indunix-1-reason'
                        ? 'bg-teal-500/15 border border-teal-500/30'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <Brain className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <span>Indunix 1 Reason</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">
                            PRO
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Extended chain-of-thought, mathematical verification, forensic risk audit.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2">
            {/* Limit Switcher Modal Trigger */}
            <button
              onClick={() => setIsLimitsModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Limits & Plans</span>
            </button>

            {activeConversationId && (
              <button
                onClick={() => handleExportConversation(activeConversationId, 'markdown')}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Export Conversation as Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Welcome Screen (When starting a fresh chat) */}
          {messages.length === 0 && !streamingContent && (
            <div className="max-w-2xl mx-auto pt-8 sm:pt-14 pb-6 text-center space-y-6">
              {/* Sovereign Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NIGERIAN SOVEREIGN AI INTELLIGENCE</span>
              </div>

              {/* Claude / ChatGPT Style Clean Headline */}
              <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
                How can Indunix help you today?
              </h1>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Analyze commercial data, audit contracts, synthesize research, and automate operations with enterprise speed.
              </p>

              {/* Guest Notification Banner */}
              {!user && (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-300 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      You have <strong className="text-white">{limits?.remaining_messages ?? 10} free guest prompts</strong> available.
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="text-emerald-400 hover:underline font-semibold whitespace-nowrap"
                  >
                    Sign Up Free &rarr;
                  </button>
                </div>
              )}

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-4">
                {starterCards.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedModel(card.model);
                      handleSendMessage(card.prompt);
                    }}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.15] cursor-pointer transition-all duration-200 group flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {card.title}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 group-hover:text-emerald-400 pt-1">
                      <span>Launch prompt</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Chronological Messages */}
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`max-w-3xl mx-auto flex gap-3.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Assistant Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble Body */}
              <div
                className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white/[0.08] text-white border border-white/[0.1] rounded-tr-sm'
                    : 'bg-[#0A0E18] text-zinc-200 border border-white/[0.06] shadow-sm rounded-tl-sm'
                }`}
              >
                {/* Optional Reasoning Trace for Indunix 1 Reason */}
                {msg.reasoning_content && (
                  <details className="mb-3 rounded-xl bg-black/40 border border-teal-500/25 p-3 text-xs font-mono text-zinc-300">
                    <summary className="cursor-pointer font-bold text-teal-400 uppercase tracking-wider text-[11px] select-none flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-teal-400" />
                      <span>Chain-of-Thought Reasoning Trace</span>
                    </summary>
                    <div className="mt-2 pl-3 border-l-2 border-teal-500/40 whitespace-pre-wrap text-zinc-400 text-[11px]">
                      {msg.reasoning_content}
                    </div>
                  </details>
                )}

                {/* Render Markdown or plain text */}
                {msg.role === 'assistant' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}

                {/* Message Action Toolbar */}
                <div className="flex items-center gap-2 mt-2 pt-1 text-zinc-500 text-[11px]">
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="hover:text-white transition-colors flex items-center gap-1"
                    title="Copy message"
                  >
                    {copiedMessageId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {msg.role === 'user' && (
                    <button
                      onClick={() => setInputPrompt(msg.content)}
                      className="hover:text-white transition-colors"
                      title="Edit and resubmit"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/[0.1] text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Active Live Streaming Bubble */}
          {isStreaming && (
            <div className="max-w-3xl mx-auto flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed bg-[#0A0E18] text-zinc-200 border border-emerald-500/30 shadow-lg rounded-tl-sm">
                <MarkdownRenderer content={streamingContent} />
                <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse" />
              </div>
            </div>
          )}

          {/* Error Message Toast in Conversation */}
          {errorMessage && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-200">Unable to generate response</div>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-white font-medium whitespace-nowrap transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Chat Composer - Claude / ChatGPT Fixed Bottom */}
        <div className="p-4 bg-gradient-to-t from-[#07090E] via-[#07090E] to-transparent shrink-0">
          <div className="max-w-3xl mx-auto relative rounded-2xl bg-[#0D111A] border border-white/[0.12] focus-within:border-emerald-500/50 shadow-2xl transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${
                selectedModel === 'indunix-1-reason' ? 'Indunix 1 Reason' : 'Indunix AI'
              }...`}
              className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none max-h-44 leading-relaxed"
            />

            {/* Composer Footer Actions */}
            <div className="absolute left-3 right-3 bottom-2.5 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto text-[11px] text-zinc-400">
                <span className="font-mono text-[10px] text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  {selectedModel}
                </span>
                <span className="hidden sm:inline text-zinc-600">|</span>
                <span className="hidden sm:inline text-[11px] text-zinc-500">
                  Shift+Enter for newline
                </span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                {isStreaming ? (
                  <button
                    onClick={handleStopGeneration}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Stop generation"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim()}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      inputPrompt.trim()
                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-400 cursor-pointer'
                        : 'bg-white/[0.05] text-zinc-600 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-zinc-600 mt-2 font-sans">
            Indunix AI Sovereign Platform. Model outputs should be verified for operational accuracy.
          </div>
        </div>
      </div>

      {/* Interactive Limits & Plan Switcher Modal */}
      <PlanLimitsModal
        isOpen={isLimitsModalOpen}
        onClose={() => setIsLimitsModalOpen(false)}
        limits={limits}
        onOpenAuth={onOpenAuth}
        onOpenDeposit={onOpenDeposit}
        onNavigateToConsole={() => onNavigate('console')}
        user={user}
      />
    </div>
  );

  // Helper renderer for conversation item in sidebar
  function renderConversationItem(c: ConversationItem) {
    const isActive = activeConversationId === c.id;
    const isEditing = editingTitleId === c.id;
    const isMenuOpen = activeMenuId === c.id;

    return (
      <div
        key={c.id}
        onClick={() => {
          if (!isEditing) {
            loadConversationMessages(c.id);
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
          isActive
            ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {c.is_pinned && <Pin className="w-3 h-3 text-emerald-400 shrink-0" />}
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={editingTitleText}
              onChange={(e) => setEditingTitleText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConversation(c.id);
                if (e.key === 'Escape') setEditingTitleId(null);
              }}
              onBlur={() => handleRenameConversation(c.id)}
              className="w-full bg-black/60 border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{c.title}</span>
          )}
        </div>

        {/* Conversation Context Menu */}
        {!isEditing && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : c.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-opacity"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[#0F131D] border border-white/[0.12] shadow-xl p-1 z-50 text-[11px] space-y-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setEditingTitleId(c.id);
                    setEditingTitleText(c.title);
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Rename</span>
                </button>

                <button
                  onClick={() => handleTogglePin(c.id, c.is_pinned)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                >
                  {c.is_pinned ? (
                    <>
                      <PinOff className="w-3 h-3" />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3 h-3" />
                      <span>Pin to Top</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExportConversation(c.id, 'markdown')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                >
                  <Download className="w-3 h-3" />
                  <span>Export Markdown</span>
                </button>

                <button
                  onClick={() => handleDeleteConversation(c.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};
