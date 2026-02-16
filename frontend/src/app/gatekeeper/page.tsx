'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { templesApi, Temple } from '@/lib/api';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import { ScanTab } from '@/components/gatekeeper/ScanTab';
import { UserVerifyTab } from '@/components/gatekeeper/UserVerifyTab';
import { motion, AnimatePresence } from 'framer-motion';



export default function GatekeeperPage() {
    const { user, logout } = useAuth();
    const [temples, setTemples] = useState<Temple[]>([]);
    const [selectedTempleId, setSelectedTempleId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'scan' | 'verify'>('scan');
    const [showTempleSelector, setShowTempleSelector] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    // Session Stats State
    const [stats, setStats] = useState({ entries: 0, exits: 0 });

    const incrementStats = (type: 'entry' | 'exit') => {
        setStats(prev => ({
            ...prev,
            [type === 'entry' ? 'entries' : 'exits']: prev[type === 'entry' ? 'entries' : 'exits'] + 1
        }));
    };

    useEffect(() => {
        const checkOnline = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', checkOnline);
        window.addEventListener('offline', checkOnline);
        return () => {
            window.removeEventListener('online', checkOnline);
            window.removeEventListener('offline', checkOnline);
        };
    }, []);

    useEffect(() => {
        const loadTemples = async () => {
            try {
                const res = await templesApi.getAll();
                setTemples(res.data);
                if (res.data.length > 0) {
                    const saved = localStorage.getItem('gk_selected_temple');
                    if (saved && res.data.find(t => t._id === saved)) {
                        setSelectedTempleId(saved);
                    } else {
                        setSelectedTempleId(res.data[0]._id);
                    }
                }
            } catch (err) {
                console.error("Failed to load temples", err);
            }
        };
        loadTemples();
    }, []);

    if (!user || (user.role !== 'gatekeeper' && user.role !== 'admin' && !user.isSuperAdmin)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-10">
                <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                <p className="text-slate-400 mb-8">You do not have permission to view this page.</p>
                <div className="bg-slate-800 p-4 rounded-lg font-mono text-xs">
                    Role: {user?.role || 'Guest'}
                </div>
            </div>
        );
    }

    const currentTemple = temples.find(t => t._id === selectedTempleId);

    return (
        <div className="relative w-full h-full min-h-screen bg-slate-50/50">

            {/* Header - Fixed & Narrow */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all">
                <div className="w-full max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {/* Replaced Logo component with direct Icon to prevent text overlap */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                                <Image
                                    src="/temple-logo.png"
                                    alt="Logo"
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                    GATEKEEPER
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                                            {isOnline ? 'System Online' : 'Offline Mode'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowTempleSelector(!showTempleSelector)}
                                className="flex items-center gap-2 bg-slate-100 hover:bg-white border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-600 px-3 py-2 rounded-xl transition-all active:scale-95 shadow-sm group"
                            >
                                <span className="text-xs font-bold max-w-[100px] truncate">
                                    {currentTemple ? currentTemple.name.split(' ')[0] : 'Select'}
                                </span>
                                <svg className={`w-3 h-3 text-slate-400 group-hover:text-orange-500 transition-transform ${showTempleSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Compact Session Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Entered</span>
                                <span className="text-2xl font-black text-emerald-900 font-mono tracking-tight leading-none">{stats.entries}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                            </div>
                        </div>
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center justify-between relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Exited</span>
                                <span className="text-2xl font-black text-blue-900 font-mono tracking-tight leading-none">{stats.exits}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Temple Selector Modal */}
            <AnimatePresence>
                {showTempleSelector && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowTempleSelector(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ring-1 ring-slate-900/5"
                        >
                            <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Select Temple</h2>
                                    <p className="text-sm text-slate-500">Choose location</p>
                                </div>
                                <button onClick={() => setShowTempleSelector(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                                <div className="grid grid-cols-1 gap-3">
                                    {temples.map(t => (
                                        <button
                                            key={t._id}
                                            onClick={() => {
                                                setSelectedTempleId(t._id);
                                                localStorage.setItem('gk_selected_temple', t._id);
                                                setShowTempleSelector(false);
                                            }}
                                            className={`p-4 rounded-2xl border text-left transition-all ${selectedTempleId === t._id
                                                ? 'bg-orange-50 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                                                : 'bg-white border-slate-200 hover:border-orange-300'
                                                }`}
                                        >
                                            <h3 className="font-bold text-lg">{t.name}</h3>
                                            <p className={`text-xs ${selectedTempleId === t._id ? 'text-white/80' : 'text-slate-500'}`}>{typeof t.location === 'string' ? t.location : t.location.city}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="pt-[180px] pb-safe px-4 w-full max-w-lg mx-auto relative z-10 flex flex-col">

                {/* Mode Tabs */}
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                    <button
                        onClick={() => setActiveTab('scan')}
                        className="flex-1 relative py-2.5 text-sm font-extrabold rounded-xl transition-all"
                    >
                        {activeTab === 'scan' && (
                            <motion.div layoutId="activeTab" className="absolute inset-0 bg-slate-900 rounded-xl shadow-md" />
                        )}
                        <span className={`relative z-10 flex items-center justify-center gap-2 ${activeTab === 'scan' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                            SCANNER
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('verify')}
                        className="flex-1 relative py-2.5 text-sm font-extrabold rounded-xl transition-all"
                    >
                        {activeTab === 'verify' && (
                            <motion.div layoutId="activeTab" className="absolute inset-0 bg-slate-900 rounded-xl shadow-md" />
                        )}
                        <span className={`relative z-10 flex items-center justify-center gap-2 ${activeTab === 'verify' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            MANUAL
                        </span>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: activeTab === 'scan' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: activeTab === 'scan' ? 20 : -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1"
                    >
                        {activeTab === 'scan' ? (
                            <ScanTab
                                selectedTempleId={selectedTempleId}
                                onScanSuccess={(type) => incrementStats(type || 'entry')}
                            />
                        ) : (
                            <UserVerifyTab
                                selectedTempleId={selectedTempleId}
                                onCheckInSuccess={() => incrementStats('entry')}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
