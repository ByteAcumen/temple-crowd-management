'use client';

import { motion } from 'framer-motion';

interface BarChartProps {
    data: { label: string; value: number; color?: string }[];
    maxHeight?: number;
}

export function BarChart({ data, maxHeight = 200 }: BarChartProps) {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="flex items-end justify-between gap-2 h-full w-full pt-6">
            {data.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                        {item.label}: {item.value}
                    </div>

                    <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: `${(item.value / maxValue) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1, type: "spring" }}
                        className={`w-full rounded-t-lg ${item.color || 'bg-orange-500'} bg-opacity-80 hover:bg-opacity-100 transition-all relative overflow-hidden`}
                        style={{ minHeight: '4px' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </motion.div>
                    <span className="text-xs text-slate-500 mt-2 truncate max-w-[60px]">{item.label}</span>
                </div>
            ))}
        </div>
    );
}

interface ProgressBarProps {
    label: string;
    value: number; // 0-100
    color?: string;
    subtext?: string;
}

export function ProgressBar({ label, value, color = 'bg-blue-500', subtext }: ProgressBarProps) {
    return (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-300">{label}</span>
                <span className="text-sm font-medium text-slate-400">{subtext || `${value}%`}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-2.5 rounded-full ${color}`}
                />
            </div>
        </div>
    );
}

interface DonutChartProps {
    data: { label: string; value: number; color: string }[];
    size?: number;
}

export function DonutChart({ data, size = 160 }: DonutChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
                {data.map((item, index) => {
                    const cumulativeBefore = data.slice(0, index).reduce((sum, s) => sum + s.value, 0);
                    const strokeDasharray = `${(item.value / total) * 100} 100`;
                    const strokeDashoffset = -cumulativeBefore / total * 100;

                    return (
                        <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="10"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <title>{item.label}: {item.value}</title>
                        </circle>
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{total}</span>
                <span className="text-xs text-slate-400">Total</span>
            </div>
        </div>
    );
}
