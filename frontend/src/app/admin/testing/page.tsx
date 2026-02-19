'use client';

// Temple Smart E-Pass — Admin Backend Testing & Diagnostics
// Premium redesign: animated test runner, health grid, temples table, bot, sync

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
    templesApi, adminApi, liveApi, botApi, bookingsApi,
    Temple, SystemHealth, CrowdData, PredictionResponse,
} from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import {
    Play, Square, RefreshCw, CheckCircle2, XCircle, Loader2,
    Circle, ChevronDown, ChevronRight, Zap, Heart, Building2,
    Bot, RotateCcw, Activity, Clock, Database, Server,
    Cpu, Radio, Send,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

/* ─── types ─── */
interface TestResult {
    name: string; method: string; endpoint: string;
    status: 'pending' | 'running' | 'pass' | 'fail';
    ms?: number; statusCode?: number; response?: unknown; error?: string;
}

/* ─── test suite (built at runtime so we have real IDs) ─── */
const buildTests = (temples: Temple[]) => {
    const firstTempleId = temples[0]?._id || '';
    return [
        { name: 'Server Health', method: 'GET', endpoint: '/', run: () => fetch(API_BASE.replace('/api/v1', '')).then(r => r.json()) },
        { name: 'System Health', method: 'GET', endpoint: '/admin/health', run: () => adminApi.getSystemHealth() },
        { name: 'Temples List', method: 'GET', endpoint: '/temples', run: () => templesApi.getAll() },
        { name: 'Live Data', method: 'GET', endpoint: '/live', run: () => liveApi.getCrowdData() },
        { name: 'Dashboard Stats', method: 'GET', endpoint: '/admin/stats', run: () => adminApi.getStats() },
        { name: 'Analytics', method: 'GET', endpoint: '/admin/analytics', run: () => adminApi.getAnalytics({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }) },
        { name: 'Bookings', method: 'GET', endpoint: '/admin/bookings', run: () => adminApi.getBookings({ limit: 5 }) },
        { name: 'Users', method: 'GET', endpoint: '/admin/users', run: () => adminApi.getUsers() },
        { name: 'AI Bot', method: 'POST', endpoint: '/bot/query', run: () => botApi.query('Hello, are you working?') },
        { name: 'Availability', method: 'GET', endpoint: '/bookings/availability', run: () => bookingsApi.checkAvailability(firstTempleId, new Date().toISOString().split('T')[0], '06:00-08:00') },
    ];
};

/* ─── small helpers ─── */
const methodBadge = (m: string) => {
    const map: Record<string, string> = {
        GET: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        POST: 'bg-blue-50 text-blue-700 border-blue-200',
        DELETE: 'bg-red-50 text-red-700 border-red-200',
    };
    return map[m] || 'bg-slate-50 text-slate-600 border-slate-200';
};
const msBadge = (ms?: number) => {
    if (!ms) return '';
    if (ms < 200) return 'bg-emerald-50 text-emerald-700';
    if (ms < 500) return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-700';
};

function AdminTestingContent() {
    const { user } = useAuth();

    /* test runner */
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const abortRef = useRef(false);

    /* system data */
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [temples, setTemples] = useState<Temple[]>([]);
    const [liveData, setLiveData] = useState<{ temples: CrowdData[]; summary: any } | null>(null);
    const [predictions, setPredictions] = useState<Record<string, PredictionResponse | { error: string }>>({});
    const [loading, setLoading] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    /* bot */
    const [botQuery, setBotQuery] = useState('What is the crowd like tomorrow?');
    const [botResp, setBotResp] = useState<{ answer: string; source?: string } | null>(null);

    /* sync */
    const [syncResult, setSyncResult] = useState<any>(null);
    const [resetMsg, setResetMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

    /* ── initial fetch ── */
    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading('fetching');
        try {
            const [hRes, tRes, lRes] = await Promise.all([
                adminApi.getSystemHealth(),
                templesApi.getAll(),
                liveApi.getCrowdData(),
            ]);
            if (hRes.success) setHealth(hRes.data);
            if (tRes.success) setTemples(tRes.data || []);
            if (lRes.success) {
                const d = lRes.data;
                setLiveData(Array.isArray(d) ? { temples: d, summary: {} } : d);
            }
            setLastUpdated(new Date());
        } catch (e) { console.error(e); }
        finally { setLoading(null); }
    }, []);

    useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

    /* ── computed ── */
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const total = results.length;
    const avgMs = results.filter(r => r.ms).reduce((a, r) => a + (r.ms || 0), 0) / (passed + failed || 1);
    const totalMs = results.filter(r => r.ms).reduce((a, r) => a + (r.ms || 0), 0);
    const progress = total > 0 ? ((passed + failed) / total) * 100 : 0;

    const liveMap = (liveData?.temples || []).reduce((acc: Record<string, number>, t: CrowdData) => {
        if (t.temple_id) acc[t.temple_id] = t.live_count ?? 0;
        return acc;
    }, {});

    /* ── test runner ── */
    const runAllTests = async () => {
        const TESTS = buildTests(temples);   // use real temple IDs
        abortRef.current = false;
        setIsRunning(true);
        setExpandedIdx(null);
        setResults(TESTS.map(t => ({ name: t.name, method: t.method, endpoint: t.endpoint, status: 'pending' })));

        for (let i = 0; i < TESTS.length; i++) {
            if (abortRef.current) break;
            setResults(p => p.map((r, idx) => idx === i ? { ...r, status: 'running' } : r));
            const t0 = performance.now();
            try {
                const resp = await TESTS[i].run();
                const ms = Math.round(performance.now() - t0);
                setResults(p => p.map((r, idx) => idx === i ? { ...r, status: 'pass', ms, statusCode: 200, response: resp } : r));
            } catch (err: any) {
                const ms = Math.round(performance.now() - t0);
                setResults(p => p.map((r, idx) => idx === i ? { ...r, status: 'fail', ms, error: err?.message || 'Request failed', statusCode: err?.status || 0 } : r));
            }
            await new Promise(r => setTimeout(r, 80));
        }
        setIsRunning(false);
        fetchAll(true);
    };

    /* ── tools ── */
    const doPredict = async (templeId: string) => {
        setLoading(`pred-${templeId}`);
        try {
            const res = await templesApi.getPredictions(templeId);
            if (res.success) setPredictions(p => ({ ...p, [templeId]: res.data }));
            else setPredictions(p => ({ ...p, [templeId]: { error: 'No data' } }));
        } catch (e: any) { setPredictions(p => ({ ...p, [templeId]: { error: e.message || 'Failed' } })); }
        finally { setLoading(null); }
    };

    const doReset = async (templeId: string, name: string) => {
        if (!confirm(`Reset live count for "${name}" to 0?`)) return;
        setLoading(`reset-${templeId}`); setResetMsg(null);
        try {
            await liveApi.resetCount(templeId);
            setResetMsg({ id: templeId, msg: `${name}: count reset ✓`, ok: true });
            fetchAll(true);
        } catch (e: any) { setResetMsg({ id: templeId, msg: e.message || 'Reset failed', ok: false }); }
        finally { setLoading(null); }
    };

    const doBot = async () => {
        setLoading('bot'); setBotResp(null);
        try {
            const res = await botApi.query(botQuery);
            setBotResp({ answer: res.success ? res.answer : 'No answer returned', source: res.source || (res.success ? 'ai' : 'error') });
        } catch (e: any) { setBotResp({ answer: e.message || 'Request failed', source: 'error' }); }
        finally { setLoading(null); }
    };

    const doSync = async () => {
        setLoading('sync'); setSyncResult(null);
        try { setSyncResult(await templesApi.syncStatus()); }
        catch (e: any) { setSyncResult({ success: false, error: e.message }); }
        finally { setLoading(null); }
    };

    /* ─────────────────────── RENDER ─────────────────────── */
    return (
        <AdminLayout title="Backend Testing" subtitle="One-click API diagnostics & system tools">
            <div className="space-y-5">

                {/* ── Status bar ── */}
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                        <span className="text-sm font-black text-slate-700">
                            {health?.status === 'healthy' ? 'All systems operational' : 'Checking systems…'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        {lastUpdated && (
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => fetchAll()}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading === 'fetching' ? 'animate-spin' : ''}`} />
                        </motion.button>
                    </div>
                </motion.div>

                {/* ══ TEST RUNNER ══ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

                    {/* header */}
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-6 py-5 border-b border-slate-100">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                    <span className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                                        <Zap className="w-4.5 h-4.5 text-white" />
                                    </span>
                                    API Test Runner
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Hit all 10 endpoints sequentially in real-time
                                </p>
                            </div>
                            {isRunning ? (
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => { abortRef.current = true; }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-500/30">
                                    <Square className="w-4 h-4" /> Stop
                                </motion.button>
                            ) : (
                                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.96 }}
                                    onClick={runAllTests}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/30">
                                    <Play className="w-4 h-4" /> Run All Tests
                                </motion.button>
                            )}
                        </div>

                        {/* progress */}
                        {results.length > 0 && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-500">
                                        {isRunning ? `Running ${Math.min(passed + failed + 1, total)} / ${total}…` : `${passed + failed} / ${total} complete`}
                                    </span>
                                    <span className={failed > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                        {passed} passed · {failed} failed · avg {Math.round(avgMs)}ms · {(totalMs / 1000).toFixed(1)}s
                                    </span>
                                </div>
                                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                                    <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                        initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* results */}
                    {results.length > 0 && (
                        <div className="divide-y divide-slate-50">
                            {results.map((r, i) => (
                                <div key={i}>
                                    <div onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                                        className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${expandedIdx === i ? 'bg-slate-50' : ''}`}>
                                        {/* icon */}
                                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                                            {r.status === 'pending' && <Circle className="w-4 h-4 text-slate-300" />}
                                            {r.status === 'running' && <Loader2 className="w-4.5 h-4.5 text-teal-500 animate-spin" />}
                                            {r.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                            {r.status === 'fail' && <XCircle className="w-5 h-5 text-red-500" />}
                                        </div>
                                        {/* name + endpoint */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm">{r.name}</p>
                                            <p className="text-[11px] font-mono text-slate-400 truncate">{r.endpoint}</p>
                                        </div>
                                        {/* method badge */}
                                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${methodBadge(r.method)}`}>
                                            {r.method}
                                        </span>
                                        {/* ms badge */}
                                        {r.ms !== undefined && (
                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tabular-nums ${msBadge(r.ms)}`}>
                                                {r.ms}ms
                                            </span>
                                        )}
                                        {/* expand */}
                                        {(r.response || r.error) && (
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expandedIdx === i ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {expandedIdx === i && (r.response || r.error) && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <pre className="px-6 py-4 bg-slate-900 text-emerald-300 text-xs font-mono overflow-auto max-h-56">
                                                    {r.error ? `ERROR: ${r.error}` : JSON.stringify(r.response, null, 2)}
                                                </pre>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* ══ SYSTEM HEALTH ══ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Heart className="w-4.5 h-4.5 text-emerald-500" /> System Health
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">Database, Redis & server status</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => fetchAll()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors">
                            <RefreshCw className={`w-3 h-3 ${loading === 'fetching' ? 'animate-spin' : ''}`} />
                            Refresh
                        </motion.button>
                    </div>
                    <div className="p-6">
                        {loading === 'fetching' && !health ? (
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Checking health…
                            </div>
                        ) : health ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Overall', value: health.status, ok: health.status === 'healthy', icon: <Activity className="w-4 h-4" /> },
                                    { label: 'Database', value: health.database, ok: health.database === 'connected', icon: <Database className="w-4 h-4" /> },
                                    { label: 'Redis', value: health.redis, ok: health.redis === 'connected', icon: <Cpu className="w-4 h-4" /> },
                                    { label: 'Uptime', value: health.uptime_formatted || '-', ok: true, icon: <Clock className="w-4 h-4" /> },
                                ].map(c => (
                                    <div key={c.label}
                                        className={`rounded-2xl border p-4 flex items-center gap-3
                                                   ${c.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {c.icon}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</p>
                                            <p className={`font-black text-sm ${c.ok ? 'text-emerald-700' : 'text-red-700'}`}>{c.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm">Could not retrieve health. Is backend running?</p>
                        )}
                    </div>
                </motion.div>

                {/* ══ TEMPLES TABLE ══ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Building2 className="w-4.5 h-4.5 text-indigo-500" /> All Temples
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black border border-indigo-100">{temples.length}</span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">GET /api/v1/temples · with live counts, Predict & Reset</p>
                        </div>
                    </div>

                    {/* reset toast */}
                    <AnimatePresence>
                        {resetMsg && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className={`mx-6 mt-4 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between
                                            ${resetMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {resetMsg.msg}
                                <button onClick={() => setResetMsg(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Temple</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Live / Cap</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Fill</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {temples.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">No temples in database</td></tr>
                                ) : temples.map((t, i) => {
                                    const live = liveMap[t._id] ?? t.live_count ?? 0;
                                    const cap = typeof t.capacity === 'number' ? t.capacity : (t.capacity as any)?.total || 1000;
                                    const pct = Math.min(100, Math.round((live / cap) * 100));
                                    const pred = predictions[t._id];
                                    const predOk = pred && !('error' in pred) ? pred as PredictionResponse : null;
                                    const isResetting = loading === `reset-${t._id}`;
                                    const isPredicting = loading === `pred-${t._id}`;
                                    return (
                                        <motion.tr key={t._id}
                                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                            className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                                                <p className="text-[11px] text-slate-400 font-medium">
                                                    {typeof t.location === 'object'
                                                        ? `${(t.location as any).city}, ${(t.location as any).state}`
                                                        : String(t.location || '')}
                                                </p>
                                                {/* inline prediction result */}
                                                {predOk && (
                                                    <p className="text-[11px] text-purple-600 font-semibold mt-0.5">
                                                        {predOk.currentCrowdLevel} · wait {predOk.estimatedWaitMinutes}m
                                                    </p>
                                                )}
                                                {pred && 'error' in pred && (
                                                    <p className="text-[11px] text-red-500 mt-0.5">{pred.error}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black tabular-nums text-slate-700">
                                                {live.toLocaleString()} / {cap.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div className={`h-full rounded-full ${pct >= 85 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.02 }} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-500">{pct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border
                                                    ${String(t.status || '').toUpperCase() === 'OPEN'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${String(t.status || '').toUpperCase() === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {String(t.status || 'OPEN').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <motion.button whileTap={{ scale: 0.95 }}
                                                        onClick={() => doPredict(t._id)} disabled={isPredicting}
                                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-black border border-indigo-200 disabled:opacity-50 transition-colors flex items-center gap-1">
                                                        {isPredicting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Radio className="w-3 h-3" />}
                                                        Predict
                                                    </motion.button>
                                                    <motion.button whileTap={{ scale: 0.95 }}
                                                        onClick={() => doReset(t._id, t.name)} disabled={isResetting}
                                                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[11px] font-black border border-amber-200 disabled:opacity-50 transition-colors flex items-center gap-1">
                                                        {isResetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                                        Reset
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* ══ BOT + SYNC row ══ */}
                <div className="grid lg:grid-cols-2 gap-5">
                    {/* AI Bot */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Bot className="w-4.5 h-4.5 text-amber-500" /> AI Bot Query
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">POST /api/v1/bot/query</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text" value={botQuery} onChange={e => setBotQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && doBot()}
                                    placeholder="Ask the AI bot anything…"
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none transition-all" />
                                <motion.button whileTap={{ scale: 0.95 }} onClick={doBot} disabled={loading === 'bot'}
                                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-1.5">
                                    {loading === 'bot' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Ask
                                </motion.button>
                            </div>
                            <AnimatePresence>
                                {botResp && (
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className={`p-4 rounded-2xl border ${botResp.source === 'error' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                            Source: {botResp.source || 'unknown'}
                                        </p>
                                        <p className="text-sm text-slate-800 font-medium leading-relaxed">{botResp.answer}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Sync + Live Summary */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Server className="w-4.5 h-4.5 text-blue-500" /> Sync & Live Summary
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">Temple status sync + live crowd totals</p>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* sync */}
                            <div>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={doSync} disabled={loading === 'sync'}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                    {loading === 'sync'
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <RefreshCw className="w-4 h-4" />}
                                    Sync Temple Status
                                </motion.button>
                                <AnimatePresence>
                                    {syncResult && (
                                        <motion.pre initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 p-3 bg-slate-900 text-emerald-300 text-xs rounded-xl font-mono overflow-auto max-h-28">
                                            {JSON.stringify(syncResult, null, 2)}
                                        </motion.pre>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* live summary */}
                            <div className="border-t border-slate-100 pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Live Crowd Summary</p>
                                {liveData?.summary && Object.keys(liveData.summary).length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Temples', value: liveData.summary.total_temples ?? '—' },
                                            { label: 'Visitors', value: liveData.summary.total_visitors ?? '—' },
                                            { label: 'Capacity', value: liveData.summary.overall_percentage != null ? `${liveData.summary.overall_percentage}%` : '—' },
                                        ].map(s => (
                                            <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                                                <p className="text-xl font-black text-slate-800 tabular-nums">{s.value}</p>
                                                <p className="text-[10px] font-semibold text-slate-400">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm">No aggregate data — run "Refresh" above</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ══ Architecture explainer ══ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6">
                    <h3 className="font-black text-white mb-4 flex items-center gap-2">
                        <Activity className="w-4.5 h-4.5 text-emerald-400" /> How Live Crowd Tracking Works
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: '🔴', title: 'Redis', desc: 'Stores live_count per temple (temple:id:live_count) — atomic INCR/DECR' },
                            { icon: '📲', title: 'Entry Flow', desc: 'Gatekeeper scans QR → POST /live/entry → Redis INCR + MongoDB sync' },
                            { icon: '🚪', title: 'Exit Flow', desc: 'POST /live/exit → Redis DECR, timestamp updated in DB' },
                            { icon: '🚦', title: 'Thresholds', desc: '85% fill → ORANGE warning · 95% fill → RED critical alert' },
                            { icon: '🔮', title: 'Predictions', desc: 'Heuristic model (time + day) or ML microservice at :8002' },
                            { icon: '🔄', title: 'Polling', desc: 'Live Monitor polls every 8s; Gatekeeper polls every 10s' },
                        ].map(c => (
                            <div key={c.title} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <p className="text-lg mb-1">{c.icon}</p>
                                <p className="font-bold text-white text-sm mb-1">{c.title}</p>
                                <p className="text-slate-400 text-xs leading-relaxed">{c.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}

export default function AdminTestingPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminTestingContent />
        </ProtectedRoute>
    );
}
