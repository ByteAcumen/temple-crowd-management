'use client';

// Temple Smart E-Pass — Admin Users & Roles Management
// Premium redesign: stat bar, animated table, create modal, assign temples modal, delete

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi, templesApi, Temple, User } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import {
    Users, Crown, Building2, Search, Plus, AlertCircle, CheckCircle2,
    X, Shield, Key, Mail, User as UserIcon, Lock, Loader2,
    RefreshCw, Trash2, ChevronDown, Eye, EyeOff,
} from 'lucide-react';

/* ─── role config ─── */
const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    super_admin: { label: 'Super Admin', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    admin: { label: 'Temple Admin', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    gatekeeper: { label: 'Gatekeeper', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};
const getRoleCfg = (u: User) =>
    u.isSuperAdmin ? ROLE_CONFIG['super_admin'] : ROLE_CONFIG[u.role] || ROLE_CONFIG['admin'];

/* ─── avatar colour pool ─── */
const AVATAR_COLORS = [
    'from-indigo-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-pink-400 to-rose-500',
    'from-purple-400 to-violet-500',
    'from-cyan-400 to-sky-500',
];
const avatarGradient = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ══════════════════════════ MAIN COMPONENT ══════════════════════════ */
function AdminUsersContent() {
    const { user, isLoading } = useAuth();

    const [admins, setAdmins] = useState<User[]>([]);
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [showCreate, setShowCreate] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    /* ─ form state ─ */
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'admin', isSuperAdmin: false,
    });
    const [formLoading, setFormLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    /* ─── fetch ─── */
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [tRes, uRes] = await Promise.all([
                templesApi.getAll(),
                adminApi.getUsers(),
            ]);
            if (tRes.success) setTemples(tRes.data || []);
            if (uRes.success && uRes.data) {
                setAdmins(uRes.data.filter((u: User) => u.role === 'admin' || u.role === 'gatekeeper'));
            }
            setLastUpdated(new Date());
        } catch (e: any) {
            setError(e.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (!isLoading && user) fetchData(); }, [user, isLoading, fetchData]);

    /* auto-clear toasts */
    useEffect(() => {
        if (!success && !error) return;
        const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
        return () => clearTimeout(t);
    }, [success, error]);

    /* ─── computed ─── */
    const filtered = admins.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
    );
    const superAdminCount = admins.filter(a => a.isSuperAdmin).length;
    const adminCount = admins.filter(a => a.role === 'admin' && !a.isSuperAdmin).length;
    const gatekeeperCount = admins.filter(a => a.role === 'gatekeeper').length;

    /* ─── handlers ─── */
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const res = await adminApi.createUser(form);
            if (res.success) {
                setAdmins(p => [res.data, ...p]);
                setSuccess(`${res.data.name} created successfully`);
                setShowCreate(false);
                setForm({ name: '', email: '', password: '', role: 'admin', isSuperAdmin: false });
            }
        } catch (e: any) { setError(e.message || 'Failed to create user'); }
        finally { setFormLoading(false); }
    };

    const handleAssign = async (templeIds: string[]) => {
        if (!selectedUser) return;
        try {
            const uid = selectedUser._id || selectedUser.id;
            const res = await adminApi.updateUserTemples(uid, { assignedTemples: templeIds });
            if (res.success) {
                setAdmins(p => p.map(a => (a._id || a.id) === uid ? res.data : a));
                setSuccess('Temple assignments saved');
                setShowAssign(false);
                setSelectedUser(null);
            }
        } catch (e: any) { setError(e.message || 'Failed to update assignments'); }
    };

    const handleDelete = async (u: User) => {
        const uid = u._id || u.id;
        if (!confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
        setDeletingId(uid);
        try {
            const res = await adminApi.deleteUser(uid);
            if (res.success) {
                setAdmins(p => p.filter(a => (a._id || a.id) !== uid));
                setSuccess(`${u.name} deleted`);
            }
        } catch (e: any) { setError(e.message || 'Failed to delete user'); }
        finally { setDeletingId(null); }
    };

    /* ══════════ ACCESS GUARD ══════════ */
    if (isLoading) {
        return (
            <AdminLayout title="Users & Roles" subtitle="Loading…">
                <div className="grid sm:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
                <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
            </AdminLayout>
        );
    }

    if (!user?.isSuperAdmin) {
        return (
            <AdminLayout title="Access Restricted" subtitle="Super Admin only">
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Super Admin Zone</h2>
                    <p className="text-slate-500 max-w-sm mb-8">
                        Only Super Admins can manage users and roles.
                    </p>
                    <Link href="/admin/dashboard"
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        Back to Dashboard
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    /* ══════════ RENDER ══════════ */
    return (
        <AdminLayout title="Users & Roles" subtitle="Manage staff accounts, roles & temple assignments">
            <div className="space-y-5">

                {/* ── Status bar ── */}
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className="text-sm font-black text-slate-700">
                            {loading ? 'Loading users…' : `${admins.length} staff member${admins.length !== 1 ? 's' : ''} managed`}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <span className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => fetchData(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── Toast ── */}
                <AnimatePresence>
                    {(success || error) && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-bold
                                        ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                            {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                            {error || success}
                            <button onClick={() => { setError(''); setSuccess(''); }} className="ml-auto opacity-60 hover:opacity-100">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── KPI row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Staff', value: admins.length, icon: <Users className="w-4.5 h-4.5" />, bg: 'bg-indigo-50', icon_bg: 'bg-indigo-100 text-indigo-600', val_color: 'text-indigo-700' },
                        { label: 'Super Admins', value: superAdminCount, icon: <Crown className="w-4.5 h-4.5" />, bg: 'bg-purple-50', icon_bg: 'bg-purple-100 text-purple-600', val_color: 'text-purple-700' },
                        { label: 'Temple Admins', value: adminCount, icon: <Shield className="w-4.5 h-4.5" />, bg: 'bg-blue-50', icon_bg: 'bg-blue-100 text-blue-600', val_color: 'text-blue-700' },
                        { label: 'Gatekeepers', value: gatekeeperCount, icon: <Key className="w-4.5 h-4.5" />, bg: 'bg-emerald-50', icon_bg: 'bg-emerald-100 text-emerald-600', val_color: 'text-emerald-700' },
                    ].map((c, i) => (
                        <motion.div key={c.label}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`${c.bg} rounded-2xl border border-white/80 shadow-sm p-4 flex items-center gap-3`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.icon_bg}`}>
                                {c.icon}
                            </div>
                            <div>
                                <p className={`text-2xl font-black tabular-nums ${c.val_color}`}>
                                    {loading ? '—' : c.value}
                                </p>
                                <p className="text-[11px] font-semibold text-slate-500">{c.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Search + Add ── */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search staff by name or email…"
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all" />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600
                                   text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 text-sm shrink-0">
                        <Plus className="w-4 h-4" /> Add New User
                    </motion.button>
                </motion.div>

                {/* ── Users Table ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* table header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Users className="w-4.5 h-4.5 text-indigo-500" /> System Users
                                {!loading && (
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black border border-indigo-100">
                                        {filtered.length}
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                Admins &amp; Gatekeepers · GET /api/v1/admin/users
                            </p>
                        </div>
                        {search && (
                            <span className="text-xs font-bold text-slate-400">
                                {filtered.length} of {admins.length} shown
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="divide-y divide-slate-50">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 bg-slate-100 rounded w-32" />
                                        <div className="h-3 bg-slate-100 rounded w-48" />
                                    </div>
                                    <div className="h-6 w-24 bg-slate-100 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center px-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Users className="w-7 h-7 text-slate-400" />
                            </div>
                            <h4 className="font-black text-slate-700 mb-1">{search ? 'No results' : 'No staff members yet'}</h4>
                            <p className="text-slate-400 text-sm">
                                {search ? `No users match "${search}"` : 'Add your first admin or gatekeeper with the button above.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Temple Assignments</th>
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence>
                                        {filtered.map((admin, i) => {
                                            const uid = admin._id || admin.id;
                                            const cfg = getRoleCfg(admin);
                                            const grad = avatarGradient(admin.name);
                                            const isDeleting = deletingId === uid;
                                            return (
                                                <motion.tr key={uid}
                                                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 8, height: 0 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    className="hover:bg-slate-50/80 transition-colors group">
                                                    {/* user */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center font-black text-white text-sm shrink-0`}>
                                                                {admin.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 text-sm">{admin.name}</p>
                                                                <p className="text-[11px] text-slate-400 font-medium">{admin.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* role */}
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${admin.isSuperAdmin ? 'animate-pulse' : ''}`} />
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                    {/* assignments */}
                                                    <td className="px-6 py-4">
                                                        {admin.isSuperAdmin ? (
                                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                                                <Shield className="w-3.5 h-3.5" /> Full system access
                                                            </span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1">
                                                                {admin.assignedTemples && admin.assignedTemples.length > 0 ? (
                                                                    admin.assignedTemples.slice(0, 3).map((t: any, idx) => {
                                                                        const name = typeof t === 'object'
                                                                            ? t.name
                                                                            : temples.find(tm => tm._id === t)?.name || 'Temple';
                                                                        return (
                                                                            <span key={idx}
                                                                                className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold">
                                                                                {name}
                                                                            </span>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[10px] font-bold">
                                                                        <AlertCircle className="w-3 h-3" /> Unassigned
                                                                    </span>
                                                                )}
                                                                {admin.assignedTemples && admin.assignedTemples.length > 3 && (
                                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[10px] font-bold">
                                                                        +{admin.assignedTemples.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    {/* actions */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!admin.isSuperAdmin && (
                                                                <motion.button whileTap={{ scale: 0.9 }}
                                                                    onClick={() => { setSelectedUser(admin); setShowAssign(true); }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-black transition-colors">
                                                                    <Building2 className="w-3 h-3" /> Assign
                                                                </motion.button>
                                                            )}
                                                            {!admin.isSuperAdmin && (
                                                                <motion.button whileTap={{ scale: 0.9 }}
                                                                    onClick={() => handleDelete(admin)}
                                                                    disabled={isDeleting}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-[11px] font-black transition-colors disabled:opacity-50">
                                                                    {isDeleting
                                                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                        : <Trash2 className="w-3 h-3" />}
                                                                    Delete
                                                                </motion.button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                {/* ── Temples quick reference ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Building2 className="w-4.5 h-4.5 text-teal-500" /> Temples Reference
                                <span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-lg text-xs font-black border border-teal-100">
                                    {temples.length}
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">All manageable locations</p>
                        </div>
                    </div>
                    <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {temples.length === 0 && !loading && (
                            <p className="text-slate-400 text-sm col-span-full px-2">No temples configured yet.</p>
                        )}
                        {temples.map((t, i) => (
                            <motion.div key={t._id}
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-black shrink-0">
                                    {t.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-700 text-[11px] truncate">{t.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        {typeof t.location === 'object'
                                            ? `${(t.location as any).city}, ${(t.location as any).state}`
                                            : String(t.location || '')}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ══ Modals via Portal ══ */}
            <CreateUserModal
                isOpen={showCreate}
                form={form}
                setForm={setForm}
                loading={formLoading}
                showPw={showPw}
                setShowPw={setShowPw}
                onClose={() => setShowCreate(false)}
                onSubmit={handleCreate}
            />
            <AssignTemplesModal
                isOpen={showAssign}
                user={selectedUser}
                temples={temples}
                onClose={() => { setShowAssign(false); setSelectedUser(null); }}
                onSave={handleAssign}
            />
        </AdminLayout>
    );
}

/* ══════════════════════ CREATE USER MODAL ══════════════════════ */
interface CreateModalProps {
    isOpen: boolean; form: any; setForm: any; loading: boolean;
    showPw: boolean; setShowPw: (v: boolean) => void;
    onClose: () => void; onSubmit: (e: React.FormEvent) => void;
}
function CreateUserModal({ isOpen, form, setForm, loading, showPw, setShowPw, onClose, onSubmit }: CreateModalProps) {
    if (typeof window === 'undefined') return null;
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* backdrop */}
                    <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    {/* panel */}
                    <motion.div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden z-10"
                        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }} onClick={e => e.stopPropagation()}>
                        {/* accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-blue-600" />
                        <div className="p-7">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl">Create Staff Account</h3>
                                    <p className="text-slate-400 text-sm mt-0.5">Grant access to the temple admin system</p>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" required value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="e.g. Rajan Kumar"
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all" />
                                    </div>
                                </div>
                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="email" required value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="admin@temple.in"
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all" />
                                    </div>
                                </div>
                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type={showPw ? 'text' : 'password'} required minLength={8}
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            placeholder="Min. 8 characters"
                                            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all" />
                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {/* Role */}
                                <div>
                                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Role</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['admin', 'gatekeeper'] as const).map(r => (
                                            <label key={r}
                                                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${form.role === r ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                                <input type="radio" name="role" value={r}
                                                    checked={form.role === r}
                                                    onChange={() => setForm({ ...form, role: r })}
                                                    className="sr-only" />
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.role === r ? 'border-indigo-500' : 'border-slate-300'}`}>
                                                    {form.role === r && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                </div>
                                                <span className="text-sm font-bold capitalize">{r === 'admin' ? 'Temple Admin' : 'Gatekeeper'}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Super Admin */}
                                <label className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer">
                                    <input type="checkbox" checked={form.isSuperAdmin}
                                        onChange={e => setForm({ ...form, isSuperAdmin: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400" />
                                    <div>
                                        <p className="text-sm font-bold text-purple-800">Super Admin Privileges</p>
                                        <p className="text-[11px] text-purple-600">Full system access including user management</p>
                                    </div>
                                </label>
                                {/* actions */}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={onClose}
                                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                        Cancel
                                    </button>
                                    <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Create Account
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

/* ══════════════════════ ASSIGN TEMPLES MODAL ══════════════════════ */
interface AssignModalProps {
    isOpen: boolean; user: User | null; temples: Temple[];
    onClose: () => void; onSave: (ids: string[]) => void;
}
function AssignTemplesModal({ isOpen, user, temples, onClose, onSave }: AssignModalProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            const ids = (user.assignedTemples || []).map((t: any) =>
                typeof t === 'object' ? t._id : t
            );
            setSelected(new Set(ids));
        }
    }, [user, isOpen]);

    const toggle = (id: string) => setSelected(p => {
        const n = new Set(p);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
    });

    const handleSave = async () => {
        setSaving(true);
        await onSave(Array.from(selected));
        setSaving(false);
    };

    if (typeof window === 'undefined') return null;
    return createPortal(
        <AnimatePresence>
            {isOpen && user && (
                <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
                    <motion.div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
                        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }} onClick={e => e.stopPropagation()}>
                        <div className="h-1 w-full bg-gradient-to-r from-teal-400 to-emerald-500 shrink-0" />
                        <div className="p-6 border-b border-slate-100 shrink-0">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(user.name)} flex items-center justify-center font-black text-white`}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800">Assign Temples</h3>
                                        <p className="text-sm text-slate-400">{user.name} · {user.email}</p>
                                    </div>
                                </div>
                                <button onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-400">{selected.size} of {temples.length} selected</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
                                        animate={{ width: `${temples.length > 0 ? (selected.size / temples.length) * 100 : 0}%` }}
                                        transition={{ duration: 0.3 }} />
                                </div>
                            </div>
                        </div>
                        {/* scrollable list */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                            {temples.map(t => {
                                const isOn = selected.has(t._id);
                                return (
                                    <motion.label key={t._id} whileHover={{ x: 2 }}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all
                                                   ${isOn ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                                        <input type="checkbox" checked={isOn}
                                            onChange={() => toggle(t._id)}
                                            className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-400" />
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${isOn ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {t.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-bold text-sm truncate ${isOn ? 'text-teal-800' : 'text-slate-700'}`}>{t.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {typeof t.location === 'object'
                                                    ? `${(t.location as any).city}, ${(t.location as any).state}`
                                                    : String(t.location || '')}
                                            </p>
                                        </div>
                                        {isOn && <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />}
                                    </motion.label>
                                );
                            })}
                        </div>
                        {/* footer */}
                        <div className="p-4 border-t border-slate-100 shrink-0 flex gap-3">
                            <button onClick={onClose}
                                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                Cancel
                            </button>
                            <motion.button onClick={handleSave} disabled={saving} whileTap={{ scale: 0.97 }}
                                className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl shadow-md shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Save Changes
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

/* ══════════════════════ PAGE EXPORT ══════════════════════ */
export default function AdminUsersPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsersContent />
        </ProtectedRoute>
    );
}
