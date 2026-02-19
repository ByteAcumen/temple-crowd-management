'use client';

// Temple Smart E-Pass — Admin Dashboard
// Premium redesign: 6 KPI cards, occupancy ring, booking breakdown, live crowd status, chart rows, auto-poll

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback, useRef } from 'react';
import { templesApi, adminApi, liveApi, Temple, Booking, CrowdData } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark, Users, CreditCard, Ticket, TrendingUp, TrendingDown,
    RefreshCw, CheckCircle2, AlertTriangle, Activity, Clock,
    BookOpen, XCircle, ChevronRight, BarChart2,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardCharts from '@/components/admin/DashboardCharts';
import RecentActivity from '@/components/admin/RecentActivity';
import LiveStatusCard from '@/components/admin/LiveStatusCard';
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
        const duration = 800;
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
    const dash = (pct / 100) * circ;
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

/* ─── status dot ─── */
const crowdStatusConfig = {
    HIGH: { label: 'High', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    MODERATE: { label: 'Moderate', color: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    LOW: { label: 'Low', color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

/* ══════════════════════ MAIN COMPONENT ══════════════════════ */
function AdminDashboardContent() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── stats shape ── */
    const [overview, setOverview] = useState({
        totalTemples: 0, totalBookings: 0, totalUsers: 0, totalRevenue: 0,
    });
    const [bookingBreakdown, setBookingBreakdown] = useState({
        today: 0, this_month: 0, active: 0, cancelled: 0, completed: 0,
    });
    const [crowd, setCrowd] = useState({
        live: 0, capacity: 0, pct: 0, status: 'LOW',
    });
    const [chartData, setChartData] = useState<{
        dailyTrends: any[]; revenueByTemple: any[]; peakHours: any[];
    }>({ dailyTrends: [], revenueByTemple: [], peakHours: [] });
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [topTemples, setTopTemples] = useState<Temple[]>([]);

    /* ── fetch ── */
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setApiError(null);
        try {
            const end = new Date();
            const start = new Date();
            if (dateRange === '7d') start.setDate(end.getDate() - 7);
            else if (dateRange === '30d') start.setDate(end.getDate() - 30);
            else if (dateRange === '90d') start.setDate(end.getDate() - 90);

            const fmt = (d: Date) => d.toISOString().split('T')[0];

            const [statsRes, analyticsRes, templesRes, liveRes, bookingsRes] = await Promise.all([
                adminApi.getStats(),
                adminApi.getAnalytics({ startDate: fmt(start), endDate: fmt(end) }),
                templesApi.getAll(),
                liveApi.getCrowdData(),
                adminApi.getBookings({ limit: 5 }),
            ]);

            /* overview */
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

            /* analytics → charts */
            if (analyticsRes.success && analyticsRes.data) {
                const a = analyticsRes.data;
                setChartData({
                    dailyTrends: a.daily_trends || [],
                    revenueByTemple: a.revenue_by_temple || [],
                    peakHours: (a as any).peak_hours || [],
                });
            }

            /* temples + live merge */
            let templesData = templesRes.data || [];
            if (liveRes.success && liveRes.data) {
                const raw = liveRes.data;
                const liveTemples: CrowdData[] = Array.isArray(raw)
                    ? raw
                    : ((raw as any).temples || []);
                const liveMap: Record<string, number> = {};
                liveTemples.forEach(t => {
                    const id = t.temple_id || (t as any)._id;
                    if (id) liveMap[id] = t.live_count || 0;
                });
                templesData = templesData.map(t => ({ ...t, live_count: liveMap[t._id] ?? t.live_count ?? 0 }));
            }
            setTopTemples(templesData.sort((a, b) => (b.live_count || 0) - (a.live_count || 0)).slice(0, 5));

            /* recent bookings */
            if (bookingsRes.success && bookingsRes.data) setRecentBookings(bookingsRes.data);

            setLastUpdated(new Date());
        } catch (e: any) {
            setApiError(e.message || 'Backend unreachable');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    /* poll every 30 s for crowd freshness */
    useEffect(() => {
        fetchData();
        pollRef.current = setInterval(() => fetchData(true), 30_000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [fetchData]);

    const crowdCfg = crowdStatusConfig[crowd.status as keyof typeof crowdStatusConfig] || crowdStatusConfig.LOW;

    /* ─── KPI definitions ─── */
    const kpis = [
        {
            label: 'Total Revenue', icon: <CreditCard className="w-5 h-5" />,
            value: overview.totalRevenue,
            display: `₹${overview.totalRevenue >= 1000 ? (overview.totalRevenue / 1000).toFixed(1) + 'k' : overview.totalRevenue}`,
            sub: `₹${(overview.totalRevenue / Math.max(overview.totalBookings, 1)).toFixed(0)} avg/booking`,
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
            label: 'Active Now', icon: <BookOpen className="w-5 h-5" />,
            value: bookingBreakdown.active,
            display: bookingBreakdown.active.toLocaleString('en-IN'),
            sub: `${bookingBreakdown.completed} completed · ${bookingBreakdown.cancelled} cancelled`,
            trending: null,
            bg: 'from-violet-50 to-purple-50', border: 'border-violet-100',
            icon_bg: 'bg-violet-100 text-violet-600', val: 'text-violet-700',
        },
        {
            label: 'Temples', icon: <Landmark className="w-5 h-5" />,
            value: overview.totalTemples,
            display: overview.totalTemples.toString(),
            sub: 'All operational',
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
            sub: `${Math.round(crowd.pct)}% of total capacity`,
            trending: crowd.pct >= 60,
            bg: crowd.status === 'HIGH' ? 'from-red-50 to-rose-50' : crowd.status === 'MODERATE' ? 'from-amber-50 to-yellow-50' : 'from-slate-50 to-slate-100',
            border: crowd.status === 'HIGH' ? 'border-red-100' : crowd.status === 'MODERATE' ? 'border-amber-100' : 'border-slate-100',
            icon_bg: crowd.status === 'HIGH' ? 'bg-red-100 text-red-600' : crowd.status === 'MODERATE' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500',
            val: crowd.status === 'HIGH' ? 'text-red-700' : crowd.status === 'MODERATE' ? 'text-amber-700' : 'text-slate-700',
        },
    ];

    /* ══════ RENDER ══════ */
    return (
        <AdminLayout title="Dashboard" subtitle="Real-time overview & analytics">
            <div className="space-y-5">

                {/* ── Status / control bar ── */}
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className="text-sm font-black text-slate-700">
                            {loading ? 'Refreshing data…' : 'Live data'}
                        </span>
                        {apiError && (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 px-2 py-0.5 bg-red-50 rounded-lg border border-red-200">
                                <AlertTriangle className="w-3 h-3" /> {apiError}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* date range */}
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

                {/* ── 6 KPI cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {kpis.map((k, i) => (
                        <motion.div key={k.label}
                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={`bg-gradient-to-br ${k.bg} rounded-2xl border ${k.border} p-4 flex flex-col gap-3`}>
                            <div className="flex items-center justify-between">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${k.icon_bg}`}>
                                    {k.icon}
                                </div>
                                {k.trending !== null && (
                                    <span className={`text-[10px] font-black flex items-center gap-0.5 ${k.trending ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {k.trending ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.label}</p>
                                <p className={`text-2xl font-black tabular-nums mt-0.5 ${k.val}`}>
                                    {loading ? '—' : k.display}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{k.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Crowd Status + Booking Breakdown row ── */}
                <div className="grid lg:grid-cols-3 gap-4">
                    {/* Crowd occupancy card */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                        className={`bg-gradient-to-br ${crowd.status === 'HIGH' ? 'from-red-50 to-rose-50' : crowd.status === 'MODERATE' ? 'from-amber-50 to-yellow-50' : 'from-slate-50 to-white'} rounded-3xl border ${crowd.status === 'HIGH' ? 'border-red-200' : crowd.status === 'MODERATE' ? 'border-amber-200' : 'border-slate-100'} p-5`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">System Occupancy</p>
                        <div className="flex items-center gap-4">
                            <OccupancyRing pct={crowd.pct} status={crowd.status} />
                            <div>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black mb-2 ${crowdCfg.bg} ${crowdCfg.text} ${crowdCfg.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${crowdCfg.color} animate-pulse`} />
                                    {crowdCfg.label} Crowd
                                </div>
                                <p className="text-2xl font-black tabular-nums text-slate-800">
                                    <AnimatedNumber value={crowd.live} />
                                </p>
                                <p className="text-xs text-slate-400 font-medium">
                                    of <AnimatedNumber value={crowd.capacity} /> cap.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Booking breakdown */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                        className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booking Breakdown</p>
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
                                    <p className="text-[10px] text-slate-400 font-semibold">{b.label}</p>
                                </div>
                            ))}
                        </div>
                        {/* booked vs cancelled bar */}
                        {bookingBreakdown.active + bookingBreakdown.cancelled > 0 && (
                            <div className="mt-4">
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
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-400" />Active</span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><span className="w-2 h-2 rounded-full bg-red-400" />Cancelled</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* ── Peak Hours ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <PeakHoursChart data={chartData.peakHours} />
                </motion.div>

                {/* ── Main Charts (DashboardCharts: daily trend + revenue) ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}>
                    <DashboardCharts
                        dailyTrends={chartData.dailyTrends}
                        revenueByTemple={chartData.revenueByTemple}
                        dateRange={dateRange}
                        onRangeChange={setDateRange}
                    />
                </motion.div>

                {/* ── Recent Activity + Busiest Temples ── */}
                <div className="grid lg:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.44 }} className="lg:col-span-2 h-[460px]">
                        <RecentActivity bookings={recentBookings} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.48 }} className="h-[460px]">
                        <LiveStatusCard topTemples={topTemples} />
                    </motion.div>
                </div>

                {/* ── Quick Links Footer ── */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Navigate</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { href: '/admin/live', label: 'Live Monitor', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                { href: '/admin/bookings', label: 'Bookings', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                { href: '/admin/temples', label: 'Temples', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                                { href: '/admin/analytics', label: 'Analytics', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                                { href: '/admin/users', label: 'Users & Roles', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                                { href: '/admin/testing', label: 'API Testing', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                            ].map(l => (
                                <Link key={l.href} href={l.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all hover:shadow-sm ${l.color}`}>
                                    {l.label} <ChevronRight className="w-3 h-3" />
                                </Link>
                            ))}
                        </div>
                        {lastUpdated && (
                            <span className="text-[10px] text-slate-300 font-medium hidden xl:block">
                                Auto-refresh every 30s · last {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
