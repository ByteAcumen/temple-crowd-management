'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { templesApi, Temple } from '@/lib/api';
import { useTempleLiveData } from '@/hooks/use-live-data';
import { useWeather } from '@/hooks/use-weather';
import { TrafficLightBadge } from '@/components/ui/traffic-light';
import { WeatherWidget } from '@/components/ui/weather-widget';
import { CrowdPredictionChart } from '@/components/ui/crowd-prediction-chart';

// Mock prediction data (replace with API call later)
const MOCK_PREDICTIONS = [
    { time: '6 AM', count: 50, level: 'Low' },
    { time: '8 AM', count: 120, level: 'Moderate' },
    { time: '10 AM', count: 350, level: 'High' },
    { time: '12 PM', count: 450, level: 'High' },
    { time: '2 PM', count: 200, level: 'Moderate' },
    { time: '4 PM', count: 300, level: 'High' },
    { time: '6 PM', count: 400, level: 'High' },
    { time: '8 PM', count: 150, level: 'Low' },
] as const;

export default function TempleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params (Next.js 15+)
    const { id } = use(params);

    const [temple, setTemple] = useState<Temple | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Live Data & Weather
    const { liveData } = useTempleLiveData(id);
    const { weather, isLoading: isWeatherLoading } = useWeather(id);

    // Scroll Effects
    const { scrollY } = useScroll();
    const bgY = useTransform(scrollY, [0, 500], ['0%', '20%']);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    useEffect(() => {
        async function fetchTemple() {
            try {
                const response = await templesApi.getById(id);
                if (response.success) {
                    setTemple(response.data);
                } else {
                    setError('Temple not found');
                }
            } catch (err) {
                setError('Failed to load temple details');
            } finally {
                setIsLoading(false);
            }
        }
        fetchTemple();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error || !temple) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h1>
                <p className="text-slate-600 mb-6">{error || 'Temple not found'}</p>
                <Link href="/temples" className="btn-primary">Back to Temples</Link>
            </div>
        );
    }

    // Merged Data
    const currentOccupancy = liveData?.currentOccupancy ?? temple.currentOccupancy ?? 0;
    const capacity = typeof temple.capacity === 'object' ? temple.capacity.total : (temple.capacity || 1000);
    const occupancyPercent = (currentOccupancy / capacity) * 100;

    // Status Logic
    const trafficStatus = occupancyPercent > 95 ? 'RED'
        : occupancyPercent > 85 ? 'ORANGE'
            : 'GREEN';

    const statusColor = trafficStatus === 'RED' ? 'text-rose-600'
        : trafficStatus === 'ORANGE' ? 'text-amber-600'
            : 'text-emerald-600';

    const bgImage = temple.imageUrl || 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&q=80'; // Fallback

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Hero Section */}
            <header className="relative h-[60vh] overflow-hidden">
                <motion.div
                    className="absolute inset-0"
                    style={{ y: bgY }}
                >
                    <img
                        src={bgImage}
                        alt={temple.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                </motion.div>

                {/* Navbar (Transparent) */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                    <Link href="/temples" className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                        <TrafficLightBadge status={trafficStatus} />
                    </div>
                </div>

                {/* Hero Content */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10"
                    style={{ opacity }}
                >
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 drop-shadow-lg">
                                    {temple.name}
                                </h1>
                                <p className="text-xl text-slate-200 flex items-center gap-2 font-medium">
                                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {typeof temple.location === 'object' ? `${temple.location.address}, ${temple.location.city}` : temple.location}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                {temple.status && (
                                    <div className={`px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 font-bold ${temple.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                        }`}>
                                        {temple.status}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Live Crowd Gauge Card */}
                        <section className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    Live Crowd Status
                                </h2>
                                <span className={`text-lg font-bold ${statusColor}`}>
                                    {Math.round(occupancyPercent)}% Capacity
                                </span>
                            </div>

                            <div className="mb-6">
                                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full ${trafficStatus === 'RED' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                                                trafficStatus === 'ORANGE' ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
                                                    'bg-gradient-to-r from-emerald-400 to-green-500'
                                            }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-sm text-slate-500 font-medium">
                                    <span>0</span>
                                    <span>{capacity.toLocaleString()} Max</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Current Visitors</p>
                                    <p className="text-2xl font-black text-slate-900">{currentOccupancy}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Avg Wait Time</p>
                                    <p className="text-2xl font-black text-slate-900">
                                        {trafficStatus === 'RED' ? '45m' : trafficStatus === 'ORANGE' ? '20m' : '5m'}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Next Slot</p>
                                    <p className="text-2xl font-black text-emerald-600">Available</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. About & Facilities */}
                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">About the Temple</h3>
                            <p className="text-slate-600 leading-relaxed mb-8">
                                {temple.description || `${temple.name} is a sacred place of worship located in ${typeof temple.location === 'object' ? temple.location.city : ''}. It is known for its spiritual significance and architectural beauty.`}
                            </p>

                            <h3 className="text-xl font-bold text-slate-900 mb-4">Facilities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {temple.facilities?.parking && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <span className="text-xl">🚗</span> <span className="font-medium text-slate-700">Parking</span>
                                    </div>
                                )}
                                {temple.facilities?.wheelchairAccess && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <span className="text-xl">♿</span> <span className="font-medium text-slate-700">Wheelchair</span>
                                    </div>
                                )}
                                {temple.facilities?.prasadCounter && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <span className="text-xl">🍬</span> <span className="font-medium text-slate-700">Prasad</span>
                                    </div>
                                )}
                                {temple.facilities?.shoeStand && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <span className="text-xl">👞</span> <span className="font-medium text-slate-700">Shoe Stand</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 3. Crowd Predictions Chart */}
                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-900">Expected Crowd Today</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                    Prediction
                                </div>
                            </div>
                            <CrowdPredictionChart data={MOCK_PREDICTIONS as any} />
                        </section>

                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        {/* 1. Booking Card (Call to Action) */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-orange-100 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Book Your Darshan</h3>
                            <p className="text-slate-500 text-sm mb-6">Skip the queue and secure your slot today.</p>

                            <Link href={`/booking?temple=${temple._id}`} className="block w-full">
                                <button className="w-full btn-primary py-3 text-lg shadow-orange-200 shadow-lg hover:shadow-xl hover:shadow-orange-300 transition-all transform hover:-translate-y-0.5">
                                    Book Now
                                </button>
                            </Link>

                            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                                <p className="text-xs text-slate-400">Trusted by 10,000+ devotees</p>
                            </div>
                        </div>

                        {/* 2. Weather Widget */}
                        <WeatherWidget weather={weather} isLoading={isWeatherLoading} />

                        {/* 3. Operating Hours */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Timings</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                                    <span className="text-slate-500">Morning</span>
                                    <span className="font-semibold text-slate-900">
                                        {temple.operatingHours?.regular?.opens || '6:00 AM'} - 12:00 PM
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                                    <span className="text-slate-500">Evening</span>
                                    <span className="font-semibold text-slate-900">
                                        4:00 PM - {temple.operatingHours?.regular?.closes || '9:00 PM'}
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-3 rounded-xl font-medium">
                                    ⚠️ Special Darshan timings may vary on festivals.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
