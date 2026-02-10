'use client';

// Temple Smart E-Pass - Ticket/E-Pass Viewer Page
// Display digital E-Pass with QR code for temple entry

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { bookingsApi, Booking } from '@/lib/api';
import { QRCodeDisplay } from '@/components/ui/qr-code-display';
import { TrafficLightBadge } from '@/components/ui/traffic-light';

// Status badge component
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
        used: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Entry Completed' },
        expired: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Expired' },
        cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

    return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}

export default function TicketPage() {
    const params = useParams();
    const passId = params.passId as string;
    const printRef = useRef<HTMLDivElement>(null);

    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch booking details
    useEffect(() => {
        async function fetchBooking() {
            if (!passId) return;

            try {
                const response = await bookingsApi.getByPassId(passId);
                if (response.success) {
                    setBooking(response.data);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load E-Pass');
            } finally {
                setIsLoading(false);
            }
        }
        fetchBooking();
    }, [passId]);

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle share
    const handleShare = async () => {
        const shareUrl = window.location.href;
        const templeName = typeof booking?.temple === 'object' ? booking.temple?.name : booking?.temple || 'Temple';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Temple E-Pass - ${templeName}`,
                    text: `My E-Pass for ${templeName} on ${booking?.date}`,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled share
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                    <p className="text-slate-600">Loading your E-Pass...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">E-Pass Not Found</h2>
                    <p className="text-slate-600 mb-6">{error || 'The E-Pass you\'re looking for doesn\'t exist or has been removed.'}</p>
                    <Link href="/dashboard" className="btn-primary inline-block">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-4 md:p-8">
            <div className="max-w-md mx-auto">
                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 print:hidden"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>

                {/* E-Pass Card */}
                <div ref={printRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg">Temple E-Pass</h1>
                                    <p className="text-white/80 text-sm">Digital Entry Pass</p>
                                </div>
                            </div>
                            <StatusBadge status={booking.status || 'confirmed'} />
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="px-6 py-8 text-center border-b border-dashed border-slate-200">
                        <QRCodeDisplay
                            value={`TEMPLE-EPASS:${passId}`}
                            size={180}
                        />
                        <p className="mt-4 font-mono text-sm text-slate-500">
                            Pass ID: <span className="font-bold text-slate-700">{passId}</span>
                        </p>
                    </div>

                    {/* Pass Details */}
                    <div className="px-6 py-6 space-y-4">
                        {/* Temple */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-xl">🛕</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500">Temple</p>
                                <p className="font-semibold text-slate-900 text-lg">
                                    {typeof booking.temple === 'object' ? booking.temple?.name : booking.temple || 'Temple'}
                                </p>
                                {typeof booking.temple === 'object' && booking.temple?.location && (
                                    <p className="text-sm text-slate-500">
                                        {typeof booking.temple.location === 'object'
                                            ? `${booking.temple.location.city}, ${booking.temple.location.state}`
                                            : booking.temple.location}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Date</p>
                                    <p className="font-semibold text-slate-900">
                                        {new Date(booking.date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Time Slot</p>
                                    <p className="font-semibold text-slate-900">{booking.timeSlot}</p>
                                </div>
                            </div>
                        </div>

                        {/* Visitors */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Visitors</p>
                                <p className="font-semibold text-slate-900">{booking.visitors || 1} Person(s)</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 text-center">
                        <p className="text-xs text-slate-500">
                            Show this QR code at the temple entrance.<br />
                            Valid only for the specified date and time slot.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-white text-slate-700 py-3 px-4 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 bg-white text-slate-700 py-3 px-4 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                    </button>
                </div>

                {/* Safety Tips */}
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 print:hidden">
                    <h3 className="text-white font-semibold mb-2">📋 Important Guidelines</h3>
                    <ul className="text-white/80 text-sm space-y-1">
                        <li>• Arrive 15 minutes before your slot</li>
                        <li>• Carry a valid photo ID</li>
                        <li>• Follow temple dress code</li>
                        <li>• Keep your phone on silent</li>
                    </ul>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
