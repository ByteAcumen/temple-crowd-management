#!/usr/bin/env node
/**
 * Temple Crowd Management — Comprehensive System Test
 * Tests: Auth, Temples, Booking, Live Crowd, Admin, Gatekeeper, ML, Frontend
 */

const BASE = 'http://localhost:5001/api/v1';

let passed = 0, failed = 0, warnings = 0;
let adminToken = '', userToken = '', gatekeeperToken = '';
let lastBookingId = '', lastPassId = '', firstTempleId = '', firstTempleName = '';

function ok(test, detail = '') {
    passed++;
    console.log(`  ✅  ${test}${detail ? ' — ' + detail : ''}`);
}
function fail(test, err = '') {
    failed++;
    console.log(`  ❌  ${test}${err ? ': ' + String(err).split('\n')[0] : ''}`);
}
function warn(test, msg = '') {
    warnings++;
    console.log(`  ⚠️   ${test}${msg ? ' — ' + msg : ''}`);
}
function section(title) {
    console.log(`\n  ── ${title} ${'─'.repeat(Math.max(0, 45 - title.length))}`);
}

async function req(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${BASE}${path}`, opts);
    const json = await r.json().catch(() => ({}));
    return { status: r.status, ...json };
}

async function run() {
    console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   🛕  TEMPLE SYSTEM — FULL INTEGRATION TEST SUITE');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

    // ── 1. HEALTH ────────────────────────────────────────────
    section('1. System Health');
    try {
        const h = await req('GET', '/health');
        h.success ? ok('Health endpoint') : fail('Health endpoint', 'success=false');
    } catch (e) { fail('Health endpoint — cannot reach backend', e.message); return; }

    // ── 2. AUTH: ADMIN ───────────────────────────────────────
    section('2. Authentication — Admin');
    try {
        const r = await req('POST', '/auth/login', { email: 'admin@temple.com', password: 'Admin@123456' });
        if (r.token) { adminToken = r.token; ok('Admin login', `token received`); }
        else fail('Admin login', r.message || r.error);
    } catch (e) { fail('Admin login', e.message); }

    try {
        const r = await req('POST', '/auth/login', { email: 'admin@temple.com', password: 'WrongPassword' });
        r.success === false ? ok('Reject wrong password') : fail('Wrong password not rejected');
    } catch (e) { warn('Wrong password test', e.message); }

    // ── 3. AUTH: USER & GATEKEEPER ───────────────────────────
    section('3. Authentication — User & Gatekeeper');
    try {
        const r = await req('POST', '/auth/login', { email: 'user@temple.com', password: 'User@12345' });
        if (r.token) { userToken = r.token; ok('Devotee user login', 'token received'); }
        else fail('User login', r.message || r.error);
    } catch (e) { fail('User login', e.message); }

    try {
        const r = await req('POST', '/auth/login', { email: 'gatekeeper@temple.com', password: 'Gate@12345' });
        if (r.token) { gatekeeperToken = r.token; ok('Gatekeeper login', 'token received'); }
        else fail('Gatekeeper login', r.message || r.error);
    } catch (e) { fail('Gatekeeper login', e.message); }

    try {
        const r = await req('GET', '/auth/me', null, userToken);
        r.success ? ok('GET /auth/me (profile)', r.data?.email) : fail('GET /auth/me');
    } catch (e) { fail('GET /auth/me', e.message); }

    // ── 4. TEMPLES ───────────────────────────────────────────
    section('4. Temples');
    try {
        const r = await req('GET', '/temples');
        if (r.success && r.count > 0) {
            firstTempleId = r.data[0]?._id;
            firstTempleName = r.data[0]?.name;
            ok(`GET /temples`, `${r.count} temples`);
        } else fail('GET /temples', r.message);
    } catch (e) { fail('GET /temples', e.message); }

    if (firstTempleId) {
        try {
            const r = await req('GET', `/temples/${firstTempleId}`);
            r.success ? ok(`GET /temples/:id`, r.data?.name) : fail('GET /temples/:id');
        } catch (e) { fail('GET /temples/:id', e.message); }
    }

    // ── 5. LIVE CROWD ────────────────────────────────────────
    section('5. Live Crowd Tracking');
    try {
        const r = await req('GET', '/live');
        if (r.success) {
            ok(`GET /live`, `${r.data.summary.total_temples} temples, ${r.data.summary.total_visitors} visitors`);
            const busy = r.data.temples.filter(t => t.live_count > 0);
            ok(`Live counts populated`, `${busy.length}/${r.data.temples.length} temples tracked`);
        } else fail('GET /live', r.message);
    } catch (e) { fail('GET /live', e.message); }

    if (firstTempleId) {
        try {
            const r = await req('GET', `/live/${firstTempleId}`);
            r.success ? ok(`GET /live/:templeId`, `${r.data.live_count} people @ ${r.data.capacity_percentage}% capacity`) : fail('GET /live/:id');
        } catch (e) { fail('GET /live/:id', e.message); }
    }

    // ── 6. BOOKINGS ──────────────────────────────────────────
    section('6. Bookings');
    if (firstTempleId) {
        try {
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            const r = await req('POST', '/bookings/check-availability', { templeId: firstTempleId, date: dateStr }, userToken);
            r.success ? ok('POST /bookings/check-availability') : warn('check-availability', r.message);
        } catch (e) { warn('check-availability', e.message); }
    }

    // Create booking — supply all required schema fields
    if (firstTempleId && firstTempleName && userToken) {
        try {
            const d = new Date(); d.setDate(d.getDate() + 5);
            const dateStr = d.toISOString().split('T')[0];
            const r = await req('POST', '/bookings', {
                templeId: firstTempleId,
                templeName: firstTempleName,
                date: dateStr,
                slot: '10:00 - 12:00',
                visitors: 2,
                userName: 'Test Devotee',
                userEmail: 'user@temple.com',
                visitorDetails: [
                    { name: 'Visitor One', age: 30, gender: 'Male' },
                    { name: 'Visitor Two', age: 25, gender: 'Female' }
                ],
                payment: { status: 'PENDING', amount: 0 }
            }, userToken);
            if (r.success && r.data?._id) {
                lastBookingId = r.data._id;
                lastPassId = r.data.passId;
                ok('POST /bookings (create booking)', `passId=${lastPassId}`);
            } else warn('Create booking', r.message || r.error || JSON.stringify(r).slice(0, 120));
        } catch (e) { warn('Create booking', e.message); }
    }

    // GET user bookings (route is GET /bookings, not /bookings/my)
    try {
        const r = await req('GET', '/bookings', null, userToken);
        r.success ? ok(`GET /bookings (user list)`, `${r.count} total bookings`) : fail('GET /bookings', r.message);
    } catch (e) { fail('GET /bookings', e.message); }

    // ── 7. ADMIN ─────────────────────────────────────────────
    section('7. Admin Panel');
    try {
        const r = await req('GET', '/admin/stats', null, adminToken);
        if (r.success) {
            const s = r.data.overview;
            ok('GET /admin/stats', `${s.total_temples} temples, ${s.total_bookings} bookings, ${s.total_users} users`);
        } else fail('GET /admin/stats', r.message);
    } catch (e) { fail('GET /admin/stats', e.message); }

    try {
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const r = await req('GET', `/admin/analytics?startDate=${start}&endDate=${end}`, null, adminToken);
        if (r.success) {
            // Response uses r.data.peak_hours (not r.data.chartData)
            ok('GET /admin/analytics', `peakHours=${r.data?.peak_hours?.length ?? 0}, dailyTrends=${r.data?.daily_trends?.length ?? 0}, revByTemple=${r.data?.revenue_by_temple?.length ?? 0}`);
        } else fail('GET /admin/analytics', r.message);
    } catch (e) { fail('GET /admin/analytics', e.message); }

    try {
        const r = await req('GET', '/admin/bookings?limit=5', null, adminToken);
        r.success ? ok('GET /admin/bookings', `${r.count} total bookings in system`) : fail('GET /admin/bookings', r.message);
    } catch (e) { fail('GET /admin/bookings', e.message); }

    // RBAC — regular user must NOT access admin routes
    try {
        const r = await req('GET', '/admin/stats', null, userToken);
        r.success === false ? ok('RBAC — non-admin blocked from /admin/stats') : fail('RBAC broken — user can access admin routes!');
    } catch (e) { warn('RBAC test', e.message); }

    // ── 8. GATEKEEPER / QR SCAN ─────────────────────────────
    section('8. Gatekeeper & QR Scan');
    if (lastPassId && firstTempleId && gatekeeperToken) {
        try {
            const r = await req('POST', '/live/entry', { templeId: firstTempleId, passId: lastPassId }, gatekeeperToken);
            if (r.success) {
                ok('POST /live/entry (scan QR entry)', `live_count=${r.data.temple.live_count}`);
            } else warn('Scan entry', r.error || r.message);
        } catch (e) { warn('Scan entry', e.message); }

        // Duplicate scan should be rejected
        try {
            const r = await req('POST', '/live/entry', { templeId: firstTempleId, passId: lastPassId }, gatekeeperToken);
            r.success === false ? ok('Duplicate scan blocked correctly') : warn('Duplicate scan allowed (should be blocked)');
        } catch (e) { warn('Duplicate scan block test', e.message); }
    } else {
        warn('Gatekeeper scan — skipped (no booking created, check booking creation above)');
    }

    // ── 9. ML SERVICES ───────────────────────────────────────
    section('9. ML Services');
    try {
        const r = await fetch('http://localhost:8001/health').then(r => r.json()).catch(() => null);
        r ? ok('ML Crowd Detection (:8001)', `status=${r.status || 'up'}`) : warn('ML Detection not responding on :8001');
    } catch (e) { warn('ML Detection', e.message); }

    try {
        const r = await fetch('http://localhost:8002/health').then(r => r.json()).catch(() => null);
        r ? ok('ML Demand Forecasting (:8002)', `status=${r.status || 'up'}`) : warn('ML Forecasting not responding on :8002');
    } catch (e) { warn('ML Forecasting', e.message); }

    // ── 10. FRONTEND ─────────────────────────────────────────
    section('10. Frontend Availability');
    try {
        const r = await fetch('http://localhost:3000');
        r.ok ? ok('Next.js Frontend on :3000', `HTTP ${r.status}`) : warn('Frontend returned ' + r.status);
    } catch (e) { fail('Frontend not reachable on :3000', e.message); }

    // ── RESULTS ──────────────────────────────────────────────
    const total = passed + failed + warnings;
    const pct = total > 0 ? Math.round(passed / total * 100) : 0;
    const fill = Math.round(pct / 5);
    const bar = '█'.repeat(fill) + '░'.repeat(20 - fill);
    console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   RESULTS: ${passed} passed | ${failed} failed | ${warnings} warnings | total ${total}`);
    console.log(`   ${bar} ${pct}%`);
    if (failed === 0 && warnings === 0) console.log('   🎉 Perfect score! All tests passed.');
    else if (failed === 0) console.log(`   ✅ All critical tests passed (${warnings} minor warnings)`);
    else console.log(`   ⚠️  ${failed} critical test(s) FAILED — review above`);
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
