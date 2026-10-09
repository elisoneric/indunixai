import React, { useState } from 'react';
import { Activity, RefreshCw, Filter, Clock, Zap, Coins } from 'lucide-react';
import { UsageLogItem } from '../../api/client';
import { formatNaira, formatDate } from '../../utils/formatters';

interface UsageLogsViewProps {
  logs: UsageLogItem[];
  onRefresh: () => void;
  selectedFilter: string;
  onFilterChange: (model: string) => void;
}

export const UsageLogsView: React.FC<UsageLogsViewProps> = ({
  logs,
  onRefresh,
  selectedFilter,
  onFilterChange,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-white">
            Live Request & Token Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable telemetry records for every API completion through the Indunix sovereign gateway.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Model Filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none font-mono text-xs cursor-pointer"
            >
              <option value="">All Models</option>
              <option value="indunix-1-spark">indunix-1-spark</option>
              <option value="indunix-1-core">indunix-1-core</option>
              <option value="indunix-1-reason">indunix-1-reason</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Model Requested</th>
                <th className="py-3.5 px-6">Prompt Tokens</th>
                <th className="py-3.5 px-6">Completion</th>
                <th className="py-3.5 px-6">Total Tokens</th>
                <th className="py-3.5 px-6">Latency</th>
                <th className="py-3.5 px-6">Cost Deducted</th>
                <th className="py-3.5 px-6">Stream</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No requests recorded yet. Make a request via Python, cURL, or the Playground!
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-6 text-slate-400">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {log.model_requested}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">
                      {log.prompt_tokens}
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">
                      {log.completion_tokens}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-cyan-400">
                      {log.total_tokens}
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">
                      {log.latency_ms}ms
                    </td>
                    <td className="py-3.5 px-6 font-bold text-emerald-400">
                      {formatNaira(log.cost_deducted_ngn)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.is_stream ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {log.is_stream ? 'SSE' : 'HTTP'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
