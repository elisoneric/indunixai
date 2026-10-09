import React, { useState } from 'react';
import { ArrowRight, Check, Copy, Terminal, Shield, Zap, Sparkles, BookOpen } from 'lucide-react';

interface HeroProps {
  onStartFree: () => void;
  onExploreEnterprise: () => void;
  onReadDocs?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartFree, onExploreEnterprise, onReadDocs }) => {
  const [activeTab, setActiveTab] = useState<'python' | 'node' | 'curl'>('python');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    python: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("INDUNIX_API_KEY"),
    base_url="https://api.indunixai.com/v1"
)

response = client.chat.completions.create(
    model="indunix-1-core",
    messages=[{"role": "user", "content": "Analyze corporate operating cash flow and assess financial risk."}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="", flush=True)`,
    node: `import OpenAI from "openai";

const indunix = new OpenAI({
  baseURL: "https://api.indunixai.com/v1",
  apiKey: process.env.INDUNIX_API_KEY,
});

const completion = await indunix.chat.completions.create({
  model: "indunix-1-spark",
  messages: [{ role: "user", content: "Categorize incoming enterprise support tickets by SLA priority." }],
});

console.log(completion.choices[0].message.content);`,
    curl: `curl https://api.indunixai.com/v1/chat/completions \\
  -H "Authorization: Bearer $INDUNIX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "indunix-1-core",
    "messages": [
      {"role": "user", "content": "Analyze corporate revenue and summarize financial risks."}
    ],
    "stream": true
  }'`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-16 pb-28 overflow-hidden mesh-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Top Grok-Style Monospace Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOVEREIGN AI INFRASTRUCTURE</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-400">DIRECT NAIRA SETTLEMENTS</span>
          </div>

          {/* Main Headline - Grok / x.ai Style */}
          <h1 className="font-heading font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.08] mb-6">
            Build with Indunix. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500">
              Frontier AI for Modern Enterprises.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Generate text and code, analyze corporate intelligence, automate operations, and deploy private on-premise model leases. All through one OpenAI-compatible API (<code className="text-emerald-400 font-mono text-sm bg-white/[0.04] px-1.5 py-0.5 rounded">api.indunixai.com/v1</code>) natively billed in Nigerian Naira.
          </p>

          {/* CTA Group - Grok Style Pill Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-10">
            <button
              onClick={onStartFree}
              className="btn-pill-primary !px-7 !py-3 text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              <span>Get Your API Key (₦1,000.00 Free)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onReadDocs || onExploreEnterprise}
              className="btn-pill-secondary !px-6 !py-3 text-sm flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <span>Read the Docs</span>
            </button>
            <button
              onClick={onExploreEnterprise}
              className="btn-pill-secondary !px-5 !py-3 text-sm flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>On-Premise Leases</span>
            </button>
          </div>

          {/* Value Props Row */}
          <ul className="flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs text-zinc-400 font-mono">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Works with your existing OpenAI SDK</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Naira settlements from ₦1,200.00/M tokens</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sub-15ms gateway routing latency</span>
            </li>
          </ul>
        </div>

        {/* Interactive Code Window Chrome - Grok/x.ai Style */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/[0.08] bg-[#0A0D14] shadow-2xl overflow-hidden">
          {/* Window Title Bar */}
          <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
              <span className="ml-2 text-xs font-mono text-zinc-500">api.indunixai.com/v1</span>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center bg-white/[0.04] p-1 rounded-full border border-white/[0.06]">
              {(['python', 'node', 'curl'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-0.5 text-xs font-mono rounded-full transition-all ${
                    activeTab === tab
                      ? 'bg-white text-black font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab === 'python' ? 'Python' : tab === 'node' ? 'Node.js' : 'cURL'}
                </button>
              ))}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Code Body */}
          <div className="p-5 sm:p-6 text-xs sm:text-sm font-mono overflow-x-auto text-zinc-300 leading-relaxed">
            <pre>
              <code>{codeSnippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
