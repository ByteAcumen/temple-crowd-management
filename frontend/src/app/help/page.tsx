'use client';

// Temple Smart E-Pass - Help Center / FAQ Page
// Knowledge base with searchable FAQs

import Link from 'next/link';
import { useState } from 'react';

// FAQ Categories and Questions
const FAQ_DATA = [
    {
        category: 'Booking',
        icon: '🎫',
        questions: [
            {
                q: 'How do I book a temple visit?',
                a: 'Go to the Temples page, select your preferred temple, and click "Book Now". Choose your date, time slot, and number of visitors. After confirming, you\'ll receive a QR code E-Pass.',
            },
            {
                q: 'How many visitors can I book for?',
                a: 'You can book for up to 10 visitors in a single booking. For larger groups, please make multiple bookings or contact the temple administration.',
            },
            {
                q: 'Can I book for the same day?',
                a: 'Yes, same-day bookings are available if slots are not full. However, we recommend booking at least 1-2 days in advance for popular temples.',
            },
            {
                q: 'Is booking free?',
                a: 'Yes, the E-Pass booking service is completely free. Some temples may have separate fees for special darshans which are payable at the temple.',
            },
        ],
    },
    {
        category: 'E-Pass & QR Code',
        icon: '📱',
        questions: [
            {
                q: 'How does the QR code E-Pass work?',
                a: 'After booking, you receive a unique QR code. Show this QR code at the temple entrance, where the gatekeeper will scan it to verify your booking and record your entry.',
            },
            {
                q: 'Where can I find my E-Pass?',
                a: 'Your E-Pass is available in your Dashboard under "My Bookings". You can also access it from the confirmation email or by visiting /tickets/[your-pass-id].',
            },
            {
                q: 'Can I print my E-Pass?',
                a: 'Yes! Open your E-Pass and click the "Print" button. We recommend carrying either a printed copy or having it saved on your phone.',
            },
            {
                q: 'What if my QR code doesn\'t scan?',
                a: 'The gatekeeper can manually enter your Pass ID. Make sure your screen brightness is high and the QR code is clearly visible.',
            },
        ],
    },
    {
        category: 'Cancellation & Changes',
        icon: '🔄',
        questions: [
            {
                q: 'How do I cancel my booking?',
                a: 'Go to your Dashboard, find the booking you want to cancel, and click the cancel option. Cancellations are free up to 24 hours before your scheduled time.',
            },
            {
                q: 'Can I change my booking date or time?',
                a: 'Currently, you need to cancel your existing booking and create a new one. We recommend doing this at least 24 hours before your original slot.',
            },
            {
                q: 'What happens if I miss my time slot?',
                a: 'If you miss your time slot, your E-Pass expires. You\'ll need to book a new slot. Frequent no-shows may affect your future booking privileges.',
            },
        ],
    },
    {
        category: 'Temple Visit',
        icon: '🛕',
        questions: [
            {
                q: 'What should I wear to the temple?',
                a: 'Most temples require modest clothing. Avoid shorts, sleeveless tops, and revealing clothes. Men typically wear dhoti/pants, women wear sarees/salwar kameez. Some temples provide cloth wraps.',
            },
            {
                q: 'What items are not allowed inside?',
                a: 'Common restricted items: leather items, mobile phones in sanctum, cameras, food, tobacco, alcohol. Check specific temple rules before visiting.',
            },
            {
                q: 'What are the temple timings?',
                a: 'Timings vary by temple. Most are open 6:00 AM - 9:00 PM with a midday break. Check the specific temple page for exact timings.',
            },
            {
                q: 'How early should I arrive?',
                a: 'We recommend arriving 15-30 minutes before your slot time. This allows for security checks, depositing bags, and other formalities.',
            },
        ],
    },
    {
        category: 'Crowd & Safety',
        icon: '👥',
        questions: [
            {
                q: 'How do I check the current crowd level?',
                a: 'Visit the Live Status page to see real-time crowd levels for all temples. Green = Low, Orange = Moderate, Red = High crowd.',
            },
            {
                q: 'What does the traffic light system mean?',
                a: 'Green (<85% capacity): Great time to visit. Orange (85-95%): Moderate crowd, plan extra time. Red (>95%): Very crowded, consider rescheduling.',
            },
            {
                q: 'Is it safe to visit during high crowd times?',
                a: 'Temple authorities manage crowd flow, but we recommend visiting during low-crowd times for a better experience. Avoid peak festival days if possible.',
            },
        ],
    },
    {
        category: 'Account & Technical',
        icon: '⚙️',
        questions: [
            {
                q: 'How do I create an account?',
                a: 'Click "Register" on the login page. Provide your name, email, and create a password. Verify your email to activate your account.',
            },
            {
                q: 'I forgot my password. What should I do?',
                a: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a password reset link.',
            },
            {
                q: 'The app is not loading properly. What should I do?',
                a: 'Try: 1) Refresh the page, 2) Clear browser cache, 3) Try a different browser, 4) Check your internet connection. Contact support if issues persist.',
            },
        ],
    },
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>('Booking');
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

    // Filter FAQs based on search
    const filteredFAQs = searchQuery
        ? FAQ_DATA.map(cat => ({
            ...cat,
            questions: cat.questions.filter(q =>
                q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter(cat => cat.questions.length > 0)
        : FAQ_DATA;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white py-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </Link>

                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        🙏 How can we help you?
                    </h1>
                    <p className="text-orange-100 mb-8 max-w-xl mx-auto">
                        Find answers to common questions about temple bookings, E-Passes, and more.
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for answers..."
                            className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 focus:ring-4 focus:ring-white/30 outline-none"
                        />
                    </div>
                </div>
            </header>

            {/* Quick Links */}
            <section className="bg-white border-b border-slate-200 py-4">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link href="/support" className="px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors flex items-center gap-2">
                            <span>🤖</span> Chat with AI
                        </Link>
                        <Link href="/live" className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-2">
                            <span>📊</span> Live Crowd Status
                        </Link>
                        <Link href="/temples" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2">
                            <span>🛕</span> Book a Visit
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {filteredFAQs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
                        <p className="text-slate-600 mb-4">Try different keywords or browse categories below.</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-orange-600 font-medium hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFAQs.map((category) => (
                            <div key={category.category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {/* Category Header */}
                                <button
                                    onClick={() => setExpandedCategory(
                                        expandedCategory === category.category ? null : category.category
                                    )}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{category.icon}</span>
                                        <span className="font-semibold text-slate-900">{category.category}</span>
                                        <span className="text-sm text-slate-400">({category.questions.length} questions)</span>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-slate-400 transition-transform ${expandedCategory === category.category ? 'rotate-180' : ''
                                            }`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Questions */}
                                {expandedCategory === category.category && (
                                    <div className="border-t border-slate-100">
                                        {category.questions.map((item, idx) => (
                                            <div key={idx} className="border-b border-slate-100 last:border-b-0">
                                                <button
                                                    onClick={() => setExpandedQuestion(
                                                        expandedQuestion === item.q ? null : item.q
                                                    )}
                                                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                                                >
                                                    <span className="text-slate-800 pr-4">{item.q}</span>
                                                    <svg
                                                        className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expandedQuestion === item.q ? 'rotate-180' : ''
                                                            }`}
                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {expandedQuestion === item.q && (
                                                    <div className="px-6 pb-4 text-slate-600 text-sm leading-relaxed bg-slate-50">
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Still Need Help */}
                <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
                    <p className="text-orange-100 mb-6">Our AI assistant is available 24/7 to answer your questions.</p>
                    <Link href="/support" className="inline-block bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors">
                        Chat with AI Support
                    </Link>
                </div>
            </main>
        </div>
    );
}
