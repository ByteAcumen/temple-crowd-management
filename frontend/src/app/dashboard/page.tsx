'use client';

// Temple Smart E-Pass - User Dashboard
// Show user's bookings and E-Passes

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState } from 'react';
import { bookingsApi, Booking } from '@/lib/api';

function UserDashboardContent() {
    const { user, logout, isLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);

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

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Dashboard Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-slate-900">Temple Smart</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Welcome back, {user?.name?.split(' ')[0]}! 🙏
                    </h1>
                    <p className="text-slate-600">Manage your temple bookings and E-Passes</p>
                </div>

                {/* Quick Actions */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <Link href="/temples" className="card p-6 hover-lift cursor-pointer group">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Browse Temples</h3>
                        <p className="text-slate-600 text-sm">Explore temples and check crowd status</p>
                    </Link>

                    <Link href="/booking" className="card p-6 hover-lift cursor-pointer group bg-gradient-to-br from-orange-500 to-red-600 text-white">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold mb-1">Book New Visit</h3>
                        <p className="text-white/80 text-sm">Get your digital E-Pass now</p>
                    </Link>

                    <Link href="/live" className="card p-6 hover-lift cursor-pointer group sm:col-span-2 md:col-span-1">
                        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Live Crowd Status</h3>
                        <p className="text-slate-600 text-sm">Check real-time temple occupancy</p>
                    </Link>
                </div>

                {/* My E-Passes */}
                <div className="card">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">My E-Passes</h2>
                            <p className="text-slate-600 text-sm">Your upcoming and past temple visits</p>
                        </div>
                        <Link href="/booking" className="btn-primary text-sm py-2">
                            New Booking
                        </Link>
                    </div>

                    {loadingBookings ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-600">Loading your bookings...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No E-Passes Yet</h3>
                            <p className="text-slate-600 mb-6">Book your first temple visit to get started</p>
                            <Link href="/booking" className="btn-primary inline-flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Book Your First Visit
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {bookings.map((booking) => (
                                <div key={booking._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">
                                                {typeof booking.temple === 'object' ? booking.temple.name : 'Temple Visit'}
                                            </h4>
                                            <p className="text-sm text-slate-600">
                                                {new Date(booking.date).toLocaleDateString('en-IN', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short'
                                                })} • {booking.timeSlot}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Pass ID: {booking.passId}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'USED' ? 'bg-blue-100 text-blue-700' :
                                                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {booking.status}
                                        </span>
                                        <Link
                                            href={`/tickets/${booking.passId}`}
                                            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                                        >
                                            View E-Pass →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
