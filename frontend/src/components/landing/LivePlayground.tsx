import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Sparkles, Zap, Brain, Shield, Terminal, Clock, Coins, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { formatNaira } from '../../utils/formatters';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface LivePlaygroundProps {
  selectedModelId?: string;
  onRefreshWallet?: () => void;
}

export const LivePlayground: React.FC<LivePlaygroundProps> = ({ selectedModelId = 'indunix-1-core', onRefreshWallet }) => {
  const [model, setModel] = useState<string>(selectedModelId);
  const [prompt, setPrompt] = useState<string>(
    'Analyze Q3 operational performance across our business units. Identify revenue leakages, operating expense overhead, and draft a 4-point executive action plan for the Board of Directors.'
  );
  const [output, setOutput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [tokensGenerated, setTokensGenerated] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const tokenCountRef = useRef<number>(0);

  useEffect(() => {
    if (selectedModelId) {
      setModel(selectedModelId);
    }
  }, [selectedModelId]);

  const presetPrompts = [
    {
      title: 'Executive Financial & Revenue Audit',
      model: 'indunix-1-reason',
      prompt: 'Perform a forensic financial risk review on corporate metrics: Gross Revenue: ₦420,000,000, OPEX: ₦315,000,000, Accounts Payable: ₦68,000,000 (35 days overdue). Calculate burn runway and provide an executive debt servicing strategy.',
    },
    {
      title: 'Commercial Contract & Risk Review',
      model: 'indunix-1-core',
      prompt: 'Review this commercial vendor agreement clause: "Supplier shall indemnify Client for up to 300% of aggregate fees for direct and indirect damages." Assess enterprise liability exposure and provide a balanced counter-clause.',
    },
    {
      title: 'Enterprise Customer SLA Triage',
      model: 'indunix-1-spark',
      prompt: 'Customer incident: "Enterprise checkout API has been failing with 504 gateway timeout for 15 minutes." Classify SLA tier, draft an immediate executive client reassurance response, and trigger engineering incident runbook.',
    },
  ];

  const handleStartStream = async () => {
    if (!prompt.trim() || isStreaming) return;
    setIsStreaming(true);
    setOutput('');
    setErrorMsg(null);
    setTokensGenerated(0);
    tokenCountRef.current = 0;
    startTimeRef.current = Date.now();

    await api.streamPlayground(
      model,
      prompt,
      (chunk) => {
        setOutput((prev) => prev + chunk);
        tokenCountRef.current += Math.max(1, Math.ceil(chunk.length / 4));
        setTokensGenerated(tokenCountRef.current);
        setLatencyMs(Date.now() - startTimeRef.current);
      },
      () => {
        setIsStreaming(false);
        setLatencyMs(Date.now() - startTimeRef.current);
        if (onRefreshWallet) onRefreshWallet();
      },
      (err) => {
        setErrorMsg(err);
        setIsStreaming(false);
      }
    );
  };

  const costEstimatedNgn = () => {
    const ratePerM = model === 'indunix-1-spark' ? 1200 : model === 'indunix-1-core' ? 1800 : 3200;
    const promptTokens = Math.max(1, Math.ceil(prompt.length / 4));
    const total = promptTokens + tokensGenerated;
    return (total / 1_000_000) * ratePerM;
  };

  const tokensPerSec = latencyMs > 0 ? ((tokensGenerated / (latencyMs / 1000))).toFixed(1) : '0.0';

  return (
    <section id="playground" className="py-24 border-t border-slate-800 bg-[#080B11] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>INTERACTIVE BROWSER PLAYGROUND</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Test Streaming Speed Live.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Experience our sub-15ms streaming SSE pipeline in action right now. Observe real-time token throughput and instant Naira cost calculations.
          </p>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <span className="text-xs text-slate-500 font-mono mr-2">Try a scenario:</span>
          {presetPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setModel(p.model);
                setPrompt(p.prompt);
                setOutput('');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{p.title}</span>
            </button>
          ))}
        </div>

        {/* Playground Grid Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 glass-panel rounded-2xl border border-slate-750/80 p-6 lg:p-8 shadow-2xl">
          {/* Left Column: Model Select & Input */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              {/* Model Selector Tabs */}
              <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                Select Model Tier
              </label>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { id: 'indunix-1-spark', name: 'Indunix 1 Spark', tag: 'Fast' },
                  { id: 'indunix-1-core', name: 'Indunix 1 Core', tag: 'Standard' },
                  { id: 'indunix-1-reason', name: 'Indunix 1 Reason', tag: 'CoT' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setModel(item.id)}
                    className={`py-2 px-3 rounded-xl text-left border transition-all ${
                      model === item.id
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-heading font-bold truncate">{item.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{item.tag}</div>
                  </button>
                ))}
              </div>

              {/* Prompt Textarea */}
              <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Prompt / Input Document</span>
                <span className="text-[11px] text-slate-500 lowercase">
                  ~{Math.ceil(prompt.length / 4)} tokens
                </span>
              </label>
              <textarea
                rows={7}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter prompt or document snippet..."
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono leading-relaxed resize-none"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartStream}
                disabled={isStreaming || !prompt.trim()}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isStreaming ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                    <span>Streaming SSE...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Run Streaming Request</span>
                  </>
                )}
              </button>

              <button
                onClick={() => { setOutput(''); setTokensGenerated(0); setLatencyMs(0); }}
                title="Reset Output"
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Streaming Output Window */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 rounded-xl border border-slate-800 overflow-hidden min-h-[380px]">
            {/* Output Header with Real-Time Telemetry */}
            <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">{model}</span>
                {isStreaming && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    SSE LIVE
                  </span>
                )}
              </div>

              {/* Metrics Pill Group with Clean Modern Digits */}
              <div className="flex items-center gap-4 text-[11px] clean-nums">
                <div className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="clean-nums">{latencyMs}ms</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-slate-500" />
                  <span className="clean-nums">{tokensPerSec} tok/s</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="clean-nums">{formatNaira(costEstimatedNgn())}</span>
                </div>
              </div>
            </div>

            {/* Response Stream Content */}
            <div className="p-5 flex-1 overflow-y-auto text-sm text-slate-200 leading-relaxed select-text">
              {errorMsg ? (
                <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                  {errorMsg}
                </div>
              ) : output ? (
                <MarkdownRenderer content={output} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
                  <Terminal className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-xs">Select a scenario above or enter a prompt and click "Run Streaming Request"</p>
                </div>
              )}
            </div>

            {/* Output Footer */}
            <div className="px-5 py-2.5 bg-slate-900/40 border-t border-slate-800/50 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Endpoint: https://api.indunixai.com/v1/chat/completions</span>
              <span>Generated: {tokensGenerated} tokens</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
