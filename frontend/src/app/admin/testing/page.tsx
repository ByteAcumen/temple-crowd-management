'use client';

// Temple Smart E-Pass — Admin Backend Testing & Diagnostics
// One-click API test runner + system health + crowd tools

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useEffect, useState, useCallback, useRef } from 'react';
import { templesApi, adminApi, liveApi, botApi, bookingsApi, Temple } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { BackendStatusBar } from '@/components/admin/BackendStatusBar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ── Types ──────────────────────────────────────────
interface TestResult {
    name: string;
    method: string;
    endpoint: string;
    status: 'pending' | 'running' | 'pass' | 'fail';
    ms?: number;
    statusCode?: number;
    response?: any;
    error?: string;
}

// ── Test Suite Definition ──────────────────────────
const TEST_SUITE: { name: string; method: string; endpoint: string; run: () => Promise<any> }[] = [
    { name: 'Server Health', method: 'GET', endpoint: '/', run: () => fetch(`${API_URL.replace('/api/v1', '')}`).then(r => r.json()) },
    { name: 'System Health', method: 'GET', endpoint: '/admin/health', run: () => adminApi.getSystemHealth() },
    { name: 'Temples List', method: 'GET', endpoint: '/temples', run: () => templesApi.getAll() },
    { name: 'Live Data', method: 'GET', endpoint: '/live', run: () => liveApi.getCrowdData() },
    { name: 'Dashboard Stats', method: 'GET', endpoint: '/admin/stats', run: () => adminApi.getStats() },
    { name: 'Analytics', method: 'GET', endpoint: '/admin/analytics', run: () => adminApi.getAnalytics({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }) },
    { name: 'Bookings', method: 'GET', endpoint: '/admin/bookings', run: () => adminApi.getBookings({ limit: 5 }) },
    { name: 'Users', method: 'GET', endpoint: '/admin/users', run: () => adminApi.getUsers() },
    { name: 'AI Bot', method: 'POST', endpoint: '/bot/query', run: () => botApi.query('Hello, are you working?') },
    { name: 'Availability', method: 'GET', endpoint: '/bookings/availability', run: () => bookingsApi.checkAvailability('test', new Date().toISOString().split('T')[0]) },
];

// ── Animation Variants ─────────────────────────────
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

function AdminTestingContent() {
    const { user } = useAuth();
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const abortRef = useRef(false);

    // ── Existing state for tools ──
    const [health, setHealth] = useState<any>(null);
    const [temples, setTemples] = useState<Temple[]>([]);
    const [liveData, setLiveData] = useState<any>(null);
    const [predictions, setPredictions] = useState<Record<string, any>>({});
    const [botResponse, setBotResponse] = useState<{ query: string; answer: string; source?: string } | null>(null);
    const [botQuery, setBotQuery] = useState('What is the crowd like tomorrow?');
    const [syncResult, setSyncResult] = useState<any>(null);
    const [resetResult, setResetResult] = useState<{ templeId: string; msg: string } | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading('fetching');
        setError(null);
        try {
            const [healthRes, templesRes, liveRes] = await Promise.all([
                adminApi.getSystemHealth(),
                templesApi.getAll(),
                liveApi.getCrowdData()
            ]);
            if (healthRes.success) setHealth(healthRes.data);
            if (templesRes.success) setTemples(templesRes.data || []);
            if (liveRes.success) {
                const d = liveRes.data;
                setLiveData(Array.isArray(d) ? { temples: d, summary: {} } : d);
            }
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to fetch');
        } finally {
            setLoading(null);
        }
    }, []);

    useEffect(() => {
        if (user) fetchAll();
    }, [user, fetchAll]);

    // ── One-Click Test Runner ──────────────────────
    const runAllTests = async () => {
        abortRef.current = false;
        setIsRunning(true);
        setExpandedIdx(null);

        const initial: TestResult[] = TEST_SUITE.map(t => ({
            name: t.name, method: t.method, endpoint: t.endpoint, status: 'pending'
        }));
        setResults(initial);

        for (let i = 0; i < TEST_SUITE.length; i++) {
            if (abortRef.current) break;

            setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'running' } : r));

            const start = performance.now();
            try {
                const response = await TEST_SUITE[i].run();
                const ms = Math.round(performance.now() - start);
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? { ...r, status: 'pass', ms, statusCode: 200, response } : r
                ));
            } catch (err: any) {
                const ms = Math.round(performance.now() - start);
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? { ...r, status: 'fail', ms, error: err.message || 'Request failed', statusCode: err.status || 0 } : r
                ));
            }

            // Small delay between tests
            await new Promise(r => setTimeout(r, 100));
        }

        setIsRunning(false);
        fetchAll(); // Refresh health data
    };

    const stopTests = () => { abortRef.current = true; };

    // ── Tool Handlers ──────────────────────────────
    const fetchPredictions = async (templeId: string) => {
        setLoading(`predict-${templeId}`);
        try {
            const res = await templesApi.getPredictions(templeId);
            if (res.success) setPredictions(prev => ({ ...prev, [templeId]: res.data }));
        } catch (err: any) {
            setPredictions(prev => ({ ...prev, [templeId]: { error: err.message } }));
        } finally { setLoading(null); }
    };

    const testBot = async () => {
        setLoading('bot');
        setBotResponse(null);
        try {
            const res = await botApi.query(botQuery);
            setBotResponse({ query: botQuery, answer: res.success ? res.answer : 'No response', source: res.source || (res.success ? 'bot' : 'error') });
        } catch (err: any) {
            setBotResponse({ query: botQuery, answer: err.message || 'Request failed', source: 'error' });
        } finally { setLoading(null); }
    };

    const syncTempleStatus = async () => {
        setLoading('sync'); setSyncResult(null);
        try {
            const res = await templesApi.syncStatus();
            setSyncResult(res);
        } catch (err: any) {
            setSyncResult({ success: false, error: err.message });
        } finally { setLoading(null); }
    };

    const resetTempleCount = async (templeId: string) => {
        if (!confirm('Reset live count to 0? This cannot be undone.')) return;
        setLoading(`reset-${templeId}`); setResetResult(null);
        try {
            await liveApi.resetCount(templeId);
            setResetResult({ templeId, msg: 'Count reset successfully' });
            fetchAll();
        } catch (err: any) {
            setResetResult({ templeId, msg: err.message || 'Reset failed' });
        } finally { setLoading(null); }
    };

    // ── Computed ────────────────────────────────────
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const total = results.length;
    const avgMs = results.filter(r => r.ms).reduce((a, r) => a + (r.ms || 0), 0) / (passed + failed || 1);
    const totalMs = results.filter(r => r.ms).reduce((a, r) => a + (r.ms || 0), 0);
    const progress = total > 0 ? ((passed + failed) / total) * 100 : 0;

    const liveTemples = liveData?.temples || [];
    const liveMap = liveTemples.reduce((acc: Record<string, number>, t: any) => {
        const id = (t.temple_id?.toString?.() || t.temple_id || t._id)?.toString?.();
        if (id) acc[id] = t.live_count ?? 0;
        return acc;
    }, {});

    return (
        <AdminLayout title="Backend Testing" subtitle="One-click API diagnostics & system tools">
            <div className="flex justify-end mb-4">
                <BackendStatusBar
                    status={loading === 'fetching' && !health ? 'loading' : 'connected'}
                    lastUpdated={lastUpdated || undefined}
                    dataCount={temples.length}
                    onRetry={fetchAll}
                />
            </div>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">✕</button>
                    </motion.div>
                )}

                {/* ═══════════════ ONE-CLICK TEST RUNNER ═══════════════ */}
                <motion.div variants={itemVariants} className="admin-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">🚀</span>
                                    API Test Runner
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Hit all {TEST_SUITE.length} endpoints sequentially and see real-time results</p>
                            </div>
                            <div className="flex gap-2">
                                {isRunning ? (
                                    <button onClick={stopTests}
                                        className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-red-500/25">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
                                        Stop
                                    </button>
                                ) : (
                                    <button onClick={runAllTests}
                                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Run All Tests
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {results.length > 0 && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-600">
                                        {isRunning ? `Running test ${passed + failed + 1} of ${total}...` : `${passed + failed} of ${total} complete`}
                                    </span>
                                    <span className={failed > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                        {passed}✅ {failed > 0 && `${failed}❌`} • avg {Math.round(avgMs)}ms • {(totalMs / 1000).toFixed(1)}s total
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${failed > 0 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results List */}
                    {results.length > 0 && (
                        <div className="divide-y divide-slate-100">
                            {results.map((r, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`px-5 py-3 flex items-center gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors ${expandedIdx === i ? 'bg-slate-50' : ''}`}
                                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                                >
                                    {/* Status Badge */}
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {r.status === 'pending' && <div className="w-3 h-3 rounded-full bg-slate-300" />}
                                        {r.status === 'running' && <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />}
                                        {r.status === 'pass' && <span className="text-emerald-500 text-lg">✅</span>}
                                        {r.status === 'fail' && <span className="text-red-500 text-lg">❌</span>}
                                    </div>

                                    {/* Test Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm">{r.name}</p>
                                        <p className="text-xs text-slate-400 font-mono">{r.method} {r.endpoint}</p>
                                    </div>

                                    {/* Response Time */}
                                    {r.ms !== undefined && (
                                        <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${r.ms < 200 ? 'bg-emerald-50 text-emerald-700' :
                                            r.ms < 500 ? 'bg-amber-50 text-amber-700' :
                                                'bg-red-50 text-red-700'
                                            }`}>
                                            {r.ms}ms
                                        </span>
                                    )}

                                    {/* Expand Arrow */}
                                    {(r.response || r.error) && (
                                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                </motion.div>
                            ))}
                            {/* Expanded JSON */}
                            <AnimatePresence>
                                {expandedIdx !== null && (results[expandedIdx]?.response || results[expandedIdx]?.error) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <pre className="p-4 bg-slate-900 text-emerald-300 text-xs overflow-auto max-h-60 font-mono">
                                            {results[expandedIdx]?.error
                                                ? `ERROR: ${results[expandedIdx].error}`
                                                : JSON.stringify(results[expandedIdx]?.response, null, 2)
                                            }
                                        </pre>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>

                {/* ═══════════════ SYSTEM HEALTH ═══════════════ */}
                <motion.div variants={itemVariants} className="admin-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-orange-50 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">💚</span>
                            System Health
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">Database, Redis & server status</p>
                    </div>
                    <div className="p-5">
                        {loading === 'fetching' && !health ? (
                            <div className="flex items-center gap-3 text-slate-500">
                                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> Loading...
                            </div>
                        ) : health ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatusCard label="Overall" value={health.status} ok={health.status === 'healthy'} />
                                <StatusCard label="Database" value={health.database} ok={health.database === 'connected'} />
                                <StatusCard label="Redis" value={health.redis} ok={health.redis === 'connected'} />
                                <StatusCard label="Uptime" value={health.uptime_formatted || '-'} ok />
                            </div>
                        ) : <p className="text-slate-500">Could not fetch health</p>}
                        <button onClick={fetchAll} disabled={loading === 'fetching'}
                            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium disabled:opacity-50">
                            {loading === 'fetching' ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </motion.div>

                {/* ═══════════════ TEMPLES + PREDICTIONS ═══════════════ */}
                <motion.div variants={itemVariants} className="admin-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">🛕</span>
                            All Temples ({temples.length})
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">Complete list from GET /api/v1/temples</p>
                    </div>
                    <div className="p-5 max-h-80 overflow-y-auto custom-scrollbar">
                        {temples.length === 0 ? (
                            <p className="text-slate-500">No temples in database</p>
                        ) : (
                            <div className="space-y-2">
                                {temples.map(t => {
                                    const liveCount = liveMap[t._id] ?? t.live_count ?? 0;
                                    const cap = typeof t.capacity === 'number' ? t.capacity : t.capacity?.total || 1000;
                                    const pct = Math.round((liveCount / cap) * 100);
                                    return (
                                        <div key={t._id}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-colors">
                                            <div>
                                                <p className="font-semibold text-slate-900">{t.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {typeof t.location === 'object' ? `${t.location?.city}, ${t.location?.state}` : t.location} • {t.status}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono">{liveCount} / {cap} ({pct}%)</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => fetchPredictions(t._id)} disabled={loading === `predict-${t._id}`}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50">Predict</button>
                                                    <button onClick={() => resetTempleCount(t._id)} disabled={loading === `reset-${t._id}`}
                                                        className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50">Reset</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Predictions Display */}
                {Object.keys(predictions).length > 0 && (
                    <motion.div variants={itemVariants} className="admin-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">🔮</span>
                                Crowd Predictions
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {Object.entries(predictions).map(([tid, pred]) => {
                                const t = temples.find(x => x._id === tid);
                                if (pred.error) {
                                    return <div key={tid} className="p-4 bg-red-50 rounded-xl text-red-700 text-sm">{t?.name || tid}: {pred.error}</div>;
                                }
                                return (
                                    <div key={tid} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="font-bold text-slate-900 mb-2">{t?.name || tid}</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span className="text-slate-500">Level:</span><span className="font-medium">{pred.currentCrowdLevel}</span>
                                            <span className="text-slate-500">Wait:</span><span>{pred.estimatedWaitMinutes} min</span>
                                            <span className="text-slate-500">Best time:</span><span>{pred.bestTimeToVisit?.join(', ') || '-'}</span>
                                            <span className="text-slate-500 col-span-2">Recommendation: {pred.recommendation}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════ AI BOT + SYNC + LIVE ═══════════════ */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* AI Bot */}
                    <motion.div variants={itemVariants} className="admin-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">🤖</span>
                                AI Bot
                            </h3>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex gap-2">
                                <input type="text" value={botQuery} onChange={e => setBotQuery(e.target.value)}
                                    placeholder="e.g. What is the crowd like tomorrow?"
                                    onKeyDown={e => e.key === 'Enter' && testBot()}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none transition-all" />
                                <button onClick={testBot} disabled={loading === 'bot'}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50">
                                    {loading === 'bot' ? '...' : 'Ask'}
                                </button>
                            </div>
                            <AnimatePresence>
                                {botResponse && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Source: {botResponse.source || 'unknown'}</p>
                                        <p className="text-slate-900 font-medium">{botResponse.answer}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Sync + Live Summary */}
                    <motion.div variants={itemVariants} className="admin-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Sync & Live Summary</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <button onClick={syncTempleStatus} disabled={loading === 'sync'}
                                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50">
                                    {loading === 'sync' ? 'Syncing...' : '🔄 Sync Temple Status'}
                                </button>
                                {syncResult && (
                                    <pre className="mt-3 p-3 bg-slate-50 rounded-lg text-xs overflow-auto max-h-32">{JSON.stringify(syncResult, null, 2)}</pre>
                                )}
                            </div>
                            <div className="border-t border-slate-100 pt-4">
                                <p className="font-semibold text-slate-700 text-sm mb-2">Live Crowd Summary</p>
                                {liveData?.summary ? (
                                    <div className="space-y-1 text-sm text-slate-600">
                                        <p>Total temples: {liveData.summary.total_temples}</p>
                                        <p>Total visitors: {liveData.summary.total_visitors}</p>
                                        <p>Overall: {liveData.summary.overall_percentage}%</p>
                                    </div>
                                ) : <p className="text-slate-500 text-sm">No live data</p>}
                                {resetResult && (
                                    <p className={`mt-2 text-sm ${resetResult.msg.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>{resetResult.msg}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Info Banner */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-bold mb-3">How Crowd Handling Works</h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                        <li>• <strong>Redis</strong>: Stores live_count per temple (temple:id:live_count)</li>
                        <li>• <strong>Entry</strong>: Gatekeeper scans QR → POST /live/entry → Redis INCR, MongoDB sync</li>
                        <li>• <strong>Exit</strong>: POST /live/exit → Redis DECR</li>
                        <li>• <strong>Thresholds</strong>: 85% = ORANGE warning, 95% = RED critical</li>
                        <li>• <strong>Predictions</strong>: Heuristic (time, weekend) or ML service when available</li>
                    </ul>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}

function StatusCard({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
    return (
        <div className={`p-3 rounded-xl border ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className={`font-bold ${ok ? 'text-emerald-700' : 'text-slate-700'}`}>{value}</p>
        </div>
    );
}

export default function AdminTestingPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminTestingContent />
        </ProtectedRoute>
    );
}
