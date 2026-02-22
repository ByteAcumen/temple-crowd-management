'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

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
    const [dynamicCommands, setDynamicCommands] = useState<Command[]>([]);
    const router = useRouter();
    const { logout } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch dynamic content (Temples) for search
    useEffect(() => {
        if (!isOpen) return; // Only fetch when opened to save API calls
        let mounted = true;

        const loadContent = async () => {
            try {
                const res = await api.temples.getAll();
                if (res.success && mounted) {
                    const tCommands = res.data.map(t => ({
                        id: `temple-${t._id || t.id}`,
                        label: `View: ${t.name}`,
                        icon: '🛕',
                        category: 'Temples',
                        action: () => router.push(`/admin/temples?search=${encodeURIComponent(t.name)}`)
                    }));
                    setDynamicCommands(tCommands);
                }
            } catch (err) {
                console.error("Failed to load generic palette data", err);
            }
        };

        loadContent();
        return () => { mounted = false; };
    }, [isOpen, router]);

    // Keyboard ESC toggle handled correctly
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Focus input when opened & Lock Body Scroll
    useEffect(() => {
        const body = document.body;
        if (isOpen) {
            body.style.overflow = 'hidden';
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                setQuery('');
                setSelectedIndex(0);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            body.style.overflow = '';
        }
        return () => { body.style.overflow = ''; };
    }, [isOpen]);

    // Define Static Commands
    const commands: Command[] = [
        ...dynamicCommands,
        // Navigation
        { id: 'nav-dashboard', label: 'Go to Dashboard', icon: '📊', category: 'Navigation', action: () => router.push('/admin/dashboard') },
        { id: 'nav-bookings', label: 'Go to Bookings', icon: '🎫', category: 'Navigation', action: () => router.push('/admin/bookings') },
        { id: 'nav-temples', label: 'Go to Temples', icon: '🛕', category: 'Navigation', action: () => router.push('/admin/temples') },
        { id: 'nav-live', label: 'Go to Live Monitor', icon: '📡', category: 'Navigation', action: () => router.push('/admin/live') },
        { id: 'nav-analytics', label: 'Go to Analytics', icon: '📈', category: 'Navigation', action: () => router.push('/admin/analytics') },
        { id: 'nav-testing', label: 'Go to Testing', icon: '🧪', category: 'Navigation', action: () => router.push('/admin/testing') },
        { id: 'nav-users', label: 'Go to Users', icon: '👥', category: 'Navigation', action: () => router.push('/admin/users') },

        // Actions
        { id: 'act-new-booking', label: 'New Booking', icon: '➕', category: 'Actions', action: () => router.push('/admin/bookings?action=new') },
        { id: 'act-scan', label: 'Gatekeeper Portal', icon: '📱', category: 'Actions', action: () => router.push('/gatekeeper') },
        { id: 'act-logout', label: 'Log Out', icon: '🚪', category: 'Account', action: () => logout() },
    ];

    // Filter commands based on query
    const filteredCommands = commands.filter(cmd => {
        if (!query) return cmd.category === 'Navigation' || cmd.category === 'Actions' || cmd.category === 'Account'; // Show defaults first
        return cmd.label.toLowerCase().includes(query.toLowerCase()) || cmd.category.toLowerCase().includes(query.toLowerCase());
    }).slice(0, 10); // Max 10 results shown to avoid lag

    // Reset index on search length changes
    useEffect(() => {
        setSelectedIndex(Math.min(selectedIndex, Math.max(0, filteredCommands.length - 1)));
    }, [query, filteredCommands.length, selectedIndex]);

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
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

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
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[101] overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center items-start pt-[15vh]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }}
                            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                            className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200/80 overflow-hidden ring-1 ring-slate-100/50"
                        >
                            {/* Search Input */}
                            <div className="flex items-center px-4 py-4 border-b border-slate-100">
                                <svg className="w-6 h-6 text-orange-500 mr-3 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                                    placeholder="Search temples, features, or jump to..."
                                    className="flex-1 bg-transparent border-none outline-none text-xl sm:text-2xl text-slate-700 placeholder:text-slate-300 font-medium"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 p-1.5 rounded-lg border border-slate-200 shadow-sm leading-none">ESC</span>
                                </div>
                            </div>

                            {/* Command List */}
                            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                                {filteredCommands.length > 0 ? (
                                    filteredCommands.map((cmd, index) => (
                                        <motion.button
                                            key={cmd.id}
                                            onClick={() => { cmd.action(); onClose(); }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left group border ${index === selectedIndex ? 'bg-orange-50/80 border-orange-200/50 shadow-sm' : 'border-transparent hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className={`text-2xl bg-white p-2 rounded-xl shadow-sm border border-slate-100 ${index === selectedIndex ? 'scale-110 ring-2 ring-orange-100' : ''} transition-all`}>{cmd.icon}</span>
                                            <div className="flex-1">
                                                <p className={`font-bold ${index === selectedIndex ? 'text-orange-900' : 'text-slate-700'}`}>
                                                    {cmd.label}
                                                </p>
                                                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                                                    {cmd.category}
                                                </p>
                                            </div>
                                            {index === selectedIndex && (
                                                <motion.span layoutId="enter-icon" className="text-sm font-bold text-orange-400 bg-orange-100/50 px-2 py-1 rounded shadow-sm">
                                                    ↵
                                                </motion.span>
                                            )}
                                        </motion.button>
                                    ))
                                ) : (
                                    <div className="py-16 text-center text-slate-400 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium text-slate-600">No results found for &quot;{query}&quot;</p>
                                        <p className="text-sm mt-1">Try searching for a temple name, or a page like &apos;Dashboard&apos;.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium sm:flex-row flex-col gap-2">
                                <div className="flex gap-4">
                                    <span className="flex items-center gap-1"><kbd className="font-sans font-bold bg-white px-1.5 rounded shadow-sm border border-slate-200">↑↓</kbd> to navigate</span>
                                    <span className="flex items-center gap-1"><kbd className="font-sans font-bold bg-white px-1.5 rounded shadow-sm border border-slate-200">↵</kbd> to select</span>
                                </div>
                                <span className="font-bold flex items-center gap-1">
                                    Temple<span className="text-orange-500">Smart</span> Search Engine
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
