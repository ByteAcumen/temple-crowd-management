'use client';

// Temple Smart E-Pass - Admin Dashboard
// Manage temples, view analytics, control access

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState } from 'react';
import { templesApi, Temple } from '@/lib/api';

function AdminDashboardContent() {
    const { user, logout, isLoading } = useAuth();
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loadingTemples, setLoadingTemples] = useState(true);
    const [stats, setStats] = useState({
        totalTemples: 0,
        totalBookings: 0,
        activeGatekeepers: 0,
        currentCrowd: 0,
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await templesApi.getAll();
                if (response.success) {
                    setTemples(response.data);
                    setStats(prev => ({
                        ...prev,
                        totalTemples: response.count,
                        currentCrowd: response.data.reduce((sum: number, t: Temple) => sum + (t.currentOccupancy || 0), 0),
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch temples:', err);
            } finally {
                setLoadingTemples(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-800 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    // Check if user is admin
    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400 mb-6">You don&apos;t have permission to access the admin panel.</p>
                    <Link href="/dashboard" className="btn-primary">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Admin Sidebar + Main Content */}
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-slate-800 min-h-screen border-r border-slate-700 hidden lg:flex lg:flex-col">
                    <div className="p-6 border-b border-slate-700">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-white block">Temple Smart</span>
                                <span className="text-xs text-orange-400">Admin Panel</span>
                            </div>
                        </Link>
                    </div>

                    <nav className="p-4 space-y-2">
                        {[
                            { name: 'Dashboard', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
                            { name: 'Temples', href: '/admin/temples', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5' },
                            { name: 'Bookings', href: '/admin/bookings', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
                            { name: 'Analytics', href: '/admin/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                            { name: 'Users', href: '/admin/users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                            { name: 'Live Monitor', href: '/live', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                </svg>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Spacer to push user profile to bottom */}
                    <div className="flex-1" />

                    {/* User Profile */}
                    <div className="p-4 border-t border-slate-700 mt-auto">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700/50">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <span className="text-orange-400 font-bold">{user?.name?.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                            </div>
                            <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-h-screen">
                    {/* Top Bar */}
                    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-slate-400 text-sm">Overview and management controls</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-xl">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-green-400 text-sm font-medium">System Online</span>
                            </div>
                        </div>
                    </header>

                    <div className="p-6">
                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-4 gap-6 mb-8">
                            {[
                                { label: 'Total Temples', value: stats.totalTemples, icon: '🛕', color: 'from-blue-500 to-blue-600' },
                                { label: 'Total Bookings', value: '12,453', icon: '🎫', color: 'from-orange-500 to-red-500' },
                                { label: 'Active Gatekeepers', value: '24', icon: '👤', color: 'from-green-500 to-emerald-500' },
                                { label: 'Current Crowd', value: stats.currentCrowd.toLocaleString(), icon: '👥', color: 'from-purple-500 to-pink-500' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-3xl">{stat.icon}</span>
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} opacity-20`}></div>
                                    </div>
                                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                                    <p className="text-slate-400 text-sm">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Temples List */}
                        <div className="bg-slate-800 rounded-2xl border border-slate-700">
                            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Temple Management</h2>
                                    <p className="text-slate-400 text-sm">Manage temples and their settings</p>
                                </div>
                                <button className="btn-primary text-sm py-2">
                                    + Add Temple
                                </button>
                            </div>

                            {loadingTemples ? (
                                <div className="p-12 text-center">
                                    <div className="w-10 h-10 border-4 border-orange-800 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-400">Loading temples...</p>
                                </div>
                            ) : temples.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-slate-400">No temples found. Add your first temple to get started.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                                <th className="px-6 py-4 font-medium">Temple</th>
                                                <th className="px-6 py-4 font-medium">Location</th>
                                                <th className="px-6 py-4 font-medium">Capacity</th>
                                                <th className="px-6 py-4 font-medium">Current</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                                <th className="px-6 py-4 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {temples.map((temple) => (
                                                <tr key={temple._id} className="hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="font-medium text-white">{temple.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400">
                                                        {typeof temple.location === 'object'
                                                            ? `${temple.location?.city || ''}, ${temple.location?.state || ''}`
                                                            : temple.location}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400">{temple.capacity?.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-orange-400 font-medium">
                                                            {temple.currentOccupancy?.toLocaleString() || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${temple.status === 'OPEN'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {temple.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                            <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}
