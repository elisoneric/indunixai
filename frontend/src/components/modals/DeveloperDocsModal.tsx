import React, { useState } from 'react';
import { X, Code2, Copy, Check, ExternalLink, Terminal, Shield, Zap, BookOpen } from 'lucide-react';

interface DeveloperDocsModalProps {
  isOpen: boolean;
  initialTab?: 'openai' | 'cursor' | 'frameworks' | 'security';
  onClose: () => void;
  onOpenFullDocs?: () => void;
}

export const DeveloperDocsModal: React.FC<DeveloperDocsModalProps> = ({
  isOpen,
  initialTab = 'openai',
  onClose,
  onOpenFullDocs,
}) => {
  const [tab, setTab] = useState<'openai' | 'cursor' | 'frameworks' | 'security'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0E131F] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white">
                Developer Integration & API Documentation
              </h3>
              <p className="text-xs text-slate-400">
                100% OpenAI SDK Compatible (`https://api.indunixai.com/v1`)
              </p>
            </div>
          </div>

          {onOpenFullDocs && (
            <button
              onClick={() => {
                onClose();
                onOpenFullDocs();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono transition-colors"
            >
              <span>Open /docs Page</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800/80 pb-3 mb-4 overflow-x-auto text-xs font-mono">
          {[
            { id: 'openai', label: 'OpenAI SDK (Python & Node)' },
            { id: 'cursor', label: 'Cursor & VS Code Setup' },
            { id: 'frameworks', label: 'LangChain & LlamaIndex' },
            { id: 'security', label: 'HMAC SHA-512 Security' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 pr-1">
          {tab === 'openai' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs font-sans">
                Indunix is a drop-in replacement for OpenAI. Simply update <code className="text-emerald-400">base_url</code> to <code className="text-emerald-400">https://api.indunixai.com/v1</code> and use your Indunix API key.
              </p>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Python (openai &gt;= 1.0.0)</span>
                  <button
                    onClick={() => copyToClipboard(`from openai import OpenAI\n\nclient = OpenAI(\n    api_key="indunix_live_YOUR_KEY",\n    base_url="https://api.indunixai.com/v1"\n)\n\nresponse = client.chat.completions.create(\n    model="indunix-1-core",\n    messages=[{"role": "user", "content": "Analyze corporate metrics"}],\n    stream=True\n)\n\nfor chunk in response:\n    if chunk.choices[0].delta.content:\n        print(chunk.choices[0].delta.content, end="", flush=True)`, 'py')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'py' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'py' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed">
{`from openai import OpenAI

client = OpenAI(
    api_key="indunix_live_YOUR_KEY",
    base_url="https://api.indunixai.com/v1"
)

response = client.chat.completions.create(
    model="indunix-1-core",
    messages=[{"role": "user", "content": "Analyze corporate metrics"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Node.js / TypeScript</span>
                  <button
                    onClick={() => copyToClipboard(`import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: "indunix_live_YOUR_KEY",\n  baseURL: "https://api.indunixai.com/v1",\n});\n\nconst completion = await client.chat.completions.create({\n  model: "indunix-1-core",\n  messages: [{ role: "user", content: "Analyze cash flow runway" }],\n});\nconsole.log(completion.choices[0].message.content);`, 'ts')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'ts' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'ts' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed">
{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "indunix_live_YOUR_KEY",
  baseURL: "https://api.indunixai.com/v1",
});

const completion = await client.chat.completions.create({
  model: "indunix-1-core",
  messages: [{ role: "user", content: "Analyze cash flow runway" }],
});
console.log(completion.choices[0].message.content);`}
                </pre>
              </div>
            </div>
          )}

          {tab === 'cursor' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs font-sans">
                Power your IDE copilots directly in Naira without foreign card declines.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-sans">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider font-mono">Cursor IDE Setup:</h4>
                <ol className="list-decimal pl-4 space-y-2 text-xs text-slate-300">
                  <li>Open Cursor Settings <code className="bg-slate-800 px-1 py-0.5 rounded font-mono">Ctrl + Shift + J</code></li>
                  <li>Navigate to <strong>Models</strong> &gt; <strong>OpenAI API Key</strong></li>
                  <li>Click <strong>Override OpenAI Base URL</strong> and enter: <code className="text-emerald-400 font-mono">https://api.indunixai.com/v1</code></li>
                  <li>Paste your Indunix API key into the <strong>API Key</strong> field</li>
                  <li>Under model name, add <code className="text-emerald-400 font-mono">indunix-1-spark</code> or <code className="text-emerald-400 font-mono">indunix-1-core</code></li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-sans">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider font-mono">VS Code (Continue / Cline) Setup:</h4>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto">
{`{
  "models": [
    {
      "title": "Indunix 1 Core",
      "provider": "openai",
      "model": "indunix-1-core",
      "apiBase": "https://api.indunixai.com/v1",
      "apiKey": "indunix_live_YOUR_KEY"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {tab === 'frameworks' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs font-sans">
                Seamless integration with modern enterprise agent frameworks.
              </p>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">LangChain (Python)</span>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed">
{`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="indunix-1-core",
    openai_api_key="indunix_live_YOUR_KEY",
    openai_api_base="https://api.indunixai.com/v1",
    temperature=0.2
)

response = llm.invoke("Summarize corporate revenue metrics")
print(response.content)`}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">LlamaIndex (Python)</span>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed">
{`from llama_index.llms.openai import OpenAI

llm = OpenAI(
    model="indunix-1-reason",
    api_key="indunix_live_YOUR_KEY",
    api_base="https://api.indunixai.com/v1"
)

response = llm.complete("Evaluate enterprise vendor liability exposure")
print(response.text)`}
                </pre>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs font-sans">
                Cryptographic authentication, enterprise zero-telemetry egress, and NDPR compliance specifications.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">HMAC SHA-512</span>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Every webhook payload and instant deposit notification is cryptographically validated using SHA-512 signatures.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">SHA-256 Key Hashing</span>
                  <p className="text-[11px] text-slate-400 font-sans">
                    API secret keys are salted and stored using irreversible SHA-256 hashes. Raw keys are never stored in plain text.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">NDPR / Data Sovereignty</span>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Enterprise requests remain strictly governed under Nigerian Data Protection Regulation standards with zero offshore IP egress.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">24h Ed25519 Leases</span>
                  <p className="text-[11px] text-slate-400 font-sans">
                    On-premise edge nodes require daily cryptographic heartbeat signatures to maintain model operational weights.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between text-xs">
          {onOpenFullDocs ? (
            <button
              onClick={() => {
                onClose();
                onOpenFullDocs();
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 font-mono"
            >
              <span>Explore Full Indunix Documentation (/docs) &rarr;</span>
            </button>
          ) : (
            <span className="text-zinc-500 font-mono">api.indunixai.com/v1</span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
