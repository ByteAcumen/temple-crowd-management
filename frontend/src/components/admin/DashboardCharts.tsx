'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
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
}

export default function DashboardCharts({ dailyTrends, revenueByTemple }: DashboardChartsProps) {

    const chartData = useMemo(() => {
        if (!dailyTrends) return [];
        return dailyTrends
            .map(d => ({
                date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: d.count
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort if needed, though usually date string sort works differently
            .slice(-7);
    }, [dailyTrends]);

    const revenueData = useMemo(() => {
        if (!revenueByTemple) return [];
        return revenueByTemple.slice(0, 5).map(d => ({
            name: d._id,
            value: d.revenue
        }));
    }, [revenueByTemple]);

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Trend Chart Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-80 flex flex-col"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Booking Trends</h3>
                        <p className="text-sm text-slate-500">Last 7 Days</p>
                    </div>
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ stroke: '#F97316', strokeWidth: 1, strokeDasharray: '5 5' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Revenue Chart Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-80 flex flex-col"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Top Revenue</h3>
                        <p className="text-sm text-slate-500">By Temple</p>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => `₹${value.toLocaleString()}`}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {revenueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'][index % 5]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
