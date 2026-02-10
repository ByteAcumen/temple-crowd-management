'use client';

// Temple Smart E-Pass - Admin Live Monitor
// Real-time crowd tracking and AI predictions
// Premium Redesign (Light Theme with Dark Visualizer)

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState } from 'react';
import { templesApi, liveApi, Temple } from '@/lib/api';
import { useMLPredict } from '@/hooks/use-ml-predict';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { TrafficLightBadge } from '@/components/ui/traffic-light';
import { BackendStatusBar } from '@/components/admin/BackendStatusBar';

// Helper for safe capacity access
const getCapacity = (t: Temple | undefined) => {
    if (!t || !t.capacity) return 1;
    if (typeof t.capacity === 'number') return t.capacity;
    return t.capacity.total || 1;
};

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

function AdminLiveMonitorContent() {
    const { user } = useAuth();
    const [temples, setTemples] = useState<Temple[]>([]);
    const [liveData, setLiveData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [selectedTempleId, setSelectedTempleId] = useState<string | null>(null);
    const { predict, predictBatch } = useMLPredict();
    const [predictions, setPredictions] = useState<Record<string, any>>({});
    const [showEntriesModal, setShowEntriesModal] = useState(false);
    const [currentEntries, setCurrentEntries] = useState<any[]>([]);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [resetting, setResetting] = useState(false);

    // Fetch initial data
    useEffect(() => {
        async function fetchData() {
            try {
                const [templesRes, liveRes] = await Promise.all([
                    templesApi.getAll(),
                    liveApi.getCrowdData()
                ]);

                if (templesRes.success) {
                    setTemples(templesRes.data);
                    if (templesRes.data.length > 0 && !selectedTempleId) {
                        setSelectedTempleId(templesRes.data[0]._id);
                    }
                }

                if (liveRes.success) {
                    const liveMap: Record<string, number> = {};
                    const raw = liveRes.data;
                    const templesArr = (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.temples)
                        ? raw.temples
                        : (Array.isArray(raw) ? raw : []);
                    templesArr.forEach((item: any) => {
                        const tid = (item.temple_id?.toString?.() || item.temple_id || item.templeId || item._id)?.toString?.();
                        if (tid) liveMap[tid] = item.live_count ?? item.count ?? 0;
                    });
                    setLiveData(liveMap);
                    setLastUpdated(new Date());
                }
            } catch (err) {
                console.error('Failed to fetch live data:', err);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchData();
            const interval = setInterval(fetchData, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [user]);

    // Generate Predictions
    useEffect(() => {
        if (temples.length === 0) return;

        const updatePredictions = async () => {
            const today = new Date();
            const requests = temples.map(t => ({
                temple_id: t._id,
                date: today.toISOString().split('T')[0],
                day_of_week: today.getDay(),
                month: today.getMonth() + 1,
                is_holiday: false,
                is_weekend: today.getDay() === 0 || today.getDay() === 6
            }));

            try {
                const results = await predictBatch(requests);
                const predMap: Record<string, any> = {};
                results.forEach(p => {
                    predMap[p.temple_id] = p;
                });
                setPredictions(predMap);
            } catch (err) {
                console.error("Prediction error:", err);
            }
        };

        updatePredictions();
    }, [temples, predictBatch]);

    const selectedTemple = temples.find(t => t._id === selectedTempleId);
    const selectedPred = selectedTempleId ? predictions[selectedTempleId] : null;
    const currentLive = selectedTempleId ? (liveData[selectedTempleId] ?? selectedTemple?.live_count ?? selectedTemple?.currentOccupancy ?? 0) : 0;

    // Helper to get status color
    const getStatusColor = (percentage: number) => {
        if (percentage > 90) return 'red';
        if (percentage > 75) return 'orange';
        return 'green';
        return 'green';
    };

    // View Entries Handler
    const handleViewEntries = async () => {
        if (!selectedTempleId) return;
        setLoadingEntries(true);
        setShowEntriesModal(true);
        try {
            const res = await liveApi.getCurrentEntries(selectedTempleId);
            if (res.success) {
                setCurrentEntries(res.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch entries', err);
        } finally {
            setLoadingEntries(false);
        }
    };

    // Reset Count Handler
    const handleResetCount = async () => {
        if (!selectedTempleId || !confirm('Are you sure you want to reset the live count to 0? This cannot be undone.')) return;
        setResetting(true);
        try {
            await liveApi.resetCount(selectedTempleId);
            setLiveData(prev => ({ ...prev, [selectedTempleId]: 0 }));
            // Optional: refresh full data
        } catch (err) {
            alert('Failed to reset count');
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Live Monitor" subtitle="Real-time crowd tracking">
                <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 rounded-2xl skeleton border border-slate-100" />
                        ))}
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6 h-[400px]">
                        <div className="rounded-2xl skeleton border border-slate-100" />
                        <div className="lg:col-span-2 rounded-2xl skeleton border border-slate-100" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const totalLiveVisitors = Object.values(liveData).reduce((a, b) => a + b, 0) || temples.reduce((a, t) => a + (t.live_count ?? t.currentOccupancy ?? 0), 0);
    const criticalTemples = temples.filter(t => {
        const live = liveData[t._id] ?? t.live_count ?? t.currentOccupancy ?? 0;
        return (live / getCapacity(t)) > 0.9;
    }).length;

    return (
        <AdminLayout title="Live Monitor" subtitle="Real-time crowd tracking and AI insights">
            <div className="flex justify-end mb-4">
                <BackendStatusBar
                    status="connected"
                    lastUpdated={lastUpdated || undefined}
                    dataCount={temples.length}
                    label="Temples"
                />
            </div>

            {/* Entries Modal */}
            <AnimatePresence>
                {showEntriesModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowEntriesModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-900">Current Entries</h3>
                                <button onClick={() => setShowEntriesModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {loadingEntries ? (
                                    <div className="flex justify-center py-12"><div className="animate-spin text-orange-500 text-3xl">⏳</div></div>
                                ) : currentEntries.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">No active entries found inside.</div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                                                <th className="pb-3">Pass ID</th>
                                                <th className="pb-3">Name</th>
                                                <th className="pb-3">Entry Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {currentEntries.map((entry: any, i) => (
                                                <tr key={i} className="text-sm">
                                                    <td className="py-3 font-mono text-orange-600">{entry.passId || entry.bookingId || '-'}</td>
                                                    <td className="py-3 font-medium text-slate-900">{entry.userName || 'Visitor'}</td>
                                                    <td className="py-3 text-slate-500">{new Date(entry.entryTime).toLocaleTimeString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
            >
                {/* Stats Row */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon="👥"
                        title="Live Visitors"
                        value={totalLiveVisitors}
                        subtext="Active now"
                        color="blue"
                    />
                    <StatCard
                        icon="⚠️"
                        title="Critical Crowd"
                        value={criticalTemples}
                        subtext=">90% Full"
                        color="red"
                    />
                    <StatCard
                        icon="🤖"
                        title="AI Accuracy"
                        value="94%"
                        color="purple"
                    />
                    <StatCard
                        icon="📡"
                        title="System Status"
                        value="Online"
                        color="green"
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-320px)] min-h-[600px]">
                    {/* Temple List */}
                    <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-xl shadow-slate-200/50">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Monitored Temples</h3>
                            <p className="text-sm text-slate-500">{temples.length} active feeds</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {temples.map(temple => {
                                const liveCount = liveData[temple._id] ?? temple.live_count ?? temple.currentOccupancy ?? 0;
                                const capacity = getCapacity(temple);
                                const percent = (liveCount / capacity) * 100;
                                const statusColor = getStatusColor(percent);
                                const isSelected = selectedTempleId === temple._id;
                                const pred = predictions[temple._id];

                                return (
                                    <motion.button
                                        key={temple._id}
                                        onClick={() => setSelectedTempleId(temple._id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${isSelected
                                            ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-100 shadow-md'
                                            : 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className={`font-bold text-sm ${isSelected ? 'text-orange-900' : 'text-slate-700'}`}>
                                                    {temple.name}
                                                </h4>
                                                <p className="text-xs text-slate-500">{typeof temple.location === 'object' ? temple.location.city : temple.location}</p>
                                            </div>
                                            {pred && (
                                                <TrafficLightBadge status={pred.status || 'GREEN'} />
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className={isSelected ? 'text-orange-700' : 'text-slate-500'}>Capacity</span>
                                                <span className={isSelected ? 'text-orange-900' : 'text-slate-900'}>
                                                    {liveCount.toLocaleString()} <span className="text-slate-400 font-normal">/ {capacity.toLocaleString()}</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${statusColor === 'red' ? 'bg-red-500' : statusColor === 'orange' ? 'bg-orange-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Monitor View */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Live Visualizer - Kept Dark for "Screen" effect */}
                        <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                            {selectedTemple ? (
                                <>
                                    {/* Header Overlay */}
                                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-bold text-white">{selectedTemple.name}</h2>
                                                <span className="animate-pulse flex h-3 w-3 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                                <span className="text-xs font-mono text-white/90 bg-red-500/80 px-2 py-0.5 rounded backdrop-blur-sm">LIVE</span>
                                            </div>
                                            <p className="text-slate-300 text-sm mt-1">
                                                Updated: {new Date().toLocaleTimeString()} • Source: ML Gateway 01
                                            </p>
                                        </div>
                                    </div>

                                    {/* Controls Overlay */}
                                    <div className="absolute top-6 right-6 z-30 flex gap-2">
                                        <button
                                            onClick={handleViewEntries}
                                            className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white border border-white/10 transition-colors text-xs font-bold flex items-center gap-2"
                                            title="View Current Entries"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            View Entries
                                        </button>
                                        <button
                                            onClick={handleResetCount}
                                            disabled={resetting}
                                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md rounded-xl text-red-200 border border-red-500/30 transition-colors text-xs font-bold flex items-center gap-2"
                                            title="Reset Counter"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            {resetting ? '...' : 'Reset'}
                                        </button>
                                    </div>

                                    {/* Visualization Content */}
                                    <div className="flex-1 relative flex items-center justify-center bg-[url('/patterns/grid.svg')] bg-center opacity-100">
                                        <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 to-slate-900 pointer-events-none" />

                                        {/* Live Data Visualization */}
                                        <div className="absolute inset-0 overflow-hidden">
                                            {/* 
                                                Visualizer Logic:
                                                - 1 dot per person for < 50
                                                - 1 dot per 5 people for < 500
                                                - 1 dot per 10 people for > 500
                                                - Cap max dots at 100 to preserve performance
                                            */}
                                            {[...Array(Math.min(currentLive > 500 ? Math.ceil(currentLive / 10) : currentLive > 50 ? Math.ceil(currentLive / 5) : currentLive, 100))].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className={`absolute w-1.5 h-1.5 rounded-full ${Math.random() > 0.7 ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]'}`}
                                                    initial={{ x: Math.random() * 800, y: Math.random() * 400, opacity: 0 }}
                                                    animate={{
                                                        x: [Math.random() * 800, Math.random() * 800],
                                                        y: [Math.random() * 400, Math.random() * 400],
                                                        opacity: [0.4, 0.8, 0.4]
                                                    }}
                                                    transition={{
                                                        duration: 15 + Math.random() * 10,
                                                        repeat: Infinity,
                                                        repeatType: "mirror"
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Main Counter Overlay */}
                                        <div className="text-center z-10 backdrop-blur-md bg-black/40 p-8 rounded-3xl border border-white/10 shadow-2xl">
                                            <p className="text-slate-300 uppercase tracking-widest text-[10px] font-bold mb-2">Real-Time Occupancy</p>
                                            <div className="text-7xl font-black text-white mb-2 tracking-tighter tabular-nums drop-shadow-2xl">
                                                {currentLive.toLocaleString()}
                                            </div>
                                            <div className="flex items-center justify-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getStatusColor((currentLive / getCapacity(selectedTemple)) * 100) === 'red' ? 'bg-red-500 text-white shadow-red-500/30' :
                                                    getStatusColor((currentLive / getCapacity(selectedTemple)) * 100) === 'orange' ? 'bg-orange-500 text-white shadow-orange-500/30' :
                                                        'bg-green-500 text-white shadow-green-500/30'
                                                    }`}>
                                                    {(currentLive / getCapacity(selectedTemple) * 100).toFixed(0)}% FULL
                                                </span>
                                                <span className="text-slate-300 text-sm font-medium">Cap: {getCapacity(selectedTemple).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom AI Insight */}
                                    <div className=" bg-black/40 backdrop-blur-md border-t border-white/5 p-4 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 ring-1 ring-purple-500/30">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">AI Forecast (Next Hour)</p>
                                            <p className="text-white text-sm font-medium">
                                                {selectedPred ? `Expecting ${selectedPred.predicted_visitors} visitors. ${selectedPred.recommendation}` : 'Analyzing entrance patterns...'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                                        <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </div>
                                    <p>Select a temple to connect to live feed</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AdminLayout>
    );
}

// Sub-components
function StatCard({ icon, title, value, subtext, color }: any) {
    const colorClasses = {
        orange: 'bg-orange-500/10 text-orange-600',
        green: 'bg-green-500/10 text-green-600',
        blue: 'bg-blue-500/10 text-blue-600',
        purple: 'bg-purple-500/10 text-purple-600',
        red: 'bg-red-500/10 text-red-600'
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group admin-card"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 ${colorClasses[color as keyof typeof colorClasses]} rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110`} />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl filter drop-shadow-sm">{icon}</span>
                    <h3 className="text-slate-500 font-medium">{title}</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
                    {subtext && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color === 'red' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{subtext}</span>}
                </div>
            </div>
        </motion.div>
    );
}

export default function AdminLivePage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminLiveMonitorContent />
        </ProtectedRoute>
    );
}
