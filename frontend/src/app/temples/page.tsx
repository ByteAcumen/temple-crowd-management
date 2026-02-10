'use client';

// Temple Smart E-Pass - Temples Browser Page
// Browse all temples with live crowd status and booking options

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { templesApi, Temple } from '@/lib/api';
import { TempleCard } from '@/components/ui/temple-card';
import { TrafficLight } from '@/components/ui/traffic-light';

export default function TemplesPage() {
    const [temples, setTemples] = useState<Temple[]>([]);
    const [filteredTemples, setFilteredTemples] = useState<Temple[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'GREEN' | 'ORANGE' | 'RED'>('all');

    // Fetch temples on mount
    useEffect(() => {
        async function fetchTemples() {
            try {
                const response = await templesApi.getAll();
                if (response.success) {
                    setTemples(response.data);
                    setFilteredTemples(response.data);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load temples';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTemples();
    }, []);

    // Filter temples when search or status filter changes
    useEffect(() => {
        let result = temples;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(temple =>
                temple.name.toLowerCase().includes(query) ||
                (typeof temple.location === 'object' &&
                    (temple.location?.city?.toLowerCase().includes(query) ||
                        temple.location?.state?.toLowerCase().includes(query)))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(temple => {
                const capacity = typeof temple.capacity === 'object' ? temple.capacity.total : (temple.capacity || 1);
                const occupancyPercent = ((temple.currentOccupancy || 0) / capacity) * 100;

                const status = occupancyPercent > 95 ? 'RED'
                    : occupancyPercent > 85 ? 'ORANGE'
                        : 'GREEN';
                return status === statusFilter;
            });
        }

        setFilteredTemples(result);
    }, [searchQuery, statusFilter, temples]);

    // Calculate stats
    const stats = {
        total: temples.length,
        open: temples.filter(t => t.status === 'OPEN').length,
        lowCrowd: temples.filter(t => {
            const capacity = typeof t.capacity === 'object' ? t.capacity.total : (t.capacity || 1);
            const pct = ((t.currentOccupancy || 0) / capacity * 100);
            return pct <= 85;
        }).length,
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-slate-900">Temple Smart</span>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/temples" className="text-orange-600 font-medium">Temples</Link>
                            <Link href="/live" className="text-slate-600 hover:text-slate-900">Live Status</Link>
                            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">My Bookings</Link>
                        </nav>

                        {/* CTA */}
                        <Link href="/login" className="btn-primary py-2 px-4 text-sm">
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            🛕 Explore Sacred Temples
                        </h1>
                        <p className="text-orange-100 text-lg max-w-2xl mx-auto">
                            View real-time crowd levels and book your darshan slot instantly
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap justify-center gap-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                            <span className="block text-2xl font-bold">{stats.total}</span>
                            <span className="text-sm text-orange-100">Total Temples</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                            <span className="block text-2xl font-bold text-green-300">{stats.open}</span>
                            <span className="text-sm text-orange-100">Currently Open</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
                            <span className="block text-2xl font-bold text-green-300">{stats.lowCrowd}</span>
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
                            <p className="text-slate-600 mb-4">{error}</p>
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
                            {filteredTemples.map((temple, index) => (
                                <TempleCard key={temple._id} temple={temple} index={index} />
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
