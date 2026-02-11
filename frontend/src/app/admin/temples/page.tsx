'use client';

// Temple Smart E-Pass - Admin Temple Management
// Manage listings, capacity, and operating hours
// Premium Redesign (Light Theme)

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { templesApi, adminApi, Temple } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { BackendStatusBar } from '@/components/admin/BackendStatusBar';
import { CardGridSkeleton } from '@/components/admin/LoadingSkeleton';
import TempleCard from '@/components/admin/temples/TempleCard';
import TempleFormModal from '@/components/admin/temples/TempleFormModal';

// Helper for safe capacity access
const getCapacity = (t: Temple | undefined) => {
    if (!t || !t.capacity) return 1;
    if (typeof t.capacity === 'number') return t.capacity;
    return t.capacity.total || 1;
};

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

type StatusFilter = 'ALL' | 'OPEN' | 'CLOSED';

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

function AdminTemplesContent() {
    const { user, isLoading: authLoading } = useAuth();
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [error, setError] = useState('');

    const [demoMode, setDemoMode] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Create/Edit Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    // Check for ?action=new
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            openCreateModal();
            // Clean up URL without reload
            router.replace('/admin/temples', { scroll: false });
        }
    }, [searchParams, router]);

    useEffect(() => {
        async function fetchTemples() {
            try {
                setLoading(true);
                setError('');
                setApiError(null);
                setDemoMode(false);

                const response = await templesApi.getAll();
                if (response.success) {
                    setTemples(response.data || []);
                    setLastUpdated(new Date());
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error('Failed to fetch temples:', errorMessage);

                // Demo Mode Fallback
                console.warn('⚠️ Backend unreachable. Switching to Demo Mode.');
                setApiError(errorMessage || 'Backend unreachable');
                setDemoMode(true);

                // Mock Temples
                setTemples([
                    {
                        _id: 't1',
                        name: 'Somnath Temple',
                        location: { city: 'Veraval', state: 'Gujarat' },
                        deity: 'Lord Shiva',
                        status: 'OPEN',
                        capacity: 5000,
                        currentOccupancy: 1200,
                        images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Somnath_Mandir_Veraval_Gujarat_01.jpg/1200px-Somnath_Mandir_Veraval_Gujarat_01.jpg'],
                        fees: { specialDarshan: 200, general: 0 },
                        facilities: { parking: true, wheelchairAccess: true, restrooms: true, drinkingWater: true, prasadCounter: true }
                    },
                    {
                        _id: 't2',
                        name: 'Kashi Vishwanath',
                        location: { city: 'Varanasi', state: 'UP' },
                        deity: 'Lord Shiva',
                        status: 'OPEN',
                        capacity: 8000,
                        currentOccupancy: 7500, // High occupancy
                        images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Kashi_Vishwanath_Temple_Banaras.jpg/1200px-Kashi_Vishwanath_Temple_Banaras.jpg'],
                        fees: { specialDarshan: 500, general: 0 },
                        facilities: { parking: false, wheelchairAccess: true, restrooms: true, drinkingWater: true, prasadCounter: true }
                    },
                    {
                        _id: 't3',
                        name: 'Kedarnath Temple',
                        location: { city: 'Rudraprayag', state: 'Uttarakhand' },
                        deity: 'Lord Shiva',
                        status: 'CLOSED', // Closed
                        capacity: 3000,
                        currentOccupancy: 0,
                        images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Kedarnath_Temple_Uttarakhand_India.jpg/1200px-Kedarnath_Temple_Uttarakhand_India.jpg'],
                        fees: { specialDarshan: 0, general: 0 },
                        facilities: { parking: true, wheelchairAccess: false, restrooms: false, drinkingWater: true, prasadCounter: false }
                    }
                ] as Temple[]);

            } finally {
                setLoading(false);
            }
        }
        if (user && !authLoading) fetchTemples();
    }, [user, authLoading]);

    // Filter temples by search + status
    const filteredTemples = temples.filter(temple => {
        const matchSearch = temple.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (typeof temple.location === 'string' ? temple.location : temple.location?.city)?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || temple.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Open Create Modal
    const openCreateModal = () => {
        setEditingTemple(null);
        setShowModal(true);
    };

    // Open Edit Modal
    const openEditModal = (temple: Temple) => {
        setEditingTemple(temple);
        setShowModal(true);
    };

    // Save Create/Edit
    const handleSave = async (formData: Partial<Temple>) => {
        setSaving(true);
        try {
            if (editingTemple) {
                const res = await adminApi.updateTemple(editingTemple._id, formData);
                if (res.success) {
                    setTemples(prev => prev.map(t => t._id === editingTemple._id ? { ...t, ...res.data } : t));
                }
            } else {
                const res = await adminApi.createTemple(formData);
                if (res.success) {
                    setTemples(prev => [...prev, res.data]);
                }
            }
            setShowModal(false);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save temple';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Sync Temple Status
    const handleSync = async () => {
        setSyncing(true);
        try {
            await templesApi.syncStatus();
            // Refetch temples to show updated statuses
            const response = await templesApi.getAll();
            if (response.success) setTemples(response.data || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Sync failed';
            setError(errorMessage);
        } finally {
            setSyncing(false);
        }
    };

    // Initial stats
    const totalCapacity = temples.reduce((sum, t) => sum + getCapacity(t), 0);
    const openTemples = temples.filter(t => t.status === 'OPEN').length;

    const handleDeleteWrapper = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

        if (demoMode) {
            alert('Demo Mode: Temple deletion simulated.');
            setTemples(prev => prev.filter(t => t._id !== id));
            return;
        }

        try {
            const res = await adminApi.deleteTemple(id);
            if (res.success) {
                setTemples(prev => prev.filter(t => t._id !== id));
            } else {
                setError(res.message || 'Failed to delete temple');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Failed to delete temple');
        }
    };

    return (
        <AdminLayout title="Temple Management" subtitle="Manage temple listings, capacity and schedules">
            <div className="flex justify-end mb-4">
                <BackendStatusBar status={loading ? 'loading' : 'connected'} lastUpdated={lastUpdated || undefined} dataCount={temples.length} />
            </div>

            {(loading || authLoading) ? (
                <CardGridSkeleton count={6} />
            ) : (
                <>
                    {/* Demo Mode Banner */}
                    <AnimatePresence>
                        {demoMode && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -20, height: 0 }}
                                className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 shadow-sm"
                            >
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <h3 className="font-bold text-amber-800">Viewing Demo Data - Backend Unreachable</h3>
                                    <p className="text-sm text-amber-700 mt-1">
                                        The system is currently in read-only demo mode because the backend server is unreachable.
                                        Error: <span className="font-mono bg-amber-100 px-1 rounded">{apiError}</span>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >
                        {/* Stats Row */}
                        <div className="grid sm:grid-cols-3 gap-6">
                            <StatCard
                                icon="🛕"
                                title="Total Temples"
                                value={temples.length}
                                color="orange"
                                trend={{ value: '+2', positive: true }}
                            />
                            <StatCard
                                icon="👥"
                                title="Total Capacity"
                                value={totalCapacity.toLocaleString()}
                                color="blue"
                            />
                            <StatCard
                                icon="🔓"
                                title="Open Now"
                                value={openTemples}
                                subtext={`${Math.round((openTemples / (temples.length || 1)) * 100)}% active`}
                                color="green"
                            />
                        </div>

                        {/* Actions Bar */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1 group">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search temples by name or location..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm hover:bg-slate-50"
                                    />
                                </div>
                                <button onClick={handleSync} disabled={syncing}
                                    className="px-5 py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                                    <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    {syncing ? 'Syncing...' : 'Sync Status'}
                                </button>
                                <motion.button onClick={openCreateModal}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Temple
                                </motion.button>
                            </div>

                            {/* Status Filter Pills */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
                                {(['ALL', 'OPEN', 'CLOSED'] as StatusFilter[]).map(s => (
                                    <button key={s} onClick={() => setStatusFilter(s)}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === s
                                            ? s === 'OPEN' ? 'bg-emerald-500 text-white shadow-sm' :
                                                s === 'CLOSED' ? 'bg-red-500 text-white shadow-sm' :
                                                    'bg-slate-900 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}>
                                        {s === 'ALL' ? `All (${temples.length})` : s === 'OPEN' ? `Open (${temples.filter(t => t.status === 'OPEN').length})` : `Closed (${temples.filter(t => t.status === 'CLOSED').length})`}
                                    </button>
                                ))}
                                <span className="ml-auto text-xs text-slate-400">{filteredTemples.length} shown</span>
                            </div>
                        </div>

                        {/* Error Messages */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-600 flex items-center gap-3"
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium">{error}</span>
                                    <button onClick={() => setError('')} className="ml-auto hover:text-red-800 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Temples Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {filteredTemples.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                            🛕
                                        </div>
                                        <h3 className="text-slate-900 font-bold text-lg mb-1">No temples found</h3>
                                        <p className="text-slate-500 text-sm">Try adjusting your search or add a new temple</p>
                                    </motion.div>
                                ) : (
                                    filteredTemples.map((temple) => (
                                        <TempleCard
                                            key={temple._id}
                                            temple={temple}
                                            onEdit={openEditModal}
                                            onDelete={handleDeleteWrapper}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Create/Edit Temple Modal */}
            <TempleFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                initialData={editingTemple}
                isSaving={saving}
            />

        </AdminLayout>
    );
}

// Sub-components
// Enhanced Premium Stat Card with Glassmorphism
function StatCard({ icon, title, value, subtext, color, trend }: StatCardProps) {
    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 p-6 group"
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

export default function AdminTemplesPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminTemplesContent />
        </ProtectedRoute>
    );
}
