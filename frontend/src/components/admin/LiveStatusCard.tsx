'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Temple } from '@/lib/api';
import { TrafficLightBadge } from '@/components/ui/traffic-light';

interface LiveStatusCardProps {
    topTemples: Temple[];
}

export default function LiveStatusCard({ topTemples }: LiveStatusCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 h-full flex flex-col relative overflow-hidden"
        >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📡</span>
                    <h3 className="font-bold text-lg">Live Crowd</h3>
                </div>
                <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.5)]" />
            </div>

            <div className="space-y-4 flex-1 relative z-10">
                {topTemples.map((temple, i) => (
                    <motion.div
                        key={temple._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                        className="bg-white/10 rounded-2xl p-4 flex items-center justify-between border border-white/5 backdrop-blur-sm transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center font-bold text-orange-200 border border-orange-500/30">
                                {i + 1}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white group-hover:text-orange-200 transition-colors">{temple.name}</p>
                                <p className="text-xs text-slate-400">
                                    {typeof temple.location === 'object' && temple.location
                                        ? (temple.location as any).city
                                        : (typeof temple.location === 'string' ? temple.location : 'India')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold font-mono text-lg tracking-tight">{(temple.live_count || 0).toLocaleString()}</p>
                            <div className="flex justify-end mt-1 transform scale-90 origin-right">
                                <TrafficLightBadge status={(temple.live_count || 0) / (typeof temple.capacity === 'number' ? temple.capacity : temple.capacity?.total || 1000) > 0.9 ? 'RED' : (temple.live_count || 0) / (typeof temple.capacity === 'number' ? temple.capacity : temple.capacity?.total || 1000) > 0.7 ? 'ORANGE' : 'GREEN'} />
                            </div>
                        </div>
                    </motion.div>
                ))}

                {topTemples.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                        <span className="text-3xl opacity-50">💤</span>
                        <p className="text-sm">No active data</p>
                    </div>
                )}
            </div>

            <Link href="/admin/live" className="mt-6 relative z-10 group">
                <button className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20 group-hover:shadow-orange-500/30 flex items-center justify-center gap-2">
                    <span>View Full Map</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
            </Link>
        </motion.div>
    );
}
