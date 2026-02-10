'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';

export default function SystemHealth() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHealth();
        // Poll every 30 seconds
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await adminApi.getSystemHealth();
            if (res.success) {
                setHealth(res.data);
            }
        } catch (err) {
            console.error('Health check failed', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-48 bg-slate-100 rounded-2xl"></div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'text-emerald-500';
            case 'disconnected': return 'text-red-500';
            case 'healthy': return 'text-emerald-500';
            default: return 'text-slate-400';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-2xl">🖥️</span> System Health
                    </h2>
                    <p className="text-slate-500 text-sm">Real-time infrastructure status</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${health?.status === 'healthy'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {health?.status?.toUpperCase() || 'UNKNOWN'}
                </div>
            </div>

            <div className="space-y-4">
                {/* Database Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-xl border border-slate-100">🗄️</div>
                        <div>
                            <p className="font-semibold text-slate-800">Database</p>
                            <p className="text-xs text-slate-500">MongoDB Clusters</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${health?.database === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className={`text-sm font-medium ${getStatusColor(health?.database || '')}`}>
                            {health?.database === 'connected' ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* API Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-xl border border-slate-100">⚡</div>
                        <div>
                            <p className="font-semibold text-slate-800">API Gateway</p>
                            <p className="text-xs text-slate-500">Uptime: {health?.uptime_formatted || '0h 0m'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-emerald-500">Active</span>
                    </div>
                </div>

                {/* Redis/Crowd Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-xl border border-slate-100">📡</div>
                        <div>
                            <p className="font-semibold text-slate-800">Live Services</p>
                            <p className="text-xs text-slate-500">Redis & Socket.IO</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${health?.redis === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className={`text-sm font-medium ${getStatusColor(health?.redis || '')}`}>
                            {health?.redis === 'connected' ? 'Synced' : 'Error'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-mono">Last Updated: {new Date().toLocaleTimeString()}</p>
            </div>
        </motion.div>
    );
}
