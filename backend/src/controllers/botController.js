'use strict';
const Temple = require('../models/Temple');
const Booking = require('../models/Booking');
const crowdTracker = require('../services/CrowdTracker');
const BotMemory = require('../services/BotMemory');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// ─── Config ───────────────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// ─── Live DB context ──────────────────────────────────────────────────────────
async function getLiveContext() {
    try {
        const [open, all] = await Promise.all([
            Temple.find({ status: 'OPEN' }).select('name capacity location').lean(),
            Temple.find().select('name status').lean(),
        ]);

        let totalVisitors = 0;
        let busiestName = '—', busiestCount = 0, criticalCount = 0;
        const lines = [];

        for (const t of open) {
            const count = await crowdTracker.getCurrentCount(t._id.toString());
            const cap = typeof t.capacity === 'number' ? t.capacity : (t.capacity?.total || 5000);
            const pct = cap > 0 ? Math.round((count / cap) * 100) : 0;
            totalVisitors += count;
            if (count > busiestCount) { busiestCount = count; busiestName = t.name; }
            if (pct >= 80) criticalCount++;
            const city = typeof t.location === 'object' ? (t.location?.city || '') : '';
            const status = pct >= 80 ? 'CRITICAL' : pct >= 50 ? 'MODERATE' : 'NORMAL';
            lines.push(`  • ${t.name}${city ? ` (${city})` : ''}: ${count}/${cap} visitors — ${pct}% — ${status}`);
        }

        const closed = all.filter(t => t.status !== 'OPEN').map(t => t.name);
        if (closed.length) lines.push(`  • [CLOSED]: ${closed.join(', ')}`);

        return {
            totalVisitors,
            openCount: open.length,
            systemStatus: criticalCount > 0 ? `${criticalCount} CRITICAL alert(s)` : 'All Clear',
            busiestTemple: `${busiestName} (${busiestCount} visitors)`,
            criticalCount,
            templeLines: lines.join('\n') || 'No data.',
        };
    } catch {
        return { totalVisitors: 0, openCount: 0, systemStatus: 'Unknown', busiestTemple: '—', criticalCount: 0, templeLines: 'Unavailable.' };
    }
}

// ─── System prompt (role-aware + live context) ─────────────────────────────────
function buildPrompt(role, ctx) {
    const roleGuide = {
        admin: `The user is a SUPER ADMIN. They have full access to all temple data, bookings, staff management, and analytics. Give operational insights when relevant. You can discuss crowd analytics, booking trends, and system status.`,
        gatekeeper: `The user is GATE STAFF at a temple. Help them with: scanning QR codes (they use the Scanner tab), manual entry, understanding GREEN/ORANGE/RED crowd alerts, recording exits, and handling pass rejections.`,
        user: `The user is a DEVOTEE wanting to visit temples. Help them book, manage bookings, understand the QR e-pass, dress codes, and timings. Keep language simple and friendly.`,
    }[role] || `The user is a devotee.`;

    return `You are TempleAI — the official AI assistant for the Temple Smart E-Pass System.
${roleGuide}

LIVE SYSTEM DATA (${new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}):
- Total visitors currently inside: ${ctx.totalVisitors.toLocaleString()}
- Open temples: ${ctx.openCount}
- System: ${ctx.systemStatus}
- Busiest: ${ctx.busiestTemple}

TEMPLE STATUS:
${ctx.templeLines}

RULES:
1. Answer directly and concisely. No filler phrases like "Based on current data" or "As a Temple Admin Assistant".
2. Use markdown: **bold**, bullet points, headers when helpful.
3. For booking questions, give step-by-step guidance.
4. If live crowd data is relevant, include the actual numbers from above.
5. End with a helpful suggestion or next step.
6. Be warm — use 🙏 occasionally.`;
}

// ─── Gemini Flash call ────────────────────────────────────────────────────────
async function geminiChat(systemPrompt, history, userQuery) {
    const contents = history
        .slice(-8)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    contents.push({ role: 'user', parts: [{ text: userQuery }] });

    const { data } = await axios.post(
        `${GEMINI_URL}?key=${GEMINI_KEY}`,
        {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.65, maxOutputTokens: 800, topP: 0.9 },
        },
        { timeout: 18000, headers: { 'Content-Type': 'application/json' } }
    );

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('');
    if (!text) throw new Error('No text in Gemini response');
    return text.trim();
}

// ─── Intent tools (fast DB lookups) ──────────────────────────────────────────
async function intentLookup(query, role) {
    const q = query.toLowerCase();

    // Specific temple status
    const m = q.match(/(?:crowd|status|busy|visitors?|people|full|capacity)\s+(?:at|in|of)\s+(.+?)(?:\?|$)/i)
        || q.match(/(?:how.*(?:busy|full|crowded)|status\s+of)\s+(.+?)(?:\?|$)/i);
    if (m) {
        const name = m[1].trim().replace(/temple|mandir/gi, '').trim();
        if (name.length > 1) {
            const t = await Temple.findOne({ name: { $regex: name, $options: 'i' } }).lean();
            if (t) {
                const count = await crowdTracker.getCurrentCount(t._id.toString());
                const cap = typeof t.capacity === 'number' ? t.capacity : (t.capacity?.total || 5000);
                const pct = cap > 0 ? Math.round((count / cap) * 100) : 0;
                const emoji = pct >= 80 ? '🔴' : pct >= 50 ? '🟡' : '🟢';
                return `**${t.name}** — Live Status ${emoji}\n- 👥 **${count.toLocaleString()}** visitors inside\n- 🏛️ Capacity: ${cap.toLocaleString()}\n- 📊 Load: **${pct}%**\n- Status: ${t.status}\n\n${pct >= 80 ? '⚠️ Very crowded — consider visiting early morning or late evening.' : pct >= 50 ? '⚡ Moderately busy — shorter queues before 9 AM.' : '✅ Good time to visit!'}`;
            }
        }
    }

    // List all temples
    if (q.match(/all temples|list.*temple|show.*temple|which temples?|available temples?/)) {
        const temples = await Temple.find().select('name location status capacity').lean();
        const rows = temples.map(t => {
            const city = typeof t.location === 'object' ? (t.location?.city || '') : '';
            const cap = typeof t.capacity === 'number' ? t.capacity : (t.capacity?.total || '—');
            return `- **${t.name}**${city ? ` · ${city}` : ''} · Cap: ${typeof cap === 'number' ? cap.toLocaleString() : cap} · ${t.status}`;
        });
        return `🏛️ **${temples.length} Temples in the System:**\n\n${rows.join('\n')}`;
    }

    // Booking stats (admin)
    if (role === 'admin' && q.match(/booking.*stats?|total bookings?|how many bookings?|booking.*overview|bookings? today/)) {
        const [total, confirmed, used, cancelled] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'CONFIRMED' }),
            Booking.countDocuments({ status: 'USED' }),
            Booking.countDocuments({ status: 'CANCELLED' }),
        ]);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayCount = await Booking.countDocuments({ createdAt: { $gte: today } });
        return `📋 **Booking Overview:**\n- Total: **${total.toLocaleString()}**\n- ✅ Active (Confirmed): **${confirmed.toLocaleString()}**\n- 🔵 Scanned (Used): **${used.toLocaleString()}**\n- ❌ Cancelled: **${cancelled.toLocaleString()}**\n- 📅 Booked today: **${todayCount.toLocaleString()}**`;
    }

    return null; // No intent matched
}

// ─── Local knowledge base ─────────────────────────────────────────────────────
function localKB(query, role) {
    const q = query.toLowerCase();

    if (q.match(/\b(hi|hello|hey|namaste|helo|hii)\b/)) {
        const greet = { admin: '👑 Hello, Admin!', gatekeeper: '🔑 Hello, Gate Staff!', user: '🙏 Namaste, Devotee!' };
        return `${greet[role] || '🙏 Namaste!'} How can I help you today?\n\nI can assist with:\n- **Booking** a temple visit\n- **Live crowd** status at any temple\n- **QR e-pass** questions\n- **Temple timings** and guidelines`;
    }

    if (q.match(/\b(book|reserv|how.*(visit|go|book))\b/)) {
        return `📲 **How to book a temple visit:**\n\n1. Go to **Temples** page in the app\n2. Select your temple\n3. Click **"Book Now"**\n4. Choose **date + time slot + number of visitors**\n5. Confirm — your **QR E-Pass is generated instantly**\n\n✅ View your passes at **Dashboard → My Bookings**`;
    }

    if (q.match(/\b(cancel|cancell)\b/)) {
        return `🔄 **Cancelling a booking:**\n\n1. Go to **Dashboard → My Bookings**\n2. Find your booking\n3. Click **Cancel**\n\n✅ Cancellations are free before your visit date.`;
    }

    if (q.match(/\b(qr|pass|epass|e-pass|ticket|scan)\b/)) {
        if (role === 'gatekeeper') {
            return `📱 **QR Scanning for Gate Staff:**\n\n1. Open the **Scanner** tab\n2. Click **Scan QR Code**\n3. Point camera at devotee's QR code\n4. System auto-records entry\n\n**Pass rejected?** The pass may be:\n- ❌ Already used / expired\n- ❌ For a different temple\n- ❌ Cancelled by the user\n\nFor manual entry: use the **Manual Entry** form with the Pass ID.`;
        }
        return `📱 **Your QR E-Pass:**\n\nGenerated automatically after booking. Find it at:\n- **Dashboard → My Bookings → View Pass**\n- Confirmation email\n\n✅ Show the QR at the temple entrance. The gatekeeper scans it to record your entry.`;
    }

    if (q.match(/\b(crowd|busy|status|traffic|how many|visitors?|people)\b/)) {
        return `🟢🟡🔴 **Crowd Status:**\n\n- 🟢 **Green (SAFE)**: Low crowd, comfortable visit\n- 🟡 **Orange (MODERATE)**: Busy, some wait expected\n- 🔴 **Red (CRITICAL)**: Very crowded, consider rescheduling\n\n📡 Check the **Live Monitor** page for real-time counts at every temple.`;
    }

    if (q.match(/\b(time|hour|open|close|timing|when)\b/)) {
        return `⏰ **Temple Timings:**\n\nMost temples: **6:00 AM – 9:00 PM**\n\n- 🌅 Best time: **Early morning (6–8 AM)** — least crowded\n- ☀️ Good: **Afternoon (12–3 PM)** — moderate\n- 🌆 Busy: **8–10 AM** and **5–7 PM** (peak hours)`;
    }

    if (q.match(/\b(dress|wear|cloth|attire|dress.?code)\b/)) {
        return `👗 **Temple Dress Code:**\n\n- Wear modest, traditional clothing\n- ❌ No shorts, sleeveless tops, or revealing outfits\n- 👞 Remove footwear before entering sanctum\n- 🥻 Silk sarees / dhotis preferred at some temples\n- Some temples provide wraps at the entrance`;
    }

    if (q.match(/\b(slot|session|time.?slot|schedul)\b/)) {
        return `🕐 **Booking Slots:**\n\nEach slot is a **2-hour window** with a visitor limit.\n\n- Book early — popular times fill fast\n- Weekends and festival days → book a week ahead\n- You'll receive a QR pass for your specific slot`;
    }

    if (q.match(/\b(refund|money|payment|fee|price|cost)\b/)) {
        return `💰 **Fees & Refunds:**\n\nMost e-passes are **free**. If any fee was charged:\n- Cancellations are processed within **3–5 business days**\n- Contact the temple office for special darshan fee queries`;
    }

    if (role === 'admin' && q.match(/\b(admin|dashboard|analytics|report)\b/)) {
        return `⚙️ **Admin Dashboard Guide:**\n\n- 📊 **Dashboard**: Live KPIs, auto-refresh every 20s\n- 📋 **Bookings**: All reservations, filters, export CSV\n- 📡 **Live Monitor**: Real-time crowd at all temples\n- 📈 **Analytics**: Revenue, visitor trends, peak hours\n- 👥 **Users & Roles**: Add staff, assign temples`;
    }

    if (role === 'gatekeeper' && q.match(/\b(red|orange|critical|alert|threshold|crowd)\b/)) {
        return `🚨 **Crowd Alert Actions:**\n\n- 🔴 **RED (>80% full)**: Pause new entries. Inform supervisor. Allow exits only.\n- 🟡 **ORANGE (50–80%)**: Slow entry. Ask visitors to use alternate times.\n- 🟢 **GREEN (<50%)**: Normal entry. Scan and process as usual.`;
    }

    return `🙏 I can help with:\n- **Book** a visit\n- **Live crowd** at any temple\n- **QR e-pass** info\n- **Timings** and **dress code**\n- **Cancel** a booking\n\nJust ask!`;
}

// ─── Main export ──────────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
    const { query, sessionId, role = 'user' } = req.body;
    if (!query?.trim()) return res.status(400).json({ success: false, error: 'Query required' });

    const sid = sessionId || uuidv4();
    BotMemory.addMessage(sid, 'user', query);

    let answer = null;
    let source = 'local_kb';

    try {
        // 1. Fast intent tools (temple status, list, booking stats)
        answer = await intentLookup(query, role);
        if (answer) source = 'live_data';
    } catch (e) {
        console.warn('[Bot] Intent lookup failed:', e.message);
    }

    if (!answer && GEMINI_KEY) {
        try {
            // 2. Gemini Flash with live context + conversation history
            const [ctx, history] = await Promise.all([
                getLiveContext(),
                Promise.resolve(BotMemory.getSession(sid).history.slice(-8)),
            ]);
            const prompt = buildPrompt(role, ctx);
            answer = await geminiChat(prompt, history, query);
            source = 'gemini_ai';
        } catch (e) {
            console.warn('[Bot] Gemini failed:', e.message);
        }
    }

    if (!answer) {
        // 3. Always-available local KB
        answer = localKB(query, role);
        source = 'local_kb';
    }

    BotMemory.addMessage(sid, 'assistant', answer);

    // Role-aware follow-up suggestions
    const suggestions = {
        admin: ['Which temples are critically full?', 'Show booking statistics', 'How many visitors today?', 'Explain the analytics page'],
        gatekeeper: ['How to scan a QR code?', 'What if scan fails?', 'Crowd alert actions?', 'How to do manual entry?'],
        user: ['How to book a visit?', 'What is the current crowd?', 'How does QR e-pass work?', 'Best time to visit?'],
    }[role] || [];

    res.json({ success: true, sessionId: sid, answer, source, suggestedQuestions: suggestions });
};
