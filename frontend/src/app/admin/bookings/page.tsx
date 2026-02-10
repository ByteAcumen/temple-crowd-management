'use client';

// Temple Smart E-Pass - Admin Booking Management
// View and manage devotee bookings
// Premium Redesign (Light Theme)

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState, useCallback } from 'react';
import { adminApi, templesApi, bookingsApi, Booking, Temple } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { BackendStatusBar } from '@/components/admin/BackendStatusBar';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/admin/LoadingSkeleton';
import { useRouter, useSearchParams } from 'next/navigation';
// Animation Variants — fast
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

// Interfaces
interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: number | string;
    subtext?: string;
    color: 'orange' | 'purple' | 'blue' | 'green';
    trend?: {
        value: string;
        positive: boolean;
    };
}

function AdminBookingsContent() {
    const { user, isLoading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemple, setSelectedTemple] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [cancelling, setCancelling] = useState<string | null>(null);

    const [demoMode, setDemoMode] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Manual Booking Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Check for ?action=new
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowCreateModal(true);
            router.replace('/admin/bookings', { scroll: false });
        }
    }, [searchParams, router]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setApiError(null);
            setDemoMode(false);

            const [bookingsRes, templesRes] = await Promise.all([
                adminApi.getBookings(),
                templesApi.getAll()
            ]);

            if (bookingsRes.success) {
                setBookings(bookingsRes.data || []);
                setLastUpdated(new Date());
            }
            if (templesRes.success) {
                setTemples(templesRes.data || []);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Failed to fetch data:', errorMessage);

            // Demo Mode Fallback
            console.warn('⚠️ Backend unreachable. Switching to Demo Mode.');
            setApiError(errorMessage || 'Backend unreachable');
            setDemoMode(true);

            // Mock Bookings
            setBookings([
                { _id: '1', passId: 'PASS-8392', user: { name: 'Rahul Sharma' }, temple: { name: 'Somnath Temple', _id: 't1' }, date: new Date().toISOString(), timeSlot: '08:00 AM', visitors: 2, status: 'CONFIRMED' },
                { _id: '2', passId: 'PASS-1029', user: { name: 'Priya Patel' }, temple: { name: 'Kashi Vishwanath', _id: 't2' }, date: new Date().toISOString(), timeSlot: '10:00 AM', visitors: 4, status: 'USED' },
                { _id: '3', passId: 'PASS-5543', user: { name: 'Amit Kumar' }, temple: { name: 'Somnath Temple', _id: 't1' }, date: new Date(Date.now() + 86400000).toISOString(), timeSlot: '09:00 AM', visitors: 1, status: 'PENDING' },
            ] as Booking[]);

            // Mock Temples
            setTemples([
                { _id: 't1', name: 'Somnath Temple' },
                { _id: 't2', name: 'Kashi Vishwanath' }
            ] as Temple[]);

        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user && !authLoading) fetchData();
    }, [user, authLoading, fetchData]);

    const getBookingUserName = (b: Booking) =>
        b.userName || (b.user && typeof b.user === 'object' ? b.user.name : null) || (typeof b.user === 'string' ? b.user : 'Unknown');
    const getTempleName = (b: Booking) =>
        b.templeName || (b.temple && typeof b.temple === 'object' ? b.temple.name : null) || 'Unknown Temple';
    const getSlot = (b: Booking) => b.slot || b.timeSlot || '-';

    // Enhanced filtering
    const filteredBookings = bookings.filter(booking => {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
            (booking.passId || '').toLowerCase().includes(search) ||
            (getBookingUserName(booking) || '').toLowerCase().includes(search) ||
            (getTempleName(booking) || '').toLowerCase().includes(search) ||
            (booking.userEmail || '').toLowerCase().includes(search);

        const templeId = typeof booking.temple === 'object' ? booking.temple?._id : booking.temple;
        const matchesTemple = selectedTemple === 'all' || templeId === selectedTemple;

        const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;

        const matchesDate = (() => {
            const bookingDate = (booking.date || '').split('T')[0];
            if (dateFrom && dateTo) return bookingDate >= dateFrom && bookingDate <= dateTo;
            if (dateFrom) return bookingDate >= dateFrom;
            if (dateTo) return bookingDate <= dateTo;
            if (selectedDate) return bookingDate === selectedDate;
            return true;
        })();

        return matchesSearch && matchesTemple && matchesStatus && matchesDate;
    });

    // Cancel Booking
    const handleCancel = async (bookingId: string) => {
        if (!confirm('Cancel this booking? The devotee will be notified.')) return;
        setCancelling(bookingId);
        try {
            await bookingsApi.cancel(bookingId);
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'CANCELLED' as const } : b));
        } catch (err: any) {
            alert(err.message || 'Failed to cancel booking');
        } finally {
            setCancelling(null);
        }
    };

    // CSV Export
    const exportCSV = () => {
        const headers = ['Pass ID', 'Devotee', 'Temple', 'Slot', 'Visitors', 'Status', 'Date'];
        const rows = filteredBookings.map(b => [
            b.passId || b._id,
            getBookingUserName(b),
            getTempleName(b),
            getSlot(b),
            String(b.visitors),
            b.status,
            new Date(b.date).toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Stats
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const scannedToday = bookings.filter(b => b.status === 'USED' && b.date.split('T')[0] === new Date().toISOString().split('T')[0]).length;

    return (
        <AdminLayout title="Booking Management" subtitle="Monitor and manage devotee reservations">
            {/* Demo Mode Banner */}
            <AnimatePresence>
                {demoMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4"
                    >
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h3 className="font-bold text-amber-800">Demo Mode — Backend Unreachable</h3>
                            <p className="text-sm text-amber-700 mt-1">{apiError}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Bar */}
            <div className="flex items-center justify-between mb-6">
                <BackendStatusBar
                    status={loading ? 'loading' : demoMode ? 'demo' : 'connected'}
                    lastUpdated={lastUpdated || undefined}
                    dataCount={bookings.length}
                    label="Bookings"
                    onRetry={fetchData}
                />
            </div>

            {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <div className="h-5 w-32 skeleton rounded" />
                            <div className="h-4 w-48 skeleton rounded mt-2" />
                        </div>
                        <table className="w-full">
                            <thead><tr className="border-b border-slate-100"><th className="px-6 py-4" /></tr></thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} cols={6} />)}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* Stats Row */}
                    <div className="grid sm:grid-cols-3 gap-6">
                        <StatCard
                            icon="📅"
                            title="Total Bookings"
                            value={totalBookings}
                            color="blue"
                            trend={{ value: '8%', positive: true }}
                        />
                        <StatCard
                            icon="✅"
                            title="Confirmed"
                            value={confirmedBookings}
                            subtext="Active passes"
                            color="green"
                        />
                        <StatCard
                            icon="📷"
                            title="Scanned Today"
                            value={scannedToday}
                            subtext="Real-time entry"
                            color="orange"
                        />
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 p-2">
                            <div className="relative group">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    placeholder="Search Pass ID or Name..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all hover:bg-slate-100"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedTemple}
                                    onChange={e => setSelectedTemple(e.target.value)}
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-slate-900 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer hover:bg-slate-100"
                                >
                                    <option value="all">All Temples</option>
                                    {temples.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedStatus}
                                    onChange={e => setSelectedStatus(e.target.value)}
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-slate-900 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer hover:bg-slate-100"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="USED">Scanned / Used</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                    <option value="EXPIRED">Expired</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>

                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); setSelectedDate(''); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-900 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all hover:bg-slate-100"
                                title="From date"
                            />

                            <div className="flex items-center gap-1">
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => { setDateTo(e.target.value); setSelectedDate(''); }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-900 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all hover:bg-slate-100"
                                    title="To date"
                                />
                                {(dateFrom || dateTo) && (
                                    <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                                        className="px-2 py-2.5 text-xs text-slate-500 hover:text-red-600 font-bold flex-shrink-0" title="Clear dates">✕</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bookings Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden admin-card">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-wrap justify-between items-center gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Recent Bookings</h3>
                                <p className="text-sm text-slate-500">Real-time reservation status</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={exportCSV}
                                    className="px-4 py-2 bg-white text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center gap-2 shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Export CSV
                                </button>
                                <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                                    {filteredBookings.length} Records
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-6 py-4 font-semibold">Pass ID</th>
                                        <th className="px-6 py-4 font-semibold">Devotee</th>
                                        <th className="px-6 py-4 font-semibold">Temple & Slot</th>
                                        <th className="px-6 py-4 font-semibold">Visitors</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Date</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <AnimatePresence>
                                        {filteredBookings.length === 0 ? (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                <td colSpan={7} className="px-6 py-16 text-center">
                                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">
                                                            🎫
                                                        </div>
                                                        <p className="font-medium">No bookings found</p>
                                                        <p className="text-sm text-slate-400">Try adjusting your filters</p>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ) : (
                                            filteredBookings.map((booking) => (
                                                <motion.tr
                                                    key={booking._id}
                                                    className="hover:bg-orange-50/30 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-orange-600 text-sm font-bold bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                                                            #{(booking.passId || booking._id || '').slice(-6).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-xs font-bold text-slate-600">
                                                                {(getBookingUserName(booking) || 'U').charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-slate-900 truncate max-w-[150px]">
                                                                {getBookingUserName(booking)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-slate-900 text-sm font-semibold">
                                                            {getTempleName(booking)}
                                                        </div>
                                                        <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5 font-medium">
                                                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            {getSlot(booking)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                            <span>{booking.visitors} People</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            booking.status === 'USED' || booking.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    'bg-red-50 text-red-700 border-red-200'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${['CONFIRMED', 'USED', 'COMPLETED', 'PENDING'].includes(booking.status) ? 'animate-pulse' : ''} ${booking.status === 'CONFIRMED' ? 'bg-emerald-500' :
                                                                booking.status === 'USED' || booking.status === 'COMPLETED' ? 'bg-blue-500' :
                                                                    booking.status === 'PENDING' ? 'bg-amber-500' :
                                                                        'bg-red-500'
                                                                }`} />
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                                                        {new Date(booking.date).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {booking.status === 'CONFIRMED' || booking.status === 'PENDING' ? (
                                                            <button onClick={() => handleCancel(booking._id)} disabled={cancelling === booking._id}
                                                                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-all">
                                                                {cancelling === booking._id ? '...' : 'Cancel'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )
            }
            {/* Manual Booking Modal Stub */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600" />
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                🏗️
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Manual Booking</h3>
                            <p className="text-slate-500 mb-6">This feature is currently under development. You will be able to manually create bookings for devotees from here.</p>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors w-full"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}

// Sub-components
function StatCard({ icon, title, value, subtext, color, trend }: StatCardProps) {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-lg p-6 group admin-card"
        >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform group-hover:scale-150 ${color === 'orange' ? 'bg-orange-500' :
                color === 'purple' ? 'bg-purple-500' :
                    color === 'green' ? 'bg-emerald-500' :
                        'bg-blue-500'
                }`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${color === 'orange' ? 'bg-orange-50 text-orange-600' :
                        color === 'purple' ? 'bg-purple-50 text-purple-600' :
                            color === 'green' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-blue-50 text-blue-600'
                        }`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trend.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
                        {subtext && <span className="text-xs font-semibold text-slate-400">{subtext}</span>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function AdminBookingsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminBookingsContent />
        </ProtectedRoute>
    );
}
