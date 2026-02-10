'use client';

// Temple Smart E-Pass - AI Support Chat Page
// RAG-powered chatbot with premium UI

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRAGChat, ChatMessage } from '@/hooks/use-rag-chat';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportPage() {
    const { messages, sendMessage, isLoading, clearChat, suggestedQuestions } = useRAGChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const message = input;
        setInput('');
        await sendMessage(message);
    };

    // Handle suggested question click
    const handleSuggestionClick = (question: string) => {
        // Direct send for smoother UX
        if (isLoading) return;
        sendMessage(question);
    };

    return (
        <div className="min-h-screen gradient-dark flex flex-col relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-10 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl blob animate-float"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl blob animate-float-reverse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <header className="glass-header border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">🤖</span>
                                    AI Support Assistant
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <p className="text-xs text-slate-300">RAG System Online</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={clearChat}
                            className="text-sm text-slate-300 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear
                        </button>
                    </div>
                </div>
            </header>

            {/* Chat Messages */}
            <main className="flex-1 overflow-y-auto custom-scrollbar z-10 relative">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="space-y-6">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}
                        </AnimatePresence>

                        {/* Typing Indicator */}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-lg shadow-lg shadow-orange-500/20">
                                    🤖
                                </div>
                                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl rounded-tl-none px-5 py-4 shadow-lg border border-white/5">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>
            </main>

            {/* Input Area */}
            <div className="glass-panel border-t border-white/10 sticky bottom-0 z-50 backdrop-blur-xl bg-slate-900/80">
                {/* Suggested Questions */}
                <div className="max-w-4xl mx-auto w-full">
                    {messages.length <= 2 && (
                        <div className="px-4 pt-4 pb-2">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-semibold"
                            >
                                Suggested Topics
                            </motion.p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.slice(0, 4).map((q, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => handleSuggestionClick(q)}
                                        className="px-4 py-2 bg-slate-800/50 text-slate-200 border border-white/10 rounded-full text-sm hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-white transition-all active:scale-95 backdrop-blur-sm"
                                    >
                                        {q}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="px-4 py-4">
                        <form onSubmit={handleSubmit} className="flex gap-3 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about bookings, crowd status, temple info..."
                                className="flex-1 px-6 py-4 bg-slate-800/50 text-white border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-slate-500 backdrop-blur-sm"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="px-6 py-4 btn-primary rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-slate-500 mt-3 text-center">
                            AI responses may vary. For critical queries, please contact temple administration directly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${isUser
                ? 'bg-slate-700 text-slate-200 border border-white/10'
                : 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/20'
                }`}
            >
                {isUser ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                ) : (
                    <span className="text-lg">🤖</span>
                )}
            </div>

            {/* Message Content */}
            <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                <div className={`inline-block px-6 py-4 rounded-2xl text-left shadow-lg backdrop-blur-sm border ${isUser
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-none border-white/10'
                    : 'bg-slate-800/90 text-slate-100 rounded-tl-none border-white/10'
                    }`}
                >
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Sources & Metadata */}
                <div className={`mt-2 flex flex-wrap gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-slate-400">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {!isUser && message.sources && message.sources.length > 0 && (
                        message.sources.map((source, i) => (
                            <span key={i} className="text-xs bg-slate-800/50 border border-white/5 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                                📚 {source}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}
