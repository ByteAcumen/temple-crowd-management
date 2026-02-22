import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { Temple } from '@/lib/api';
import { TrafficLightBadge } from '@/components/ui/traffic-light';
import { motion } from 'framer-motion';

interface LiveStatusCardProps {
    topTemples: Temple[];
}

export default function LiveStatusCard({ topTemples }: LiveStatusCardProps) {
    return (
        <GlassCard className="h-full flex flex-col relative overflow-hidden p-6">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-orange-400/20 to-rose-400/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📡</span>
                    <h3 className="font-bold text-lg text-slate-900">Live Crowd</h3>
                </div>
                <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
            </div>

            <div className="space-y-4 flex-1 relative z-10 overflow-y-auto custom-scrollbar pr-2">
                {topTemples.map((temple, i) => (
                    <motion.div
                        key={temple._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        className="bg-white/70 rounded-2xl p-4 flex items-center justify-between border border-white/60 backdrop-blur-md transition-all cursor-pointer group shadow-[0_4px_12px_rgb(0,0,0,0.03)] hover:shadow-lg hover:shadow-orange-500/5 ring-1 ring-slate-100/50 hover:ring-orange-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-600/10 flex items-center justify-center font-bold text-orange-600 border border-orange-500/20">
                                {i + 1}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">{temple.name}</p>
                                <p className="text-xs text-slate-500">
                                    {typeof temple.location === 'object' && temple.location
                                        ? (temple.location as any).city
                                        : (typeof temple.location === 'string' ? temple.location : 'India')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold font-mono text-lg tracking-tight text-slate-900 mb-1">{(temple.live_count || 0).toLocaleString()}</p>
                            <div className="flex justify-end transform scale-90 origin-right">
                                <TrafficLightBadge status={(temple.live_count || 0) / (typeof temple.capacity === 'number' ? temple.capacity : (temple.capacity?.total || 1000)) > 0.9 ? 'RED' : (temple.live_count || 0) / (typeof temple.capacity === 'number' ? temple.capacity : (temple.capacity?.total || 1000)) > 0.7 ? 'ORANGE' : 'GREEN'} />
                            </div>
                        </div>
                    </motion.div>
                ))}

                {topTemples.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-60">
                        <span className="text-3xl">📡</span>
                        <p className="text-sm font-medium">No live temples active</p>
                    </div>
                )}
            </div>

            <Link href="/admin/live" className="mt-6 relative z-10 group">
                <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200">
                    <span>View Live Map</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
            </Link>
        </GlassCard>
    );
}
