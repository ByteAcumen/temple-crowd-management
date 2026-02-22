'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import {
    MessageCircle, X, Send, RotateCcw, Maximize2, Minimize2,
    Copy, Check, ChevronRight, Bot, Sparkles, Zap,
    AlertTriangle, Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    source?: string;
    error?: boolean;
}

type UserRole = 'user' | 'admin' | 'gatekeeper';

// ─────────────────────────────────────────────────
// Role config
// ─────────────────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, {
    label: string;
    greeting: string;
    suggestions: string[];
    accent: string;
    badge: string;
}> = {
    user: {
        label: 'Temple Guide',
        greeting: '🙏 Namaste! I\'m your Temple AI Guide.\n\nI can help you **book a visit**, check **live crowd status**, understand the **QR e-pass system**, and answer any temple question. How can I help you today?',
        suggestions: [
            'How do I book a temple visit?',
            'Is Tirupati crowded right now?',
            'How does QR e-pass work?',
            'Best time to visit temples?',
        ],
        accent: 'from-orange-500 to-red-500',
        badge: '🙏 Devotee',
    },
    admin: {
        label: 'Admin AI Assistant',
        greeting: '👑 Welcome, Admin! I\'m your TempleAI assistant with full system visibility.\n\nI can help with **crowd analytics**, **booking management**, **staff operations**, and **live monitoring**. What do you need?',
        suggestions: [
            'Which temples are critically full?',
            'Show total booking statistics',
            'How many visitors today?',
            'Explain the live monitor dashboard',
        ],
        accent: 'from-blue-600 to-indigo-600',
        badge: '⚙️ Admin',
    },
    gatekeeper: {
        label: 'Gate Staff Assistant',
        greeting: '🔑 Hello Gate Staff! I\'m here to support your duties.\n\nI can guide you on **scanning QR codes**, **manual entries**, **crowd threshold actions**, and **shift reporting**. What do you need help with?',
        suggestions: [
            'How do I scan a QR code?',
            'What if QR scan fails?',
            'How to do manual entry?',
            'What do RED/ORANGE alerts mean?',
        ],
        accent: 'from-emerald-500 to-teal-600',
        badge: '🔑 Gatekeeper',
    },
};

// ─────────────────────────────────────────────────
// Markdown-like text renderer (no external dep)
// ─────────────────────────────────────────────────
function renderMarkdown(text: string): string {
    return text
        // Bold **text**
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic *text* (single asterisk not followed by another asterisk)
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        // Bullet points (lines starting with -)
        .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>[\s\S]*?<\/li>)(\n?<li>[\s\S]*?<\/li>)*/g, (match) => `<ul class="list-none space-y-1 my-1">${match}</ul>`)
        // Numbered lists
        .replace(/^\d+\. (.+)$/gm, '<li class="ml-3">$1</li>')
        // Headers ##
        .replace(/^## (.+)$/gm, '<p class="font-black text-sm mt-2 mb-0.5">$1</p>')
        // Code `inline`
        .replace(/`(.+?)`/g, '<code class="bg-slate-100 text-orange-600 px-1 rounded text-xs font-mono">$1</code>')
        // Line breaks
        .replace(/\n/g, '<br/>');
}

function BotMessage({ content, error }: { content: string; error?: boolean }) {
    return (
        <div
            className={`text-sm leading-relaxed ${error ? 'text-red-600' : 'text-slate-700'}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
    );
}

// ─────────────────────────────────────────────────
// Copy button
// ─────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
            title="Copy"
        >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}

// ─────────────────────────────────────────────────
// Typing dots animation
// ─────────────────────────────────────────────────
function TypingIndicator() {
    return (
        <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                        <div
                            key={delay}
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                        />
                    ))}
                </div>
                <span className="text-xs text-slate-400 font-medium">TempleAI is thinking…</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────
// Source badge
// ─────────────────────────────────────────────────
function SourceBadge({ source }: { source?: string }) {
    if (!source || source === 'local_kb') return null;
    const configs: Record<string, { label: string; icon: string; color: string }> = {
        gemini_ai: { label: 'Gemini AI', icon: '✨', color: 'bg-blue-50 text-blue-600 border-blue-100' },
        ml_service: { label: 'ML Engine', icon: '🤖', color: 'bg-purple-50 text-purple-600 border-purple-100' },
        intent_tool: { label: 'Live Data', icon: '📡', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    };
    const cfg = configs[source];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.color} mt-1`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────
export function ChatbotWidget() {
    const { user } = useAuth();
    const role: UserRole = (user?.role as UserRole) || 'user';
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;

    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>(cfg.suggestions);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasOpened, setHasOpened] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Init messages when opened first time ──
    useEffect(() => {
        if (isOpen && !hasOpened) {
            setHasOpened(true);
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: cfg.greeting,
                timestamp: new Date(),
            }]);
        }
    }, [isOpen, hasOpened, cfg.greeting]);

    // ── Auto scroll ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // ── Focus input on open ──
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // ── Track unread ──
    useEffect(() => {
        if (!isOpen && messages.length > 1) {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages.length]); // eslint-disable-line

    const open = () => { setIsOpen(true); setUnreadCount(0); };
    const close = () => setIsOpen(false);

    // ── Send message ──
    const send = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        setInput('');
        const userMsg: Message = {
            id: `u_${Date.now()}`,
            role: 'user',
            content: trimmed,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
            const res = await fetch(`${API_BASE}/bot/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: trimmed,
                    sessionId,
                    role,
                }),
                signal: AbortSignal.timeout(20000),
            });

            const data = await res.json();

            if (data.sessionId) setSessionId(data.sessionId);
            if (data.suggestedQuestions?.length) setSuggestions(data.suggestedQuestions);

            const botMsg: Message = {
                id: `b_${Date.now()}`,
                role: 'assistant',
                content: data.answer || data.error || "I couldn't process that. Please try again.",
                timestamp: new Date(),
                source: data.source,
                error: !data.success && !data.answer,
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (e: any) {
            const errorMsg: Message = {
                id: `e_${Date.now()}`,
                role: 'assistant',
                content: e.name === 'TimeoutError'
                    ? '⏱️ Response took too long. Please try again.'
                    : '🔌 Connection error. Make sure the backend is running, then try again.',
                timestamp: new Date(),
                error: true,
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isLoading, sessionId, role]);

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    const clearChat = () => {
        setMessages([{
            id: 'welcome_reset',
            role: 'assistant',
            content: cfg.greeting,
            timestamp: new Date(),
        }]);
        setSessionId(null);
        setSuggestions(cfg.suggestions);
    };

    const panelW = isFullscreen ? 'w-[min(700px,95vw)]' : 'w-80 sm:w-[420px]';
    const panelH = isFullscreen ? 'h-[85vh]' : 'h-[580px] max-h-[80vh]';
    const accentGrad = `bg-gradient-to-r ${cfg.accent}`;

    return (
        <div className="fixed bottom-5 right-5 z-[9990] flex flex-col items-end gap-3">

            {/* ── Chat Panel ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.93 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className={`${panelW} ${panelH} bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden`}
                        style={{ maxWidth: 'calc(100vw - 24px)' }}
                    >
                        {/* ── Header ── */}
                        <div className={`${accentGrad} px-4 py-3.5 flex items-center justify-between shrink-0`}>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-sm">TempleAI {cfg.label}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-white/80 font-medium">Powered by AI · </span>
                                        <span className="text-[10px] font-black text-white/90 bg-white/20 px-1.5 py-0.5 rounded-full">{cfg.badge}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Fullscreen toggle */}
                                <button
                                    onClick={() => setIsFullscreen(f => !f)}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
                                    title={isFullscreen ? 'Minimize' : 'Expand'}
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                {/* Clear */}
                                <button
                                    onClick={clearChat}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
                                    title="Clear chat"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                {/* Close */}
                                <button
                                    onClick={close}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ── Messages ── */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50" style={{ overscrollBehavior: 'contain' }}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user'
                                            ? `${accentGrad} text-white rounded-tr-none`
                                            : `bg-white border border-slate-100 rounded-tl-none ${msg.error ? 'border-red-100 bg-red-50/50' : ''}`
                                            }`}>
                                            {msg.role === 'user'
                                                ? <p className="text-sm leading-relaxed">{msg.content}</p>
                                                : <BotMessage content={msg.content} error={msg.error} />
                                            }
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 px-1">
                                            <span className="text-[10px] text-slate-400">
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.role === 'assistant' && <SourceBadge source={msg.source} />}
                                            {msg.role === 'assistant' && <CopyButton text={msg.content} />}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && <TypingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Suggested Questions ── */}
                        {messages.length <= 2 && !isLoading && (
                            <div className="px-4 py-2.5 bg-white border-t border-slate-100 shrink-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick questions</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {suggestions.slice(0, isFullscreen ? 6 : 4).map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => send(q)}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-600 hover:text-orange-700 text-xs font-medium rounded-xl transition-all"
                                        >
                                            <ChevronRight className="w-3 h-3 opacity-50" />
                                            {q.length > 30 ? q.slice(0, 30) + '…' : q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Input Area ── */}
                        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                            <div className="flex gap-2 items-end bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all p-2">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                                    disabled={isLoading}
                                    rows={1}
                                    className="flex-1 bg-transparent text-sm outline-none resize-none text-slate-700 placeholder-slate-400 max-h-24 overflow-y-auto py-1 px-1 disabled:opacity-60"
                                    style={{ lineHeight: '1.5' }}
                                />
                                <motion.button
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => send(input)}
                                    disabled={!input.trim() || isLoading}
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-white transition-all shrink-0 ${input.trim() && !isLoading
                                        ? `${accentGrad} shadow-md`
                                        : 'bg-slate-200 cursor-not-allowed'
                                        }`}
                                >
                                    {isLoading
                                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <Send className="w-4 h-4" />
                                    }
                                </motion.button>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center mt-1.5">TempleAI may make mistakes. Verify important info.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Floating Button ── */}
            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => isOpen ? close() : open()}
                className={`relative w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all ${accentGrad}`}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <X className="w-6 h-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <MessageCircle className="w-6 h-6 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Unread badge */}
                <AnimatePresence>
                    {!isOpen && unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center px-1 border-2 border-white"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Pulse ring when closed */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-orange-400 pointer-events-none" />
                )}
            </motion.button>
        </div>
    );
}

export default ChatbotWidget;
