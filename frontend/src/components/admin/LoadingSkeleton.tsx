'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return <div className={`rounded-lg skeleton ${className}`} />;
}

export function StatCardSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
            <div className="flex items-start justify-between mb-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="w-16 h-6 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
        </motion.div>
    );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
    return (
        <tr className="border-b border-slate-100">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-slate-100 bg-white overflow-hidden"
                >
                    <Skeleton className="h-36 w-full" />
                    <div className="p-5 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 flex-1 rounded-xl" />
                            <Skeleton className="h-8 w-20 rounded-xl" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export default function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <Skeleton className="h-6 w-48 mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <TableRowSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
