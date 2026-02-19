'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi, templesApi, Temple } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import {
    TrendingUp, TrendingDown, Calendar, Filter, IndianRupee,
    Users, Clock, BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight,
    Zap, Activity, PieChart as PieChartIcon, CheckCircle,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';

/* ─── palette ─── */
const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#eab308', '#ec4899'];

/* ─── helpers ─── */
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, className = '' }: {
    value: number; prefix?: string; suffix?: string; decimals?: number; className?: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const prev = useRef(value);
    useEffect(() => {
        const from = prev.current;
        prev.current = value;
        let raf: number;
        const dur = 800;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const v = from + (value - from) * ease;
            if (ref.current) ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, prefix, suffix, decimals]);
    return <span ref={ref} className={className}>{prefix}{value.toFixed(decimals)}{suffix}</span>;
}

/* ─── custom tooltip ─── */
function CustomTooltip({ active, payload, label, prefix = '' }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xl px-4 py-3 min-w-[130px]">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-sm font-black" style={{ color: p.color || '#1e293b' }}>
                    {prefix}{(p.value ?? 0).toLocaleString()} <span className="font-medium text-slate-500 text-xs">{p.name}</span>
                </p>
            ))}
        </div>
    );
}

/* ─── mini sparkline pill ─── */
function TrendPill({ value, label }: { value: number; label: string }) {
    const pos = value >= 0;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black
                         ${pos ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {pos ? '+' : ''}{value.toFixed(1)}% {label}
        </span>
    );
}

/* ─── revenue table row ─── */
function RevRow({ t, max, index }: { t: { name: string; value: number; bookings?: number }; max: number; index: number }) {
    const pct = max > 0 ? (t.value / max) * 100 : 0;
    return (
        <motion.tr initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
            className="hover:bg-slate-50 transition-colors">
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 bg-slate-100">{index + 1}</span>
                    <span className="font-semibold text-slate-700 text-sm">{t.name}</span>
                </div>
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden flex-1 min-w-[60px]">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 w-8 text-right">{Math.round(pct)}%</span>
                </div>
            </td>
            <td className="py-3 px-4 text-right font-black text-slate-800 text-sm">₹{t.value.toLocaleString()}</td>
            <td className="py-3 px-4 text-right text-slate-400 text-xs font-medium">{t.bookings ?? '—'}</td>
        </motion.tr>
    );
}

/* ─── main ─── */
function AdminAnalyticsContent() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dateRange, setDateRange] = useState('7d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedTemple, setSelectedTemple] = useState('all');
    const [temples, setTemples] = useState<Temple[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [kpis, setKpis] = useState({
        totalBookings: 0, totalRevenue: 0, avgPerDay: 0,
        todayVisits: 0, peakHour: '—', growthPct: 0,
    });
    const [charts, setCharts] = useState<{
        daily: { name: string; visits: number }[];
        revenue: { name: string; value: number; bookings?: number }[];
        hours: { time: string; bookings: number }[];
    }>({ daily: [], revenue: [], hours: [] });

    /* ── date util ── */
    const getRange = useCallback(() => {
        if (dateRange === 'custom' && customStart && customEnd) return { startDate: customStart, endDate: customEnd };
        const end = new Date(), start = new Date();
        if (dateRange === '7d') start.setDate(end.getDate() - 7);
        else start.setDate(end.getDate() - 30);
        return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    }, [dateRange, customStart, customEnd]);

    /* ── fetch ── */
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const { startDate, endDate } = getRange();
            const res = await adminApi.getAnalytics({
                startDate, endDate,
                templeId: selectedTemple !== 'all' ? selectedTemple : undefined,
            }) as any;

            if (res?.success) {
                const d = res.data || {};
                const dailyTrends = (d.daily_trends || []) as { _id: string; count: number }[];
                const revTemples = (d.revenue_by_temple || []) as { _id: string; revenue: number; bookings: number }[];
                const peakHours = (d.peak_hours || []) as { _id: string; count: number }[];

                const totalBookings = dailyTrends.reduce((s, x) => s + x.count, 0);
                const totalRevenue = revTemples.reduce((s, x) => s + x.revenue, 0);
                const days = dailyTrends.length || 1;
                const avgPerDay = Math.round(totalBookings / days);
                const todayStr = new Date().toISOString().split('T')[0];
                const todayVisits = dailyTrends.find(d => d._id === todayStr)?.count ?? 0;
                const growthPct = avgPerDay > 0 ? ((todayVisits - avgPerDay) / avgPerDay) * 100 : 0;
                const peakHour = peakHours[0]?._id || '—';

                setKpis({ totalBookings, totalRevenue, avgPerDay, todayVisits, peakHour, growthPct });

                setCharts({
                    daily: dailyTrends.map(d => ({
                        name: new Date(d._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                        visits: d.count,
                    })),
                    revenue: revTemples
                        .sort((a, b) => b.revenue - a.revenue)
                        .map(t => ({ name: t._id || 'Unknown', value: t.revenue, bookings: t.bookings })),
                    hours: peakHours.map(p => ({ time: p._id, bookings: p.count })),
                });
                setLastUpdated(new Date());
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [getRange, selectedTemple]);

    useEffect(() => { if (user) fetchData(); }, [user, fetchData]);
    useEffect(() => {
        if (user) templesApi.getAll().then(r => { if (r.success) setTemples(r.data); });
    }, [user]);

    const maxRev = charts.revenue.length > 0 ? charts.revenue[0].value : 1;

    /* ─── skeleton ─── */
    if (loading) return (
        <AdminLayout title="Analytics" subtitle="System performance insights">
            <div className="space-y-5 animate-pulse">
                <div className="h-16 bg-slate-100 rounded-2xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
                </div>
                <div className="grid lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 h-80 bg-slate-100 rounded-3xl" />
                    <div className="h-80 bg-slate-100 rounded-3xl" />
                </div>
                <div className="h-72 bg-slate-100 rounded-3xl" />
            </div>
        </AdminLayout>
    );

    /* ─── render ─── */
    return (
        <AdminLayout title="Analytics" subtitle="System performance insights">
            <div className="space-y-5">

                {/* ── Filter bar ── */}
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5 flex flex-wrap items-center gap-3">

                    {/* Temple filter */}
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select value={selectedTemple} onChange={e => setSelectedTemple(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer">
                            <option value="all">All Temples</option>
                            {temples.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* Date range pills */}
                    <div className="bg-slate-100 rounded-xl p-1 flex">
                        {[{ k: '7d', l: '7 Days' }, { k: '30d', l: '30 Days' }].map(r => (
                            <button key={r.k} onClick={() => { setDateRange(r.k); setCustomStart(''); setCustomEnd(''); }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${dateRange === r.k
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'}`}>
                                {r.l}
                            </button>
                        ))}
                    </div>

                    {/* Custom date */}
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input type="date" value={customStart}
                            onChange={e => { setCustomStart(e.target.value); setDateRange('custom'); }}
                            className="text-xs bg-transparent focus:outline-none text-slate-600 font-medium w-24" />
                        <span className="text-slate-300 font-bold">→</span>
                        <input type="date" value={customEnd}
                            onChange={e => { setCustomEnd(e.target.value); setDateRange('custom'); }}
                            className="text-xs bg-transparent focus:outline-none text-slate-600 font-medium w-24" />
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        {lastUpdated && (
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => fetchData(true)} disabled={refreshing}
                            className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200">
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── KPI cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            title: 'Growth Trend', icon: kpis.growthPct >= 0 ? TrendingUp : TrendingDown,
                            value: kpis.growthPct, prefix: kpis.growthPct >= 0 ? '+' : '', suffix: '%', decimals: 1,
                            sub: 'vs daily average', positive: kpis.growthPct >= 0,
                            iconBg: kpis.growthPct >= 0 ? 'bg-emerald-50' : 'bg-red-50',
                            iconColor: kpis.growthPct >= 0 ? 'text-emerald-600' : 'text-red-600',
                            textColor: kpis.growthPct >= 0 ? 'text-emerald-700' : 'text-red-700',
                            delay: 0,
                        },
                        {
                            title: 'Total Bookings', icon: Activity,
                            value: kpis.totalBookings, prefix: '', suffix: '', decimals: 0,
                            sub: `Avg ${kpis.avgPerDay}/day`, positive: true,
                            iconBg: 'bg-blue-50', iconColor: 'text-blue-600', textColor: 'text-slate-800', delay: 0.05,
                        },
                        {
                            title: 'Total Revenue', icon: IndianRupee,
                            value: kpis.totalRevenue / 1000, prefix: '₹', suffix: 'K', decimals: 1,
                            sub: 'Booking income', positive: true,
                            iconBg: 'bg-orange-50', iconColor: 'text-orange-600', textColor: 'text-slate-800', delay: 0.10,
                        },
                        {
                            title: 'Peak Hour', icon: Clock,
                            value: 0, prefix: '', suffix: kpis.peakHour, decimals: 0,
                            isText: true,
                            sub: 'Busiest of day', positive: true,
                            iconBg: 'bg-purple-50', iconColor: 'text-purple-600', textColor: 'text-slate-800', delay: 0.15,
                        },
                    ].map((k, i) => {
                        const Icon = k.icon;
                        return (
                            <motion.div key={k.title}
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: k.delay, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.title}</p>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${k.iconBg}`}>
                                        <Icon className={`w-4 h-4 ${k.iconColor}`} />
                                    </div>
                                </div>
                                <p className={`text-3xl font-black tabular-nums leading-none mb-2 ${k.textColor}`}>
                                    {(k as any).isText
                                        ? k.suffix
                                        : <AnimatedNumber value={k.value} prefix={k.prefix} suffix={k.suffix} decimals={k.decimals} />
                                    }
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium">{k.sub}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Today highlight ── */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 flex flex-wrap items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today's Visits</p>
                        <p className="text-3xl font-black text-white tabular-nums">
                            <AnimatedNumber value={kpis.todayVisits} />
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <TrendPill value={kpis.growthPct} label="vs avg" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Avg / day</p>
                            <p className="text-lg font-black text-white">{kpis.avgPerDay.toLocaleString()}</p>
                        </div>
                    </div>
                </motion.div>

                {/* ── Charts row 1: Area + Donut ── */}
                <div className="grid lg:grid-cols-3 gap-5">
                    {/* Area chart */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                        className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <div>
                                <h3 className="font-black text-slate-800 flex items-center gap-2">
                                    <BarChart3 className="w-4.5 h-4.5 text-orange-500" /> Visitor Trends
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                    Daily footfall · {dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'Custom range'}
                                </p>
                            </div>
                            <span className="px-3 py-1.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                Live
                            </span>
                        </div>
                        <div className="h-72 p-5">
                            {charts.daily.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">No data for this period</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.daily} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f97316" stopOpacity={0.18} />
                                                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={8} />
                                        <YAxis axisLine={false} tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="visits" name="Visits"
                                            stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#gVisits)"
                                            dot={false} activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {/* Donut chart */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <PieChartIcon className="w-4.5 h-4.5 text-blue-500" /> Revenue Mix
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">Distribution by temple</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-4">
                            {charts.revenue.length === 0 ? (
                                <p className="text-slate-400 text-sm font-medium">No revenue data</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={charts.revenue} cx="50%" cy="50%"
                                            innerRadius={52} outerRadius={80}
                                            paddingAngle={3} dataKey="value" stroke="none">
                                            {charts.revenue.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => `₹${(v || 0).toLocaleString()}`}
                                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', padding: '8px 14px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-1 px-2">
                                {charts.revenue.slice(0, 5).map((r, i) => (
                                    <span key={i} className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        {r.name.length > 16 ? r.name.slice(0, 14) + '…' : r.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Peak Hours bar chart ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Clock className="w-4.5 h-4.5 text-purple-500" /> Peak Hour Analysis
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">Busiest hours of the day (from booking data)</p>
                        </div>
                        {kpis.peakHour !== '—' && (
                            <span className="px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                Peak: {kpis.peakHour}
                            </span>
                        )}
                    </div>
                    <div className="h-64 px-5 pt-5 pb-2">
                        {charts.hours.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">No hourly data</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.hours} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={8} />
                                    <YAxis axisLine={false} tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="bookings" name="Entries" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                        {charts.hours.map((h, i) => {
                                            const isPeak = h.time === kpis.peakHour;
                                            return <Cell key={i} fill={isPeak ? '#8b5cf6' : '#c4b5fd'} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* ── Revenue table ── */}
                {charts.revenue.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <IndianRupee className="w-4.5 h-4.5 text-orange-500" /> Revenue by Temple
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">Sorted by highest earnings for selected period</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Temple</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Share</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Revenue</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Bookings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {charts.revenue.map((t, i) => (
                                        <RevRow key={i} t={t} max={maxRev} index={i} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* ── Quick stats footer ── */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.46 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { label: 'Temples tracked', value: temples.length, icon: <Users className="w-4 h-4 text-blue-500" /> },
                        { label: 'Data points', value: charts.daily.length, icon: <Activity className="w-4 h-4 text-emerald-500" /> },
                        { label: 'Revenue sources', value: charts.revenue.length, icon: <IndianRupee className="w-4 h-4 text-orange-500" /> },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">{s.icon}</div>
                            <div>
                                <p className="text-xl font-black text-slate-800 tabular-nums">{s.value}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </AdminLayout>
    );
}

export default function AdminAnalyticsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminAnalyticsContent />
        </ProtectedRoute>
    );
}
