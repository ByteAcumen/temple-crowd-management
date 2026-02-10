'use client';

import { useState, useRef, useEffect } from 'react';
import { useGatekeeperChat } from '@/hooks/use-gatekeeper-chat';
import { AnimatePresence, motion } from 'framer-motion';

export function GatekeeperSupportBot() {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, sendMessage, isLoading, suggestions, clearChat } = useGatekeeperChat();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-24 right-4 w-80 sm:w-96 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden z-[60] flex flex-col max-h-[600px]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 flex items-center justify-between text-white shadow-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                    <span className="text-xl">🤖</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">Gatekeeper AI</h3>
                                    <p className="text-[10px] text-orange-100 font-medium opacity-90">Always here to help</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors relative z-10"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-hide">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center border border-orange-100 flex-shrink-0 shadow-sm">
                                    <span className="text-sm">🤖</span>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm text-sm text-slate-700 max-w-[85%]">
                                    Hi! I can help with scanning errors, app issues, or emergency contacts.
                                </div>
                            </div>

                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${msg.role === 'assistant' ? 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-100' : 'bg-slate-200 border-slate-300'}`}>
                                        <span className="text-xs">{msg.role === 'assistant' ? '🤖' : '👤'}</span>
                                    </div>
                                    <div
                                        className={`rounded-2xl p-3 shadow-sm text-sm max-w-[85%] ${msg.role === 'user'
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                            : 'bg-white border border-slate-100 text-slate-700'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100">
                                        <span className="text-xs animate-spin">⏳</span>
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Suggestions (Chips) */}
                        {messages.length < 3 && suggestions.length > 0 && (
                            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(s)}
                                        className="whitespace-nowrap px-3 py-1.5 bg-white border border-orange-100 text-orange-600 rounded-full text-xs font-medium hover:bg-orange-50 hover:border-orange-200 transition-colors shadow-sm"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-slate-100">
                            <form
                                onSubmit={handleSubmit}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </form>
                            <div className="flex justify-between items-center mt-2 px-1">
                                <span className="text-[10px] text-slate-400">AI Assistance</span>
                                {messages.length > 0 && (
                                    <button onClick={clearChat} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors">
                                        Clear Chat
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-xl shadow-orange-500/30 flex items-center justify-center text-white z-40 border-2 border-white/20"
                >
                    <span className="text-2xl">🤖</span>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                    </span>
                </motion.button>
            )}
        </>
    );
}
