import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into lines or process blocks
  const renderFormattedInline = (text: string) => {
    // Process inline elements: code, bold, italic
    // Match `code`, **bold**, *italic*
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Regex for bold (**...**) and inline code (`...`) and italic (*...*)
    const tokenRegex = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)/;

    while (remaining) {
      const match = remaining.match(tokenRegex);
      if (!match) {
        parts.push(remaining);
        break;
      }

      const matchIdx = match.index || 0;
      if (matchIdx > 0) {
        parts.push(remaining.substring(0, matchIdx));
      }

      const fullMatch = match[0];
      if (match[1]) {
        // **bold**
        parts.push(
          <strong key={keyIdx++} className="font-bold text-white tracking-wide">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // `code`
        parts.push(
          <code key={keyIdx++} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800/90 text-emerald-300 font-mono text-xs border border-slate-700/60">
            {match[4]}
          </code>
        );
      } else if (match[5]) {
        // *italic*
        parts.push(
          <em key={keyIdx++} className="italic text-slate-300">
            {match[6]}
          </em>
        );
      }

      remaining = remaining.substring(matchIdx + fullMatch.length);
    }

    return parts;
  };

  // Check if content has <think> block
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  let thinkSection = '';
  let mainContent = content;

  if (thinkMatch) {
    thinkSection = thinkMatch[1].trim();
    mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  }

  const lines = mainContent.split('\n');

  return (
    <div className={`space-y-2 text-sm leading-relaxed text-slate-200 ${className}`}>
      {thinkSection && (
        <div className="mb-4 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/25 text-xs text-slate-400 font-mono space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px] mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chain-of-Thought Reasoning Trace</span>
          </div>
          {thinkSection.split('\n').map((tLine, i) => (
            <div key={i} className="pl-3 border-l border-emerald-500/30">
              {renderFormattedInline(tLine)}
            </div>
          ))}
        </div>
      )}

      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-heading text-emerald-400 font-bold text-base mt-4 mb-2 tracking-tight">
              {renderFormattedInline(trimmed.substring(4))}
            </h4>
          );
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={idx} className="font-heading text-teal-300 font-semibold text-sm mt-3 mb-1.5">
              {renderFormattedInline(trimmed.substring(5))}
            </h5>
          );
        }

        // Bullet points
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
              <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1 text-slate-200">
                {renderFormattedInline(trimmed.substring(2))}
              </div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
              <span className="text-emerald-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                {numMatch[1]}.
              </span>
              <div className="flex-1 text-slate-200">
                {renderFormattedInline(numMatch[2])}
              </div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-slate-200 leading-relaxed">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
