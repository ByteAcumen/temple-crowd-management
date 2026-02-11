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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Loading your tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Tickets</h1>
                        <p className="text-slate-600">Manage your upcoming and past temple visits</p>
                    </div>
                    <Link href="/booking" className="btn-primary flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Booking
                    </Link>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            🎫
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No tickets found</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">You haven&apos;t booked any darshan slots yet. Plan your spiritual journey today.</p>
                        <Link href="/booking" className="btn-primary inline-flex">
                            Book Now
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <motion.div
                                key={booking._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Link
                                    href={`/tickets/${booking.passId}`}
                                    className="block bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all border border-slate-100 overflow-hidden group h-full flex flex-col"
                                >
                                    <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 relative overflow-hidden p-6 flex flex-col justify-between">
                                        <div className="absolute inset-0 bg-[url('/patterns/temple-pattern.png')] opacity-10"></div>
                                        <div className="relative z-10 flex justify-between items-start text-white">
                                            <span className="bg-white/20 backdrop-blur rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wider">E-Pass</span>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded bg-white text-orange-600`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="relative z-10 text-white">
                                            <h3 className="font-bold text-lg leading-tight truncate">
                                                {typeof booking.temple === 'object' ? booking.temple?.name : 'Temple'}
                                            </h3>
                                            <p className="text-orange-100 text-sm">
                                                {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-6 relative flex-grow flex flex-col justify-between">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase">Time Slot</p>
                                                <p className="font-semibold text-slate-800">{booking.timeSlot}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 uppercase">Visitors</p>
                                                <p className="font-semibold text-slate-800">{booking.visitors}</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-dashed border-slate-200 pt-4 flex items-center justify-between mt-auto">
                                            <span className="text-xs font-mono text-slate-400">ID: {booking.passId.slice(0, 8)}...</span>
                                            <span className="text-sm font-medium text-orange-600 group-hover:underline">View Details &rarr;</span>
                                        </div>
                                        {/* Circles for ticket effect */}
                                        <div className="absolute -left-3 top-[-12px] w-6 h-6 bg-slate-50 rounded-full"></div>
                                        <div className="absolute -right-3 top-[-12px] w-6 h-6 bg-slate-50 rounded-full"></div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
