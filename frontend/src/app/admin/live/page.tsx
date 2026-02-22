'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { templesApi, liveApi, Temple } from '@/lib/api';
import { useMLPredict } from '@/hooks/use-ml-predict';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import {
    Activity, AlertTriangle, RotateCcw, Users, RefreshCw,
    TrendingUp, Zap, Brain, ChevronRight,
    ArrowUpRight, ArrowDownRight, Eye, X,
    CheckCircle, Radio,
} from 'lucide-react';
import VideoAnalyzer from '@/components/admin/live/VideoAnalyzer';

/* ─────────────── types ─────────────── */
interface LiveTemple {
    temple_id: string;
    temple_name: string;
    location: string;
    live_count: number;
    capacity: number;
    capacity_percentage: number;
    traffic_status: 'GREEN' | 'ORANGE' | 'RED';
    status: string;
    available_space: number;
}
interface DailyStats { today_entries: number; today_exits: number; live_count: number; }
interface MLPred { predicted_visitors: number; confidence: number; status: string; recommendation: string; }

/* ─────────────── helpers ─────────────── */
const getCapacity = (t: Temple) => typeof t.capacity === 'number' ? t.capacity : (t.capacity?.total || 1);
const pct = (live: number, cap: number) => Math.min(Math.round((live / Math.max(cap, 1)) * 100), 100);

function statusConfig(s: string) {
    if (s === 'RED') return { label: 'CRITICAL', bg: 'bg-red-500', ring: 'ring-red-500/30', text: 'text-red-600', light: 'bg-red-50', bar: 'from-red-500 to-red-600', glow: 'shadow-red-500/40' };
    if (s === 'ORANGE') return { label: 'WARNING', bg: 'bg-orange-500', ring: 'ring-orange-500/30', text: 'text-orange-600', light: 'bg-orange-50', bar: 'from-orange-400 to-orange-600', glow: 'shadow-orange-500/40' };
    return { label: 'SAFE', bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-600', light: 'bg-emerald-50', bar: 'from-emerald-400 to-emerald-500', glow: 'shadow-emerald-500/40' };
}

/* ─────────────── Animated Counter ─────────────── */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const prev = useRef(value);
    useEffect(() => {
        const from = prev.current;
        prev.current = value;
        let raf: number;
        const dur = 600;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            if (ref.current) ref.current.textContent = Math.round(from + (value - from) * ease).toLocaleString();
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return <span ref={ref} className={className}>{value.toLocaleString()}</span>;
}

/* ─────────────── Circular Gauge ─────────────── */
function CircularGauge({ percent, status }: { percent: number; status: string }) {
    const cfg = statusConfig(status);
    const r = 54, c = 2 * Math.PI * r;
    const dash = (percent / 100) * c;
    return (
        <div className="relative flex items-center justify-center">
            <svg width={128} height={128} className="-rotate-90">
                <circle cx={64} cy={64} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
                <motion.circle cx={64} cy={64} r={r} fill="none"
                    strokeWidth={10} strokeLinecap="round"
                    stroke={status === 'RED' ? '#ef4444' : status === 'ORANGE' ? '#f97316' : '#10b981'}
                    strokeDasharray={`${c}`}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: c - dash }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black tabular-nums ${cfg.text}`}>{percent}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full</span>
            </div>
        </div>
    );
}

/* ─────────────── Entries Drawer ─────────────── */
function EntriesDrawer({ entries, loading, onClose }: { entries: any[]; loading: boolean; onClose: () => void }) {
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">Current Entries</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">People inside right now</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6" style={{ willChange: 'scroll-position' }}>
                    {loading ? (
                        <div className="space-y-3">
                            {Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <Users className="w-8 h-8 mb-3 opacity-50" />
                            <p className="font-semibold text-sm">No active entries inside</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {entries.map((e, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">
                                        {(e.userName || 'V').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-700 truncate">{e.userName || 'Visitor'}</p>
                                        {e.userEmail && <p className="text-xs text-slate-400 truncate">{e.userEmail}</p>}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-mono text-[11px] font-bold text-orange-600">#{(e.passId || '').slice(-6).toUpperCase()}</p>
                                        {e.entryTime && <p className="text-[10px] text-slate-400">{new Date(e.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}

/* ─────────────── Reset Confirm Dialog ─────────────── */
function ResetDialog({ templeName, onConfirm, onClose, loading }: {
    templeName: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full z-10"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RotateCcw className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-black text-slate-800 text-center mb-1">Reset Live Count?</h3>
                <p className="text-sm text-slate-500 text-center mb-5">
                    Reset <span className="font-bold text-slate-700">{templeName}</span> live count to 0. This cannot be undone.
                </p>
                <div className="flex gap-2">
                    <button onClick={onClose} disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 text-sm transition-colors">Cancel</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                        {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Resetting…</> : 'Yes, Reset'}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

/* ─────────────── Toast ─────────────── */
function Toast({ msg, ok, onDone }: { msg: string; ok: boolean; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <motion.div initial={{ opacity: 0, y: -32, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -32 }}
            className={`fixed top-4 right-4 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm
                        ${ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {msg}
        </motion.div>
    );
}

/* ─────────────── Main Content ─────────────── */
function AdminLiveMonitorContent() {
    const { user } = useAuth();
    const { predictBatch } = useMLPredict();

    // data state
    const [temples, setTemples] = useState<Temple[]>([]);
    const [liveTemples, setLiveTemples] = useState<LiveTemple[]>([]);
    const [summary, setSummary] = useState({ total_visitors: 0, total_capacity: 0, overall_percentage: 0, total_temples: 0 });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [dailyStats, setDailyStats] = useState<Record<string, DailyStats>>({});
    const [predictions, setPredictions] = useState<Record<string, MLPred>>({});
    const [entries, setEntries] = useState<any[]>([]);
    const [lastUpd, setLastUpd] = useState<Date | null>(null);

    // ui state
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showEntries, setShowEntries] = useState(false);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const showToast = (msg: string, ok = true) => setToast({ msg, ok });
    const [liveCountdown, setLiveCountdown] = useState(8);

    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

    /* ── selected derived ── */
    const selectedTemple = temples.find(t => t._id === selectedId);
    const selectedLive = liveTemples.find(l => l.temple_id === selectedId);
    const selectedPred = selectedId ? predictions[selectedId] : null;
    const selectedDaily = selectedId ? dailyStats[selectedId] : null;
    const currentLive = selectedLive?.live_count ?? selectedTemple?.live_count ?? selectedTemple?.currentOccupancy ?? 0;
    const currentCap = selectedLive?.capacity ?? (selectedTemple ? getCapacity(selectedTemple) : 1);
    const currentPct = selectedLive?.capacity_percentage ?? pct(currentLive, currentCap);
    const currentStatus = selectedLive?.traffic_status ?? 'GREEN';
    const cfg = statusConfig(currentStatus);

    /* ── fetch live ── */
    const fetchLive = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [tRes, lRes] = await Promise.all([templesApi.getAll(), liveApi.getCrowdData()]);
            if (tRes.success) {
                setTemples(tRes.data);
                if (tRes.data.length > 0 && !selectedId) setSelectedId(tRes.data[0]._id);
            }
            if (lRes.success) {
                const raw = lRes.data as any;
                const arr: LiveTemple[] = (raw?.temples || []);
                setLiveTemples(arr);
                setSummary({
                    total_visitors: raw?.summary?.total_visitors || 0,
                    total_capacity: raw?.summary?.total_capacity || 0,
                    overall_percentage: raw?.summary?.overall_percentage || 0,
                    total_temples: arr.length,
                });
                setLastUpd(new Date());
            }
        } catch { /* silent fail on poll */ }
        finally { setLoading(false); setRefreshing(false); }
    }, [selectedId]);

    /* ── fetch daily stats for selected temple ── */
    const fetchDailyStats = useCallback(async (templeId: string) => {
        try {
            const res = await liveApi.getDailyStats(templeId);
            if (res?.success) {
                setDailyStats(prev => ({ ...prev, [templeId]: res.data }));
            }
        } catch { /* ignore */ }
    }, []);

    /* ── initial + polling ── */
    useEffect(() => {
        if (!user) return;
        fetchLive();
        const iv = setInterval(() => { fetchLive(true); setLiveCountdown(8); }, 8000);
        const tick = setInterval(() => setLiveCountdown(c => (c <= 1 ? 8 : c - 1)), 1000);
        return () => { clearInterval(iv); clearInterval(tick); };
    }, [user, fetchLive]);

    /* ── fetch daily stats when temple changes ── */
    useEffect(() => {
        if (selectedId) fetchDailyStats(selectedId);
    }, [selectedId, fetchDailyStats]);

    /* ── ML predictions ── */
    useEffect(() => {
        if (temples.length === 0) return;
        const now = new Date();
        const requests = temples.map(t => ({
            temple_id: t._id,
            date: now.toISOString().split('T')[0],
            day_of_week: now.getDay(),
            month: now.getMonth() + 1,
            is_holiday: false,
            is_weekend: now.getDay() === 0 || now.getDay() === 6,
        }));
        predictBatch(requests).then(results => {
            const m: Record<string, MLPred> = {};
            results.forEach(r => { m[r.temple_id] = r; });
            setPredictions(m);
        }).catch(() => { });
    }, [temples.length]); // eslint-disable-line

    /* ── actions ── */
    const openEntries = async () => {
        if (!selectedId) return;
        setShowEntries(true);
        setLoadingEntries(true);
        try {
            const res = await liveApi.getCurrentEntries(selectedId);
            if (res?.success) setEntries(res.data || []);
        } catch { setEntries([]); }
        finally { setLoadingEntries(false); }
    };

    const doReset = async () => {
        if (!selectedId || !selectedTemple) return;
        setResetting(true);
        try {
            await liveApi.resetCount(selectedId);
            setLiveTemples(prev => prev.map(l => l.temple_id === selectedId ? { ...l, live_count: 0, capacity_percentage: 0 } : l));
            showToast(`${selectedTemple.name} count reset to 0`);
            setShowReset(false);
            fetchDailyStats(selectedId);
        } catch { showToast('Reset failed', false); }
        finally { setResetting(false); }
    };

    /* ── Skeleton loading ── */
    if (loading) {
        return (
            <AdminLayout title="Live Monitor" subtitle="Real-time crowd tracking">
                <div className="space-y-5 animate-pulse">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
                    </div>
                    <div className="grid lg:grid-cols-3 gap-5">
                        <div className="h-[520px] bg-slate-100 rounded-3xl" />
                        <div className="lg:col-span-2 h-[520px] bg-slate-100 rounded-3xl" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    /* ── Render ── */
    return (
        <AdminLayout title="Live Monitor" subtitle="Real-time crowd tracking &amp; AI intelligence">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
                <AnimatePresence>
                    {toast && <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}
                </AnimatePresence>

                <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-6 space-y-5">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200">
                                    <Radio className="w-4.5 h-4.5 text-white" />
                                </div>
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Live Monitor</h1>
                                <p className="text-xs text-slate-400 font-medium">
                                    {summary.total_temples} temples
                                    {lastUpd ? ` · Updated ${lastUpd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ' · Loading…'}
                                    {!loading && <> · <span className="text-blue-500 font-bold tabular-nums">↻ {liveCountdown}s</span></>}
                                </p>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => fetchLive(true)} disabled={refreshing}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:border-slate-300 shadow-sm">
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </motion.button>
                    </div>

                    {/* ── Summary Stats ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Live Visitors', value: summary.total_visitors, icon: <Users className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50', sub: 'Inside temples now', delay: 0 },
                            { label: 'Total Capacity', value: summary.total_capacity, icon: <Activity className="w-4 h-4 text-slate-600" />, bg: 'bg-slate-50', sub: 'Combined max', delay: 0.04 },
                            { label: 'Overall Load', value: `${summary.overall_percentage}%`, icon: <TrendingUp className="w-4 h-4 text-orange-600" />, bg: 'bg-orange-50', sub: 'System utilisation', delay: 0.08 },
                            {
                                label: 'Critical Alerts',
                                value: liveTemples.filter(l => l.traffic_status === 'RED').length,
                                icon: <AlertTriangle className="w-4 h-4 text-red-600" />, bg: 'bg-red-50',
                                sub: 'Temples above 90%', delay: 0.12
                            },
                        ].map(s => (
                            <motion.div key={s.label}
                                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: s.delay, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                                        <p className="text-2xl font-black text-slate-800 tabular-nums">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{s.sub}</p>
                                    </div>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>{s.icon}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Main Panel ── */}
                    <div className="grid lg:grid-cols-3 gap-5" style={{ minHeight: 560 }}>

                        {/* Temple List */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                                <h3 className="font-black text-slate-800">Monitored Temples</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{temples.length} active feeds · auto-refresh</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ willChange: 'scroll-position', overscrollBehavior: 'contain' }}>
                                {temples.map(t => {
                                    const live = liveTemples.find(l => l.temple_id === t._id);
                                    const count = live?.live_count ?? t.live_count ?? 0;
                                    const cap = live?.capacity ?? getCapacity(t);
                                    const p = live?.capacity_percentage ?? pct(count, cap);
                                    const st = live?.traffic_status ?? 'GREEN';
                                    const sc = statusConfig(st);
                                    const pred = predictions[t._id];
                                    const sel = selectedId === t._id;

                                    return (
                                        <motion.button key={t._id}
                                            onClick={() => setSelectedId(t._id)}
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            className={`w-full p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden
                                                        ${sel
                                                    ? 'bg-slate-900 border-slate-700 shadow-lg'
                                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2.5">
                                                <div className="min-w-0">
                                                    <h4 className={`font-black text-sm truncate ${sel ? 'text-white' : 'text-slate-800'}`}>{t.name}</h4>
                                                    <p className={`text-xs font-medium mt-0.5 ${sel ? 'text-slate-400' : 'text-slate-400'}`}>
                                                        {typeof t.location === 'object' ? (t.location as any).city : t.location}
                                                    </p>
                                                </div>
                                                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black shrink-0 ${sc.light} ${sc.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.bg} ${st === 'RED' ? 'animate-pulse' : ''}`} />
                                                    {sc.label}
                                                </span>
                                            </div>

                                            {/* Capacity bar */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className={sel ? 'text-slate-300' : 'text-slate-500'}>{count.toLocaleString()} / {cap.toLocaleString()}</span>
                                                    <span className={sc.text}>{p}%</span>
                                                </div>
                                                <div className={`h-1.5 rounded-full overflow-hidden ${sel ? 'bg-white/10' : 'bg-slate-100'}`}>
                                                    <motion.div
                                                        className={`h-full rounded-full bg-gradient-to-r ${sc.bar}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${p}%` }}
                                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                    />
                                                </div>
                                            </div>

                                            {/* AI prediction tag */}
                                            {pred && (
                                                <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold ${sel ? 'text-purple-300' : 'text-purple-600'}`}>
                                                    <Brain className="w-3 h-3" />
                                                    AI: {pred.predicted_visitors} expected · {Math.round(pred.confidence * 100)}% conf.
                                                </div>
                                            )}

                                            {sel && <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Main Panel - Dark visualizer + info */}
                        <div className="lg:col-span-2 flex flex-col gap-4">

                            {selectedTemple ? (
                                <>
                                    {/* Dark monitor panel */}
                                    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex-1 min-h-[320px] flex flex-col">
                                        {/* Subtle animated background */}
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                            <div className={`absolute inset-0 opacity-5 bg-gradient-radial ${currentStatus === 'RED' ? 'from-red-500' : currentStatus === 'ORANGE' ? 'from-orange-500' : 'from-emerald-500'} to-transparent`} />
                                            {[...Array(12)].map((_, i) => (
                                                <motion.div key={i}
                                                    className={`absolute w-1 h-1 rounded-full ${currentStatus === 'RED' ? 'bg-red-400' : currentStatus === 'ORANGE' ? 'bg-orange-400' : 'bg-emerald-400'} opacity-30`}
                                                    style={{ left: `${8 + i * 8}%`, top: `${20 + (i % 4) * 20}%` }}
                                                    animate={{ y: [0, -8, 0], opacity: [0.2, 0.6, 0.2] }}
                                                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
                                                />
                                            ))}
                                        </div>

                                        {/* Header */}
                                        <div className="flex items-start justify-between p-6 pb-0 relative z-10">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-xl font-black text-white">{selectedTemple.name}</h2>
                                                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-300 bg-red-500/20 border border-red-500/30 px-2.5 py-1 rounded-lg">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />LIVE
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-xs mt-1 font-medium">
                                                    {typeof selectedTemple.location === 'object' ? (selectedTemple.location as any).city : selectedTemple.location}
                                                    {' · '}Polling every 8s
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={openEntries}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white/80 hover:text-white border border-white/10 text-xs font-bold transition-all">
                                                    <Eye className="w-3.5 h-3.5" />View Inside
                                                </motion.button>
                                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => setShowReset(true)}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-300 border border-red-500/30 text-xs font-bold transition-all">
                                                    <RotateCcw className="w-3.5 h-3.5" />Reset
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* Central counter + gauge */}
                                        <div className="flex-1 flex items-center justify-center gap-10 px-8 py-6 relative z-10">
                                            <CircularGauge percent={currentPct} status={currentStatus} />
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Real-Time Count</p>
                                                <div className={`text-7xl font-black tabular-nums tracking-tighter leading-none ${cfg.text}`}>
                                                    <AnimatedNumber value={currentLive} />
                                                </div>
                                                <p className="text-slate-400 text-sm font-medium mt-2">
                                                    of <span className="text-white font-bold">{currentCap.toLocaleString()}</span> capacity
                                                </p>
                                                <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${cfg.light} ${cfg.text} border border-current/10`}>
                                                    <span className={`w-2 h-2 rounded-full ${cfg.bg} ${currentStatus !== 'GREEN' ? 'animate-pulse' : ''}`} />
                                                    {cfg.label} · {currentPct}% Full
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Insight bar */}
                                        <div className="border-t border-white/5 bg-black/30 backdrop-blur-sm px-6 py-4 flex items-center gap-4 relative z-10 shrink-0">
                                            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                                <Brain className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-purple-400 font-black uppercase tracking-wider mb-0.5">AI Crowd Forecast</p>
                                                <p className="text-white/80 text-xs font-medium truncate">
                                                    {selectedPred
                                                        ? `Expecting ${selectedPred.predicted_visitors.toLocaleString()} visitors · ${selectedPred.recommendation}`
                                                        : 'Analyzing entrance patterns…'}
                                                </p>
                                            </div>
                                            {selectedPred && (
                                                <div className="shrink-0 text-right">
                                                    <p className="text-[10px] text-slate-400 font-bold">Confidence</p>
                                                    <p className="text-purple-400 font-black text-sm">{Math.round(selectedPred.confidence * 100)}%</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            {
                                                label: "Today's Entries", icon: <ArrowUpRight className="w-4 h-4 text-emerald-600" />,
                                                value: selectedDaily?.today_entries ?? '—', bg: 'bg-emerald-50', sub: 'Entered today'
                                            },
                                            {
                                                label: "Today's Exits", icon: <ArrowDownRight className="w-4 h-4 text-blue-600" />,
                                                value: selectedDaily?.today_exits ?? '—', bg: 'bg-blue-50', sub: 'Exited today'
                                            },
                                            {
                                                label: 'Free Spaces', icon: <Zap className="w-4 h-4 text-orange-600" />,
                                                value: selectedLive ? selectedLive.available_space : (currentCap - currentLive), bg: 'bg-orange-50', sub: 'Available now'
                                            },
                                        ].map(s => (
                                            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.bg}`}>{s.icon}</div>
                                                </div>
                                                <p className="text-2xl font-black text-slate-800 tabular-nums">
                                                    {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{s.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-5xl mb-4">📡</div>
                                        <p className="font-black text-slate-600 mb-1">Select a Temple</p>
                                        <p className="text-sm text-slate-400">Choose a temple from the list to view live data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── All temples table ── */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="font-black text-slate-800">All Temples Status</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time overview of all {temples.length} monitored temples</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100 bg-slate-50/60">
                                        <th className="px-6 py-3.5">Temple</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5">Live Count</th>
                                        <th className="px-6 py-3.5">Capacity</th>
                                        <th className="px-6 py-3.5">Load</th>
                                        <th className="px-6 py-3.5">AI Forecast</th>
                                        <th className="px-6 py-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {temples.map((t, i) => {
                                        const live = liveTemples.find(l => l.temple_id === t._id);
                                        const count = live?.live_count ?? 0;
                                        const cap = live?.capacity ?? getCapacity(t);
                                        const p = live?.capacity_percentage ?? pct(count, cap);
                                        const st = live?.traffic_status ?? 'GREEN';
                                        const sc = statusConfig(st);
                                        const pred = predictions[t._id];
                                        const isSel = selectedId === t._id;
                                        return (
                                            <motion.tr key={t._id}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.02 }}
                                                onClick={() => setSelectedId(t._id)}
                                                className={`cursor-pointer transition-colors ${isSel ? 'bg-slate-900 hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <p className={`font-bold text-sm ${isSel ? 'text-white' : 'text-slate-800'}`}>{t.name}</p>
                                                    <p className={`text-xs ${isSel ? 'text-slate-400' : 'text-slate-400'}`}>
                                                        {typeof t.location === 'object' ? (t.location as any).city : t.location}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black ${sc.light} ${sc.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sc.bg} ${st === 'RED' ? 'animate-pulse' : ''}`} />
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 font-black tabular-nums text-lg ${isSel ? cfg.text : sc.text}`}>{count.toLocaleString()}</td>
                                                <td className={`px-6 py-4 text-sm font-medium ${isSel ? 'text-slate-400' : 'text-slate-500'}`}>{cap.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isSel ? 'bg-white/10' : 'bg-slate-100'}`} style={{ width: 80 }}>
                                                            <div className={`h-full rounded-full bg-gradient-to-r ${sc.bar}`} style={{ width: `${p}%` }} />
                                                        </div>
                                                        <span className={`text-xs font-black ${isSel ? sc.text : sc.text}`}>{p}%</span>
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 text-xs font-medium ${isSel ? 'text-purple-300' : 'text-purple-600'}`}>
                                                    {pred ? `${pred.predicted_visitors.toLocaleString()} est.` : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-xs font-bold ${isSel ? 'text-white/60' : 'text-slate-400'}`}>
                                                        {isSel ? '● Viewing' : 'View →'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Video Analysis Section ── */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-px flex-1 bg-slate-100" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">AI Video Analysis Demo</span>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <VideoAnalyzer />
                    </div>
                </div>
            </div>

            {/* ── Portals ── */}
            {mounted && createPortal(
                <AnimatePresence>
                    {showEntries && (
                        <EntriesDrawer entries={entries} loading={loadingEntries} onClose={() => setShowEntries(false)} />
                    )}
                </AnimatePresence>,
                document.body
            )}

            {mounted && createPortal(
                <AnimatePresence>
                    {showReset && selectedTemple && (
                        <ResetDialog
                            templeName={selectedTemple.name}
                            onConfirm={doReset}
                            onClose={() => setShowReset(false)}
                            loading={resetting}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </AdminLayout>
    );
}

export default function AdminLivePage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminLiveMonitorContent />
        </ProtectedRoute>
    );
}
