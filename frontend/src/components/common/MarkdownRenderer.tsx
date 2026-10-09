import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Process inline markdown elements: **bold**, `code`, *italic*
  const renderFormattedInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

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
          <code key={keyIdx++} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800/90 text-emerald-300 font-mono text-xs border border-slate-700/60 clean-nums">
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

  // Cell formatter for tables (Badges and numbers)
  const renderCellContent = (rawText: string) => {
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // Verdict badges
    if (lower === 'healthy' || lower.includes('healthy')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {text}
        </span>
      );
    }
    if (lower === 'at risk' || lower.includes('at risk')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {text}
        </span>
      );
    }
    if (lower.includes('below plan') || lower.includes('drag') || lower.includes('critical')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          {text}
        </span>
      );
    }
    if (lower.includes('scaling') || lower.includes('investment')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          {text}
        </span>
      );
    }

    // Number / Currency formatting
    const isNumeric = /^[\$₦€£]?-?\d+(\.\d+)?(%|M|k|B|pts|ms)?$/i.test(text.replace(/[\s,−–—+]/g, ''));
    if (isNumeric) {
      const isPositive = text.includes('+');
      const isNegative = text.includes('−') || text.includes('-');
      return (
        <span className={`clean-nums font-medium ${isPositive ? 'text-emerald-300' : isNegative ? 'text-rose-300' : 'text-slate-200'}`}>
          {renderFormattedInline(text)}
        </span>
      );
    }

    return renderFormattedInline(text);
  };

  // Check for <think> reasoning trace block
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  let thinkSection = '';
  let mainContent = content;

  if (thinkMatch) {
    thinkSection = thinkMatch[1].trim();
    mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  }

  // Parse lines into structured blocks (Paragraphs, Headings, Tables, Lists, Horizontal Rules)
  const lines = mainContent.split('\n');
  const blocks: Array<{ type: string; payload: any }> = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is part of a markdown table (starts and ends with |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // Line 0 is header
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        // Skip separator line (|---|---|...)
        const dataLines = tableLines.slice(1).filter((l) => !/^\|[\s\-:|]+\|$/.test(l));

        const rowCells = dataLines.map((l) =>
          l
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        blocks.push({
          type: 'table',
          payload: { headers: headerCells, rows: rowCells },
        });
        continue;
      }
    }

    // Code Block ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.substring(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: 'code',
        payload: { lang, code: codeLines.join('\n') },
      });
      continue;
    }

    // Horizontal Rule
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr', payload: null });
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', payload: trimmed.substring(2) });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', payload: trimmed.substring(3) });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', payload: trimmed.substring(4) });
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', payload: trimmed.substring(5) });
      i++;
      continue;
    }

    // Bullet points
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ type: 'bullet', payload: trimmed.substring(2) });
      i++;
      continue;
    }

    // Numbered List
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      blocks.push({ type: 'numbered', payload: { num: numMatch[1], text: numMatch[2] } });
      i++;
      continue;
    }

    // Empty line
    if (!trimmed) {
      blocks.push({ type: 'empty', payload: null });
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push({ type: 'p', payload: trimmed });
    i++;
  }

  return (
    <div className={`space-y-2.5 text-sm leading-relaxed text-slate-200 ${className}`}>
      {thinkSection && (
        <div className="mb-4 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/25 text-xs text-slate-300 font-mono space-y-1.5 shadow-inner">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px] mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chain-of-Thought Reasoning Trace</span>
          </div>
          {thinkSection.split('\n').map((tLine, idx) => (
            <div key={idx} className="pl-3 border-l border-emerald-500/30 text-slate-300">
              {renderFormattedInline(tLine)}
            </div>
          ))}
        </div>
      )}

      {blocks.map((block, idx) => {
        if (block.type === 'empty') {
          return <div key={idx} className="h-1.5" />;
        }

        if (block.type === 'h1') {
          return (
            <h1 key={idx} className="font-heading text-xl sm:text-2xl font-extrabold text-white mt-6 mb-3 tracking-tight border-b border-slate-800 pb-2">
              {renderFormattedInline(block.payload)}
            </h1>
          );
        }

        if (block.type === 'h2') {
          return (
            <h2 key={idx} className="font-heading text-lg sm:text-xl font-bold text-white mt-5 mb-2 tracking-tight">
              {renderFormattedInline(block.payload)}
            </h2>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3 key={idx} className="font-heading text-base font-bold text-emerald-400 mt-4 mb-2 tracking-tight">
              {renderFormattedInline(block.payload)}
            </h3>
          );
        }

        if (block.type === 'h4') {
          return (
            <h4 key={idx} className="font-heading text-sm font-semibold text-teal-300 mt-3 mb-1.5">
              {renderFormattedInline(block.payload)}
            </h4>
          );
        }

        if (block.type === 'hr') {
          return <hr key={idx} className="my-5 border-slate-800/80" />;
        }

        if (block.type === 'table') {
          const { headers, rows } = block.payload;
          return (
            <div key={idx} className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-[#090D17]/80 shadow-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-300 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-800">
                  <tr>
                    {headers.map((h: string, hi: number) => (
                      <th key={hi} className="py-3 px-4 whitespace-nowrap">
                        {renderFormattedInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rows.map((row: string[], ri: number) => (
                    <tr key={ri} className="hover:bg-slate-800/30 transition-colors">
                      {row.map((cell: string, ci: number) => (
                        <td key={ci} className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                          {renderCellContent(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'code') {
          return (
            <div key={idx} className="my-3 rounded-xl bg-[#070A12] border border-slate-800/90 p-4 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
              {block.payload.lang && (
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-mono">
                  {block.payload.lang}
                </div>
              )}
              <pre className="clean-nums">
                <code>{block.payload.code}</code>
              </pre>
            </div>
          );
        }

        if (block.type === 'bullet') {
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1">
              <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1 text-slate-200">
                {renderFormattedInline(block.payload)}
              </div>
            </div>
          );
        }

        if (block.type === 'numbered') {
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1">
              <span className="text-emerald-400 font-mono text-xs font-bold shrink-0 mt-0.5 clean-nums">
                {block.payload.num}.
              </span>
              <div className="flex-1 text-slate-200">
                {renderFormattedInline(block.payload.text)}
              </div>
            </div>
          );
        }

        // Paragraph
        return (
          <p key={idx} className="text-slate-200 leading-relaxed my-1">
            {renderFormattedInline(block.payload)}
          </p>
        );
      })}
    </div>
  );
};
