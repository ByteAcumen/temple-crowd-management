'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { BackendStatusBar } from '@/components/admin/BackendStatusBar';
import TempleCard from '@/components/admin/temples/TempleCard';
import TempleFormModal from '@/components/admin/temples/TempleFormModal';
import { templesApi, adminApi, Temple } from '@/lib/api';
import {
    Plus, Search, Building2, Users, RefreshCw, X,
    Trash2, ToggleRight, SlidersHorizontal, Filter,
    CheckSquare, Square, AlertCircle
} from 'lucide-react';

// ─── Skeleton Card ─────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
            <div className="h-44 bg-slate-100" />
            <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                <div className="h-2 bg-slate-100 rounded-full" />
                <div className="h-2 bg-slate-100 rounded-full w-5/6" />
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, ring, delay = 0 }:
    { label: string; value: string | number; sub?: string; icon: React.ReactNode; ring: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                    <p className="text-2xl font-black text-slate-800 tabular-nums">{value}</p>
                    {sub && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ring}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onCancel, loading }:
    { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <motion.div
                initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full z-10 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                    className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5"
                >
                    <Trash2 className="w-8 h-8 text-red-500" />
                </motion.div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Delete Temple?</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    Permanently delete <span className="font-bold text-slate-700">"{name}"</span>?
                    All associated bookings will also be cancelled.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-100">
                        Cancel
                    </button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={onConfirm} disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                        {loading
                            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting...</>
                            : 'Yes, Delete'}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onDone }: { msg: string; ok: boolean; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold
                       ${ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
            <span className="text-base">{ok ? '✅' : '❌'}</span>
            {msg}
        </motion.div>
    );
}

// ─── Constants ─────────────────────────────────────────────────────────────
const STATUS_FILTERS = ['All', 'OPEN', 'CLOSED', 'MAINTENANCE'] as const;
type SFilter = typeof STATUS_FILTERS[number];

const STATUS_DOT: Record<string, string> = {
    OPEN: 'bg-emerald-500', CLOSED: 'bg-red-500', MAINTENANCE: 'bg-amber-500'
};

// ─── Page ──────────────────────────────────────────────────────────────────
export default function TemplesPage() {
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [backendUp, setBackendUp] = useState(true);
    const [fetchErr, setFetchErr] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<SFilter>('All');

    // modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editTemple, setEditTemple] = useState<Temple | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);

    // delete
    const [delTarget, setDelTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // bulk
    const [bulkMode, setBulkMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // toast
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const showToast = (msg: string, ok = true) => setToast({ msg, ok });

    // ── Fetch ───────────────────────────────────────────────────────────────
    const fetchTemples = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setFetchErr(null);
        try {
            const res = await templesApi.getAll();
            setTemples(res.data || []);
            setBackendUp(true);
        } catch (e: any) {
            setFetchErr(e.message || 'Failed to load temples');
            setBackendUp(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchTemples(); }, [fetchTemples]);

    // ── Stats ───────────────────────────────────────────────────────────────
    const openCount = temples.filter(t => t.status === 'OPEN').length;
    const closedCount = temples.filter(t => t.status === 'CLOSED').length;
    const maintCount = temples.filter(t => t.status === 'MAINTENANCE').length;
    const totalLive = temples.reduce((s, t) => s + (t.live_count ?? (t as any).currentOccupancy ?? 0), 0);
    const totalCap = temples.reduce((s, t) => {
        const c = typeof t.capacity === 'number' ? t.capacity : (t.capacity?.total || 0);
        return s + c;
    }, 0);
    const globalPct = totalCap > 0 ? Math.round(totalLive / totalCap * 100) : 0;

    // ── Filtered ────────────────────────────────────────────────────────────
    const filtered = temples.filter(t => {
        const q = search.toLowerCase().trim();
        const loc = typeof t.location === 'object' ? `${t.location.city} ${t.location.state}` : t.location || '';
        const hit = !q || t.name.toLowerCase().includes(q)
            || loc.toLowerCase().includes(q)
            || (t.deity || '').toLowerCase().includes(q);
        const st = statusFilter === 'All' || t.status === statusFilter;
        return hit && st;
    });

    // ── Handlers ────────────────────────────────────────────────────────────
    const openCreate = () => { setEditTemple(null); setSaveErr(null); setModalOpen(true); };
    const openEdit = (t: Temple) => { setEditTemple(t); setSaveErr(null); setModalOpen(true); };
    const closeModal = () => { if (!isSaving) { setModalOpen(false); setEditTemple(null); } };

    const handleSave = async (data: Partial<Temple>) => {
        setSaveErr(null);
        setIsSaving(true);
        try {
            if (editTemple) {
                const res = await adminApi.updateTemple(editTemple._id, data);
                setTemples(p => p.map(t => t._id === editTemple._id ? res.data : t));
                showToast(`"${res.data.name}" updated`);
            } else {
                const res = await adminApi.createTemple(data);
                setTemples(p => [...p, res.data]);
                showToast(`"${res.data.name}" added`);
            }
            setModalOpen(false); setEditTemple(null);
        } catch (e: any) {
            setSaveErr(e.message || 'Save failed');
        } finally { setIsSaving(false); }
    };

    const handleDeleteConfirm = async () => {
        if (!delTarget) return;
        setIsDeleting(true);
        try {
            await adminApi.deleteTemple(delTarget.id);
            setTemples(p => p.filter(t => t._id !== delTarget.id));
            showToast(`"${delTarget.name}" deleted`);
        } catch (e: any) { showToast(e.message || 'Delete failed', false); }
        finally { setIsDeleting(false); setDelTarget(null); }
    };

    const handleStatusChange = (id: string, s: 'OPEN' | 'CLOSED' | 'MAINTENANCE') =>
        setTemples(p => p.map(t => t._id === id ? { ...t, status: s } : t));

    const toggleSelect = (id: string) =>
        setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const allSelected = selected.size === filtered.length && filtered.length > 0;
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map(t => t._id)));

    const bulkSetStatus = async (s: 'OPEN' | 'CLOSED' | 'MAINTENANCE') => {
        const ids = [...selected];
        for (const id of ids) {
            try { await adminApi.updateTemple(id, { status: s }); } catch (_) { }
        }
        setTemples(p => p.map(t => selected.has(t._id) ? { ...t, status: s } : t));
        showToast(`${ids.length} temples set to ${s}`);
        setSelected(new Set()); setBulkMode(false);
    };

    const bulkDelete = async () => {
        if (!window.confirm(`Delete ${selected.size} temples? This cannot be undone.`)) return;
        const ids = [...selected];
        for (const id of ids) {
            try { await adminApi.deleteTemple(id); } catch (_) { }
        }
        setTemples(p => p.filter(t => !selected.has(t._id)));
        showToast(`${ids.length} temples deleted`);
        setSelected(new Set()); setBulkMode(false);
    };

    return (
        <AdminLayout title="Temple Management" subtitle="Manage all registered temples">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">

                {/* Toasts */}
                <AnimatePresence>
                    {toast && <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}
                </AnimatePresence>

                {/* Backend error banner */}
                {!backendUp && (
                    <BackendStatusBar status="error" label="Backend offline" onRetry={() => fetchTemples()} />
                )}

                <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-6 space-y-6">

                    {/* ── Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-0.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200">
                                    <Building2 className="w-4.5 h-4.5 text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Temple Management</h1>
                            </div>
                            <p className="text-xs text-slate-400 font-medium pl-12">
                                {temples.length} temples · {openCount} open · {totalLive.toLocaleString('en-IN')} visitors live
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => fetchTemples(true)} disabled={loading || refreshing}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:border-slate-300 shadow-sm transition-all"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={openCreate}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500
                                           text-white font-bold rounded-xl shadow-md shadow-orange-200/70
                                           hover:shadow-orange-300/80 transition-all text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Temple
                            </motion.button>
                        </div>
                    </div>

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard label="Total Temples" value={temples.length}
                            sub={`${closedCount} closed, ${maintCount} maintenance`}
                            icon={<Building2 className="w-4.5 h-4.5 text-orange-600" />}
                            ring="bg-orange-50" delay={0} />
                        <StatCard label="Open Now" value={openCount}
                            sub={`${Math.round(openCount / Math.max(1, temples.length) * 100)}% of total`}
                            icon={<span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />}
                            ring="bg-emerald-50" delay={0.04} />
                        <StatCard label="Live Visitors" value={totalLive.toLocaleString('en-IN')}
                            sub={`${globalPct}% system capacity`}
                            icon={<Users className="w-4.5 h-4.5 text-blue-600" />}
                            ring="bg-blue-50" delay={0.08} />
                        <StatCard label="System Capacity" value={totalCap >= 1000 ? `${(totalCap / 1000).toFixed(0)}K` : totalCap}
                            sub="combined maximum"
                            icon={<Building2 className="w-4.5 h-4.5 text-purple-600" />}
                            ring="bg-purple-50" delay={0.12} />
                    </div>

                    {/* ── Filter Bar ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                <input
                                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name, city, deity…"
                                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                               outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400
                                               placeholder:text-slate-300 text-slate-700 font-medium transition-all"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                {STATUS_FILTERS.map(s => (
                                    <button key={s} onClick={() => setStatusFilter(s)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all
                                                   ${statusFilter === s
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                                    >
                                        {s !== 'All' && (
                                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s] ?? 'bg-slate-400'}`} />
                                        )}
                                        {s === 'All' ? `All (${temples.length})` : s}
                                    </button>
                                ))}
                            </div>

                            {/* Bulk toggle */}
                            <button onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()); }}
                                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border
                                           ${bulkMode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Bulk Edit
                            </button>
                        </div>

                        {/* Bulk Actions */}
                        <AnimatePresence>
                            {bulkMode && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-slate-100">
                                        <button onClick={toggleAll}
                                            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline">
                                            {allSelected ? <><CheckSquare className="w-3.5 h-3.5" />Deselect All</> : <><Square className="w-3.5 h-3.5" />Select All</>}
                                        </button>
                                        <span className="text-xs text-slate-400">{selected.size} / {filtered.length} selected</span>
                                        {selected.size > 0 && (
                                            <>
                                                <button onClick={() => bulkSetStatus('OPEN')}
                                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1">
                                                    <ToggleRight className="w-3.5 h-3.5" />Set Open
                                                </button>
                                                <button onClick={() => bulkSetStatus('CLOSED')}
                                                    className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center gap-1">
                                                    <ToggleRight className="w-3.5 h-3.5" />Set Closed
                                                </button>
                                                <button onClick={bulkDelete}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 flex items-center gap-1 ml-auto">
                                                    <Trash2 className="w-3.5 h-3.5" />Delete ({selected.size})
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Result count ── */}
                    <div className="flex items-center justify-between px-0.5">
                        <p className="text-xs text-slate-400 font-medium">
                            Showing <span className="font-bold text-slate-600">{filtered.length}</span> of {temples.length} temples
                            {statusFilter !== 'All' && <> · <span className="text-orange-500 font-bold">{statusFilter}</span></>}
                            {search && <> matching "<span className="text-orange-500 font-bold">{search}</span>"</>}
                        </p>
                        {(search || statusFilter !== 'All') && (
                            <button onClick={() => { setSearch(''); setStatusFilter('All'); }}
                                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-bold transition-colors">
                                <Filter className="w-3 h-3" /> Clear
                            </button>
                        )}
                    </div>

                    {/* ── Grid ── */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : fetchErr ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white rounded-2xl border border-red-100 p-14 text-center shadow-sm">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-slate-700 mb-1.5">Failed to Load</h3>
                            <p className="text-sm text-slate-400 mb-5">{fetchErr}</p>
                            <button onClick={() => fetchTemples()}
                                className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-200">
                                Retry
                            </button>
                        </motion.div>
                    ) : filtered.length === 0 ? (
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
                            <div className="text-6xl mb-4">🛕</div>
                            <h3 className="text-lg font-black text-slate-700 mb-1.5">
                                {search || statusFilter !== 'All' ? 'No Matches Found' : 'No Temples Yet'}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                {search || statusFilter !== 'All'
                                    ? 'Try adjusting your search terms or filters.'
                                    : 'Add your first temple to start managing crowds.'}
                            </p>
                            {search || statusFilter !== 'All'
                                ? <button onClick={() => { setSearch(''); setStatusFilter('All'); }}
                                    className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                    Clear Filters
                                </button>
                                : <button onClick={openCreate}
                                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-md shadow-orange-200">
                                    + Add First Temple
                                </button>
                            }
                        </motion.div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                            initial="hidden" animate="visible"
                        >
                            {filtered.map((temple, i) => (
                                <div key={temple._id} className="relative">
                                    {/* Selection checkbox overlay for bulk mode */}
                                    {bulkMode && (
                                        <motion.button
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            onClick={() => toggleSelect(temple._id)}
                                            className={`absolute top-3.5 left-3.5 z-30 w-6 h-6 rounded-lg shadow-lg flex items-center justify-center
                                                       transition-all border-2
                                                       ${selected.has(temple._id)
                                                    ? 'bg-orange-500 border-white shadow-orange-300'
                                                    : 'bg-white/90 border-slate-300 hover:border-orange-400'}`}
                                        >
                                            {selected.has(temple._id) && (
                                                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </motion.button>
                                    )}

                                    {/* Bulk selection highlight ring */}
                                    {bulkMode && selected.has(temple._id) && (
                                        <div className="absolute inset-0 rounded-2xl ring-2 ring-orange-400 ring-offset-2 pointer-events-none z-20" />
                                    )}

                                    <TempleCard
                                        temple={temple}
                                        index={i}
                                        onEdit={openEdit}
                                        onDelete={(id, name) => setDelTarget({ id, name })}
                                        onStatusChange={handleStatusChange}
                                    />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            <AnimatePresence>
                {modalOpen && (
                    <TempleFormModal
                        isOpen={modalOpen}
                        onClose={closeModal}
                        onSave={handleSave}
                        initialData={editTemple}
                        isSaving={isSaving}
                    />
                )}
                {delTarget && (
                    <DeleteDialog
                        name={delTarget.name}
                        onConfirm={handleDeleteConfirm}
                        onCancel={() => setDelTarget(null)}
                        loading={isDeleting}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
