'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Temple } from '@/lib/api';
import { TrafficLightBadge } from './traffic-light';
import { getTempleImage } from '@/lib/temple-images';

// Unsplash temple images (free commercial use)
const TEMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80', // South Indian temple
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80', // Taj Mahal style
    'https://images.unsplash.com/photo-1564804955013-e02ad9516982?w=800&q=80', // Temple architecture
    'https://images.unsplash.com/photo-1585468274952-66591eb14165?w=800&q=80', // Golden temple
    'https://images.unsplash.com/photo-1600100397608-e2d47b05be59?w=800&q=80', // Temple interior
];

interface PublicTempleCardProps {
    temple: Temple;
    index?: number;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.05, duration: 0.4 }
    }),
    hover: { y: -5, transition: { duration: 0.2 } }
};

export function PublicTempleCard({ temple, index = 0 }: PublicTempleCardProps) {
    // Helper to get capacity
    const capacity = typeof temple.capacity === 'object' ? temple.capacity.total : (temple.capacity || 1000);
    const occupancy = temple.live_count ?? temple.currentOccupancy ?? 0;

    // Calculate crowd percentage
    const occupancyPercent = (occupancy / capacity) * 100;

    // Determine traffic status
    const trafficStatus = occupancyPercent > 95 ? 'RED'
        : occupancyPercent > 85 ? 'ORANGE'
            : 'GREEN';

    // Get location string
    const locationStr = typeof temple.location === 'object'
        ? `${temple.location?.city || ''}, ${temple.location?.state || ''}`
        : temple.location || 'Location TBD';

    // Get real temple image based on temple name
    const imageUrl = temple.imageUrl || getTempleImage(temple.name);

    return (
        <motion.div
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden flex flex-col h-full transition-shadow duration-300"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            layoutId={temple._id}
            custom={index}
            viewport={{ once: true, margin: "50px" }}
        >
            {/* Image Header */}
            <div className="relative h-56 overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={temple.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Live Status Badge */}
                <div className="absolute top-3 right-3">
                    <TrafficLightBadge status={trafficStatus} />
                </div>

                {/* Open/Closed Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md ${temple.status === 'OPEN'
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-rose-500/90 text-white'
                        }`}>
                        {temple.status || 'CLOSED'}
                    </span>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold mb-1 leading-tight">{temple.name}</h3>
                    <div className="flex items-center text-slate-200 text-sm">
                        <svg className="w-4 h-4 mr-1 stroke-orange-400" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="truncate">{locationStr}</span>
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Crowd Meter */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                        <span>Live Crowd</span>
                        <span className={`${trafficStatus === 'RED' ? 'text-rose-600' :
                            trafficStatus === 'ORANGE' ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                            {Math.round(occupancyPercent)}% Full
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${trafficStatus === 'RED' ? 'bg-rose-500' :
                                trafficStatus === 'ORANGE' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                        {occupancy.toLocaleString()} visitors inside
                    </p>
                </div>

                {/* Key Details */}
                <div className="space-y-2 mb-6">
                    {temple.operatingHours?.regular && (
                        <div className="flex items-center text-sm text-slate-600">
                            <span className="w-6 text-center text-lg mr-2">🕒</span>
                            <span>{temple.operatingHours.regular.opens} - {temple.operatingHours.regular.closes}</span>
                        </div>
                    )}
                    {temple.deity && (
                        <div className="flex items-center text-sm text-slate-600">
                            <span className="w-6 text-center text-lg mr-2">🙏</span>
                            <span>{temple.deity}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-slate-50 flex gap-3">
                    <Link href={`/temples/${temple._id}`} className="flex-1">
                        <button className="w-full btn-secondary text-sm py-2">
                            Details
                        </button>
                    </Link>
                    <Link href={`/booking?temple=${temple._id}`} className="flex-1">
                        <button className="w-full btn-primary text-sm py-2 shadow-lg shadow-orange-200">
                            Book Darshan
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
