import React from 'react';
import { Flame, Moon, Bot, Zap, Code, AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { ParsedChat } from '../types';
import { SpicinessHearts } from './CheetahPattern';

interface SpicyAnalyticsProps {
  chats: ParsedChat[];
  onSelectChat?: (chat: ParsedChat) => void;
  onAskDeepAnalyst?: (prompt: string) => void;
}

export const SpicyAnalytics: React.FC<SpicyAnalyticsProps> = ({ chats, onSelectChat, onAskDeepAnalyst }) => {
  if (chats.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-400">
        <p>No chat data available. Upload files or load sample chats to view analytics.</p>
      </div>
    );
  }

  // 1. Calculations
  const totalChats = chats.length;
  const totalTurns = chats.reduce((acc, c) => acc + c.turnsCount, 0);
  const totalTokens = chats.reduce((acc, c) => acc + c.tokenEstimate, 0);
  const totalUserWords = chats.reduce((acc, c) => acc + c.userWordCount, 0);
  const totalAiWords = chats.reduce((acc, c) => acc + c.aiWordCount, 0);
  const lateNightChats = chats.filter((c) => c.isLateNight).length;
  const lateNightPct = Math.round((lateNightChats / totalChats) * 100);
  const totalApologies = chats.reduce((acc, c) => acc + c.apologyCount, 0);
  const totalCodeSnippets = chats.reduce((acc, c) => acc + c.codeBlocksCount, 0);

  // Platform distribution
  const platformCounts: Record<string, number> = {};
  chats.forEach((c) => {
    platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
  });
  const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
  const dominantPlatform = sortedPlatforms[0]?.[0] || 'Unknown';
  const dominantPct = Math.round(((sortedPlatforms[0]?.[1] || 0) / totalChats) * 100);

  // Topic distribution
  const topicCounts: Record<string, number> = {};
  chats.forEach((c) => {
    topicCounts[c.primaryTopic] = (topicCounts[c.primaryTopic] || 0) + 1;
  });
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

  // Code languages
  const langCounts: Record<string, number> = {};
  chats.forEach((c) => {
    c.codeLanguages.forEach((lang) => {
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    });
  });
  const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);

  // Spiciness levels
  const spicinessCounts = [0, 0, 0, 0, 0];
  chats.forEach((c) => {
    const idx = Math.min(5, Math.max(1, c.spiciness)) - 1;
    spicinessCounts[idx] += 1;
  });

  // Most intense / longest chat
  const longestChat = [...chats].sort((a, b) => b.tokenEstimate - a.tokenEstimate)[0];

  return (
    <div className="space-y-6">
      {/* 5-Column High-Impact KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Ingested */}
        <div className="p-4 rounded-2xl bg-[#170929] border border-pink-500/20 shadow-md relative overflow-hidden">
          <div className="text-xs font-semibold text-pink-300 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Ingested Chats</span>
            <Flame size={14} className="text-[#ff2a85]" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-white tabular-nums">
            {totalChats}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            <span className="text-pink-300 font-medium">{totalTurns}</span> total turns
          </div>
        </div>

        {/* Token Burn */}
        <div className="p-4 rounded-2xl bg-[#170929] border border-pink-500/20 shadow-md relative overflow-hidden">
          <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Estimated Tokens</span>
            <Zap size={14} className="text-[#d946ef]" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-purple-200 tabular-nums">
            {(totalTokens / 1000).toFixed(1)}k
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            ~${((totalTokens / 1000) * 0.003).toFixed(2)} compute est.
          </div>
        </div>

        {/* Dominant Platform */}
        <div className="p-4 rounded-2xl bg-[#170929] border border-pink-500/20 shadow-md relative overflow-hidden">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Dominant Platform</span>
            <Bot size={14} className="text-[#fbbf24]" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-white truncate">
            {dominantPlatform}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            <span className="text-amber-300 font-medium">{dominantPct}%</span> of all sessions
          </div>
        </div>

        {/* Late-Night Ratio */}
        <div className="p-4 rounded-2xl bg-[#170929] border border-pink-500/20 shadow-md relative overflow-hidden">
          <div className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Late-Night Ratio</span>
            <Moon size={14} className="text-[#ff2a85]" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-rose-300 tabular-nums">
            {lateNightPct}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {lateNightChats} chats between 12am-5am
          </div>
        </div>

        {/* Apology & Hallucination Radar */}
        <div className="p-4 rounded-2xl bg-[#170929] border border-pink-500/20 shadow-md relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Apology Radar</span>
            <AlertTriangle size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-white tabular-nums">
            {totalApologies}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            AI backtracks detected
          </div>
        </div>
      </div>

      {/* Grid: Platform Breakdown + Topic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Platform Share */}
        <div className="p-5 rounded-2xl bg-[#140722] border border-pink-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              Platform Market Share
            </h3>
            <span className="text-xs text-neutral-400 font-mono">{sortedPlatforms.length} platforms</span>
          </div>

          <div className="space-y-3">
            {sortedPlatforms.map(([platform, count]) => {
              const pct = Math.round((count / totalChats) * 100);
              let barColor = 'from-pink-500 to-rose-600';
              if (platform === 'Claude') barColor = 'from-purple-500 to-indigo-600';
              if (platform === 'ChatGPT') barColor = 'from-emerald-400 to-teal-600';
              if (platform === 'Gemini') barColor = 'from-blue-400 to-blue-600';
              if (platform === 'DeepSeek') barColor = 'from-cyan-400 to-blue-500';
              if (platform === 'Cursor/Copilot') barColor = 'from-violet-500 to-fuchsia-600';

              return (
                <div key={platform} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-200">{platform}</span>
                    <span className="font-mono text-neutral-400">{count} chats ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Clusters */}
        <div className="p-5 rounded-2xl bg-[#140722] border border-pink-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Primary Topic Clusters
            </h3>
            <span className="text-xs text-neutral-400 font-mono">{sortedTopics.length} detected</span>
          </div>

          <div className="space-y-3">
            {sortedTopics.slice(0, 6).map(([topic, count]) => {
              const pct = Math.round((count / totalChats) * 100);
              return (
                <div key={topic} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-200">{topic}</span>
                    <span className="font-mono text-neutral-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row: Verbosity Ratio & Code Language Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User vs AI Verbosity */}
        <div className="p-5 rounded-2xl bg-[#140722] border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Verbosity Balance
          </h3>
          <div className="pt-2 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-300">
              <span>You (User Words):</span>
              <span className="font-mono font-semibold text-pink-300">{totalUserWords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-300">
              <span>AI (Generated Words):</span>
              <span className="font-mono font-semibold text-purple-300">{totalAiWords.toLocaleString()}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-900 overflow-hidden flex mt-2">
              <div
                className="bg-pink-500 h-full"
                style={{ width: `${Math.round((totalUserWords / (totalUserWords + totalAiWords || 1)) * 100)}%` }}
                title="User Words"
              />
              <div
                className="bg-purple-600 h-full flex-1"
                title="AI Words"
              />
            </div>
            <div className="flex justify-between text-[11px] text-neutral-500 pt-1">
              <span>User: {Math.round((totalUserWords / (totalUserWords + totalAiWords || 1)) * 100)}%</span>
              <span>AI: {Math.round((totalAiWords / (totalUserWords + totalAiWords || 1)) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Code Snippets Languages */}
        <div className="p-5 rounded-2xl bg-[#140722] border border-pink-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Code size={14} className="text-amber-400" />
              <span>Languages</span>
            </h3>
            <span className="text-xs font-mono text-neutral-400">{totalCodeSnippets} snippets</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {sortedLangs.length > 0 ? (
              sortedLangs.map(([lang, count]) => (
                <span
                  key={lang}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-700/60 text-xs font-mono text-pink-200 flex items-center gap-1.5"
                >
                  <span>{lang}</span>
                  <span className="text-[10px] text-neutral-400 font-semibold bg-neutral-800 px-1 py-0.2 rounded">
                    {count}
                  </span>
                </span>
              ))
            ) : (
              <span className="text-xs text-neutral-500">No code blocks detected.</span>
            )}
          </div>
        </div>

        {/* Spiciness Level Spectrum */}
        <div className="p-5 rounded-2xl bg-[#140722] border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Flame size={14} className="text-rose-400" />
            <span>Spiciness Spectrum</span>
          </h3>
          <div className="space-y-1.5 pt-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = spicinessCounts[stars - 1] || 0;
              const pct = Math.round((count / totalChats) * 100);
              return (
                <div key={stars} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <SpicinessHearts rating={stars} max={stars} size={11} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                      <div className="h-full bg-pink-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-neutral-400 text-[11px] w-6 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Longest Session Spotlight */}
      {longestChat && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#200a33] via-[#170726] to-[#12051e] border border-pink-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
              🔥 Heaviest Single Deep-Dive Session
            </div>
            <h4 className="text-base font-bold text-white">{longestChat.title}</h4>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
              <span>{longestChat.platform} ({longestChat.model})</span>
              <span>·</span>
              <span className="font-mono text-pink-300">~{longestChat.tokenEstimate.toLocaleString()} tokens</span>
              <span>·</span>
              <span>{longestChat.turnsCount} turns</span>
            </div>
          </div>
          {onSelectChat && (
            <button
              onClick={() => onSelectChat(longestChat)}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 transition shadow-lg shadow-pink-600/30"
            >
              <span>Inspect Transcript</span>
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
