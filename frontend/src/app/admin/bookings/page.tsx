'use client';

import { ProtectedRoute } from '@/lib/protected-route';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { adminApi, templesApi, bookingsApi, Booking, Temple } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import {
    Calendar, CheckCircle2, Clock, Search, Filter, X,
    RefreshCw, AlertCircle, FileText, Users, Ticket,
    ChevronDown, Trash2, Eye, TrendingUp, TrendingDown,
    ScanLine, Ban, MoreVertical, ArrowUpRight,
} from 'lucide-react';

/* ─────────────── helpers ─────────────── */
function getName(b: Booking) {
    return b.userName || (typeof b.user === 'object' && b.user ? (b.user as any).name : null) || '—';
}
function getTemple(b: Booking) {
    return b.templeName || (typeof b.temple === 'object' && b.temple ? (b.temple as any).name : null) || 'Unknown';
}
function getSlot(b: Booking) { return b.slot || b.timeSlot || '—'; }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function today() { return new Date().toISOString().split('T')[0]; }

/* ─────────────── status config ─────────────── */
const STATUS: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
    CONFIRMED: { label: 'Confirmed', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    PENDING: { label: 'Pending', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    USED: { label: 'Scanned', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    COMPLETED: { label: 'Completed', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    CANCELLED: { label: 'Cancelled', dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    EXPIRED: { label: 'Expired', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

/* ─────────────── Skeleton ─────────────── */
function SkeletonRow() {
    return (
        <tr className="border-b border-slate-100">
            {[140, 120, 160, 70, 90, 90, 80].map((w, i) => (
                <td key={i} className="px-5 py-4">
                    <div className={`h-3.5 bg-slate-100 rounded-full animate-pulse`} style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

/* ─────────────── Confirm Dialog ─────────────── */
function CancelDialog({ booking, onConfirm, onClose, loading }: {
    booking: Booking; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full z-10"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Ban className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-[18px] font-black text-slate-800 text-center mb-2">Cancel Booking?</h3>
                <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-1.5 border border-slate-100">
                    <Row label="Pass" val={`#${(booking.passId || booking._id).slice(-6).toUpperCase()}`} mono />
                    <Row label="Devotee" val={getName(booking)} />
                    <Row label="Temple" val={getTemple(booking)} />
                    <Row label="Date" val={fmtDate(booking.date)} />
                </div>
                <p className="text-xs text-slate-500 text-center mb-5">The devotee will be notified. This action cannot be undone.</p>
                <div className="flex gap-2">
                    <button onClick={onClose} disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">
                        Keep Booking
                    </button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={onConfirm} disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                        {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Cancelling…</> : 'Yes, Cancel'}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
function Row({ label, val, mono }: { label: string; val: string; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">{label}</span>
            <span className={`font-bold text-slate-700 ${mono ? 'font-mono text-orange-600' : ''}`}>{val}</span>
        </div>
    );
}

/* ─────────────── Booking detail drawer ─────────────── */
function BookingDrawer({ booking, onClose, onCancel }: {
    booking: Booking; onClose: () => void; onCancel: () => void;
}) {
    const st = STATUS[booking.status] ?? STATUS.EXPIRED;
    const canCancel = ['CONFIRMED', 'PENDING'].includes(booking.status);
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                        </span>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="font-mono text-2xl font-black text-orange-600">
                        #{(booking.passId || booking._id).slice(-6).toUpperCase()}
                    </p>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">E-Pass · {fmtDate(booking.date)}</p>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Devotee */}
                    <Section title="Devotee Information">
                        <DetailRow icon="👤" label="Name" val={getName(booking)} />
                        <DetailRow icon="📧" label="Email" val={booking.userEmail || '—'} />
                        <DetailRow icon="👥" label="Visitors" val={`${booking.visitors} person${booking.visitors !== 1 ? 's' : ''}`} />
                    </Section>

                    {/* Visit */}
                    <Section title="Visit Details">
                        <DetailRow icon="🛕" label="Temple" val={getTemple(booking)} />
                        <DetailRow icon="🕐" label="Slot" val={getSlot(booking)} />
                        <DetailRow icon="📅" label="Date" val={fmtDate(booking.date)} />
                        {booking.entryTime && <DetailRow icon="➡️" label="Entry" val={new Date(booking.entryTime).toLocaleTimeString()} />}
                        {booking.exitTime && <DetailRow icon="⬅️" label="Exit" val={new Date(booking.exitTime).toLocaleTimeString()} />}
                    </Section>

                    {/* Visitor details */}
                    {booking.visitorDetails && booking.visitorDetails.length > 0 && (
                        <Section title={`Visitor Details (${booking.visitorDetails.length})`}>
                            {booking.visitorDetails.map((v, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm font-black text-orange-600">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{v.name}</p>
                                        <p className="text-xs text-slate-400">Age {v.age}{v.idType && ` · ${v.idType}`}</p>
                                    </div>
                                </div>
                            ))}
                        </Section>
                    )}

                    {/* Timestamps */}
                    <Section title="Booking Timeline">
                        {booking.createdAt && <DetailRow icon="🕐" label="Booked at" val={new Date(booking.createdAt).toLocaleString('en-IN')} />}
                    </Section>
                </div>

                {/* Footer */}
                {canCancel && (
                    <div className="p-6 border-t border-slate-100 shrink-0">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { onCancel(); onClose(); }}
                            className="w-full py-3 rounded-2xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all text-sm flex items-center justify-center gap-2">
                            <Ban className="w-4 h-4" />Cancel This Booking
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </>
    );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">{title}</p>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                {children}
            </div>
        </div>
    );
}
function DetailRow({ icon, label, val }: { icon: string; label: string; val: string }) {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5 text-slate-500">
                <span>{icon}</span><span className="text-xs font-semibold">{label}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 max-w-[55%] text-right truncate">{val}</span>
        </div>
    );
}

/* ─────────────── Toast ─────────────── */
function Toast({ msg, ok, onDone }: { msg: string; ok: boolean; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
    return (
        <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-4 right-4 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm
                        ${ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
            {ok ? '✅' : '❌'} {msg}
        </motion.div>
    );
}

/* ─────────────── Main Page ─────────────── */
function AdminBookingsContent() {
    const { user, isLoading: authLoading } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [apiErr, setApiErr] = useState<string | null>(null);
    const [lastUpd, setLastUpd] = useState<Date | null>(null);

    // filters
    const [search, setSearch] = useState('');
    const [temple, setTempleF] = useState('all');
    const [status, setStatusF] = useState('all');
    const [dateFrom, setFrom] = useState('');
    const [dateTo, setTo] = useState('');

    // sort
    const [sortBy, setSortBy] = useState<'date' | 'created'>('date');
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

    // actions
    const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [viewBooking, setViewBooking] = useState<Booking | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [mounted, setMounted] = useState(false);
    const showToast = (msg: string, ok = true) => setToast({ msg, ok });

    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

    /* ── Fetch ── */
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setApiErr(null);
        try {
            const [bRes, tRes] = await Promise.all([adminApi.getBookings(), templesApi.getAll()]);
            if (bRes.success) { setBookings(bRes.data || []); setLastUpd(new Date()); }
            if (tRes.success) setTemples(tRes.data || []);
        } catch (e: any) {
            setApiErr(e.message || 'Backend unreachable');
            setBookings([]); setTemples([]);
        } finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { if (user && !authLoading) fetchData(); }, [user, authLoading, fetchData]);

    /* ── Stats ── */
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
    const todayUsed = bookings.filter(b => b.status === 'USED' && (b.date || '').split('T')[0] === today()).length;
    const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;
    const totalVisitors = bookings.reduce((s, b) => s + (b.visitors || 0), 0);

    /* ── Filter ── */
    const filtered = bookings
        .filter(b => {
            const q = search.toLowerCase();
            const tId = typeof b.temple === 'object' ? (b.temple as any)?._id : b.temple;
            const hit = !q || (b.passId || '').toLowerCase().includes(q)
                || getName(b).toLowerCase().includes(q)
                || getTemple(b).toLowerCase().includes(q)
                || (b.userEmail || '').toLowerCase().includes(q);
            const matchT = temple === 'all' || tId === temple;
            const matchS = status === 'all' || b.status === status;
            const bDate = (b.date || '').split('T')[0];
            const matchD = (!dateFrom || bDate >= dateFrom) && (!dateTo || bDate <= dateTo);
            return hit && matchT && matchS && matchD;
        })
        .sort((a, b) => {
            const aV = sortBy === 'date' ? a.date : (a.createdAt || a.date);
            const bV = sortBy === 'date' ? b.date : (b.createdAt || b.date);
            return sortDir === 'desc' ? bV.localeCompare(aV) : aV.localeCompare(bV);
        });

    /* ── Cancel ── */
    const doCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await bookingsApi.cancel(cancelTarget._id);
            setBookings(p => p.map(b => b._id === cancelTarget._id ? { ...b, status: 'CANCELLED' as const } : b));
            showToast(`Booking #${cancelTarget.passId?.slice(-6).toUpperCase() || cancelTarget._id.slice(-6).toUpperCase()} cancelled`);
        } catch (e: any) {
            showToast(e.message || 'Cancel failed', false);
        } finally { setCancelling(false); setCancelTarget(null); }
    };

    /* ── CSV ── */
    const exportCSV = () => {
        const headers = ['Pass ID', 'Devotee', 'Email', 'Temple', 'Slot', 'Visitors', 'Status', 'Date'];
        const rows = filtered.map(b => [
            b.passId || b._id, getName(b), b.userEmail || '', getTemple(b),
            getSlot(b), String(b.visitors), b.status, fmtDate(b.date)
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `bookings-${today()}.csv`;
        a.click();
    };

    /* ── Sort toggle ── */
    const toggleSort = (col: typeof sortBy) => {
        if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortBy(col); setSortDir('desc'); }
    };

    const clearFilters = () => { setSearch(''); setTempleF('all'); setStatusF('all'); setFrom(''); setTo(''); };
    const hasFilters = search || temple !== 'all' || status !== 'all' || dateFrom || dateTo;

    /* ── Render ── */
    return (
        <AdminLayout title="Booking Management" subtitle="Monitor and manage devotee reservations">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/20">
                <AnimatePresence>
                    {toast && <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}
                </AnimatePresence>

                <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-6 space-y-5">

                    {/* ── Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Ticket className="w-4.5 h-4.5 text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bookings</h1>
                            </div>
                            <p className="text-xs text-slate-400 font-medium pl-12 mt-0.5">
                                {total} total · {confirmed} active
                                {lastUpd && <> · Updated {lastUpd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</>}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => fetchData(true)} disabled={loading || refreshing}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:border-slate-300 shadow-sm">
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={exportCSV} disabled={filtered.length === 0}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-emerald-700 font-bold text-sm hover:border-emerald-300 hover:bg-emerald-50 shadow-sm transition-all disabled:opacity-40">
                                <FileText className="w-4 h-4" />Export CSV
                            </motion.button>
                        </div>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Bookings', value: total, sub: `${totalVisitors.toLocaleString()} visitors`, icon: <Calendar className="w-4.5 h-4.5 text-blue-600" />, ring: 'bg-blue-50', delay: 0 },
                            { label: 'Active Passes', value: confirmed, sub: 'Confirmed now', icon: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />, ring: 'bg-emerald-50', delay: 0.04 },
                            { label: "Scanned Today", value: todayUsed, sub: 'Real-time entries', icon: <ScanLine className="w-4.5 h-4.5 text-purple-600" />, ring: 'bg-purple-50', delay: 0.08 },
                            { label: 'Cancelled', value: cancelled, sub: `${Math.round(cancelled / Math.max(1, total) * 100)}% rate`, icon: <Ban className="w-4.5 h-4.5 text-red-500" />, ring: 'bg-red-50', delay: 0.12 },
                        ].map(s => (
                            <motion.div key={s.label}
                                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: s.delay, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                                        <p className="text-2xl font-black text-slate-800 tabular-nums">{s.value.toLocaleString()}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{s.sub}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.ring}`}>{s.icon}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Filter Bar ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search pass ID, name, email, temple…"
                                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
                                               outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-400
                                               placeholder:text-slate-300 text-slate-700 font-medium transition-all"
                                />
                                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                            </div>

                            {/* Temple select */}
                            <div className="relative">
                                <select value={temple} onChange={e => setTempleF(e.target.value)}
                                    className="appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700
                                               font-bold outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-400 transition-all cursor-pointer min-w-[140px]"
                                >
                                    <option value="all">All Temples</option>
                                    {temples.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Status pills */}
                            <div className="flex items-center gap-1 flex-wrap">
                                {['all', 'CONFIRMED', 'PENDING', 'USED', 'CANCELLED', 'EXPIRED'].map(s => {
                                    const cfg = s === 'all' ? null : STATUS[s];
                                    return (
                                        <button key={s} onClick={() => setStatusF(s)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                                                       ${status === s
                                                    ? 'bg-blue-500 text-white shadow-sm shadow-blue-200'
                                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                                        >
                                            {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                                            {s === 'all' ? 'All' : cfg?.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date range */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400">Date:</span>
                            <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700
                                           outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-400 transition-all" />
                            <span className="text-slate-300 font-bold text-sm">→</span>
                            <input type="date" value={dateTo} onChange={e => setTo(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700
                                           outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-400 transition-all" />
                            {hasFilters && (
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={clearFilters}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold hover:bg-orange-100 transition-all">
                                    <X className="w-3 h-3" />Clear All
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* ── Result count ── */}
                    <div className="flex items-center justify-between px-0.5">
                        <p className="text-xs text-slate-400 font-medium">
                            Showing <span className="font-black text-slate-600">{filtered.length}</span> of {total} bookings
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            Sort by:
                            <button onClick={() => toggleSort('date')}
                                className={`font-bold transition-colors flex items-center gap-0.5 ${sortBy === 'date' ? 'text-blue-600' : 'hover:text-slate-600'}`}>
                                Visit Date {sortBy === 'date' && (sortDir === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />)}
                            </button>
                            <button onClick={() => toggleSort('created')}
                                className={`font-bold transition-colors flex items-center gap-0.5 ${sortBy === 'created' ? 'text-blue-600' : 'hover:text-slate-600'}`}>
                                Created {sortBy === 'created' && (sortDir === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />)}
                            </button>
                        </div>
                    </div>

                    {/* ── Table ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Error banner */}
                        {apiErr && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex items-center gap-3 px-5 py-3 bg-red-50 border-b border-red-100">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <span className="text-sm font-medium text-red-700">{apiErr}</span>
                                <button onClick={() => fetchData()}
                                    className="ml-auto text-xs font-bold text-red-600 hover:text-red-800 underline">Retry</button>
                            </motion.div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100 bg-slate-50/60">
                                        <th className="px-5 py-3.5">Pass ID</th>
                                        <th className="px-5 py-3.5">Devotee</th>
                                        <th className="px-5 py-3.5">Temple & Slot</th>
                                        <th className="px-5 py-3.5">Visitors</th>
                                        <th className="px-5 py-3.5">Status</th>
                                        <th className="px-5 py-3.5 cursor-pointer select-none" onClick={() => toggleSort('date')}>
                                            <span className="flex items-center gap-1">
                                                Visit Date
                                                {sortBy === 'date' ? (sortDir === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />) : null}
                                            </span>
                                        </th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        Array(7).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center">
                                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                                    <div className="text-5xl mb-4">📋</div>
                                                    <p className="font-black text-slate-600 mb-1">
                                                        {hasFilters ? 'No Matches Found' : 'No Bookings Yet'}
                                                    </p>
                                                    <p className="text-sm text-slate-400 mb-4">
                                                        {hasFilters ? 'Try adjusting your filters.' : 'Bookings will appear here once devotees start reserving.'}
                                                    </p>
                                                    {hasFilters && (
                                                        <button onClick={clearFilters}
                                                            className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-sm">
                                                            Clear Filters
                                                        </button>
                                                    )}
                                                </motion.div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((b, i) => {
                                            const st = STATUS[b.status] ?? STATUS.EXPIRED;
                                            const canCancel = ['CONFIRMED', 'PENDING'].includes(b.status);
                                            return (
                                                <motion.tr key={b._id}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: Math.min(i * 0.025, 0.3) }}
                                                    className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                                                    onClick={() => setViewBooking(b)}
                                                >
                                                    {/* Pass ID */}
                                                    <td className="px-5 py-4">
                                                        <span className="font-mono text-orange-600 font-black text-sm bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                                                            #{(b.passId || b._id).slice(-6).toUpperCase()}
                                                        </span>
                                                    </td>

                                                    {/* Devotee */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                                                                {(getName(b) || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[13px] font-bold text-slate-800 truncate max-w-[130px]">{getName(b)}</p>
                                                                <p className="text-[11px] text-slate-400 truncate max-w-[130px]">{b.userEmail || ''}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Temple */}
                                                    <td className="px-5 py-4">
                                                        <p className="text-[13px] font-bold text-slate-800 truncate max-w-[160px]">{getTemple(b)}</p>
                                                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3" />{getSlot(b)}
                                                        </p>
                                                    </td>

                                                    {/* Visitors */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-600">
                                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                                            {b.visitors}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black border
                                                                         ${st.bg} ${st.text} ${st.border}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${b.status === 'CONFIRMED' ? 'animate-pulse' : ''}`} />
                                                            {st.label}
                                                        </span>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-5 py-4 text-[13px] font-medium text-slate-500 whitespace-nowrap">
                                                        {fmtDate(b.date)}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                                onClick={() => setViewBooking(b)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-all"
                                                                title="View details"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </motion.button>
                                                            {canCancel && (
                                                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                                    onClick={() => setCancelTarget(b)}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all border border-red-100"
                                                                    title="Cancel booking"
                                                                >
                                                                    <Ban className="w-3.5 h-3.5" />
                                                                </motion.button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table footer */}
                        {!loading && filtered.length > 0 && (
                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                                <p className="text-xs text-slate-400 font-medium">
                                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                                </p>
                                <button onClick={exportCSV}
                                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                    <ArrowUpRight className="w-3 h-3" />Export {filtered.length} records
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Portal Modals — mounted directly on document.body above AdminLayout ── */}
            {mounted && createPortal(
                <AnimatePresence>
                    {cancelTarget && (
                        <CancelDialog
                            booking={cancelTarget}
                            onConfirm={doCancel}
                            onClose={() => setCancelTarget(null)}
                            loading={cancelling}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}

            {mounted && createPortal(
                <AnimatePresence>
                    {viewBooking && (
                        <BookingDrawer
                            booking={viewBooking}
                            onClose={() => setViewBooking(null)}
                            onCancel={() => { setCancelTarget(viewBooking); setViewBooking(null); }}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </AdminLayout>
    );
}

export default function AdminBookingsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminBookingsContent />
        </ProtectedRoute>
    );
}
