'use client';

// Temple Smart E-Pass - Individual Temple Dashboard
// Complete temple information view with all details

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/protected-route';
import { useState, useEffect } from 'react';
import { templesApi, adminApi, Temple } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { TrafficLightBadge } from '@/components/ui/traffic-light';

const getCapacity = (temple: Temple | null) => {
    if (!temple) return 1;
    if (typeof temple.capacity === 'number') return temple.capacity;
    return temple.capacity?.total || 1;
};

function TempleDashboardContent() {
    const params = useParams();
    const id = params?.id as string;

    const [temple, setTemple] = useState<Temple | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        async function fetchData() {
            try {
                const [templeRes, bookingsRes] = await Promise.all([
                    templesApi.getById(id),
                    adminApi.getBookings({ templeId: id, limit: 5 })
                ]);

                if (templeRes.success) setTemple(templeRes.data);
                if (bookingsRes.success) setStats({ recentBookings: bookingsRes.data, count: bookingsRes.count });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <AdminLayout title="Temple Dashboard" subtitle="Loading temple data...">
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (!temple) return <AdminLayout title="Not Found" subtitle="Temple not found"><div>Temple not found</div></AdminLayout>;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📋' },
        { id: 'fees', label: 'Fees & Donations', icon: '💰' },
        { id: 'facilities', label: 'Facilities', icon: '🏢' },
        { id: 'prasad', label: 'Prasad Menu', icon: '🍲' },
        { id: 'services', label: 'Services', icon: '🙏' },
    ];

    return (
        <AdminLayout title={temple.name} subtitle={`${typeof temple.location === 'string' ? temple.location : `${temple.location.city}, ${temple.location.state}`}`}>
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/temples" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Temples
                    </Link>
                    <div className="ml-auto flex gap-3">
                        <Link href={`/admin/temples/${id}/edit`} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit Details
                        </Link>
                        <Link href="/admin/live" className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            Live Monitor
                        </Link>
                    </div>
                </div>

                {/* Status Cards Row */}
                <div className="grid md:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Status</h3>
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${temple.status === 'OPEN' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className={`text-xl font-bold ${temple.status === 'OPEN' ? 'text-green-600' : 'text-red-600'}`}>{temple.status}</span>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Capacity</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">{(temple.live_count || temple.currentOccupancy || 0).toLocaleString()}</span>
                            <span className="text-slate-400 text-sm">/ {getCapacity(temple).toLocaleString()}</span>
                        </div>
                        <div className="mt-2">
                            <TrafficLightBadge status={(temple.live_count || 0) / getCapacity(temple) > 0.95 ? 'RED' : (temple.live_count || 0) / getCapacity(temple) > 0.85 ? 'ORANGE' : 'GREEN'} />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Timings</h3>
                        <span className="text-xl font-bold text-slate-900">
                            {temple.operatingHours?.regular?.opens || '06:00'} - {temple.operatingHours?.regular?.closes || '21:00'}
                        </span>
                        <p className="text-slate-400 text-xs mt-1">Weekdays</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Bookings</h3>
                        <span className="text-2xl font-bold text-slate-900">{stats?.count || 0}</span>
                        <p className="text-slate-400 text-xs mt-1">Total bookings</p>
                    </motion.div>
                </div>

                {/* Deity & Description Card */}
                {(temple.deity || temple.description) && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        {temple.deity && (
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">🙏</span>
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Main Deity</p>
                                    <p className="text-xl font-bold text-slate-900">{temple.deity}</p>
                                </div>
                            </div>
                        )}
                        {temple.description && (
                            <p className="text-slate-600 leading-relaxed">{temple.description}</p>
                        )}
                        {temple.significance && (
                            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <p className="text-orange-800 font-medium flex items-center gap-2">
                                    <span>✨</span> {temple.significance}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-100 bg-white rounded-t-xl px-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id
                                    ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span>📍</span> Location</h4>
                                <div className="space-y-2 text-slate-600">
                                    {typeof temple.location === 'object' && (
                                        <>
                                            <p>{temple.location.address}</p>
                                            <p className="font-medium">{temple.location.city}, {temple.location.state}</p>
                                            {temple.location.coordinates && (
                                                <p className="text-sm text-slate-400">
                                                    Coordinates: {temple.location.coordinates.latitude}, {temple.location.coordinates.longitude}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span>📞</span> Contact</h4>
                                <div className="space-y-2 text-slate-600">
                                    {temple.contact?.phone && <p>📱 {temple.contact.phone}</p>}
                                    {temple.contact?.email && <p>✉️ {temple.contact.email}</p>}
                                    {temple.contact?.website && (
                                        <a href={temple.contact.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline flex items-center gap-1">
                                            🌐 {temple.contact.website}
                                        </a>
                                    )}
                                </div>
                            </div>
                            {temple.liveDarshan?.enabled && (
                                <div className="md:col-span-2">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span>📺</span> Live Darshan</h4>
                                    <a href={temple.liveDarshan.streamUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        Watch Live Stream
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fees Tab */}
                    {activeTab === 'fees' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4">Entry & Darshan Fees</h4>
                                <div className="space-y-3">
                                    {temple.fees && Object.entries(temple.fees).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className="font-bold text-slate-900">₹{value || 'Free'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4">Donations</h4>
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">💝</span>
                                        <span className="font-semibold text-green-800">Donations {temple.donations?.enabled ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                    {temple.donations?.section80G && (
                                        <p className="text-green-700 text-sm flex items-center gap-2">
                                            <span>📄</span> 80G Tax Exemption Available
                                        </p>
                                    )}
                                    {temple.donations?.minimumAmount && (
                                        <p className="text-green-700 text-sm mt-2">Minimum: ₹{temple.donations.minimumAmount}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Facilities Tab */}
                    {activeTab === 'facilities' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {temple.facilities && Object.entries(temple.facilities).map(([key, value]) => {
                                const icons: Record<string, string> = {
                                    parking: '🅿️', wheelchairAccess: '♿', cloakroom: '🧥',
                                    prasadCounter: '🍲', shoeStand: '👟', drinkingWater: '🚰',
                                    restrooms: '🚻', accommodation: '🏨', freeFood: '🍛'
                                };
                                return (
                                    <div key={key} className={`p-4 rounded-xl border flex items-center gap-3 ${value ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                                        <span className="text-2xl">{icons[key] || '✓'}</span>
                                        <div>
                                            <p className="font-medium text-slate-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                            <p className={`text-sm ${value ? 'text-green-600' : 'text-slate-400'}`}>{value ? 'Available' : 'Not Available'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Prasad Tab */}
                    {activeTab === 'prasad' && (
                        <div>
                            {temple.prasadMenu && temple.prasadMenu.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {temple.prasadMenu.map((item, index) => (
                                        <div key={index} className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <div className="flex items-start justify-between mb-2">
                                                <h5 className="font-bold text-slate-800">{item.name}</h5>
                                                <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-bold">₹{item.price}</span>
                                            </div>
                                            {item.description && <p className="text-slate-600 text-sm mb-2">{item.description}</p>}
                                            {item.servingSize && <p className="text-amber-700 text-xs">Serving: {item.servingSize}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <span className="text-4xl mb-3 block">🍲</span>
                                    <p>No prasad menu items available</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Services Tab */}
                    {activeTab === 'services' && (
                        <div>
                            {temple.specialServices && temple.specialServices.length > 0 ? (
                                <div className="space-y-4">
                                    {temple.specialServices.map((service, index) => (
                                        <div key={index} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h5 className="font-bold text-slate-800">{service.name}</h5>
                                                    {service.duration && <p className="text-slate-500 text-sm">Duration: {service.duration}</p>}
                                                </div>
                                                <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full font-bold">₹{service.price}</span>
                                            </div>
                                            {service.description && <p className="text-slate-600 text-sm">{service.description}</p>}
                                            {service.requiresBooking && (
                                                <p className="text-purple-600 text-xs mt-2 flex items-center gap-1">
                                                    <span>📅</span> Requires advance booking
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <span className="text-4xl mb-3 block">🙏</span>
                                    <p>No special services listed</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

export default function TempleDashboardPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <TempleDashboardContent />
        </ProtectedRoute>
    );
}
