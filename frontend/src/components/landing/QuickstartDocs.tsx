import React, { useState } from 'react';
import { Terminal, Check, Copy, BookOpen, ArrowRight } from 'lucide-react';

interface QuickstartDocsProps {
  onOpenFullDocs?: () => void;
}

export const QuickstartDocs: React.FC<QuickstartDocsProps> = ({ onOpenFullDocs }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const curlExample = `curl https://api.indunixai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer indunix-live-sk-YOUR_SECRET_KEY" \\
  -d '{
    "model": "indunix-1-core",
    "messages": [{"role": "user", "content": "Analyze corporate revenue metrics and calculate Q3 cash runway."}],
    "temperature": 0.5
  }'`;

  const pythonExample = `import os
from openai import OpenAI

# Initialize standard OpenAI client with Indunix Sovereign Gateway
client = OpenAI(
    base_url="https://api.indunixai.com/v1",
    api_key=os.environ.get("INDUNIX_API_KEY", "indunix-live-sk-YOUR_KEY")
)

# Stream response with sub-15ms overhead
response = client.chat.completions.create(
    model="indunix-1-spark",
    messages=[{"role": "user", "content": "Summarize Nigerian financial regulations."}],
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)`;

  return (
    <section id="docs" className="py-24 border-t border-white/[0.08] bg-[#06070A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono mb-3">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>DEVELOPER QUICKSTART</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Zero Code Refactoring. <br />
            <span className="text-emerald-400">Just Change the Base URL.</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Indunix AI conforms 100% to the OpenAI API specification. You can swap existing LLM integrations in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* cURL Snippet */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0A0D14] overflow-hidden shadow-2xl">
            <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                <span className="ml-2 text-zinc-400 font-semibold">1. Standard cURL</span>
              </div>
              <button
                onClick={() => handleCopy('curl', curlExample)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors"
              >
                {copiedId === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'curl' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{curlExample}</code>
            </pre>
          </div>

          {/* Python Snippet */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0A0D14] overflow-hidden shadow-2xl">
            <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                <span className="ml-2 text-zinc-400 font-semibold">2. Python OpenAI SDK</span>
              </div>
              <button
                onClick={() => handleCopy('python', pythonExample)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors"
              >
                {copiedId === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'python' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
              <code>{pythonExample}</code>
            </pre>
          </div>
        </div>

        {onOpenFullDocs && (
          <div className="text-center mt-12">
            <button
              onClick={onOpenFullDocs}
              className="btn-pill-primary inline-flex items-center gap-2"
            >
              <span>Explore Full API Documentation (/docs)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
