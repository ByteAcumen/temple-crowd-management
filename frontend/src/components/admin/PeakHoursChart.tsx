'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface PeakHoursProps {
    data: Array<{
        _id: string; // Time slot "10:00 - 11:00"
        count: number;
        total_visitors: number;
    }>;
}

export default function PeakHoursChart({ data }: PeakHoursProps) {
    return (
        <GlassCard className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Peak Hours</h3>
                    <p className="text-sm text-slate-500">Most Busiest Time Slots</p>
                </div>
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative">
                {data && data.length > 0 ? (
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="_id"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10 }}
                                    interval={0}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: '#1E293B' }}
                                />
                                <Bar dataKey="total_visitors" radius={[4, 4, 0, 0]} barSize={40}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 opacity-60">
                        <span className="text-4xl">🕰️</span>
                        <p className="text-sm font-medium">No peak hour data available</p>
                        <p className="text-xs text-slate-400">Bookings will appear here</p>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
