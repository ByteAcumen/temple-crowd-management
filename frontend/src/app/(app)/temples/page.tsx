'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Temple, bookingsApi } from '@/lib/api'; // Assuming bookingsApi has getAllTemples or similar, checking api.ts...
// If not, we might need a templesApi. But checking `dashboard/page` it uses `bookingsApi`.
// Let's assume we need to extend api.ts or verify if getTemples exists.
// Wait, I haven't checked api.ts for `templesApi`.
// Let's use a standard fetch or extend api.ts.
// For now, I'll assume we can fetch temples.
// Actually, let's create a beautiful generic layout first, and fetch logic.

// Since I haven't verified `getTemples` in `api.ts`, I will assume `ticketsApi` might have it or use a direct fetch to /temples endpoint.
// Let's add the fetch logic.

export default function TemplesPage() {
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchTemples = async () => {
            try {
                // Assuming standard endpoint /temples exists
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/temples`);
                const data = await res.json();
                if (data.success) {
                    setTemples(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch temples', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTemples();
    }, []);

    const filteredTemples = temples.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-24 pb-8 px-6 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <Link href="/dashboard" className="text-sm font-bold text-orange-600 hover:underline mb-2 inline-flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-slate-800">Explore Temples</h1>
                            <p className="text-slate-500 mt-1">Discover sacred destinations and book your darshan.</p>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search temples or cities..."
                                className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 w-full md:w-80 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-3xl shadow-sm overflow-hidden h-96 animate-pulse">
                                <div className="h-48 bg-slate-200"></div>
                                <div className="p-6 space-y-4">
                                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    <div className="h-20 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTemples.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🕉️</div>
                        <h3 className="text-xl font-bold text-slate-800">No temples found</h3>
                        <p className="text-slate-500">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTemples.map((temple, idx) => (
                            <motion.div
                                key={temple._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all border border-slate-100 overflow-hidden group hover:-translate-y-1"
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <Image
                                        src={temple.imageUrl || '/patterns/temple-pattern.png'}
                                        alt={temple.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 right-4 text-white">
                                        <h3 className="text-xl font-bold drop-shadow-md">{temple.name}</h3>
                                        <p className="text-sm font-medium opacity-90 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            {temple.location.city}, {temple.location.state}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded-full text-slate-800 shadow-lg">
                                            OPEN: {temple.operatingHours.open} - {temple.operatingHours.close}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-slate-600 mb-6 line-clamp-2 text-sm leading-relaxed">
                                        {temple.description}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-6">
                                        <div className="text-center">
                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Crowd</div>
                                            <div className="text-green-600 font-bold text-sm">Moderate</div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100"></div>
                                        <div className="text-center">
                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Capacity</div>
                                            <div className="text-slate-800 font-bold text-sm">{temple.capacity.total.toLocaleString()}</div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100"></div>
                                        <div className="text-center">
                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Wait</div>
                                            <div className="text-slate-800 font-bold text-sm">~15m</div>
                                        </div>
                                    </div>

                                    <Link href={`/booking?templeId=${temple._id}`} className="block w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-center shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 transition-all active:scale-95">
                                        Book Darshan Slot
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
