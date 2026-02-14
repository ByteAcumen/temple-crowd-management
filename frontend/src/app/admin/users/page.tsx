'use client';

// Temple Smart E-Pass - Admin User Management
// Super Admin only - Manage temple admins and gatekeepers
// Premium Redesign (Light Theme)

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState } from 'react';
import { adminApi, templesApi, Temple, User } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { BackendStatusBar } from '@/components/admin/BackendStatusBar';
import { StatCard as SharedStatCard } from '@/components/admin/StatCard';
import { StatCardSkeleton } from '@/components/admin/LoadingSkeleton';

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

// Interfaces
interface CreateAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    formData: any;
    setFormData: (data: any) => void;
}

interface AssignTemplesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (ids: string[]) => Promise<void>;
    user: User | null;
    temples: Temple[];
}


function AdminUsersContent() {
    const { user, isLoading } = useAuth();
    const [admins, setAdmins] = useState<User[]>([]);
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [demoMode, setDemoMode] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Create form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        isSuperAdmin: false,
        assignedTemples: [] as string[]
    });

    // Fetch data with Demo Mode Fallback
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setApiError(null);
                setDemoMode(false);

                // Fetch temples first
                const templesRes = await templesApi.getAll();
                if (templesRes.success) {
                    setTemples(templesRes.data);
                }

                // Fetch admin + gatekeeper users for super admin user management
                if (user?.isSuperAdmin) {
                    const usersRes = await adminApi.getUsers();
                    if (usersRes.success && usersRes.data) {
                        const staff = usersRes.data.filter((u: User) => u.role === 'admin' || u.role === 'gatekeeper');
                        setAdmins(staff);
                    }
                    setLastUpdated(new Date());
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error('Error fetching admin data:', errorMessage);

                // Switch to Demo Mode if backend fails
                if (user?.isSuperAdmin) {
                    console.warn('⚠️ Backend unreachable. Switching to Demo Mode.');
                    setApiError(errorMessage || 'Backend unreachable');
                    setDemoMode(true);

                    // Mock Data
                    setAdmins([
                        { _id: '1', id: '1', name: 'Demo Super Admin', email: 'super@demo.com', role: 'admin', isSuperAdmin: true },
                        { _id: '2', id: '2', name: 'Temple Manager', email: 'manager@demo.com', role: 'admin', isSuperAdmin: false, assignedTemples: ['1'] },
                        { _id: '3', id: '3', name: 'Gate Keeper', email: 'gate@demo.com', role: 'gatekeeper', isSuperAdmin: false, assignedTemples: ['2'] }
                    ] as User[]);

                    setTemples([
                        { _id: '1', name: 'Somnath Temple', location: { city: 'Veraval' } },
                        { _id: '2', name: 'Kashi Vishwanath', location: { city: 'Varanasi' } }
                    ] as Temple[]);
                }
            } finally {
                setLoading(false);
            }
        }

        if (!isLoading && user) {
            fetchData();
        }
    }, [user, isLoading]);

    // Filter admins by search query
    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handlers
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (demoMode) {
            setSuccess('Demo Mode: User created successfully (simulated)');
            setShowCreateModal(false);
            return;
        }

        try {
            const res = await adminApi.createUser(formData);
            if (res.success) {
                setAdmins(prev => [res.data, ...prev]);
                setSuccess('Admin created successfully');
                setShowCreateModal(false);
                setFormData({ name: '', email: '', password: '', role: 'admin', isSuperAdmin: false, assignedTemples: [] });
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Failed to create user');
        }
    };

    const handleUpdateTemples = async (templeIds: string[]) => {
        if (!selectedUser) return;
        setError('');

        if (demoMode) {
            setSuccess('Demo Mode: Assignments updated (simulated)');
            setShowAssignModal(false);
            return;
        }

        try {
            const res = await adminApi.updateUserTemples(selectedUser._id || selectedUser.id, {
                assignedTemples: templeIds
            });
            if (res.success) {
                setAdmins(prev => prev.map(a =>
                    (a._id || a.id) === (selectedUser._id || selectedUser.id) ? res.data : a
                ));
                setSuccess('Temple assignments updated');
                setShowAssignModal(false);
                setSelectedUser(null);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Failed to update assignments');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        if (demoMode) {
            setAdmins(prev => prev.filter(a => (a._id || a.id) !== userId));
            setSuccess('Demo Mode: User deleted (simulated)');
            return;
        }

        try {
            const res = await adminApi.deleteUser(userId);
            if (res.success) {
                setAdmins(prev => prev.filter(a => (a._id || a.id) !== userId));
                setSuccess('User deleted');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage || 'Failed to delete user');
        }
    };

    if (isLoading) {
        return (
            <AdminLayout title="User Management" subtitle="Loading...">
                <div className="grid sm:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
                </div>
                <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
            </AdminLayout>
        );
    }

    if (!user?.isSuperAdmin) {
        return (
            <AdminLayout title="Access Restricted" subtitle="Super Admin privileges required">
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <span className="text-5xl">🔐</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Super Admin Zone</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed max-w-md">
                        This area is restricted to Super Administrators. You can view your dashboard or manage your assigned temple tasks.
                    </p>
                    <Link
                        href="/admin/dashboard"
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="User Management" subtitle="Manage admin accounts and assignments">
            <div className="flex justify-end mb-4">
                <BackendStatusBar
                    status={loading ? 'loading' : demoMode ? 'demo' : 'connected'}
                    lastUpdated={lastUpdated || undefined}
                    dataCount={admins.length}
                    onRetry={() => window.location.reload()}
                />
            </div>

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
                {/* Stats Cards */}
                <div className="grid sm:grid-cols-3 gap-6">
                    {loading ? (
                        <>
                            {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
                        </>
                    ) : (
                        <>
                            <SharedStatCard icon="👥" label="Total Users" value={admins.length} subtext="Registered accounts" color="orange" trend={{ value: 'staff', positive: true }} />
                            <SharedStatCard icon="👑" label="Super Admins" value={admins.filter(a => a.isSuperAdmin).length} subtext="Full access" color="purple" />
                            <SharedStatCard icon="🛕" label="Active Temples" value={temples.length} subtext="Managed locations" color="blue" />
                        </>
                    )}
                </div>

                {/* Actions & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-lg w-full group">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search admins by name or email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm hover:shadow-md"
                        />
                    </div>
                    <motion.button
                        onClick={() => setShowCreateModal(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New User
                    </motion.button>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                    {(error || success) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm ${error
                                ? 'bg-red-50 border-red-200 text-red-600'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                }`}
                        >
                            <span className="text-xl">{error ? '⚠️' : '✅'}</span>
                            <p className="font-medium">{error || success}</p>
                            <button onClick={() => { setError(''); setSuccess(''); }} className="ml-auto hover:bg-black/5 p-1 rounded">
                                ✕
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Admins Table */}
                <div className="admin-card bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">System Users</h3>
                            <p className="text-sm text-slate-500">Manage access control and permissions</p>
                        </div>
                        <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                            {filteredAdmins.length} Users
                        </div>
                    </div>

                    {filteredAdmins.length === 0 ? (
                        <div className="p-16 text-center text-slate-500">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
                                🕵️‍♂️
                            </div>
                            <h4 className="text-lg font-semibold text-slate-900 mb-1">No users found</h4>
                            <p>Try adjusting your search terms or create a new user.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-6 py-4 font-semibold">User Details</th>
                                        <th className="px-6 py-4 font-semibold">Role & Access</th>
                                        <th className="px-6 py-4 font-semibold">Assignments</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <AnimatePresence>
                                        {filteredAdmins.map((admin, index) => (
                                            <motion.tr
                                                key={admin._id || admin.id}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                layout
                                                className="hover:bg-orange-50/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm border border-white ${admin.isSuperAdmin
                                                            ? 'bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600'
                                                            : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
                                                            }`}>
                                                            {admin.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{admin.name}</p>
                                                            <p className="text-sm text-slate-500 font-medium">{admin.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {admin.isSuperAdmin ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                                            Super Admin
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${admin.role === 'gatekeeper'
                                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                            : 'bg-blue-100 text-blue-700 border-blue-200'
                                                            }`}>
                                                            {admin.role === 'gatekeeper' ? 'Gatekeeper' : 'Temple Admin'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {admin.isSuperAdmin ? (
                                                        <span className="text-slate-400 text-sm font-medium italic flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                                            Full System Access
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {admin.assignedTemples && admin.assignedTemples.length > 0 ? (
                                                                admin.assignedTemples.map((t: any, i: number) => {
                                                                    const tid = typeof t === 'object' ? t._id : t;
                                                                    const tname = typeof t === 'object' ? t.name : temples.find(tm => tm._id === tid)?.name || 'Temple';
                                                                    return (
                                                                        <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-sm">
                                                                            {tname}
                                                                        </span>
                                                                    );
                                                                })
                                                            ) : (
                                                                <span className="text-amber-500/80 text-sm font-medium flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
                                                                    ⚠️ Unassigned
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => { setSelectedUser(admin); setShowAssignModal(true); }}
                                                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-transparent hover:border-orange-100"
                                                            title="Assign Temples"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                                                            </svg>
                                                        </motion.button>

                                                        {!admin.isSuperAdmin && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleDeleteUser(admin._id || admin.id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                                title="Delete User"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Modals */}
            <CreateAdminModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateUser}
                formData={formData}
                setFormData={setFormData}
            />

            <AssignTemplesModal
                isOpen={showAssignModal}
                onClose={() => { setShowAssignModal(false); setSelectedUser(null); }}
                onSave={handleUpdateTemples}
                user={selectedUser}
                temples={temples}
            />
        </AdminLayout>
    );
}

// Sub-components
function CreateAdminModal({ isOpen, onClose, onSubmit, formData, setFormData }: CreateAdminModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Create Administrator</h3>
                <p className="text-slate-500 mb-8">Grant access to the temple management system.</p>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                            placeholder="e.g. Sarah Connor"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                            placeholder="admin@temple.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <input
                            type="checkbox"
                            id="superAdmin"
                            checked={formData.isSuperAdmin}
                            onChange={e => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                            <label htmlFor="superAdmin" className="text-slate-900 font-medium cursor-pointer block">
                                Super Admin Privileges
                            </label>
                            <p className="text-xs text-slate-500">Full access to system settings and user management</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all">
                            Create Account
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function AssignTemplesModal({ isOpen, onClose, onSave, user, temples }: AssignTemplesModalProps) {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600" />
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Assign Temples</h3>
                <p className="text-slate-500 mb-6">Manage access for <span className="text-orange-600 font-medium">{user.name}</span></p>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 mb-6">
                    {temples.map((temple: any) => {
                        const isAssigned = user.assignedTemples?.some((t: any) =>
                            (typeof t === 'string' ? t : t._id) === temple._id
                        );

                        return (
                            <label key={temple._id} className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all group">
                                <input
                                    type="checkbox"
                                    defaultChecked={isAssigned}
                                    data-temple-id={temple._id}
                                    className="temple-checkbox w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                />
                                <div className="flex-1">
                                    <h4 className="text-slate-900 font-medium group-hover:text-orange-600 transition-colors">{temple.name}</h4>
                                    <p className="text-xs text-slate-500">{temple.location?.city || temple.location}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>

                <div className="flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const checkboxes = document.querySelectorAll('.temple-checkbox:checked');
                            const templeIds = Array.from(checkboxes).map((cb) => (cb as HTMLInputElement).dataset.templeId as string);
                            onSave(templeIds);
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function AdminUsersPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsersContent />
        </ProtectedRoute>
    );
}
