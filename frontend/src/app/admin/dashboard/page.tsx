'use client';

// Temple Smart E-Pass - Super Admin Dashboard
// Premium Professional Design with Advanced Animations
// Glassmorphism, Charts, Images & Smooth Scrolling

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { templesApi, adminApi, liveApi, Temple, Booking, CrowdData } from '@/lib/api';
import { motion, useScroll } from 'framer-motion';
import { BackendStatusBar } from '@/components/admin/BackendStatusBar';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardCharts from '@/components/admin/DashboardCharts';
import RecentActivity from '@/components/admin/RecentActivity';
import LiveStatusCard from '@/components/admin/LiveStatusCard';
import { StatCard } from '@/components/admin/StatCard';

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

import { ProtectedRoute } from '@/lib/protected-route';

function AdminDashboardContent() {
    const { user } = useAuth();
    const { scrollYProgress } = useScroll();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTemples: 0,
        totalBookings: 0,
        totalUsers: 0,
        currentCrowd: 0,
        todayVisits: 0,
        totalRevenue: 0,
    });

    // Chart & Activity Data
    const [chartData, setChartData] = useState<{
        dailyTrends: { _id: string; count: number }[];
        revenueByTemple: { _id: string; revenue: number; bookings: number }[];
    }>({ dailyTrends: [], revenueByTemple: [] });

    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [topTemples, setTopTemples] = useState<Temple[]>([]);

    const [apiError, setApiError] = useState<string | null>(null);
    const [demoMode, setDemoMode] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);

    // Fetch Data
    const fetchData = async () => {
        try {
            setLoading(true);
            setApiError(null);
            setDemoMode(false);
            setLastUpdated(new Date());
            console.log('🔄 Dashboard: Starting data fetch...');

            // 1. Stats
            console.log('📊 Fetching admin stats...');
            const statsRes = await adminApi.getStats();
            console.log('📊 Stats Response:', statsRes);
            const statsData = statsRes.success && statsRes.data ? statsRes.data : null;


            // 2. Analytics (Charts)
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setDate(today.getDate() - 30);

            console.log('📈 Fetching analytics from', lastMonth.toISOString().split('T')[0], 'to', today.toISOString().split('T')[0]);
            const analyticsRes = await adminApi.getAnalytics({
                startDate: lastMonth.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
            });
            console.log('📈 Analytics Response:', analyticsRes);
            const analytics = analyticsRes.success && analyticsRes.data ? analyticsRes.data : null;

            // 3. Live Crowd & Temples
            console.log('🏛️ Fetching temples and live data...');
            const [templesRes, liveRes] = await Promise.all([
                templesApi.getAll(),
                liveApi.getCrowdData()
            ]);
            console.log('🏛️ Temples Response:', templesRes);
            console.log('👥 Live Crowd Response:', liveRes);


            // Merge Live Data
            let templesData = templesRes.data || [];
            if (liveRes.success && liveRes.data) {
                const raw = liveRes.data;
                const liveMap: Record<string, number> = {};
                // Handle different response structures safely
                const liveTemples: CrowdData[] = (typeof raw === 'object' && !Array.isArray(raw) && 'temples' in raw)
                    ? (raw as { temples: CrowdData[] }).temples
                    : (Array.isArray(raw) ? raw as CrowdData[] : []);

                liveTemples.forEach((t) => {
                    const id = t.temple_id || (t as { _id?: string })._id; // Handle generic object fallback if needed
                    if (id) liveMap[id] = t.live_count || 0;
                });

                templesData = templesData.map(t => ({
                    ...t,
                    live_count: liveMap[t._id] ?? t.live_count ?? 0
                }));
            }

            // Sort by live count for "Busiest Temples"
            setTopTemples(templesData.sort((a, b) => (b.live_count || 0) - (a.live_count || 0)).slice(0, 3));

            // 4. Recent Bookings
            const bookingsRes = await adminApi.getBookings({ limit: 5 });
            console.log('📊 Dashboard - Bookings Response:', bookingsRes);
            if (bookingsRes.success && bookingsRes.data) {
                console.log('✅ Setting recent bookings:', bookingsRes.data.length, 'bookings');
                setRecentBookings(bookingsRes.data);
            } else {
                console.warn('⚠️ No booking data received or request failed');
            }


            // Set State
            if (statsData) {
                const newStats = {
                    totalTemples: statsData.overview?.total_temples ?? templesData.length,
                    totalBookings: statsData.overview?.total_bookings ?? 0,
                    totalUsers: statsData.overview?.total_users ?? 0,
                    currentCrowd: statsData.crowd?.current_live_count ?? 0,
                    todayVisits: statsData.bookings?.today ?? 0,
                    totalRevenue: statsData.overview?.total_revenue ?? 0,
                };
                console.log('💾 Setting stats:', newStats);
                setStats(newStats);
            } else {
                console.warn('⚠️ No stats data available from backend');
            }

            if (analytics) {
                const chartData = {
                    dailyTrends: analytics.daily_trends || [],
                    revenueByTemple: analytics.revenue_by_temple || []
                };
                console.log('📊 Setting chart data:', chartData);
                setChartData(chartData);
            } else {
                console.warn('⚠️ No analytics data available from backend');
            }

            console.log('✅ Dashboard data fetch completed successfully');

        } catch (error: unknown) {
            console.error('❌ Dashboard fetch failed:', error);
            setDemoMode(true);
            console.log('🎭 Entering demo mode with fallback data');
            setApiError(error instanceof Error ? error.message : 'Backend unreachable');


            // DEMO DATA GENERATION
            setStats({
                totalTemples: 5,
                totalBookings: 1250,
                totalUsers: 840,
                currentCrowd: 12450,
                todayVisits: 320,
                totalRevenue: 450000,
            });

            setChartData({
                dailyTrends: Array.from({ length: 7 }, (_, i) => ({
                    _id: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
                    count: Math.floor(50 + Math.random() * 200)
                })),
                revenueByTemple: [
                    { _id: 'Somnath', revenue: 150000, bookings: 120 },
                    { _id: 'Kashi', revenue: 120000, bookings: 90 },
                    { _id: 'Tirupati', revenue: 90000, bookings: 80 }
                ]
            });

            setRecentBookings([
                { _id: '1', user: 'Amit Kumar', temple: { name: 'Somnath' } as Temple, status: 'CONFIRMED', visitors: 4, createdAt: new Date().toISOString(), date: new Date().toISOString(), passId: 'DEMO1' } as Booking,
                { _id: '2', user: 'Priya Singh', temple: { name: 'Kashi' } as Temple, status: 'COMPLETED', visitors: 2, createdAt: new Date(Date.now() - 3600000).toISOString(), date: new Date().toISOString(), passId: 'DEMO2' } as Booking,
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin' || user?.isSuperAdmin) {
            fetchData();
        }
    }, [user]);

    // Removed the manual null check since ProtectedRoute handles it
    // if (user?.role !== 'admin' && !user?.isSuperAdmin) return null;

    return (
        <AdminLayout title="Dashboard" subtitle="Overview & Real-time Statistics">
            {/* Scroll Progress */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 origin-left z-50 shadow-lg shadow-orange-500/50"
                style={{ scaleX: scrollYProgress }}
            />

            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-600 to-orange-500 bg-size-200 animate-gradient-shift text-white p-8 lg:p-10 shadow-xl shadow-orange-500/20"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black mb-2">Namaste, {user?.name?.split(' ')[0]}! 🙏</h2>
                        <p className="text-orange-100 max-w-xl text-lg">
                            System is <span className="font-bold text-white">active</span>.
                            Live crowd at <span className="font-bold text-white">{(stats.currentCrowd).toLocaleString()}</span> visitors.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-3">
                        <Link href="/admin/bookings?action=new" className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl shadow-lg shadow-orange-900/10 hover:shadow-orange-900/20 hover:bg-orange-50 transition-all active:scale-95 flex items-center gap-2">
                            <span>📅</span> New Booking
                        </Link>
                        <Link href="/admin/live" className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md flex items-center gap-2">
                            <span>📡</span> Live Monitor
                        </Link>
                        <Link href="/gatekeeper" className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md flex items-center gap-2">
                            <span>📷</span> Scan Ticket
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Status Bar */}
            <div className="flex justify-end mb-6">
                <BackendStatusBar
                    status={loading ? 'loading' : demoMode ? 'demo' : 'connected'}
                    lastUpdated={lastUpdated}
                    onRetry={fetchData}
                />
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
                <StatCard
                    icon="🎫"
                    label="Total Bookings"
                    value={stats.totalBookings}
                    subtext={`+${stats.todayVisits} today`}
                    color="blue"
                    delay={0}
                    trend={{ value: "12%", positive: true }}
                />
                <StatCard
                    icon="💰"
                    label="Total Revenue"
                    value={`₹${(stats.totalRevenue / 1000).toFixed(1)}k`}
                    subtext="All temples"
                    color="green"
                    delay={0.1}
                    trend={{ value: "8%", positive: true }}
                />
                <StatCard
                    icon="👥"
                    label="Live Crowd"
                    value={stats.currentCrowd}
                    subtext="Active visitors"
                    color="red"
                    delay={0.2}
                    trend={{ value: "High", positive: stats.currentCrowd < 50000 }} // Positive if not overcrowding
                />
                <StatCard
                    icon="🏛️"
                    label="Active Temples"
                    value={stats.totalTemples}
                    subtext="System wide"
                    color="orange"
                    delay={0.3}
                />
            </motion.div>

            {/* Charts & Graphs */}
            <div className="mb-8">
                <DashboardCharts dailyTrends={chartData.dailyTrends} revenueByTemple={chartData.revenueByTemple} />
            </div>

            {/* Bottom Grid: Recent Activity & Busiest Temples */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity (2/3 width) */}
                <div className="lg:col-span-2 h-[450px]">
                    <RecentActivity bookings={recentBookings} />
                </div>

                {/* Busiest Temples (1/3 width) */}
                <div className="h-full flex flex-col gap-4">
                    <LiveStatusCard topTemples={topTemples} />
                </div>
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
