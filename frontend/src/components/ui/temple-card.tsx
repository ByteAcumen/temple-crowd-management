'use client';

// Temple Smart E-Pass - Temple Card Component
// Displays temple information with crowd status and booking action

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrafficLightBadge } from './traffic-light';

import { Temple } from '@/lib/api';

// Unsplash temple images (free commercial use)
const TEMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80', // South Indian temple
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80', // Taj Mahal style
    'https://images.unsplash.com/photo-1564804955013-e02ad9516982?w=800&q=80', // Temple architecture
    'https://images.unsplash.com/photo-1585468274952-66591eb14165?w=800&q=80', // Golden temple
    'https://images.unsplash.com/photo-1600100397608-e2d47b05be59?w=800&q=80', // Temple interior
];

interface TempleCardProps {
    temple: Temple;
    index?: number;
}

// Card animation variants
const cardVariants = {
    hidden: {
        opacity: 0,
        y: 40,
        scale: 0.95
    },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            delay: index * 0.1,
            ease: 'easeOut' as const
        }
    }),
    hover: {
        y: -8,
        scale: 1.02,
        transition: {
            duration: 0.3,
            ease: 'easeOut' as const
        }
    },
    tap: {
        scale: 0.98
    }
};

export function TempleCard({ temple, index = 0 }: TempleCardProps) {
    // Helper to get capacity
    const capacity = typeof temple.capacity === 'object' ? temple.capacity.total : (temple.capacity || 0);

    // Calculate crowd percentage
    const occupancyPercent = capacity
        ? Math.round((temple.currentOccupancy || 0) / capacity * 100)
        : 0;

    // Determine traffic status
    const trafficStatus = occupancyPercent > 95 ? 'RED'
        : occupancyPercent > 85 ? 'ORANGE'
            : 'GREEN';

    // Get location string
    const locationStr = typeof temple.location === 'object'
        ? `${temple.location?.city || ''}, ${temple.location?.state || ''}`
        : temple.location || 'Location TBD';

    // Get image (cycle through if no custom image)
    const imageUrl = temple.imageUrl || TEMPLE_IMAGES[index % TEMPLE_IMAGES.length];

    return (
        <motion.div
            className="group bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 card-glow"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            whileTap="tap"
            viewport={{ once: true, margin: '-50px' }}
            custom={index}
        >
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={temple.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <TrafficLightBadge status={trafficStatus} />
                </div>

                {/* Temple Status (Open/Closed) */}
                {temple.status && (
                    <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${temple.status === 'OPEN'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}>
                            {temple.status}
                        </span>
                    </div>
                )}

                {/* Temple Name on Image */}
                <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">
                        {temple.name}
                    </h3>
                    <p className="text-sm text-white/80 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {locationStr}
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
                {/* Capacity Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Current Crowd</span>
                        <span className="font-semibold text-slate-800">
                            {(temple.currentOccupancy || 0).toLocaleString()} / {capacity.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${trafficStatus === 'RED' ? 'bg-red-500'
                                : trafficStatus === 'ORANGE' ? 'bg-orange-500'
                                    : 'bg-green-500'
                                }`}
                            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Operating Hours */}
                {temple.operatingHours?.regular && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{temple.operatingHours.regular.opens || '6:00 AM'} - {temple.operatingHours.regular.closes || '9:00 PM'}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Link
                        href={`/booking?temple=${temple._id}`}
                        className="flex-1 btn-primary py-2.5 text-center text-sm"
                    >
                        Book Now
                    </Link>
                    <button
                        className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        title="View Details"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default TempleCard;
