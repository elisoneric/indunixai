import React, { useState, useMemo } from 'react';
import {
  RefreshCw, Filter, Key, Calendar, Layers, ChevronDown, ChevronRight,
  Search, Download, Clock, Activity, Coins, Zap, Shield, FileText, Check
} from 'lucide-react';
import { UsageLogItem, ApiKeyItem } from '../../api/client';
import { formatNaira, formatDate } from '../../utils/formatters';

interface UsageLogsViewProps {
  logs: UsageLogItem[];
  keys?: ApiKeyItem[];
  onRefresh: () => void;
  selectedFilter: string;
  onFilterChange: (model: string) => void;
}

export type GroupByOption = 'none' | 'api_key' | 'model' | 'date';
export type TimeFilterOption = 'all' | '24h' | '7d' | '30d';

interface GroupedData {
  groupKey: string;
  groupTitle: string;
  groupSubtitle?: string;
  groupType: 'api_key' | 'model' | 'date';
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCostNgn: number;
  avgLatencyMs: number;
  logs: UsageLogItem[];
}

export const UsageLogsView: React.FC<UsageLogsViewProps> = ({
  logs,
  keys = [],
  onRefresh,
  selectedFilter,
  onFilterChange,
}) => {
  // State
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('all');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // 1. Filter logs by Time, API Key, Model, and Search query
  const filteredLogs = useMemo(() => {
    const now = new Date();

    return logs.filter((log) => {
      // Model Filter
      if (selectedFilter && log.model_requested !== selectedFilter) {
        return false;
      }

      // API Key Filter
      if (selectedApiKey === 'playground') {
        if (log.api_key_id) return false;
      } else if (selectedApiKey !== 'all') {
        if (log.api_key_id !== selectedApiKey) return false;
      }

      // Time Filter
      if (timeFilter !== 'all') {
        const logDate = new Date(log.created_at);
        const diffMs = now.getTime() - logDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (timeFilter === '24h' && diffHours > 24) return false;
        if (timeFilter === '7d' && diffHours > 24 * 7) return false;
        if (timeFilter === '30d' && diffHours > 24 * 30) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchId = log.id.toLowerCase().includes(q);
        const matchModel = log.model_requested.toLowerCase().includes(q);
        const matchKeyName = (log.api_key_name || '').toLowerCase().includes(q);
        const matchKeyPrefix = (log.api_key_prefix || '').toLowerCase().includes(q);
        if (!matchId && !matchModel && !matchKeyName && !matchKeyPrefix) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedFilter, selectedApiKey, timeFilter, searchQuery]);

  // 2. Metrics summary based on currently filtered logs
  const metrics = useMemo(() => {
    const totalRequests = filteredLogs.length;
    const promptTokens = filteredLogs.reduce((acc, l) => acc + (l.prompt_tokens || 0), 0);
    const completionTokens = filteredLogs.reduce((acc, l) => acc + (l.completion_tokens || 0), 0);
    const totalTokens = filteredLogs.reduce((acc, l) => acc + (l.total_tokens || 0), 0);
    const totalCostNgn = filteredLogs.reduce((acc, l) => acc + (l.cost_deducted_ngn || 0), 0);
    const avgLatencyMs = totalRequests > 0
      ? Math.round(filteredLogs.reduce((acc, l) => acc + (l.latency_ms || 0), 0) / totalRequests)
      : 0;
    const streamRequests = filteredLogs.filter((l) => l.is_stream).length;

    return {
      totalRequests,
      promptTokens,
      completionTokens,
      totalTokens,
      totalCostNgn,
      avgLatencyMs,
      streamRequests,
    };
  }, [filteredLogs]);

  // 3. Grouped logs data structure
  const groupedData = useMemo((): GroupedData[] => {
    if (groupBy === 'none') return [];

    const map: Record<string, GroupedData> = {};

    filteredLogs.forEach((log) => {
      let key = '';
      let title = '';
      let subtitle = '';

      if (groupBy === 'api_key') {
        if (!log.api_key_id) {
          key = 'session_playground';
          title = 'Browser Session / Interactive Playground';
          subtitle = 'No API key attached';
        } else {
          key = log.api_key_id;
          title = log.api_key_name || 'API Key';
          subtitle = log.api_key_prefix ? `${log.api_key_prefix}...` : key.slice(0, 8);
        }
      } else if (groupBy === 'model') {
        key = log.model_requested;
        title = log.model_requested;
        subtitle = 'Indunix Sovereign Model';
      } else if (groupBy === 'date') {
        const d = new Date(log.created_at);
        key = d.toISOString().slice(0, 10);
        title = d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        subtitle = key;
      }

      if (!map[key]) {
        map[key] = {
          groupKey: key,
          groupTitle: title,
          groupSubtitle: subtitle,
          groupType: groupBy,
          totalRequests: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          totalCostNgn: 0,
          avgLatencyMs: 0,
          logs: [],
        };
      }

      const g = map[key];
      g.totalRequests += 1;
      g.promptTokens += log.prompt_tokens || 0;
      g.completionTokens += log.completion_tokens || 0;
      g.totalTokens += log.total_tokens || 0;
      g.totalCostNgn += log.cost_deducted_ngn || 0;
      g.logs.push(log);
    });

    // Calculate latency averages and sort descending by requests
    const list = Object.values(map);
    list.forEach((g) => {
      const sumLat = g.logs.reduce((acc, l) => acc + (l.latency_ms || 0), 0);
      g.avgLatencyMs = g.totalRequests > 0 ? Math.round(sumLat / g.totalRequests) : 0;
    });

    return list.sort((a, b) => b.totalRequests - a.totalRequests);
  }, [filteredLogs, groupBy]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExpandAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    groupedData.forEach((g) => {
      next[g.groupKey] = expand;
    });
    setExpandedGroups(next);
  };

  // CSV Export
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Timestamp', 'API Key Name', 'Key Prefix', 'Model', 'Prompt Tokens', 'Completion Tokens', 'Total Tokens', 'Latency (ms)', 'Cost (NGN)', 'Stream Mode'];
      const rows = filteredLogs.map((l) => [
        l.created_at,
        `"${(l.api_key_name || 'Playground/Session').replace(/"/g, '""')}"`,
        l.api_key_prefix || 'N/A',
        l.model_requested,
        l.prompt_tokens,
        l.completion_tokens,
        l.total_tokens,
        l.latency_ms,
        l.cost_deducted_ngn.toFixed(4),
        l.is_stream ? 'SSE' : 'HTTP',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `indunix_usage_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-zinc-100">
      {/* Page Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-white flex items-center gap-2.5">
            <span>Live Request & Token Telemetry</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              LIVE
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit immutable compute telemetry, analyze token consumption, and filter logs by API Key, time period, or model.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0 || isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Live Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Metrics Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Filtered Requests</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {metrics.totalRequests.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {metrics.streamRequests} streaming SSE
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Tokens</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {metrics.totalTokens.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {metrics.promptTokens.toLocaleString()} in / {metrics.completionTokens.toLocaleString()} out
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Deducted</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatNaira(metrics.totalCostNgn)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Direct Naira settlements
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Avg Gateway Latency</div>
          <div className="text-xl font-bold font-mono text-teal-300 mt-1">
            {metrics.avgLatencyMs}ms
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Sub-15ms edge routing
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Group Mode</div>
          <div className="text-sm font-bold text-zinc-200 mt-1.5 flex items-center gap-1.5 capitalize">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>{groupBy === 'none' ? 'Flat List' : `By ${groupBy.replace('_', ' ')}`}</span>
          </div>
        </div>
      </div>

      {/* Control Strip: Grouping + Time Filter + API Key Filter + Model Filter + Search */}
      <div className="p-4 rounded-2xl bg-[#090D16] border border-slate-800 shadow-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Group By Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Group Logs By</span>
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="none">No Grouping (Flat Request Feed)</option>
              <option value="api_key">Group by API Key & Session</option>
              <option value="model">Group by Model Requested</option>
              <option value="date">Group by Date (Daily)</option>
            </select>
          </div>

          {/* 2. Time Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Time Window</span>
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilterOption)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="all">All Time History</option>
              <option value="24h">Past 24 Hours (Today)</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          {/* 3. API Key Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3 h-3 text-purple-400" />
              <span>Filter by API Key</span>
            </label>
            <select
              value={selectedApiKey}
              onChange={(e) => setSelectedApiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="all">All API Keys & Sessions</option>
              <option value="playground">Playground / Browser Sessions Only</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.key_prefix}...)
                </option>
              ))}
            </select>
          </div>

          {/* 4. Model Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-emerald-400" />
              <span>Filter by Model</span>
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="">All Sovereign Models</option>
              <option value="indunix-1-spark">indunix-1-spark (Sub-second)</option>
              <option value="indunix-1-core">indunix-1-core (Flagship)</option>
              <option value="indunix-1-reason">indunix-1-reason (Reasoning)</option>
              <option value="indunix-edge-local">indunix-edge-local (On-Prem)</option>
            </select>
          </div>
        </div>

        {/* Search Bar & Reset Filter Options */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by log ID, key name, prefix, or model..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            {groupBy !== 'none' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleExpandAll(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={() => handleExpandAll(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
                >
                  Collapse All
                </button>
              </div>
            )}

            {(selectedFilter || selectedApiKey !== 'all' || timeFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  onFilterChange('');
                  setSelectedApiKey('all');
                  setTimeFilter('all');
                  setSearchQuery('');
                }}
                className="text-[11px] text-emerald-400 hover:underline font-mono px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Grouped Accordions OR Flat Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 space-y-2">
          <FileText className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
          <div className="text-sm font-semibold text-slate-400">No matching usage records found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your time window, API key, or model filter to view historical telemetry logs.
          </p>
        </div>
      ) : groupBy !== 'none' ? (
        /* Grouped View Accordions */
        <div className="space-y-4">
          {groupedData.map((group) => {
            const isExpanded = expandedGroups[group.groupKey] ?? true;

            return (
              <div
                key={group.groupKey}
                className="rounded-2xl border border-slate-800 bg-[#090D17] overflow-hidden shadow-lg transition-all"
              >
                {/* Group Accordion Header */}
                <div
                  onClick={() => toggleGroup(group.groupKey)}
                  className="p-4 bg-slate-900/70 hover:bg-slate-900 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 select-none transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button className="p-1 rounded text-slate-400 hover:text-white shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                      {group.groupType === 'api_key' ? (
                        <Key className="w-4 h-4 text-purple-400" />
                      ) : group.groupType === 'model' ? (
                        <Zap className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Calendar className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white flex items-center gap-2 truncate">
                        <span>{group.groupTitle}</span>
                        {group.groupSubtitle && (
                          <span className="text-[11px] font-mono font-normal text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/[0.06]">
                            {group.groupSubtitle}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {group.totalRequests} request{group.totalRequests === 1 ? '' : 's'} recorded
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges on Group Card */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-slate-800 text-cyan-300">
                      {group.totalTokens.toLocaleString()} tokens
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-slate-800 text-emerald-400 font-bold">
                      {formatNaira(group.totalCostNgn)}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-black/40 border border-slate-800 text-slate-400">
                      {group.avgLatencyMs}ms avg
                    </span>
                  </div>
                </div>

                {/* Group Logs Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {renderLogsTable(group.logs, false)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Table View */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {renderLogsTable(filteredLogs, true)}
          </div>
        </div>
      )}
    </div>
  );

  // Helper Table Renderer
  function renderLogsTable(logsList: UsageLogItem[], showKeyColumn = true) {
    return (
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
          <tr>
            <th className="py-3 px-5 whitespace-nowrap">Timestamp</th>
            {showKeyColumn && <th className="py-3 px-5 whitespace-nowrap">API Key</th>}
            <th className="py-3 px-5 whitespace-nowrap">Model</th>
            <th className="py-3 px-5 text-right whitespace-nowrap">Prompt</th>
            <th className="py-3 px-5 text-right whitespace-nowrap">Completion</th>
            <th className="py-3 px-5 text-right whitespace-nowrap">Total Tokens</th>
            <th className="py-3 px-5 text-right whitespace-nowrap">Latency</th>
            <th className="py-3 px-5 text-right whitespace-nowrap">Cost Deducted</th>
            <th className="py-3 px-5 text-center whitespace-nowrap">Mode</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-850 text-slate-300">
          {logsList.map((log) => (
            <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
              <td className="py-3 px-5 text-slate-400 whitespace-nowrap text-[11px]">
                {formatDate(log.created_at)}
              </td>

              {showKeyColumn && (
                <td className="py-3 px-5 whitespace-nowrap">
                  {log.api_key_name ? (
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {log.api_key_name}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                      Playground / Session
                    </span>
                  )}
                </td>
              )}

              <td className="py-3 px-5 whitespace-nowrap">
                <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {log.model_requested}
                </span>
              </td>

              <td className="py-3 px-5 text-right text-slate-400">
                {log.prompt_tokens.toLocaleString()}
              </td>

              <td className="py-3 px-5 text-right text-slate-400">
                {log.completion_tokens.toLocaleString()}
              </td>

              <td className="py-3 px-5 text-right font-bold text-cyan-400">
                {log.total_tokens.toLocaleString()}
              </td>

              <td className="py-3 px-5 text-right text-slate-400">
                {log.latency_ms}ms
              </td>

              <td className="py-3 px-5 text-right font-bold text-emerald-400">
                {formatNaira(log.cost_deducted_ngn)}
              </td>

              <td className="py-3 px-5 text-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  log.is_stream ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                }`}>
                  {log.is_stream ? 'SSE' : 'HTTP'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
};
