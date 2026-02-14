'use client';

// Temple Smart E-Pass - Temples Browser Page
// Browse all temples with live crowd status and booking options

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { templesApi, Temple } from '@/lib/api';
import { PublicTempleCard } from '@/components/ui/temple-card-public';
import { TrafficLight } from '@/components/ui/traffic-light';

export default function TemplesPage() {
    const [temples, setTemples] = useState<Temple[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'GREEN' | 'ORANGE' | 'RED'>('all');

    // Fetch temples on mount
    useEffect(() => {
        async function fetchTemples() {

            try {
                const response = await templesApi.getAll();


                if (response && response.success && response.data) {

                    setTemples(response.data);
                } else {
                    console.error('❌ Invalid response:', response);
                    setError('Failed to load temples');
                }
            } catch (err) {
                console.error('❌ Error fetching temples:', err);
                setError(err instanceof Error ? err.message : 'Failed to load temples');
            } finally {
                setIsLoading(false);
            }
        }
        fetchTemples();
    }, []);

    // Filter logic
    const filteredTemples = temples.filter((temple: Temple) => {
        // 1. Search Filter (Name, City, Deity)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const nameMatch = temple.name?.toLowerCase().includes(query);
            const cityMatch = (typeof temple.location === 'string' ? temple.location : temple.location?.city)?.toLowerCase().includes(query);

            if (!nameMatch && !cityMatch) return false;
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            const status = (temple as any).traffic_status || 'GREEN'; // Default if missing
            if (status !== statusFilter) return false;
        }

        return true;
    });

    // Calculate stats
    const stats = {
        total: temples.length,
        open: temples.filter((t: Temple) => t.status === 'OPEN').length,
        lowCrowd: temples.filter((t: Temple) => {
            const capacity = typeof t.capacity === 'object' ? t.capacity.total : (t.capacity || 1);
            const occupancy = t.currentOccupancy ?? 0;
            const pct = (occupancy / capacity * 100);
            return pct <= 85;
        }).length,
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative py-12 md:py-20 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600"></div>
                <div className="absolute inset-0 bg-[url('/patterns/temple-pattern.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up">
                        Explore Sacred Spaces
                    </h1>
                    <p className="text-orange-100 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-fade-in-up delay-100">
                        Discover temples, check live crowd status, and book your peaceful darshan.
                    </p>

                    {/* Quick Stats */}
                    <div className="inline-flex flex-wrap justify-center gap-4 animate-fade-in-up delay-200">
                        <div className="glass-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-md">
                            <span className="block text-2xl font-bold">{stats.total}</span>
                            <span className="text-sm text-orange-100">Temples</span>
                        </div>
                        <div className="glass-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-md">
                            <span className="block text-2xl font-bold text-green-300">{stats.open}</span>
                            <span className="text-sm text-orange-100">Open Now</span>
                        </div>
                        <div className="glass-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-md">
                            <span className="block text-2xl font-bold text-blue-300">{stats.lowCrowd}</span>
                            <span className="text-sm text-orange-100">Low Crowd</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filters Section */}
            <section className="bg-white border-b border-slate-200 py-4 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by temple name or city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 flex-shrink-0">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'GREEN', label: '🟢 Low' },
                                { key: 'ORANGE', label: '🟡 Moderate' },
                                { key: 'RED', label: '🔴 High' },
                            ].map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => setStatusFilter(filter.key as any)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === filter.key
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Temples Grid */}
            <section className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {isLoading ? (
                        // Loading Skeleton
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                                    <div className="h-48 bg-slate-200" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                                        <div className="h-2 bg-slate-200 rounded w-full" />
                                        <div className="h-10 bg-slate-200 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        // Error State
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">Failed to load temples</h3>
                            <p className="text-slate-600 mb-4">Could not connect to live server.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredTemples.length === 0 ? (
                        // Empty State
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">No temples found</h3>
                            <p className="text-slate-600">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No temples are available at the moment'}
                            </p>
                        </div>
                    ) : (
                        // Temple Cards Grid
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemples.map((temple: any, index: number) => (
                                <PublicTempleCard key={temple.temple_id || temple._id} temple={temple} index={index} />
                            ))}
                        </div>
                    )}

                    {/* Results Count */}
                    {!isLoading && !error && filteredTemples.length > 0 && (
                        <p className="text-center text-slate-500 mt-8">
                            Showing {filteredTemples.length} of {temples.length} temples
                        </p>
                    )}
                </div>
            </section>

            {/* Legend */}
            <section className="bg-white border-t border-slate-200 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                        <span className="text-slate-600 font-medium">Crowd Status:</span>
                        <div className="flex items-center gap-2">
                            <TrafficLight status="GREEN" size="sm" />
                            <span className="text-slate-600">(&lt;85% capacity)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrafficLight status="ORANGE" size="sm" />
                            <span className="text-slate-600">(85-95%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrafficLight status="RED" size="sm" />
                            <span className="text-slate-600">(&gt;95%)</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
