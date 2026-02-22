'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { templesApi, adminApi, liveApi, Temple, Booking } from '@/lib/api';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 25 }
    }
};

export default function SimulationControls() {
    const [temples, setTemples] = useState<Temple[]>([]);
    const [selectedTemple, setSelectedTemple] = useState<string>('');
    const [selectedTempleData, setSelectedTempleData] = useState<Temple | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingTemples, setLoadingTemples] = useState(true);
    const [log, setLog] = useState<{ msg: string; type: string; time: string }[]>([]);
    const [simulating, setSimulating] = useState(false);
    const [surgeProgress, setSurgeProgress] = useState(0);
    const [simulationStats, setSimulationStats] = useState({
        entries: 0,
        exits: 0,
        errors: 0
    });

    // Load initial data
    useEffect(() => {
        loadTemples();
    }, []);

    // Load temple data when selection changes
    useEffect(() => {
        if (selectedTemple) {
            const temple = temples.find(t => t._id === selectedTemple);
            setSelectedTempleData(temple || null);
            loadBookings(selectedTemple);
        }
    }, [selectedTemple, temples]);

    const loadTemples = async () => {
        setLoadingTemples(true);
        try {
            const res = await templesApi.getAll();
            if (res.success && res.data.length > 0) {
                setTemples(res.data);
                setSelectedTemple(res.data[0]._id);
                addLog('Connected to backend. Loaded ' + res.data.length + ' temples.', 'success');
            } else {
                addLog('No temples found in database', 'warning');
            }
        } catch (err: any) {
            addLog('Failed to connect: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setLoadingTemples(false);
        }
    };

    const loadBookings = async (templeId: string) => {
        try {
            const d = new Date();
            const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const res = await adminApi.getBookings({
                templeId,
                date: today,
                status: 'CONFIRMED',
                limit: 100
            });

            if (res.success) {
                setBookings(res.data);
                if (res.data.length > 0) {
                    addLog(`Loaded ${res.data.length} passes ready for simulation`, 'info');
                } else {
                    addLog('No active passes today. Create bookings to simulate.', 'warning');
                }
            }
        } catch (err: any) {
            addLog('Error loading passes: ' + err.message, 'error');
        }
    };

    const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLog(prev => [{ msg, type, time }, ...prev.slice(0, 9)]);
    }, []);

    const getRandomBooking = () => {
        if (bookings.length === 0) return null;
        return bookings[Math.floor(Math.random() * bookings.length)];
    };

    const simulateScan = async (type: 'entry' | 'exit') => {
        if (!selectedTemple) {
            addLog('Select a temple first', 'warning');
            return;
        }

        const booking = getRandomBooking();
        if (!booking) {
            addLog('No valid passes available. Create bookings first!', 'warning');
            return;
        }

        setLoading(true);
        try {
            if (type === 'entry') {
                await liveApi.recordEntry(selectedTemple, booking.passId);
                setSimulationStats(prev => ({ ...prev, entries: prev.entries + 1 }));
                addLog(`✅ Entry: Pass ${booking.passId.slice(0, 8)}...`, 'success');
            } else {
                await liveApi.recordExit(selectedTemple, booking.passId);
                setSimulationStats(prev => ({ ...prev, exits: prev.exits + 1 }));
                addLog(`✅ Exit: Pass ${booking.passId.slice(0, 8)}...`, 'success');
            }
            // Refresh temple data to show updated crowd
            loadTemples();
        } catch (err: any) {
            setSimulationStats(prev => ({ ...prev, errors: prev.errors + 1 }));
            addLog(`❌ ${type} failed: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const simulateCrowdSurge = async () => {
        if (!selectedTemple) {
            addLog('Select a temple first', 'warning');
            return;
        }

        if (bookings.length === 0) {
            addLog('No passes to simulate surge. Create bookings first!', 'warning');
            return;
        }

        setSimulating(true);
        setSurgeProgress(0);
        addLog('⚡ SURGE STARTED (rate-limited mode)', 'warning');

        const totalOperations = Math.min(bookings.length, 10); // Reduced from 20 to avoid rate limits
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < totalOperations; i++) {
            const booking = bookings[i];
            if (!booking) continue;

            // Retry logic for rate limits
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    await liveApi.recordEntry(selectedTemple, booking.passId);
                    successCount++;
                    setSimulationStats(prev => ({ ...prev, entries: prev.entries + 1 }));
                    addLog(`✅ [${i + 1}/${totalOperations}] Entry recorded`, 'success');
                    break; // Success, exit retry loop
                } catch (e: any) {
                    if (e.message?.includes('Too many requests') && attempt < 2) {
                        // Wait longer on rate limit
                        await new Promise(r => setTimeout(r, 2000));
                        continue; // Retry
                    }
                    errorCount++;
                    setSimulationStats(prev => ({ ...prev, errors: prev.errors + 1 }));
                    break;
                }
            }

            setSurgeProgress(((i + 1) / totalOperations) * 100);
            // Longer delay between requests to avoid rate limiting (800ms)
            await new Promise(r => setTimeout(r, 800));
        }

        addLog(`⚡ Surge complete: ${successCount}/${totalOperations} entries`, successCount > 0 ? 'success' : 'warning');
        setSimulating(false);
        loadTemples(); // Refresh to show updated crowd
    };

    const resetStats = () => {
        setSimulationStats({ entries: 0, exits: 0, errors: 0 });
        setLog([]);
        addLog('Stats reset', 'info');
    };

    // Get capacity info
    const getCapacityInfo = () => {
        if (!selectedTempleData) return { current: 0, total: 0, percent: 0 };
        const current = selectedTempleData.currentOccupancy || selectedTempleData.live_count || 0;
        const total = typeof selectedTempleData.capacity === 'number'
            ? selectedTempleData.capacity
            : selectedTempleData.capacity?.total || 1000;
        return { current, total, percent: Math.round((current / total) * 100) };
    };

    const capacityInfo = getCapacityInfo();

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <span className="text-xl">🎮</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Simulation Center</h2>
                            <p className="text-slate-400 text-xs">Test crowd flow & system response</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${loadingTemples ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                        <span className="text-xs text-slate-400 font-medium">
                            {loadingTemples ? 'Connecting...' : `${temples.length} temples`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Temple Selector with Live Stats */}
                <motion.div variants={itemVariants}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Temple</label>
                    <select
                        value={selectedTemple}
                        onChange={(e) => setSelectedTemple(e.target.value)}
                        disabled={loadingTemples || temples.length === 0}
                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none font-medium text-slate-800 disabled:opacity-50"
                    >
                        {loadingTemples ? (
                            <option>Loading temples...</option>
                        ) : temples.length === 0 ? (
                            <option>No temples available</option>
                        ) : (
                            temples.map(t => (
                                <option key={t._id} value={t._id}>
                                    {t.name} ({typeof t.location === 'string' ? t.location : `${t.location.city}, ${t.location.state}`})
                                </option>
                            ))
                        )}
                    </select>
                </motion.div>

                {/* Real-time Temple Stats */}
                <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-3 rounded-xl border border-indigo-200/50">
                        <span className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">Live Crowd</span>
                        <p className="text-2xl font-black text-indigo-700">{capacityInfo.current.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 rounded-xl border border-emerald-200/50">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Capacity</span>
                        <p className="text-2xl font-black text-emerald-700">{capacityInfo.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-3 rounded-xl border border-orange-200/50">
                        <span className="text-[10px] text-orange-600 uppercase font-bold tracking-wider">Occupancy</span>
                        <p className="text-2xl font-black text-orange-700">{capacityInfo.percent}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 rounded-xl border border-blue-200/50">
                        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Passes</span>
                        <p className="text-2xl font-black text-blue-700">{bookings.length}</p>
                    </div>
                </motion.div>

                {/* Simulation Stats */}
                <motion.div variants={itemVariants} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-xs text-slate-600"><span className="font-bold text-emerald-600">{simulationStats.entries}</span> entries</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-xs text-slate-600"><span className="font-bold text-blue-600">{simulationStats.exits}</span> exits</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-xs text-slate-600"><span className="font-bold text-red-600">{simulationStats.errors}</span> errors</span>
                        </div>
                    </div>
                    <button
                        onClick={resetStats}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                        Reset
                    </button>
                </motion.div>

                {/* Action Buttons */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => simulateScan('entry')}
                        disabled={loading || simulating || bookings.length === 0}
                        className="group flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        {loading ? 'Processing...' : 'Simulate Entry'}
                    </button>
                    <button
                        onClick={() => simulateScan('exit')}
                        disabled={loading || simulating || bookings.length === 0}
                        className="group flex items-center justify-center gap-2 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {loading ? 'Processing...' : 'Simulate Exit'}
                    </button>
                </motion.div>

                {/* Crowd Surge Button with Progress */}
                <motion.div variants={itemVariants} className="relative">
                    <button
                        onClick={simulateCrowdSurge}
                        disabled={loading || simulating || bookings.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white rounded-xl font-black text-lg shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-[1.01] transition-all disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed overflow-hidden relative"
                    >
                        {simulating && (
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${surgeProgress}%` }}
                                className="absolute inset-0 bg-white/20"
                            />
                        )}
                        <span className="relative flex items-center justify-center gap-2">
                            <span className="text-xl">{simulating ? '🔥' : '⚡'}</span>
                            {simulating ? `SURGE IN PROGRESS... ${Math.round(surgeProgress)}%` : 'TRIGGER CROWD SURGE'}
                        </span>
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-2">
                        Simulates rapid entry of up to {Math.min(bookings.length, 20)} visitors
                    </p>
                </motion.div>

                {/* Console Log */}
                <motion.div variants={itemVariants} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">Simulation Log</span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono">{log.length} entries</span>
                    </div>
                    <div className="p-3 font-mono text-xs h-36 overflow-y-auto">
                        <AnimatePresence mode="popLayout">
                            {log.length === 0 ? (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-slate-600 italic"
                                >
                                    Ready to simulate... Select a temple and click an action.
                                </motion.span>
                            ) : (
                                <div className="space-y-1">
                                    {log.map((entry, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={`flex items-start gap-2 ${entry.type === 'error' ? 'text-red-400' :
                                                entry.type === 'success' ? 'text-emerald-400' :
                                                    entry.type === 'warning' ? 'text-amber-400' :
                                                        'text-slate-400'
                                                }`}
                                        >
                                            <span className="text-slate-600 shrink-0">[{entry.time}]</span>
                                            <span>{entry.msg}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
