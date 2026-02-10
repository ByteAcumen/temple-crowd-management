'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
    icon: React.ReactNode;
    title?: string;
    label?: string;
    value: string | number;
    subtext?: string;
    trend?: {
        value: string;
        positive: boolean;
    };
    color: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'amber';
    bgLight?: string;
    delay?: number;
}

const colorMap = {
    orange: { accent: 'bg-orange-500', icon: 'bg-orange-50 text-orange-600' },
    blue: { accent: 'bg-blue-500', icon: 'bg-blue-50 text-blue-600' },
    green: { accent: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
    purple: { accent: 'bg-purple-500', icon: 'bg-purple-50 text-purple-600' },
    red: { accent: 'bg-red-500', icon: 'bg-red-50 text-red-600' },
    amber: { accent: 'bg-amber-500', icon: 'bg-amber-50 text-amber-600' },
};

export function StatCard({ icon, title, label, value, subtext, trend, color, bgLight, delay = 0 }: StatCardProps) {
    const colors = colorMap[color] || colorMap.orange;
    const displayLabel = label || title || '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl bg-white border border-slate-100/80 shadow-lg shadow-slate-200/40 p-6 group admin-card"
        >
            <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.07] blur-2xl transition-all duration-500 group-hover:opacity-15 ${colors.accent}`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.icon}`}>
                        {icon}
                    </div>
                    {trend && (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${trend.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </span>
                    )}
                </div>

                <div>
                    <p className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wider">{displayLabel}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{value}</p>
                        {subtext && <span className="text-xs font-medium text-slate-400">{subtext}</span>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
