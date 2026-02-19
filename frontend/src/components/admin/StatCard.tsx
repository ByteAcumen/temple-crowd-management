import { GlassCard } from '@/components/ui/GlassCard';

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
    bgLight?: string; // Kept for backward compat, but unused in dark mode
    delay?: number;
}

const colorMap = {
    orange: {
        accent: 'from-orange-500/10 to-orange-600/5',
        icon: 'bg-orange-50 text-orange-600 border border-orange-100',
        text: 'text-orange-600'
    },
    blue: {
        accent: 'from-blue-500/10 to-blue-600/5',
        icon: 'bg-blue-50 text-blue-600 border border-blue-100',
        text: 'text-blue-600'
    },
    green: {
        accent: 'from-emerald-500/10 to-emerald-600/5',
        icon: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        text: 'text-emerald-600'
    },
    purple: {
        accent: 'from-purple-500/10 to-purple-600/5',
        icon: 'bg-purple-50 text-purple-600 border border-purple-100',
        text: 'text-purple-600'
    },
    red: {
        accent: 'from-red-500/10 to-red-600/5',
        icon: 'bg-red-50 text-red-600 border border-red-100',
        text: 'text-red-600'
    },
    amber: {
        accent: 'from-amber-500/10 to-amber-600/5',
        icon: 'bg-amber-50 text-amber-600 border border-amber-100',
        text: 'text-amber-600'
    },
};

export function StatCard({ icon, title, label, value, subtext, trend, color, delay = 0 }: StatCardProps) {
    const colors = colorMap[color] || colorMap.orange;
    const displayLabel = label || title || '';

    return (
        <GlassCard
            className="p-6 group"
            delay={delay}
            hoverEffect={true}
        >
            {/* Ambient Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${colors.accent} blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${colors.icon}`}>
                        {icon}
                    </div>
                    {trend && (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${trend.positive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </span>
                    )}
                </div>

                <div>
                    <p className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wider">{displayLabel}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 tracking-tight tabular-nums shadow-sm">{value}</p>
                        {subtext && <span className={`text-xs font-medium ${colors.text} opacity-80`}>{subtext}</span>}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
