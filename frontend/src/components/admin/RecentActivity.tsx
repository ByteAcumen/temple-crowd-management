'use client';

import { motion } from 'framer-motion';
import { Booking } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface RecentActivityProps {
    bookings: Booking[];
}

export default function RecentActivity({ bookings }: RecentActivityProps) {
    if (!bookings || bookings.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center text-slate-400 flex flex-col items-center justify-center h-full gap-3">
                <span className="text-4xl opacity-20">📅</span>
                <p>No recent activity</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col h-full relative group">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
                </div>
                <span className="px-3 py-1 bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border border-orange-100 rounded-full text-xs font-bold shadow-sm">
                    Live Updates
                </span>
            </div>

            {/* List */}
            <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                {bookings.map((booking, i) => (
                    <motion.div
                        key={booking._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-2xl hover:bg-slate-50 transition-all flex gap-4 items-center group/item cursor-default border border-transparent hover:border-slate-100"
                    >
                        {/* Status Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/item:scale-110 ${booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                                booking.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                                    booking.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' :
                                        'bg-amber-50 text-amber-600'
                            }`}>
                            {booking.status === 'CONFIRMED' ? <span className="text-xl">✅</span> :
                                booking.status === 'CANCELLED' ? <span className="text-xl">❌</span> :
                                    booking.status === 'COMPLETED' ? <span className="text-xl">🏁</span> :
                                        <span className="text-xl">⏳</span>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-slate-900 truncate pr-2">
                                    {booking.userName || (typeof booking.user === 'object' ? booking.user?.name : booking.user) || 'Unknown User'}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                    {booking.createdAt ? formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true }) : 'Just now'}
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                                <span className={`font-bold ${booking.status === 'CONFIRMED' ? 'text-emerald-600' :
                                        booking.status === 'CANCELLED' ? 'text-red-600' :
                                            'text-slate-600'
                                    }`}>
                                    {booking.status === 'CONFIRMED' ? 'Booked' : booking.status}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>{booking.visitors} visitors</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="font-medium text-slate-700">
                                    {booking.templeName || (typeof booking.temple === 'object' ? booking.temple?.name : 'Temple')}
                                </span>
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 backdrop-blur-sm relative z-20">
                <Link href="/admin/bookings" className="block w-full">
                    <button className="w-full py-3 text-sm font-bold text-slate-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-100 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group/btn">
                        View All Activity
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                </Link>
            </div>
        </div>
    );
}
