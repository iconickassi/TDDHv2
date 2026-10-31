import React, { useState } from 'react';
import { X, Copy, Check, Heart, Code, Clock, User, Bot, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ParsedChat } from '../types';
import { SpicinessHearts } from './CheetahPattern';

interface ChatReaderModalProps {
  chat: ParsedChat | null;
  onClose: () => void;
  onToggleFavorite?: (id: string) => void;
}

export const ChatReaderModal: React.FC<ChatReaderModalProps> = ({ chat, onClose, onToggleFavorite }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!chat) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadMarkdown = () => {
    const mdContent = [
      `# ${chat.title}`,
      `**Platform:** ${chat.platform} (${chat.model})`,
      `**Date:** ${chat.date} ${chat.time || ''}`,
      `**Topic:** ${chat.primaryTopic} | **Tone:** ${chat.tone} | **Spiciness:** ${chat.spiciness}/5 hearts`,
      `**Tokens:** ~${chat.tokenEstimate.toLocaleString()} (${chat.turnsCount} turns)`,
      '',
      '---',
      '',
      ...chat.messages.map((m) => {
        const speaker = m.role === 'user' ? 'User' : `${chat.platform} (${chat.model})`;
        return `### ${speaker} (${m.timestamp || ''})\n\n${m.content}\n`;
      }),
    ].join('\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#140722] border border-pink-500/25 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Glam top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ff2a85] via-[#d946ef] via-[#fbbf24] to-[#ff2a85]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-pink-500/15 flex items-start justify-between gap-4 bg-[#1a0b2d]/80">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {chat.platform}
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">{chat.model}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-300 font-medium">{chat.primaryTopic}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-400">{chat.date} {chat.time || ''}</span>
              {chat.isLateNight && (
                <span className="text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-500/30">
                  🌙 2AM-5AM Late Night
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug line-clamp-2">
              {chat.title}
            </h2>
            <div className="flex items-center gap-3 pt-0.5 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Spiciness:</span>
                <SpicinessHearts rating={chat.spiciness} />
              </div>
              <span className="text-neutral-600">·</span>
              <span>{chat.turnsCount} turns</span>
              <span className="text-neutral-600">·</span>
              <span className="font-mono text-pink-300">~{chat.tokenEstimate.toLocaleString()} tokens</span>
              {chat.apologyCount > 0 && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded text-[11px]">
                    {chat.apologyCount} AI apology
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(chat.id)}
                className={`p-2 rounded-xl transition border ${
                  chat.isFavorite
                    ? 'bg-pink-500/20 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(255,42,133,0.4)]'
                    : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-400 hover:text-pink-300 hover:border-pink-500/40'
                }`}
                title="Heart this chat"
              >
                <Heart size={16} className={chat.isFavorite ? 'fill-pink-500 text-pink-500' : ''} />
              </button>
            )}
            <button
              onClick={handleDownloadMarkdown}
              className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-700/60 text-neutral-300 hover:text-white hover:border-pink-500/40 transition"
              title="Download chat markdown"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-700/60 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Close viewer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Conversation Message Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#0f051a]">
          {chat.messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id || idx}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border ${
                    isUser
                      ? 'bg-gradient-to-br from-[#2a103c] to-[#1e0a2d] border-pink-500/30 text-rose-50 shadow-sm'
                      : 'bg-[#180a26] border-purple-500/20 text-neutral-200 shadow-md'
                  }`}
                >
                  {/* Speaker and metadata header */}
                  <div className="flex items-center justify-between gap-3 mb-2 text-xs border-b border-white/5 pb-1.5">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-neutral-300">
                      {isUser ? (
                        <>
                          <User size={12} className="text-pink-400" />
                          <span>You</span>
                        </>
                      ) : (
                        <>
                          <span className="text-purple-300 font-semibold">{chat.platform}</span>
                          <span className="text-neutral-500 font-mono text-[10px]">({chat.model})</span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-neutral-500">
                        {m.wordCount} words
                      </span>
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="text-neutral-400 hover:text-pink-300 transition p-1"
                        title="Copy turn text"
                      >
                        {copiedId === m.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="prose prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const isInline = inline || !String(children).includes('\n');
                          if (isInline) {
                            return (
                              <code className="bg-pink-950/40 text-pink-300 border border-pink-500/20 px-1 py-0.5 rounded font-mono text-[12px]" {...props}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <div className="relative group my-3 rounded-xl overflow-hidden border border-purple-500/30 bg-[#090310]">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#170827] text-xs font-mono text-neutral-400 border-b border-purple-500/20">
                                <span className="flex items-center gap-1.5 text-pink-300">
                                  <Code size={12} />
                                  <span>Snippet</span>
                                </span>
                                <button
                                  onClick={() => handleCopy(String(children), `code-${idx}`)}
                                  className="hover:text-white transition flex items-center gap-1 text-[11px]"
                                >
                                  {copiedId === `code-${idx}` ? (
                                    <>
                                      <Check size={11} className="text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-3 text-[12px] font-mono overflow-x-auto text-pink-100">
                                <code {...props}>{children}</code>
                              </pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-pink-600/30 border border-pink-500/40 flex items-center justify-center text-pink-300 shrink-0 shadow-md">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
