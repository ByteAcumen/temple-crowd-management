'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';

interface LiveCapacityEyeProps {
    crowdCount: number;
    capacity: number;
    cameraName?: string;
    isLive?: boolean;
}

export default function LiveCapacityEye({
    crowdCount = 0,
    capacity = 10000,
    cameraName = "Main Entrance - Gate 1",
    isLive = true
}: LiveCapacityEyeProps) {
    const percentage = Math.min((crowdCount / capacity) * 100, 100);
    const [pulse, setPulse] = useState(false);

    // Simulated pulse effect for "Live" indicator
    useEffect(() => {
        const interval = setInterval(() => {
            setPulse(prev => !prev);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const statusColor = percentage > 90 ? 'red'
        : percentage > 70 ? 'orange'
            : 'emerald';

    return (
        <GlassCard className="h-full relative overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500' : 'bg-slate-300'}`} />
                        {isLive && (
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-400 animate-ping opacity-75" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-slate-900 font-bold text-sm tracking-wide">LIVE VISION EYE</h3>
                        <p className="text-xs text-slate-500 font-mono">{cameraName}</p>
                    </div>
                </div>
                <div className="px-2 py-1 bg-white rounded border border-slate-200 text-[10px] text-slate-500 font-mono shadow-sm">
                    RTSP-01 • 1080p
                </div>
            </div>

            {/* Main Visual Area */}
            <div className="flex-1 relative bg-black group overflow-hidden">
                {/* Mock Video Feed Simulation (CSS Pattern) */}
                {isLive && (
                    <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
                        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-black to-black" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150" />
                    </div>
                )}
                {/* Placeholder for Video Stream */}
                {/* Placeholder for Video Stream / Offline State */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20" style={{ display: isLive ? 'none' : 'flex' }}>
                    <div className="text-center space-y-3">
                        <div className="relative inline-flex">
                            <span className="text-5xl opacity-20 text-red-500 animate-pulse">●</span>
                            <span className="absolute inset-0 text-5xl opacity-20 text-red-500 blur-xl animate-pulse">●</span>
                        </div>
                        <div>
                            <p className="text-red-500/80 font-mono text-xs tracking-widest uppercase mb-1">Signal Lost</p>
                            <p className="text-slate-500 text-sm font-mono">Attempting to reconnect...</p>
                        </div>
                    </div>
                    {/* Scanlines Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
                </div>

                {/* Simulated Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

                {/* Animated Scanner Line */}
                {/* Animated Scanner Line */}
                {isLive && (
                    <motion.div
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10 pointer-events-none"
                    />
                )}

                {/* Bounding Box Simulation (Dynamic) */}
                {isLive && (
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-x-10 inset-y-16 border border-dashed border-emerald-500/30 rounded-lg flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded border border-emerald-500/30 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-emerald-400 font-mono text-[10px] tracking-wider">AI ANALYSIS ACTIVE</span>
                        </div>
                    </motion.div>
                )}

                {/* Stats Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Current Occupancy</p>
                            <div className="flex items-baseline gap-2">
                                <motion.span
                                    className="text-4xl font-black text-white tracking-tight"
                                    key={crowdCount}
                                    initial={{ scale: 1.2, color: '#fff' }}
                                    animate={{ scale: 1, color: '#fff' }}
                                >
                                    {crowdCount.toLocaleString()}
                                </motion.span>
                                <span className="text-sm text-slate-400 font-medium">/ {capacity.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Circular Guage Simulation */}
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-800"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <motion.path
                                    className={`${statusColor === 'red' ? 'text-red-500' : statusColor === 'orange' ? 'text-orange-500' : 'text-emerald-500'}`}
                                    initial={{ strokeDasharray: "0, 100" }}
                                    animate={{ strokeDasharray: `${percentage}, 100` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-[10px] font-bold ${statusColor === 'red' ? 'text-red-400' : statusColor === 'orange' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                    {Math.round(percentage)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <motion.div
                            className={`h-full ${statusColor === 'red' ? 'bg-gradient-to-r from-red-600 to-red-400' : statusColor === 'orange' ? 'bg-gradient-to-r from-orange-600 to-orange-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8 }}
                        />
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
