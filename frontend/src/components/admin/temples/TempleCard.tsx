'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Temple } from '@/lib/api';
import { TrafficLightBadge } from '@/components/ui/traffic-light';

interface TempleCardProps {
    temple: Temple;
    onEdit: (temple: Temple) => void;
    onDelete: (id: string, name: string) => void;
}

// Helper for safe capacity access
const getCapacity = (t: Temple) => {
    if (!t || !t.capacity) return 1;
    if (typeof t.capacity === 'number') return t.capacity;
    return t.capacity.total || 1;
};

export default function TempleCard({ temple, onEdit, onDelete }: TempleCardProps) {
    const capacity = getCapacity(temple);
    const occupancy = temple.live_count ?? temple.currentOccupancy ?? 0;
    const occupancyPercent = (occupancy / capacity);

    // Determine Traffic Status based on occupancy
    const trafficStatus = occupancyPercent > 0.9 ? 'RED' : occupancyPercent > 0.7 ? 'ORANGE' : 'GREEN';

    return (
        <motion.div
            layoutId={temple._id}
            className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:border-orange-100 transition-all duration-300 relative flex flex-col h-full"
        >
            {/* Card Header with Image */}
            <div className="h-48 bg-slate-100 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10" />

                {temple.images && temple.images.length > 0 ? (
                    <motion.img
                        src={temple.images[0]}
                        alt={temple.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.7 }}
                    />
                ) : (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-slate-200"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                    >
                        <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </motion.div>
                )}

                <div className="absolute bottom-4 left-4 z-20 right-4">
                    <h3 className="font-bold text-white text-xl drop-shadow-md truncate">{temple.name}</h3>
                    <p className="text-white/90 text-sm flex items-center gap-1 drop-shadow-sm font-medium truncate">
                        <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {typeof temple.location === 'object' ? `${temple.location.city}, ${temple.location.state}` : temple.location}
                    </p>
                </div>
                <div className="absolute top-4 right-4 z-20">
                    <TrafficLightBadge status={trafficStatus} />
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Deity & Fees Row */}
                <div className="mb-4">
                    {temple.deity && (
                        <p className="text-sm text-slate-600 flex items-center gap-2 mb-3">
                            <span className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 text-xs">🙏</span>
                            <span className="font-semibold">{temple.deity}</span>
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {temple.fees?.general === 0 && (
                            <span className="px-2.5 py-1 text-[11px] uppercase tracking-wide bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-100">Free Entry</span>
                        )}
                        {temple.fees?.specialDarshan && temple.fees.specialDarshan > 0 && (
                            <span className="px-2.5 py-1 text-[11px] uppercase tracking-wide bg-purple-50 text-purple-700 rounded-lg font-bold border border-purple-100">⚡ ₹{temple.fees.specialDarshan} VIP</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${temple.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className={`font-bold text-sm ${temple.status === 'OPEN' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {temple.status || 'CLOSED'}
                            </span>
                        </div>
                    </div>
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Capacity</p>
                        <p className="text-slate-900 font-bold text-sm">
                            {capacity.toLocaleString()} <span className="text-slate-400 font-medium text-xs">max</span>
                        </p>
                    </div>
                </div>

                {/* Facilities Icons */}
                {temple.facilities && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {temple.facilities.parking && <span title="Parking" className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-100 transition-colors">🚗</span>}
                        {temple.facilities.wheelchairAccess && <span title="Wheelchair Access" className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-100 transition-colors">♿</span>}
                        {temple.facilities.restrooms && <span title="Restrooms" className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-100 transition-colors">🚻</span>}
                        {temple.facilities.drinkingWater && <span title="Drinking Water" className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-100 transition-colors">🚰</span>}
                        {temple.facilities.prasadCounter && <span title="Prasad Counter" className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-100 transition-colors">🍬</span>}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                    <Link href={`/admin/temples/${temple._id}`} className="flex-1">
                        <button className="w-full py-2.5 bg-slate-900 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-slate-200 hover:shadow-orange-200">
                            View Details
                        </button>
                    </Link>
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(temple)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100" title="Edit Details">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                            onClick={() => onDelete(temple._id, temple.name)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                            title="Delete Temple"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
