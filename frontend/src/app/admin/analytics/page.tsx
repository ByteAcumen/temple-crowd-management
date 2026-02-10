'use client';

// Temple Smart E-Pass - Admin Analytics
// Visual insights into system performance and crowd trends
// Premium Light Theme with Recharts

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState } from 'react';
import { adminApi, templesApi, Temple } from '@/lib/api';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { BackendStatusBar } from '@/components/admin/BackendStatusBar';
import { StatCardSkeleton } from '@/components/admin/LoadingSkeleton';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';

// Color Palette
const COLORS = ['#F97316', '#3B82F6', '#10B981', '#F43F5E', '#8B5CF6'];

function AdminAnalyticsContent() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedTemple, setSelectedTemple] = useState('all');
    const [temples, setTemples] = useState<Temple[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Analytics data from API
    const [analytics, setAnalytics] = useState({
        totalBookings: 0,
        totalRevenue: 0,
        totalUsers: 0,
        todayVisits: 0,
        avgBookingsPerDay: 0,
        peakHour: '10:00 AM',
    });

    // Chart data
    const [chartData, setChartData] = useState<{
        dailyVisits: { name: string; visits: number }[];
        templeRevenue: { name: string; value: number }[];
        peakHours: { time: string; bookings: number }[];
    }>({
        dailyVisits: [],
        templeRevenue: [],
        peakHours: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // Calculate date range for API
                // Calculate date range for API
                const getDateRange = () => {
                    if (dateRange === 'custom' && customStart && customEnd) {
                        return { startDate: customStart, endDate: customEnd };
                    }
                    const end = new Date();
                    const start = new Date();
                    if (dateRange === '24h') start.setDate(end.getDate() - 1);
                    else if (dateRange === '7d') start.setDate(end.getDate() - 7);
                    else start.setDate(end.getDate() - 30);
                    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
                };

                const { startDate, endDate } = getDateRange();
                const res = await adminApi.getAnalytics({
                    startDate,
                    endDate,
                    templeId: selectedTemple !== 'all' ? selectedTemple : undefined
                });

                interface AnalyticsReponse {
                    success: boolean;
                    data: {
                        daily_trends: Array<{ _id: string; count: number }>;
                        revenue_by_temple: Array<{ _id: string; revenue: number; bookings: number }>;
                        peak_hours: Array<{ _id: string; count: number }>;
                    };
                }

                const data = res as AnalyticsReponse;
                const apiData = data.data || {};

                if (res.success) {
                    const dailyTrends = apiData.daily_trends || [];
                    const revenueByTemple = apiData.revenue_by_temple || [];
                    const peakHours = apiData.peak_hours || [];

                    const totalBookings = dailyTrends.reduce((s, d) => s + (d.count || 0), 0);
                    const totalRevenue = revenueByTemple.reduce((s, t) => s + (t.revenue || 0), 0);
                    const daysInRange = dailyTrends.length || 1;
                    const peakHour = peakHours[0]?._id || '10:00 AM';
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todayVisits = dailyTrends.find((d) => d._id === todayStr)?.count ?? 0;

                    setAnalytics({
                        totalBookings,
                        totalRevenue,
                        totalUsers: 0,
                        todayVisits,
                        avgBookingsPerDay: Math.round(totalBookings / daysInRange) || 0,
                        peakHour,
                    });

                    // Format data for Recharts
                    const daily = dailyTrends.map((d) => ({
                        name: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        visits: d.count,
                    }));

                    const revenue = revenueByTemple.map((t) => ({
                        name: t._id || 'Unknown',
                        value: t.revenue || 0
                    }));

                    const peak = peakHours.map((p) => ({
                        time: p._id,
                        bookings: p.count
                    }));

                    setChartData({
                        dailyVisits: daily,
                        templeRevenue: revenue,
                        peakHours: peak
                    });
                    setLastUpdated(new Date());
                }
            } catch (err: unknown) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchAnalytics();
    }, [user, dateRange, customStart, customEnd, selectedTemple]);

    // Fetch Temples
    useEffect(() => {
        if (user) {
            templesApi.getAll().then(res => {
                if (res.success) setTemples(res.data);
            });
        }
    }, [user]);

    // Calculate derived metrics
    const growthPercent = analytics.avgBookingsPerDay > 0
        ? ((analytics.todayVisits - analytics.avgBookingsPerDay) / analytics.avgBookingsPerDay * 100).toFixed(1)
        : '0';
    const isGrowthPositive = parseFloat(growthPercent) >= 0;

    return (
        <AdminLayout title="System Analytics" subtitle="Deep insights into system performance">
            <div className="flex justify-between items-center mb-6">
                <BackendStatusBar status={loading ? 'loading' : 'connected'} lastUpdated={lastUpdated || undefined} />
                {/* Controls */}
                {/* Controls */}
                <div className="flex flex-wrap gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-3 flex items-center">
                        <select
                            value={selectedTemple}
                            onChange={(e) => setSelectedTemple(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer py-2"
                        >
                            <option value="all">All Temples</option>
                            {temples.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-sm flex items-center">
                        {['7d', '30d'].map((range) => (
                            <button
                                key={range}
                                onClick={() => { setDateRange(range); setCustomStart(''); setCustomEnd(''); }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${dateRange === range
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                {range === '7d' ? '7 Days' : '30 Days'}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 px-3 py-1">
                        <input
                            type="date"
                            className="text-xs bg-transparent focus:outline-none text-slate-600 font-medium"
                            value={customStart}
                            onChange={(e) => { setCustomStart(e.target.value); setDateRange('custom'); }}
                        />
                        <span className="text-slate-300">→</span>
                        <input
                            type="date"
                            className="text-xs bg-transparent focus:outline-none text-slate-600 font-medium"
                            value={customEnd}
                            onChange={(e) => { setCustomEnd(e.target.value); setDateRange('custom'); }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
                </div>
            ) : (
                <>
                    {/* Overview Stats */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            icon="📈"
                            label="Growth Trend"
                            value={`${isGrowthPositive ? '+' : ''}${growthPercent}%`}
                            trend={{ value: 'vs avg', positive: isGrowthPositive }}
                            color="green"

                        />
                        <StatCard
                            icon="🎫"
                            label="Total Bookings"
                            value={analytics.totalBookings.toLocaleString()}
                            color="blue"

                        />
                        <StatCard
                            icon="💰"
                            label="Total Revenue"
                            value={`₹${(analytics.totalRevenue / 1000).toFixed(1)}K`}
                            color="amber"

                        />
                        <StatCard
                            icon="⏱️"
                            label="Peak Hour"
                            value={analytics.peakHour}
                            color="purple"

                        />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6 mb-8">
                        {/* Main Chart: Daily Visits */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-2 admin-card bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Visitor Trends</h3>
                                    <p className="text-sm text-slate-500">Daily footfall over time</p>
                                </div>
                                <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold">
                                    Live Data
                                </div>
                            </div>
                            <div className="h-80 w-full p-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData.dailyVisits}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, dy: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                                            itemStyle={{ color: '#1E293B', fontWeight: 600 }}
                                            cursor={{ stroke: '#F97316', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area type="monotone" dataKey="visits" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" name="Visits" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Revenue Distribution */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="admin-card bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">Revenue Mix</h3>
                                <p className="text-sm text-slate-500">Income distribution by temple</p>
                            </div>
                            <div className="h-64 w-full flex-1 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.templeRevenue}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.templeRevenue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `₹${(value || 0).toLocaleString()}`}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    {/* Peak Hours Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="admin-card bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden mb-8"
                    >
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Peak Hour Analysis</h3>
                            <p className="text-sm text-slate-500">Busiest times of the day</p>
                        </div>
                        <div className="h-72 w-full p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.peakHours} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, dy: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8FAFC' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="bookings" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Bookings/Entries" barSize={40}>
                                        {chartData.peakHours.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#60A5FA'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </>
            )}
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
