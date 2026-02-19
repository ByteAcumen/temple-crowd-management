'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';

interface RevenueCardProps {
    revenue: number;
    growth: number;
}

export function RevenueCard({ revenue, growth }: RevenueCardProps) {
    // Calculate last week's revenue based on growth percentage to avoid NaN
    const lastWeekRevenue = growth !== 0 ? revenue / (1 + growth / 100) : revenue;

    return (
        <GlassCard className="flex-1 flex flex-col justify-center p-6 bg-white/60 border-orange-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Total Revenue</p>
                    <div className="p-1.5 bg-green-100 text-green-700 rounded text-xs font-bold flex items-center gap-1">
                        <span>↑</span> {growth.toFixed(1)}%
                    </div>
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">₹{(revenue / 1000).toFixed(1)}k</h3>
                <p className="text-sm text-slate-400">vs. ₹{(lastWeekRevenue / 1000).toFixed(1)}k last week</p>
            </div>

            {/* Decorative Background Blob */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/15 transition-colors"></div>

            <div className="mt-6 flex gap-3 relative z-10">
                <Link href="/admin/bookings?action=new" className="flex-1 py-2.5 bg-slate-900 text-white font-semibold rounded-lg text-center text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95">
                    + New Booking
                </Link>
                <Link href="/admin/live" className="flex-1 py-2.5 bg-white text-slate-600 font-semibold rounded-lg text-center text-sm hover:bg-slate-50 transition-colors border border-slate-200 hover:border-slate-300 active:scale-95">
                    Map View
                </Link>
            </div>
        </GlassCard>
    );
}
