'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]';

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
        card: 'rounded-3xl'
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
    );
}

export function TicketCardSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        >
            {/* Header Section */}
            <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-300 relative p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <Skeleton className="w-16 h-5" />
                    <Skeleton className="w-20 h-5" />
                </div>
                <div>
                    <Skeleton className="w-3/4 h-6 mb-2" />
                    <Skeleton className="w-1/2 h-4" />
                </div>
            </div>

            {/* Body Section */}
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="w-1/3">
                        <Skeleton className="w-16 h-3 mb-1" />
                        <Skeleton className="w-20 h-5" />
                    </div>
                    <div className="w-1/3 text-right">
                        <Skeleton className="w-16 h-3 mb-1 ml-auto" />
                        <Skeleton className="w-12 h-5 ml-auto" />
                    </div>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-4 flex items-center justify-between">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-20 h-4" />
                </div>
            </div>
        </motion.div>
    );
}

export function DashboardStatSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <Skeleton className="w-1/2 h-6 mb-4" />
            <Skeleton className="w-3/4 h-8 mb-2" />
            <Skeleton className="w-1/3 h-4" />
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 px-8 py-6">
                    <Skeleton className="w-32 h-6" />
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i}>
                                <Skeleton className="w-20 h-4 mb-2" />
                                <Skeleton className="w-full h-12" />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="w-32 h-12 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
