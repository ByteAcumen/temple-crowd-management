'use client';

// Temple Smart E-Pass — Admin Dashboard
// Enhanced: 20s live poll, all 15 temples with capacity bars, sparkline-style trends, improved activity feed

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback, useRef } from 'react';
import { templesApi, adminApi, liveApi, Temple, Booking, CrowdData } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark, Users, CreditCard, Ticket, TrendingUp, TrendingDown,
    RefreshCw, CheckCircle2, AlertTriangle, Activity, Clock,
    BookOpen, XCircle, ChevronRight, BarChart2, Zap, MapPin,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardCharts from '@/components/admin/DashboardCharts';
import RecentActivity from '@/components/admin/RecentActivity';
import PeakHoursChart from '@/components/admin/PeakHoursChart';
import { ProtectedRoute } from '@/lib/protected-route';

/* ─── animated counter ─── */
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
    value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
    const [display, setDisplay] = useState(0);
    const raf = useRef<number>(0);
    const start = useRef(0);
    const prev = useRef(0);

    useEffect(() => {
        cancelAnimationFrame(raf.current);
        const from = prev.current;
        const duration = 600;
        start.current = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start.current) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setDisplay(from + (value - from) * ease);
            if (p < 1) raf.current = requestAnimationFrame(tick);
            else { prev.current = value; setDisplay(value); }
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [value]);

    const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-IN');
    return <span>{prefix}{formatted}{suffix}</span>;
}

/* ─── occupancy ring ─── */
function OccupancyRing({ pct, status }: { pct: number; status: string }) {
    const r = 36; const circ = 2 * Math.PI * r;
    const strokeColor = status === 'HIGH' ? '#ef4444' : status === 'MODERATE' ? '#f59e0b' : '#10b981';
    const dash = (Math.min(pct, 100) / 100) * circ;
    return (
        <svg width="88" height="88" className="shrink-0">
            <circle cx="44" cy="44" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <motion.circle cx="44" cy="44" r={r} fill="none" stroke={strokeColor} strokeWidth="7"
                strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
                style={{ rotate: -90, transformOrigin: '44px 44px' }}
                initial={{ strokeDasharray: `0 ${circ}` }}
                animate={{ strokeDasharray: `${dash} ${circ}` }}
                transition={{ duration: 1, ease: 'easeOut' }} />
            <text x="44" y="48" textAnchor="middle" className="fill-slate-800"
                style={{ fontSize: 13, fontWeight: 900, fontFamily: 'inherit' }}>
                {Math.round(pct)}%
            </text>
        </svg>
    );
}

/* ─── capacity mini-bar ─── */
function CapacityBar({ pct, status }: { pct: number; status: string }) {
    const color = status === 'HIGH' ? 'bg-red-500' : status === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-500';
    return (
        <div className="h-1.5 rounded-full bg-slate-100 w-full overflow-hidden mt-1">
            <motion.div
                className={`h-full rounded-full ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
            />
        </div>
    );
}

/* ─── crowd status config ─── */
const crowdStatusConfig = {
    HIGH: { label: 'High', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    MODERATE: { label: 'Moderate', color: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    LOW: { label: 'Low', color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

function getCrowdStatus(pct: number): 'HIGH' | 'MODERATE' | 'LOW' {
    if (pct >= 95) return 'HIGH';
    if (pct >= 85) return 'MODERATE';
    return 'LOW';
}

/* ══════════════════════ ALL TEMPLES SECTION ══════════════════════ */
interface TempleRow { temple: Temple; pct: number; status: 'HIGH' | 'MODERATE' | 'LOW'; }

function AllTemplesSection({ temples, loading }: { temples: Temple[]; loading: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const rows: TempleRow[] = temples.map(t => {
        const cap = typeof t.capacity === 'number' ? t.capacity : (t.capacity as any)?.total || 5000;
        const pct = cap > 0 ? ((t.live_count || 0) / cap) * 100 : 0;
        return { temple: t, pct: Math.min(pct, 100), status: getCrowdStatus(pct) };
    }).sort((a, b) => b.pct - a.pct);

    const visible = expanded ? rows : rows.slice(0, 6);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Live Temple Status</p>
                        <p className="text-[10px] text-slate-400 font-medium">{rows.length} temples · Real-time capacity</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-400">Live</span>
                    </span>
                    <Link href="/admin/live" className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
                        Full Map <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                {[
                    { label: 'Critical', value: rows.filter(r => r.status === 'HIGH').length, color: 'text-red-600', dot: 'bg-red-500' },
                    { label: 'Moderate', value: rows.filter(r => r.status === 'MODERATE').length, color: 'text-amber-600', dot: 'bg-amber-400' },
                    { label: 'Normal', value: rows.filter(r => r.status === 'LOW').length, color: 'text-emerald-600', dot: 'bg-emerald-500' },
                ].map(s => (
                    <div key={s.label} className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            <span className={`text-lg font-black tabular-nums ${s.color}`}>{loading ? '—' : s.value}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Temple rows */}
            <div className="divide-y divide-slate-50">
                <AnimatePresence>
                    {visible.map((row, i) => {
                        const cfg = crowdStatusConfig[row.status];
                        const city = typeof row.temple.location === 'object' && row.temple.location
                            ? (row.temple.location as any).city || ''
                            : (typeof row.temple.location === 'string' ? row.temple.location : '');
                        return (
                            <motion.div key={row.temple._id}
                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }} transition={{ delay: i * 0.025 }}
                                className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/70 transition-colors group">
                                {/* Rank */}
                                <span className="text-xs font-black text-slate-300 w-5 text-center tabular-nums">{i + 1}</span>
                                {/* Name + City */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">{row.temple.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {city && <p className="text-[10px] text-slate-400 font-medium">{city}</p>}
                                        <CapacityBar pct={row.pct} status={row.status} />
                                    </div>
                                </div>
                                {/* Count */}
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black tabular-nums text-slate-800 font-mono">
                                        {(row.temple.live_count || 0).toLocaleString('en-IN')}
                                    </p>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
                                        {row.pct.toFixed(1)}%
                                    </span>
                                </div>
                                {/* Status dot */}
                                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.color} ${row.status !== 'LOW' ? 'animate-pulse' : ''}`} />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Show more */}
            {rows.length > 6 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                    <button onClick={() => setExpanded(!expanded)}
                        className="w-full text-[11px] font-black text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1">
                        {expanded ? '↑ Show less' : `↓ Show ${rows.length - 6} more temples`}
                    </button>
                </div>
            )}
        </motion.div>
    );
}

/* ══════════════════════ MAIN COMPONENT ══════════════════════ */
function AdminDashboardContent() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [countdown, setCountdown] = useState(20);

    const [overview, setOverview] = useState({ totalTemples: 0, totalBookings: 0, totalUsers: 0, totalRevenue: 0 });
    const [bookingBreakdown, setBookingBreakdown] = useState({ today: 0, this_month: 0, active: 0, cancelled: 0, completed: 0 });
    const [crowd, setCrowd] = useState({ live: 0, capacity: 0, pct: 0, status: 'LOW' });
    const [chartData, setChartData] = useState<{ dailyTrends: any[]; revenueByTemple: any[]; peakHours: any[] }>(
        { dailyTrends: [], revenueByTemple: [], peakHours: [] }
    );
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [allTemples, setAllTemples] = useState<Temple[]>([]);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setApiError(null);
        try {
            const end = new Date();
            const start = new Date();
            if (dateRange === '7d') start.setDate(end.getDate() - 7);
            else if (dateRange === '30d') start.setDate(end.getDate() - 30);
            else if (dateRange === '90d') start.setDate(end.getDate() - 90);

            const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const [statsRes, analyticsRes, templesRes, liveRes, bookingsRes] = await Promise.all([
                adminApi.getStats(),
                adminApi.getAnalytics({ startDate: fmt(start), endDate: fmt(end) }),
                templesApi.getAll(),
                liveApi.getCrowdData(),
                adminApi.getBookings({ limit: 10 }),
            ]);

            if (statsRes.success && statsRes.data) {
                const d = statsRes.data;
                setOverview({
                    totalTemples: d.overview?.total_temples ?? 0,
                    totalBookings: d.overview?.total_bookings ?? 0,
                    totalUsers: d.overview?.total_users ?? 0,
                    totalRevenue: d.overview?.total_revenue ?? 0,
                });
                setBookingBreakdown({
                    today: d.bookings?.today ?? 0,
                    this_month: d.bookings?.this_month ?? 0,
                    active: d.bookings?.active ?? 0,
                    cancelled: d.bookings?.cancelled ?? 0,
                    completed: d.bookings?.completed ?? 0,
                });
                const pct = parseFloat(String(d.crowd?.occupancy_percentage ?? 0));
                setCrowd({
                    live: d.crowd?.current_live_count ?? 0,
                    capacity: d.crowd?.total_capacity ?? 0,
                    pct: isNaN(pct) ? 0 : pct,
                    status: d.crowd?.status ?? 'LOW',
                });
            }

            if (analyticsRes.success && analyticsRes.data) {
                const a = analyticsRes.data;
                setChartData({
                    dailyTrends: a.daily_trends || [],
                    revenueByTemple: a.revenue_by_temple || [],
                    peakHours: (a as any).peak_hours || [],
                });
            }

            /* merge live counts into all temples */
            let templesData = templesRes.data || [];
            if (liveRes.success && liveRes.data) {
                const raw = liveRes.data;
                const liveTemples: CrowdData[] = Array.isArray(raw) ? raw : ((raw as any).temples || []);
                const liveMap: Record<string, number> = {};
                liveTemples.forEach(t => {
                    const id = t.temple_id || (t as any)._id;
                    if (id) liveMap[id] = t.live_count || 0;
                });
                templesData = templesData.map(t => ({ ...t, live_count: liveMap[t._id] ?? t.live_count ?? 0 }));
            }
            setAllTemples(templesData);

            if (bookingsRes.success && bookingsRes.data) setRecentBookings(bookingsRes.data);

            setLastUpdated(new Date());
            setCountdown(20);
        } catch (e: any) {
            setApiError(e.message || 'Backend unreachable');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    /* Poll every 20s */
    useEffect(() => {
        fetchData();
        pollRef.current = setInterval(() => fetchData(true), 20_000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [fetchData]);

    /* Countdown ticker */
    useEffect(() => {
        const tick = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 20), 1000);
        return () => clearInterval(tick);
    }, []);

    const crowdCfg = crowdStatusConfig[crowd.status as keyof typeof crowdStatusConfig] || crowdStatusConfig.LOW;
    const topTemples = [...allTemples].sort((a, b) => (b.live_count || 0) - (a.live_count || 0)).slice(0, 5);
    const avgPerBooking = overview.totalBookings > 0 ? Math.round(overview.totalRevenue / overview.totalBookings) : 0;
    const completionRate = (overview.totalBookings > 0)
        ? Math.round((bookingBreakdown.completed / overview.totalBookings) * 100)
        : 0;

    /* ─── KPI cards ─── */
    const kpis = [
        {
            label: 'Total Revenue', icon: <CreditCard className="w-5 h-5" />,
            value: overview.totalRevenue,
            display: overview.totalRevenue >= 100000
                ? `₹${(overview.totalRevenue / 100000).toFixed(1)}L`
                : `₹${overview.totalRevenue >= 1000 ? (overview.totalRevenue / 1000).toFixed(1) + 'k' : overview.totalRevenue}`,
            sub: `₹${avgPerBooking.toLocaleString('en-IN')} avg/booking`,
            trending: true,
            bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100',
            icon_bg: 'bg-emerald-100 text-emerald-600', val: 'text-emerald-700',
        },
        {
            label: 'Total Bookings', icon: <Ticket className="w-5 h-5" />,
            value: overview.totalBookings,
            display: overview.totalBookings.toLocaleString('en-IN'),
            sub: `${bookingBreakdown.today} today · ${bookingBreakdown.this_month} this month`,
            trending: true,
            bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100',
            icon_bg: 'bg-blue-100 text-blue-600', val: 'text-blue-700',
        },
        {
            label: 'Active Bookings', icon: <BookOpen className="w-5 h-5" />,
            value: bookingBreakdown.active,
            display: bookingBreakdown.active.toLocaleString('en-IN'),
            sub: `${completionRate}% completion rate`,
            trending: null,
            bg: 'from-violet-50 to-purple-50', border: 'border-violet-100',
            icon_bg: 'bg-violet-100 text-violet-600', val: 'text-violet-700',
        },
        {
            label: 'Temples', icon: <Landmark className="w-5 h-5" />,
            value: overview.totalTemples,
            display: overview.totalTemples.toString(),
            sub: `${allTemples.filter(t => t.status === 'OPEN').length} open now`,
            trending: null,
            bg: 'from-amber-50 to-orange-50', border: 'border-amber-100',
            icon_bg: 'bg-amber-100 text-amber-600', val: 'text-amber-700',
        },
        {
            label: 'Registered Users', icon: <Users className="w-5 h-5" />,
            value: overview.totalUsers,
            display: overview.totalUsers.toLocaleString('en-IN'),
            sub: 'Devotees + Staff',
            trending: true,
            bg: 'from-rose-50 to-pink-50', border: 'border-rose-100',
            icon_bg: 'bg-rose-100 text-rose-600', val: 'text-rose-700',
        },
        {
            label: 'Live Visitors', icon: <Activity className="w-5 h-5" />,
            value: crowd.live,
            display: crowd.live.toLocaleString('en-IN'),
            sub: `${crowd.pct.toFixed(1)}% of ${(crowd.capacity / 1000).toFixed(0)}k capacity`,
            trending: crowd.pct >= 60,
            bg: crowd.status === 'HIGH' ? 'from-red-50 to-rose-50' : crowd.status === 'MODERATE' ? 'from-amber-50 to-yellow-50' : 'from-slate-50 to-slate-100',
            border: crowd.status === 'HIGH' ? 'border-red-100' : crowd.status === 'MODERATE' ? 'border-amber-100' : 'border-slate-100',
            icon_bg: crowd.status === 'HIGH' ? 'bg-red-100 text-red-600' : crowd.status === 'MODERATE' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500',
            val: crowd.status === 'HIGH' ? 'text-red-700' : crowd.status === 'MODERATE' ? 'text-amber-700' : 'text-slate-700',
        },
    ];

    /* ══ RENDER ══ */
    return (
        <AdminLayout title="Dashboard" subtitle="Real-time overview & analytics">
            <div className="space-y-4">

                {/* ── Control bar ── */}
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className="text-sm font-black text-slate-700">
                            {loading ? 'Refreshing data…' : 'Live data'}
                        </span>
                        {!loading && lastUpdated && (
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 font-medium hidden sm:block">
                                Next refresh in {countdown}s
                            </span>
                        )}
                        {apiError && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 px-2 py-0.5 bg-red-50 rounded-lg border border-red-200">
                                <AlertTriangle className="w-3 h-3" /> {apiError}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                            {(['7d', '30d', '90d'] as const).map(r => (
                                <button key={r} onClick={() => setDateRange(r)}
                                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all
                                               ${dateRange === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                                </button>
                            ))}
                        </div>
                        {lastUpdated && (
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 hidden sm:flex">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => fetchData()}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── Crowd Status + Booking Breakdown ── */}
                <div className="grid lg:grid-cols-3 gap-4">
                    {/* System occupancy */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className={`bg-gradient-to-br ${crowd.status === 'HIGH' ? 'from-red-50 to-rose-50' : crowd.status === 'MODERATE' ? 'from-amber-50 to-yellow-50' : 'from-slate-50 to-white'} rounded-3xl border ${crowd.status === 'HIGH' ? 'border-red-200' : crowd.status === 'MODERATE' ? 'border-amber-200' : 'border-slate-100'} p-5`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">System Occupancy</p>
                        <div className="flex items-center gap-4">
                            <OccupancyRing pct={crowd.pct} status={crowd.status} />
                            <div className="flex-1">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black mb-2 ${crowdCfg.bg} ${crowdCfg.text} ${crowdCfg.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${crowdCfg.color} animate-pulse`} />
                                    {crowdCfg.label} Crowd
                                </div>
                                <p className="text-2xl font-black tabular-nums text-slate-800">
                                    {loading ? '—' : <AnimatedNumber value={crowd.live} />}
                                </p>
                                <p className="text-xs text-slate-400 font-medium">
                                    of <AnimatedNumber value={crowd.capacity} /> cap.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* All Temples Live Status (Now Top Right) */}
                    <div className="lg:col-span-2">
                        <AllTemplesSection temples={allTemples} loading={loading} />
                    </div>
                </div>

                {/* ── 6 KPI cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    {kpis.map((k, i) => (
                        <motion.div key={k.label}
                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (i * 0.05) }}
                            className={`bg-gradient-to-br ${k.bg} rounded-2xl border ${k.border} p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-default`}>
                            <div className="flex items-center justify-between">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${k.icon_bg}`}>
                                    {k.icon}
                                </div>
                                {k.trending !== null && (
                                    <span className={`text-[10px] font-black flex items-center gap-0.5 ${k.trending ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {k.trending ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {k.trending ? '+12.5%' : ''}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.label}</p>
                                <p className={`text-2xl font-black tabular-nums mt-0.5 ${k.val}`}>
                                    {loading ? <span className="animate-pulse bg-slate-200 rounded h-7 w-16 block" /> : k.display}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{k.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Booking breakdown */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booking Breakdown</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {bookingBreakdown.active} active · {bookingBreakdown.completed} completed · {bookingBreakdown.cancelled} cancelled
                            </p>
                        </div>
                        <Link href="/admin/bookings"
                            className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
                            View all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Today', value: bookingBreakdown.today, icon: <Clock className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600', val: 'text-blue-700' },
                            { label: 'This Month', value: bookingBreakdown.this_month, icon: <BarChart2 className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-600', val: 'text-indigo-700' },
                            { label: 'Active', value: bookingBreakdown.active, icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600', val: 'text-emerald-700' },
                            { label: 'Cancelled', value: bookingBreakdown.cancelled, icon: <XCircle className="w-4 h-4" />, color: 'bg-red-50 text-red-600', val: 'text-red-700' },
                        ].map(b => (
                            <div key={b.label} className="bg-slate-50 rounded-2xl border border-slate-100 p-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${b.color}`}>
                                    {b.icon}
                                </div>
                                <p className={`text-xl font-black tabular-nums ${b.val}`}>
                                    {loading ? '—' : b.value.toLocaleString('en-IN')}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{b.label}</p>
                            </div>
                        ))}
                    </div>
                    {/* Active vs cancelled bar */}
                    {bookingBreakdown.active + bookingBreakdown.cancelled > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                <span>Active {Math.round((bookingBreakdown.active / (bookingBreakdown.active + bookingBreakdown.cancelled)) * 100)}%</span>
                                <span>Cancelled {Math.round((bookingBreakdown.cancelled / (bookingBreakdown.active + bookingBreakdown.cancelled)) * 100)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                                <motion.div className="h-full bg-emerald-400 rounded-l-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(bookingBreakdown.active / (bookingBreakdown.active + bookingBreakdown.cancelled || 1)) * 100}%` }}
                                    transition={{ duration: 0.8, delay: 0.4 }} />
                                <motion.div className="h-full bg-red-400 rounded-r-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(bookingBreakdown.cancelled / (bookingBreakdown.active + bookingBreakdown.cancelled || 1)) * 100}%` }}
                                    transition={{ duration: 0.8, delay: 0.5 }} />
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ── Peak Hours chart ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[380px]">
                    <PeakHoursChart data={chartData.peakHours} />
                </motion.div>

                {/* ── Booking Trends + Revenue ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
                    <DashboardCharts
                        dailyTrends={chartData.dailyTrends}
                        revenueByTemple={chartData.revenueByTemple}
                        dateRange={dateRange}
                        onRangeChange={setDateRange}
                    />
                </motion.div>

                {/* ── Recent Activity (full width) ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.48 }} className="h-[480px]">
                    <RecentActivity bookings={recentBookings} />
                </motion.div>

                {/* ── Quick Links Footer ── */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Navigate</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { href: '/admin/live', label: '📡 Live Monitor', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                { href: '/admin/bookings', label: '📅 Bookings', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                { href: '/admin/temples', label: '🛕 Temples', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                                { href: '/admin/analytics', label: '📊 Analytics', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                                { href: '/admin/users', label: '👥 Users & Roles', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                                { href: '/admin/testing', label: '🔧 API Testing', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                            ].map(l => (
                                <Link key={l.href} href={l.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all hover:shadow-sm ${l.color}`}>
                                    {l.label} <ChevronRight className="w-3 h-3" />
                                </Link>
                            ))}
                        </div>
                        {lastUpdated && (
                            <span className="text-[10px] text-slate-300 font-medium hidden xl:block">
                                Auto-refresh every 20s · last {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                    </div>
                </motion.div>

            </div>
        </AdminLayout>
    );
}

export default function AdminDashboard() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}
