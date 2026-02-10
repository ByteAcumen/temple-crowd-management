'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface Command {
    id: string;
    label: string;
    icon: string;
    shortcut?: string;
    action: () => void;
    category: string;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { logout } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle logic (handled by parent for open, but we handle close)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Define Commands
    const commands: Command[] = [
        // Navigation
        { id: 'nav-dashboard', label: 'Go to Dashboard', icon: '📊', category: 'Navigation', action: () => router.push('/admin/dashboard') },
        { id: 'nav-bookings', label: 'Go to Bookings', icon: '🎫', category: 'Navigation', action: () => router.push('/admin/bookings') },
        { id: 'nav-temples', label: 'Go to Temples', icon: '🛕', category: 'Navigation', action: () => router.push('/admin/temples') },
        { id: 'nav-live', label: 'Go to Live Monitor', icon: '📡', category: 'Navigation', action: () => router.push('/admin/live') },
        { id: 'nav-analytics', label: 'Go to Analytics', icon: '📈', category: 'Navigation', action: () => router.push('/admin/analytics') },
        { id: 'nav-testing', label: 'Go to Testing', icon: '🧪', category: 'Navigation', action: () => router.push('/admin/testing') },

        // Actions
        { id: 'act-new-booking', label: 'New Booking', icon: '➕', category: 'Actions', action: () => router.push('/admin/bookings?action=new') },
        { id: 'act-scan', label: 'Gatekeeper Scanner', icon: '📱', category: 'Actions', action: () => router.push('/gatekeeper/scan') },
        { id: 'act-logout', label: 'Log Out', icon: '🚪', category: 'Account', action: () => logout() },
    ];

    // Filter commands based on query
    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
    );

    // Keyboard Navigation in List
    useEffect(() => {
        const handleListNav = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleListNav);
        return () => window.removeEventListener('keydown', handleListNav);
    }, [isOpen, filteredCommands, selectedIndex]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onClose()}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[101]"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-4 border-b border-slate-100">
                            <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                                placeholder="Type a command (Ctrl+K)..."
                                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-700 placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">ESC</span>
                            </div>
                        </div>

                        {/* Command List */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                            {filteredCommands.length > 0 ? (
                                filteredCommands.map((cmd, index) => (
                                    <motion.button
                                        key={cmd.id}
                                        onClick={() => { cmd.action(); onClose(); }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${index === selectedIndex ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className={`text-xl ${index === selectedIndex ? 'scale-110' : ''} transition-transform`}>{cmd.icon}</span>
                                        <div className="flex-1">
                                            <p className={`font-semibold text-sm ${index === selectedIndex ? 'text-orange-900' : 'text-slate-700'}`}>
                                                {cmd.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                {cmd.category}
                                            </p>
                                        </div>
                                        {index === selectedIndex && (
                                            <motion.span layoutId="enter-icon" className="text-xs font-bold text-orange-400">
                                                ↵
                                            </motion.span>
                                        )}
                                    </motion.button>
                                ))
                            ) : (
                                <div className="py-8 text-center text-slate-400 text-sm">
                                    No commands found for "{query}"
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <div className="flex gap-4">
                                <span>↑↓ to navigate</span>
                                <span>↵ to select</span>
                            </div>
                            <span>TempleSmart Admin</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
