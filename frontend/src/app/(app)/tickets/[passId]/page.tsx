'use client';

// Temple Smart E-Pass - Ticket/E-Pass Viewer Page
// Display digital E-Pass with QR code for temple entry

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { bookingsApi, Booking } from '@/lib/api';
import { QRCodeDisplay } from '@/components/ui/qr-code-display';
import { useTempleLiveData } from '@/hooks/use-live-data';

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
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load E-Pass';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchBooking();
    }, [passId]);

    // Live Data Hook
    const templeId = booking?.temple && typeof booking.temple === 'object' ? booking.temple._id : (typeof booking?.temple === 'string' ? booking.temple : null);
    const { liveData } = useTempleLiveData(templeId);

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle download
    const handleDownload = async () => {
        if (printRef.current) {
            try {
                const canvas = await html2canvas(printRef.current, {
                    scale: 3, // Higher resolution
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true, // Important for images
                    allowTaint: true,
                });

                const image = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = image;
                link.download = `temple-epass-${passId}.png`;
                link.click();
            } catch (err) {
                console.error("Failed to download ticket", err);
                alert("Failed to generate image. Please try printing instead.");
            }
        }
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
            } catch {
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

                {/* E-Pass Card - Boarding Pass Style */}
                <div ref={printRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden relative print:shadow-none">
                    {/* Top Section - Temple Image/Header */}
                    <div className="relative h-48 bg-gradient-to-r from-orange-600 to-red-600 overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/patterns/temple-pattern.png')] opacity-20"></div>
                        <div className="absolute inset-0 flex items-center justify-between px-8 text-white">
                            <div>
                                <p className="text-orange-100 font-medium tracking-widest text-sm uppercase">Pious Journey</p>
                                <h1 className="text-3xl font-bold mt-1">Temple E-Pass</h1>
                            </div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center relative overflow-hidden">
                                {/* Using standard img tag for better html2canvas compatibility during download */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/temple-logo.png"
                                    alt="Temple Smart Logo"
                                    className="w-full h-full object-contain p-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Middle Section - Details */}
                    <div className="px-8 py-8 relative">
                        {/* Cutout Circles for "Perforation" effect */}
                        <div className="absolute -left-4 top-0 w-8 h-8 bg-slate-100 rounded-full"></div>
                        <div className="absolute -right-4 top-0 w-8 h-8 bg-slate-100 rounded-full"></div>

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide">Temple</p>
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                    {typeof booking.temple === 'object' ? booking.temple?.name : booking.temple || 'Temple'}
                                </h2>
                                <p className="text-slate-600">
                                    {typeof booking.temple === 'object' && booking.temple?.location
                                        ? (typeof booking.temple.location === 'object' ? `${booking.temple.location.city}, ${booking.temple.location.state}` : booking.temple.location)
                                        : ''}
                                </p>
                            </div>
                            <div className="text-right">
                                <StatusBadge status={booking.status || 'confirmed'} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8 mb-8">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Date</p>
                                <p className="font-bold text-slate-900 text-lg">
                                    {new Date(booking.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {new Date(booking.date).toLocaleDateString('en-US', { year: 'numeric' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Time</p>
                                <p className="font-bold text-slate-900 text-lg">
                                    {booking.timeSlot?.split('-')[0] || '--:--'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {booking.timeSlot || 'Not scheduled'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Visitors</p>
                                <p className="font-bold text-slate-900 text-lg">
                                    {booking.visitors || 1}
                                </p>
                                <p className="text-xs text-slate-500">Adults</p>
                            </div>
                        </div>

                        {/* Live Crowd Status */}
                        {liveData && liveData.status && (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between mb-8 print:hidden">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-3 w-3">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveData.status === 'RED' ? 'bg-red-400' : liveData.status === 'ORANGE' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${liveData.status === 'RED' ? 'bg-red-500' : liveData.status === 'ORANGE' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Live Crowd:</span>
                                </div>
                                <span className={`text-sm font-bold ${liveData.status === 'RED' ? 'text-red-600' :
                                    liveData.status === 'ORANGE' ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                    {liveData.status === 'RED' ? 'Heavy Rush' :
                                        liveData.status === 'ORANGE' ? 'Moderate' : 'Smooth Entry'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bottom Section - QR */}
                    <div className="border-t-2 border-dashed border-slate-200 relative bg-slate-50 px-8 py-8">
                        {/* Cutout Circles for "Perforation" effect */}
                        <div className="absolute -left-4 -top-4 w-8 h-8 bg-slate-100 rounded-full z-10"></div>
                        <div className="absolute -right-4 -top-4 w-8 h-8 bg-slate-100 rounded-full z-10"></div>

                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-shrink-0 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                                <QRCodeDisplay
                                    value={JSON.stringify({
                                        id: passId,
                                        tid: typeof booking.temple === 'object' ? booking.temple?._id : booking.temple,
                                        dt: booking.date,
                                        sl: booking.timeSlot,
                                        v: booking.visitors
                                    })}
                                    size={160}
                                />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Scan at Gate</p>
                                <p className="font-mono text-xl font-bold text-slate-800 tracking-wider mb-2">
                                    {passId.match(/.{1,4}/g)?.join(' ')}
                                </p>
                                <p className="text-sm text-slate-500">
                                    Please show this QR code at the temple entrance. Valid only for the selected date and time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 print:hidden">
                    <button
                        onClick={handleDownload}
                        className="flex-1 bg-white text-slate-700 py-3 px-4 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </button>
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
