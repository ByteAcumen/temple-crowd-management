'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface BackendStatusBarProps {
    status: 'loading' | 'connected' | 'error' | 'demo';
    lastUpdated?: Date | string;
    dataCount?: number;
    label?: string;
    onRetry?: () => void;
}

export function BackendStatusBar({
    status,
    lastUpdated,
    dataCount,
    label = 'Backend',
    onRetry,
}: BackendStatusBarProps) {
    const statusConfig = {
        loading: {
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            dot: 'bg-amber-500 animate-pulse',
            text: 'Connecting...',
        },
        connected: {
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            dot: 'bg-emerald-500',
            text: 'Live',
        },
        error: {
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
            dot: 'bg-red-500',
            text: 'Disconnected',
        },
        demo: {
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            dot: 'bg-amber-500',
            text: 'Demo Mode',
        },
    };

    const config = statusConfig[status];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.bg} ${config.border} ${config.color}`}
            >
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span>{config.text}</span>
                {lastUpdated && status === 'connected' && (
                    <span className="text-slate-500 font-normal">
                        • {typeof lastUpdated === 'string' ? lastUpdated : new Date(lastUpdated).toLocaleTimeString()}
                    </span>
                )}
                {dataCount !== undefined && status === 'connected' && (
                    <span className="text-slate-500 font-normal">• {dataCount} records</span>
                )}
                {status === 'error' && onRetry && (
                    <button
                        onClick={onRetry}
                        className="ml-1 underline hover:no-underline font-semibold"
                    >
                        Retry
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
