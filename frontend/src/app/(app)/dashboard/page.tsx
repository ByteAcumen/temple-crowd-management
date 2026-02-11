'use client';

// Temple Smart E-Pass - User Dashboard
// Show user's bookings and E-Passes

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState } from 'react';
import { bookingsApi, Booking } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

function UserDashboardContent() {
    const { user, isLoading, updateProfile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'profile'>('overview');

    // Profile State
    const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', city: '', state: '' });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                city: user.city || '',
                state: user.state || ''
            });
        }
    }, [user]);

    useEffect(() => {
        async function fetchBookings() {
            try {
                const response = await bookingsApi.getMyBookings();
                if (response.success) {
                    setBookings(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
            } finally {
                setLoadingBookings(false);
            }
        }
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEditingProfile(true);
        setProfileMessage(null);
        try {
            await updateProfile(profileData);
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: unknown) {
            setProfileMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' });
        } finally {
            setIsEditingProfile(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 overflow-x-hidden">
            {/* Navbar is in app layout */}

            {/* Header / Welcome Section */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-200">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">
                                    Namaste, {user?.name?.split(' ')[0] || 'Devotee'}! 🙏
                                </h1>
                                <p className="text-slate-600">May your journey be filled with peace.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-100 p-1 rounded-xl inline-flex self-start"
                        >
                            {(['overview', 'tickets', 'profile'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${activeTab === tab ? 'text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white rounded-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">{tab}</span>
                                </button>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                            className="space-y-8"
                        >
                            {/* Stats/Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <motion.div variants={itemVariants} className="md:col-span-2">
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden h-full flex flex-col justify-between group cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <h2 className="text-3xl font-bold mb-2">Plan Your Visit</h2>
                                            <p className="text-indigo-100 mb-6 max-w-sm">Explore new temples, check live crowd status, and book your priority darshan slots.</p>
                                            <Link href="/temples" className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl font-medium hover:bg-white/30 transition-colors">
                                                Browse Temples
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <Link href="/booking" className="block h-full bg-white rounded-3xl p-8 border border-slate-100 hover:border-orange-200 hover:shadow-lg transition-all group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">New Booking</h3>
                                            <p className="text-slate-500 text-sm">Create a new E-Pass</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            </div>

                            {/* Recent Bookings */}
                            <motion.div variants={itemVariants}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                                    <button onClick={() => setActiveTab('tickets')} className="text-orange-600 text-sm font-medium hover:underline">View All Tickets</button>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    {loadingBookings ? (
                                        <div className="p-8 text-center text-slate-400">Loading...</div>
                                    ) : bookings.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🎫</div>
                                            <h3 className="text-slate-900 font-medium">No bookings found</h3>
                                            <p className="text-slate-500 text-sm mt-1">Your upcoming visits will appear here.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {bookings.slice(0, 3).map((booking) => (
                                                <div key={booking._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                                                            {new Date(booking.date).getDate()}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-900">
                                                                {typeof booking.temple === 'object' ? booking.temple?.name : 'Temple'}
                                                            </h4>
                                                            <p className="text-sm text-slate-500">
                                                                {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} • {booking.timeSlot}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Link href={`/tickets/${booking.passId}`} className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
                                                        View Pass <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* TICKETS TAB */}
                    {activeTab === 'tickets' && (
                        <motion.div
                            key="tickets"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {loadingBookings ? (
                                <div className="col-span-full py-20 text-center text-slate-500">Loading your tickets...</div>
                            ) : bookings.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
                                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">No Tickets Yet</h3>
                                    <p className="text-slate-500 mb-6">Book your first temple visit to get started.</p>
                                    <Link href="/booking" className="btn-primary">Book Now</Link>
                                </div>
                            ) : (
                                bookings.map((booking) => (
                                    <motion.div variants={itemVariants} key={booking._id}>
                                        <Link href={`/tickets/${booking.passId}`} className="block bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all border border-slate-100 overflow-hidden group">
                                            <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 relative overflow-hidden p-6 flex flex-col justify-between">
                                                <div className="absolute inset-0 bg-[url('/patterns/temple-pattern.png')] opacity-10"></div>
                                                <div className="relative z-10 flex justify-between items-start text-white">
                                                    <span className="bg-white/20 backdrop-blur rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wider">E-Pass</span>
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded bg-white text-orange-600`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <div className="relative z-10 text-white">
                                                    <h3 className="font-bold text-lg leading-tight truncate">
                                                        {typeof booking.temple === 'object' ? booking.temple?.name : 'Temple'}
                                                    </h3>
                                                    <p className="text-orange-100 text-sm">
                                                        {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-6 relative">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div>
                                                        <p className="text-xs text-slate-400 uppercase">Time Slot</p>
                                                        <p className="font-semibold text-slate-800">{booking.timeSlot}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-400 uppercase">Visitors</p>
                                                        <p className="font-semibold text-slate-800">{booking.visitors}</p>
                                                    </div>
                                                </div>
                                                <div className="border-t border-dashed border-slate-200 pt-4 flex items-center justify-between">
                                                    <span className="text-xs font-mono text-slate-400">ID: {booking.passId.slice(0, 8)}...</span>
                                                    <span className="text-sm font-medium text-orange-600 group-hover:underline">View Details &rarr;</span>
                                                </div>
                                                {/* Circles for ticket effect */}
                                                <div className="absolute -left-3 top-[-12px] w-6 h-6 bg-slate-50 rounded-full"></div>
                                                <div className="absolute -right-3 top-[-12px] w-6 h-6 bg-slate-50 rounded-full"></div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <motion.div
                            key="profile"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                                <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Edit Profile</h2>
                                    <button onClick={() => setActiveTab('overview')} className="text-slate-400 hover:text-white">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="p-8">
                                    {profileMessage && (
                                        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                            {profileMessage.type === 'success' ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            )}
                                            <p className="text-sm font-medium">{profileMessage.text}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                                                    placeholder="Your Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                                                    placeholder="Email Address"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                                                <input
                                                    type="tel"
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                                                <input
                                                    type="text"
                                                    value={user?.role}
                                                    readOnly
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                                                <input
                                                    type="text"
                                                    value={profileData.city}
                                                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                                                    placeholder="e.g. Mumbai"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                                                <input
                                                    type="text"
                                                    value={profileData.state}
                                                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                                                    placeholder="e.g. Maharashtra"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isEditingProfile}
                                                className="btn-primary py-3 px-8 flex items-center gap-2 rounded-xl shadow-lg shadow-orange-200"
                                            >
                                                {isEditingProfile ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function UserDashboard() {
    return (
        <ProtectedRoute allowedRoles={['user']}>
            <UserDashboardContent />
        </ProtectedRoute>
    );
}
