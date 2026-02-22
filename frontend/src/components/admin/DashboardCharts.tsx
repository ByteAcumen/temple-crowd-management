'use client';

import { motion } from 'framer-motion';
import { useMemo, memo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

// Types
interface DailyTrend {
    _id: string; // "YYYY-MM-DD"
    count: number;
}

interface RevenueData {
    _id: string; // Temple Name
    revenue: number;
    bookings: number;
}

interface DashboardChartsProps {
    dailyTrends: DailyTrend[];
    revenueByTemple: RevenueData[];
    dateRange: string;
    onRangeChange: (range: string) => void;
}

import { GlassCard } from '@/components/ui/GlassCard';

function DashboardChartsBase({ dailyTrends, revenueByTemple, dateRange, onRangeChange }: DashboardChartsProps) {
    const chartData = useMemo(() => {
        if (!dailyTrends) return [];
        return dailyTrends
            .map(d => ({
                date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: d._id,
                value: d.count
            }))
            .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
    }, [dailyTrends]);

    const revenueData = useMemo(() => {
        if (!revenueByTemple) return [];
        return revenueByTemple.slice(0, 5).map(d => ({
            name: d._id,
            value: d.revenue
        }));
    }, [revenueByTemple]);

    console.log('📈 DashboardCharts Render:', { dailyTrends, revenueByTemple, chartData, revenueData });

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Trend Chart Card */}
            <GlassCard className="p-6 h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Booking Trends</h3>
                        <p className="text-sm text-slate-500">Visitor Traffic Analysis</p>
                    </div>
                    {/* Range Filter */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {['7d', '30d', '90d'].map((range) => (
                            <button
                                key={range}
                                onClick={() => onRangeChange(range)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${dateRange === range
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Fixed height container */}
                <div className="w-full h-[360px] mt-4">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10 }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', color: '#1E293B', fontWeight: 600 }}
                                    itemStyle={{ color: '#ea580c' }}
                                    cursor={{ stroke: '#f97316', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center flex-col text-slate-400">
                            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm font-medium">No booking data yet</p>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Revenue Chart Card */}
            <GlassCard className="p-6 h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Top Revenue</h3>
                        <p className="text-sm text-slate-500">By Temple</p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                {/* Fixed height container */}
                <div className="w-full h-[360px] mt-4">
                    {revenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: '#1E293B' }}
                                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                                    {revenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center flex-col text-slate-400">
                            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">No revenue data yet</p>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}

const DashboardCharts = memo(DashboardChartsBase);
export default DashboardCharts;
