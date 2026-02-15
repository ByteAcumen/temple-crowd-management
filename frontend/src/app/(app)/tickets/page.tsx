'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingsApi, Booking } from '@/lib/api';
import { motion } from 'framer-motion';

export default function TicketsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchBookings() {
            try {
                const response = await bookingsApi.getMyBookings();
                if (response.success) {
                    setBookings(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchBookings();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-animated flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <p className="text-white font-medium animate-pulse">Loading your tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-animated py-8 px-4 md:py-12 md:px-6">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
                <div className="absolute top-[-5%] right-[-10%] w-[600px] h-[600px] bg-red-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-reverse" />
                <div className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] bg-yellow-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float delay-500" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
                            My Tickets
                        </h1>
                        <p className="text-white/80 text-sm md:text-base font-medium mt-1">
                            Manage your upcoming and past temple visits
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Link
                            href="/booking"
                            className="glass px-6 py-3 rounded-2xl font-bold text-sm md:text-base flex items-center gap-2 shadow-lg border border-white/20 hover:bg-white/30 transition-all active:scale-95 text-white"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Booking
                        </Link>
                    </motion.div>
                </div>

                {bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-20 glass rounded-[2.5rem] shadow-2xl border border-white/20"
                    >
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-lg">
                            🎫
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">No tickets found</h3>
                        <p className="text-white/70 text-sm md:text-base mb-8 max-w-md mx-auto font-medium">
                            You haven&apos;t booked any darshan slots yet. Plan your spiritual journey today.
                        </p>
                        <Link
                            href="/booking"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            Book Now
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking, idx) => (
                            <motion.div
                                key={booking._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                            >
                                <Link
                                    href={`/tickets/${booking.passId}`}
                                    className="block glass rounded-[2rem] shadow-lg hover:shadow-2xl transition-all border border-white/20 overflow-hidden group h-full flex flex-col backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="h-36 bg-gradient-to-br from-orange-500 to-red-600 relative overflow-hidden p-6 flex flex-col justify-between">
                                        <div className="absolute inset-0 bg-[url('/patterns/temple-pattern.png')] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10 flex justify-between items-start text-white">
                                            <span className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
                                                E-Pass
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-lg shadow-sm ${booking.status === 'CONFIRMED' ? 'bg-emerald-500 text-white' :
                                                    booking.status === 'USED' ? 'bg-blue-500 text-white' :
                                                        booking.status === 'CANCELLED' ? 'bg-red-500 text-white' :
                                                            booking.status === 'EXPIRED' ? 'bg-slate-500 text-white' :
                                                                'bg-white text-orange-600'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="relative z-10 text-white">
                                            <h3 className="font-black text-xl leading-tight truncate group-hover:scale-105 transition-transform">
                                                {typeof booking.temple === 'object' ? booking.temple?.name : booking.templeName || 'Temple'}
                                            </h3>
                                            <p className="text-orange-100 text-sm font-medium mt-1">
                                                {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-6 relative flex-grow flex flex-col justify-between bg-white/80 backdrop-blur-md">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Time Slot</p>
                                                <p className="font-bold text-slate-900 text-base">{booking.timeSlot}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Visitors</p>
                                                <p className="font-bold text-slate-900 text-base">{booking.visitors}</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-dashed border-slate-200 pt-4 flex items-center justify-between mt-auto">
                                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">ID: {booking.passId.slice(0, 8)}...</span>
                                            <span className="text-sm font-bold text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                View Details
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </span>
                                        </div>
                                        {/* Cutout circles for ticket effect */}
                                        <div className="absolute -left-3 top-[-16px] w-6 h-6 bg-gradient-to-br from-orange-200 to-red-200 rounded-full shadow-inner"></div>
                                        <div className="absolute -right-3 top-[-16px] w-6 h-6 bg-gradient-to-br from-orange-200 to-red-200 rounded-full shadow-inner"></div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(20px, -20px) rotate(2deg); }
                    50% { transform: translate(-20px, 20px) rotate(-2deg); }
                    75% { transform: translate(10px, 10px) rotate(1deg); }
                }
                @keyframes float-reverse {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(-20px, 20px) rotate(-2deg); }
                    50% { transform: translate(20px, -20px) rotate(2deg); }
                    75% { transform: translate(-10px, -10px) rotate(-1deg); }
                }
                .animate-float {
                    animation: float 20s ease-in-out infinite;
                }
                .animate-float-reverse {
                    animation: float-reverse 20s ease-in-out infinite;
                }
                .delay-500 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
}
