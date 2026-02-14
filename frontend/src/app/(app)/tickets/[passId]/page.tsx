'use client';

// Temple Smart E-Pass - Ticket/E-Pass Viewer Page
// Premium Design: Boarding Pass Style, Animated Gradient, Clear QR

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { bookingsApi, Booking } from '@/lib/api';
import { QRCodeDisplay } from '@/components/ui/qr-code-display';
import { useTempleLiveData } from '@/hooks/use-live-data';
import { motion } from 'framer-motion';

// Status badge component
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmed' },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
        used: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Used' },
        expired: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Expired' },
        cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.bg} ${config.text}`}>
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
    const [isDownloading, setIsDownloading] = useState(false);
    const [showToast, setShowToast] = useState(false);
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

    // Handle download as PDF (via print)
    const handleDownload = () => {
        window.print();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
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
            <div className="min-h-screen gradient-animated flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <p className="text-white font-medium animate-pulse">Retrieving E-Pass...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !booking) {
        return (
            <div className="min-h-screen gradient-animated flex items-center justify-center p-4">
                <div className="glass rounded-[2rem] p-8 text-center max-w-md shadow-2xl border border-white/20">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">E-Pass Not Found</h2>
                    <p className="text-slate-500 mb-6">{error || 'The E-Pass you\'re looking for doesn\'t exist or has been removed.'}</p>
                    <Link href="/dashboard" className="inline-flex items-center justify-center px-6 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-animated p-4 md:p-8 font-sans overflow-x-hidden selection:bg-orange-500/30">
            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="font-bold text-sm">Download Started!</p>
                </div>
            )}

            <div className="max-w-md mx-auto relative z-10">
                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 print:hidden font-bold transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* E-Pass Card - Boarding Pass Style */}
                    <div ref={printRef} className="bg-white rounded-[2rem] shadow-2xl overflow-hidden relative print:shadow-none print:break-inside-avoid">
                        {/* Top Section - Temple Image/Header */}
                        <div className="relative h-56 bg-gradient-to-br from-orange-500 to-red-600 overflow-hidden p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-[url('/patterns/temple-pattern.png')] opacity-20 mix-blend-overlay"></div>
                            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-orange-100 font-bold tracking-widest text-xs uppercase mb-1">Official E-Pass</p>
                                    <h1 className="text-3xl font-black text-white leading-none tracking-tight">
                                        {typeof booking.temple === 'object' ? booking.temple?.name : booking.temple || 'Temple'}
                                    </h1>
                                </div>
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain opacity-90" onError={(e) => e.currentTarget.style.display = 'none'} />
                                </div>
                            </div>

                            <div className="relative z-10 flex items-end justify-between">
                                <div>
                                    <p className="text-orange-100/80 text-xs font-bold uppercase tracking-wide mb-0.5">Location</p>
                                    <p className="text-white font-medium text-sm">
                                        {typeof booking.temple === 'object' && booking.temple?.location
                                            ? (typeof booking.temple.location === 'object' ? `${booking.temple.location.city}, ${booking.temple.location.state}` : booking.temple.location)
                                            : 'India'}
                                    </p>
                                </div>
                                <StatusBadge status={booking.status || 'confirmed'} />
                            </div>
                        </div>

                        {/* Middle Section - Details */}
                        <div className="px-8 py-8 relative bg-white">
                            {/* Cutout Circles for "Perforation" effect */}
                            <div className="absolute -left-4 top-[-16px] w-8 h-8 bg-slate-900 rounded-full shadow-inner"></div>
                            <div className="absolute -right-4 top-[-16px] w-8 h-8 bg-slate-900 rounded-full shadow-inner"></div>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Date</p>
                                    <p className="font-black text-slate-800 text-lg">
                                        {new Date(booking.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {new Date(booking.date).toLocaleDateString('en-US', { year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Time Slot</p>
                                    <p className="font-black text-slate-800 text-lg">
                                        {((booking as any).slot || booking.timeSlot)?.split('-')[0] || '--:--'}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {(booking as any).slot || booking.timeSlot || 'Not scheduled'}
                                    </p>
                                </div>
                                <div className="col-span-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Visitors</p>
                                        <p className="font-black text-slate-800 text-lg">{booking.visitors}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Primary Guest</p>
                                        <p className="font-bold text-slate-800 text-sm">{booking.userName || 'Guest'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Visitor Details List */}
                            {booking.visitorDetails && booking.visitorDetails.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Group Members</p>
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                    </div>
                                    <div className="space-y-2">
                                        {booking.visitorDetails.map((visitor, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 print:bg-white print:border-slate-200">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 text-sm truncate">{visitor.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        Age: {visitor.age}
                                                        {visitor.idType && visitor.idType !== 'NONE' && visitor.idNumber && (
                                                            <span className="ml-1">• {visitor.idType}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-center">
                                <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Valid For</p>
                                    <p className="font-bold text-slate-900 text-lg">
                                        {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                    <p className="text-xs text-orange-600 font-bold mt-1">
                                        {new Date(booking.date).toDateString() === new Date().toDateString() ? '● Valid Today' : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Live Crowd Status */}
                            {liveData && liveData.status && (
                                <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between mt-8 mb-8 print:hidden shadow-lg shadow-slate-900/10">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex h-3 w-3">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveData.status === 'RED' ? 'bg-red-500' : liveData.status === 'ORANGE' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-3 w-3 ${liveData.status === 'RED' ? 'bg-red-500' : liveData.status === 'ORANGE' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Crowd</span>
                                    </div>
                                    <span className={`text-sm font-bold ${liveData.status === 'RED' ? 'text-red-400' :
                                        liveData.status === 'ORANGE' ? 'text-orange-400' : 'text-emerald-400'
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
                            <div className="absolute -left-4 -top-4 w-8 h-8 bg-slate-900 rounded-full z-10 shadow-inner"></div>
                            <div className="absolute -right-4 -top-4 w-8 h-8 bg-slate-900 rounded-full z-10 shadow-inner"></div>

                            <div className="flex flex-col items-center gap-6">
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                                    <QRCodeDisplay
                                        value={JSON.stringify({
                                            id: passId
                                        })}
                                        size={180}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Entry Token</p>
                                    <p className="font-mono text-xl font-bold text-slate-800 tracking-widest mb-2 bg-slate-200/50 px-4 py-1 rounded-lg inline-block border border-slate-200">
                                        {passId.match(/.{1,4}/g)?.join(' ')}
                                    </p>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                                        Scan at the gate. Valid primarily for the selected slot.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 print:hidden">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`flex-1 py-4 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 text-sm ${isDownloading
                            ? 'bg-orange-500 text-white cursor-wait'
                            : 'bg-white text-slate-800 hover:bg-slate-50'
                            }`}
                    >
                        {isDownloading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Save PDF
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 bg-white/[0.1] backdrop-blur-md text-white border border-white/20 py-4 px-4 rounded-xl font-bold hover:bg-white/[0.2] transition-colors flex items-center justify-center gap-2 text-sm shadow-lg active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Share Pass
                    </button>
                    <button
                        onClick={handlePrint}
                        className="w-14 h-14 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center shadow-lg active:scale-95"
                        title="Print"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </button>
                </div>

                {/* Safety Tips */}
                <div className="mt-8 text-center print:hidden opacity-80">
                    <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-2">Temple Etiquette</p>
                    <p className="text-white/90 text-sm">Please arrive 15 mins early • Carry ID Proof • Dress Modestly</p>
                </div>
            </div>

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
                    .gradient-animated {
                         background: white !important;
                    }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
