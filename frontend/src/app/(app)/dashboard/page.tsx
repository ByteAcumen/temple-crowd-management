'use client';

// Temple Smart E-Pass - User Dashboard
// Premium Design: Animated Gradients, Glassmorphism, Floating Blobs

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState } from 'react';
import { bookingsApi, Booking } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/ui/Logo';

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
            <div className="min-h-screen gradient-animated flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <p className="text-white font-medium animate-pulse">Loading experience...</p>
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
        <div className="min-h-screen gradient-animated font-sans text-slate-900 selection:bg-orange-500/30 overflow-x-hidden relative">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-reverse" />
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-yellow-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float delay-500" />
            </div>

            {/* Navbar is in app layout, but we add spacing */}

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Header Welcome Section (Glassmorphism) */}
                <div className="glass rounded-3xl p-8 mb-8 shadow-xl border border-white/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-5"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-500/30 border-2 border-white/20">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">
                                    Namaste, {user?.name?.split(' ')[0] || 'Devotee'}! 🙏
                                </h1>
                                <p className="text-slate-500 font-medium">May your journey be filled with peace.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl inline-flex self-start border border-white/40 shadow-sm"
                        >
                            {(['overview', 'tickets', 'profile'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 capitalize ${activeTab === tab ? 'text-orange-600 shadow-md' : 'text-slate-500 hover:bg-white/30 hover:text-slate-700'
                                        }`}
                                >
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white rounded-xl"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">{tab}</span>
                                </button>
                            ))}
                        </motion.div>
                    </div>
                </div>

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
                                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden h-full flex flex-col justify-between group cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all border border-white/10 shadow-xl shadow-indigo-500/20">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <h2 className="text-3xl font-bold mb-2">Plan Your Visit</h2>
                                            <p className="text-indigo-100 mb-6 max-w-sm">Explore new temples, check live crowd status, and book your priority darshan slots.</p>
                                            <Link href="/temples" className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl font-bold hover:bg-white hover:text-indigo-600 transition-all active:scale-95">
                                                Browse Temples
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <Link href="/booking" className="glass h-full rounded-3xl p-8 border border-white/40 hover:border-orange-200 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-center items-center text-center">
                                        <div className="absolute inset-0 bg-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative z-10">
                                            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg mx-auto">
                                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">New Booking</h3>
                                            <p className="text-slate-500 text-sm font-medium">Create a new E-Pass</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            </div>

                            {/* Recent Activity */}
                            <motion.div variants={itemVariants}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
                                    <button onClick={() => setActiveTab('tickets')} className="text-orange-600 text-sm font-bold hover:underline bg-white/50 px-3 py-1 rounded-lg transition-colors">View All Tickets</button>
                                </div>
                                <div className="glass rounded-3xl shadow-lg border border-white/20 overflow-hidden">
                                    {loadingBookings ? (
                                        <div className="p-8 space-y-4">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center gap-4 animate-pulse">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-200/50" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-5 bg-slate-200/50 rounded w-1/3" />
                                                        <div className="h-4 bg-slate-200/50 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : bookings.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">🎫</div>
                                            <h3 className="text-slate-800 font-bold text-lg">No bookings found</h3>
                                            <p className="text-slate-500 text-sm mt-1">Your upcoming visits will appear here.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100/50">
                                            {bookings.slice(0, 3).map((booking) => (
                                                <div key={booking._id} className="p-5 flex items-center justify-between hover:bg-white/40 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex flex-col items-center justify-center font-bold border border-orange-100 shadow-sm">
                                                            <span className="text-xl leading-none">{new Date(booking.date).getDate()}</span>
                                                            <span className="text-[10px] uppercase">{new Date(booking.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-lg">
                                                                {typeof booking.temple === 'object' ? booking.temple?.name : 'Temple'}
                                                            </h4>
                                                            <p className="text-sm text-slate-500 font-medium">
                                                                {booking.timeSlot} • {booking.visitors} Visitors
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Link href={`/tickets/${booking.passId}`} className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
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
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <motion.div key={i} variants={itemVariants}>
                                            <div className="glass rounded-3xl shadow-sm border border-white/20 overflow-hidden h-64 animate-pulse">
                                                <div className="h-1/2 bg-slate-200/50" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </>
                            ) : bookings.length === 0 ? (
                                <div className="col-span-full py-20 text-center glass rounded-3xl">
                                    <div className="inline-block p-6 rounded-full bg-slate-50 mb-4 shadow-inner">
                                        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">No Tickets Yet</h3>
                                    <p className="text-slate-500 mb-6 font-medium">Book your first temple visit to get started.</p>
                                    <Link href="/booking" className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all active:scale-95">Book Now</Link>
                                </div>
                            ) : (
                                bookings.map((booking) => (
                                    <motion.div variants={itemVariants} key={booking._id}>
                                        <Link href={`/tickets/${booking.passId}`} className="block glass rounded-[2rem] shadow-lg hover:shadow-2xl transition-all border border-white/20 overflow-hidden group hover:-translate-y-1">
                                            {/* Top Park of Ticket */}
                                            <div className="h-40 bg-gradient-to-br from-orange-500 to-red-600 relative overflow-hidden p-6 flex flex-col justify-between">
                                                <div className="absolute inset-0 bg-[url('/patterns/temple-pattern.png')] opacity-20 mix-blend-overlay"></div>
                                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

                                                <div className="relative z-10 flex justify-between items-start text-white">
                                                    <span className="bg-white/20 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">E-Pass</span>
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white/95 text-orange-600 shadow-sm uppercase tracking-wide`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <div className="relative z-10 text-white">
                                                    <h3 className="font-bold text-xl leading-tight truncate drop-shadow-sm">
                                                        {typeof booking.temple === 'object' ? booking.temple?.name : 'Temple'}
                                                    </h3>
                                                    <p className="text-orange-100 text-sm font-medium mt-1 opacity-90">
                                                        {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Bottom Part of Ticket */}
                                            <div className="p-6 relative bg-white/60 backdrop-blur-xl">
                                                {/* Dashed Line */}
                                                <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-slate-300"></div>
                                                {/* Cutouts */}
                                                <div className="absolute -left-3 top-[-12px] w-6 h-6 bg-slate-100/50 backdrop-blur rounded-full shadow-inner"></div>
                                                <div className="absolute -right-3 top-[-12px] w-6 h-6 bg-slate-100/50 backdrop-blur rounded-full shadow-inner"></div>

                                                <div className="flex justify-between items-center mb-6 pt-2">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Time Slot</p>
                                                        <p className="font-bold text-slate-800 text-lg">{booking.timeSlot}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Visitors</p>
                                                        <p className="font-bold text-slate-800 text-lg">{booking.visitors}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" /></svg>
                                                        </div>
                                                        <span className="text-xs font-mono text-slate-400">{booking.passId.slice(0, 8)}...</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                        View <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                    </span>
                                                </div>
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
                            <div className="glass rounded-[2rem] shadow-xl border border-white/20 overflow-hidden">
                                <div className="bg-slate-900/5 backdrop-blur-sm px-8 py-6 flex items-center justify-between border-b border-white/10">
                                    <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
                                    <button onClick={() => setActiveTab('overview')} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="p-8 bg-white/60 backdrop-blur-xl">
                                    {profileMessage && (
                                        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                            {profileMessage.type === 'success' ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            )}
                                            <p className="text-sm font-bold">{profileMessage.text}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Inputs */}
                                            {['Full Name', 'Email', 'Phone', 'Role', 'City', 'State'].map((label, idx) => {
                                                const field = label.toLowerCase().replace(' ', '') === 'fullname' ? 'name' : label.toLowerCase();
                                                const isReadOnly = label === 'Role';
                                                const value = isReadOnly ? user?.role : (profileData as any)[field];

                                                return (
                                                    <div key={label}>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 pl-1">{label}</label>
                                                        <input
                                                            type={label === 'Email' ? 'email' : 'text'}
                                                            value={value}
                                                            readOnly={isReadOnly}
                                                            onChange={(e) => !isReadOnly && setProfileData({ ...profileData, [field]: e.target.value })}
                                                            className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium ${isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:bg-white'}`}
                                                            placeholder={`Enter ${label}`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isEditingProfile}
                                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isEditingProfile ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
