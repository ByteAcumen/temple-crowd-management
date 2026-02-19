'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';

interface Alert {
    id: string;
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    timestamp: string;
    templeName?: string;
}

interface DashboardAlertsProps {
    alerts: Alert[];
}

export default function DashboardAlerts({ alerts }: DashboardAlertsProps) {
    return (
        <GlassCard className="h-full flex flex-col relative overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-slate-900 font-bold text-sm tracking-wide">SYSTEM ALERTS</h3>
                        <p className="text-xs text-slate-500 font-mono">Real-time Operational Issues</p>
                    </div>
                </div>
                {alerts.length > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                        {alerts.length} Active
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <svg className="w-12 h-12 mb-3 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">All Systems Operational</p>
                        <p className="text-xs">No active alerts reported</p>
                    </div>
                ) : (
                    alerts.map((alert, idx) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-4 rounded-xl border flex gap-4 ${alert.type === 'CRITICAL'
                                    ? 'bg-red-50 border-red-100'
                                    : alert.type === 'WARNING'
                                        ? 'bg-orange-50 border-orange-100'
                                        : 'bg-blue-50 border-blue-100'
                                }`}
                        >
                            <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${alert.type === 'CRITICAL' ? 'bg-red-500 animate-ping' : alert.type === 'WARNING' ? 'bg-orange-500' : 'bg-blue-500'
                                }`} />

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm font-bold ${alert.type === 'CRITICAL' ? 'text-red-700' : alert.type === 'WARNING' ? 'text-orange-700' : 'text-blue-700'
                                        }`}>
                                        {alert.templeName ? `${alert.templeName}: ` : ''}{alert.type}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-mono table-cell">{alert.timestamp}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {alert.message}
                                </p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}
