'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Temple, adminApi } from '@/lib/api';
import {
    MapPin, Users, Zap, Clock, Car, Accessibility, Droplets,
    Edit2, Trash2, ChevronRight, Wifi, Lock, Star
} from 'lucide-react';

// Fallback gradient map for temples without matching images
const GRADIENT_COLORS = [
    'from-orange-400 via-amber-500 to-red-500',
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-teal-400 via-emerald-500 to-green-600',
    'from-blue-500 via-cyan-500 to-teal-500',
    'from-rose-400 via-red-500 to-orange-600',
    'from-violet-500 via-purple-600 to-indigo-700',
];

function getTempleImage(temple: Temple): string | null {
    if (temple.images?.[0]) return temple.images[0];
    if ((temple as any).imageUrl) return (temple as any).imageUrl;
    return null; // Force fallback to gradients if no DB image
}

function getGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

// ─── Status & Traffic Config ─────────────────────────────────────────────────
const STATUS_CFG = {
    OPEN: { label: 'Open', dot: 'bg-emerald-500', pulse: true, text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    CLOSED: { label: 'Closed', dot: 'bg-red-500', pulse: false, text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    MAINTENANCE: { label: 'Maintenance', dot: 'bg-amber-500', pulse: false, text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
};

const TRAFFIC_CFG = {
    GREEN: { label: 'Normal', bar: 'from-emerald-400 to-teal-500', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    ORANGE: { label: 'Busy', bar: 'from-amber-400 to-orange-500', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    RED: { label: 'Critical', bar: 'from-red-400 to-rose-600', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

function getCapacity(t: Temple): number {
    if (!t?.capacity) return 1;
    if (typeof t.capacity === 'number') return t.capacity;
    return t.capacity.total || 1;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface TempleCardProps {
    temple: Temple;
    onEdit: (temple: Temple) => void;
    onDelete: (id: string, name: string) => void;
    onStatusChange?: (id: string, newStatus: 'OPEN' | 'CLOSED' | 'MAINTENANCE') => void;
    index?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function TempleCard({ temple, onEdit, onDelete, onStatusChange, index = 0 }: TempleCardProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    const imgSrc = getTempleImage(temple);
    const gradient = getGradient(temple.name);
    const capacity = getCapacity(temple);
    const occupancy = Math.max(0, temple.live_count ?? (temple as any).currentOccupancy ?? 0);
    const pct = Math.min(100, Math.round((occupancy / capacity) * 100));

    const trafficKey = ((temple as any).traffic_status || (pct >= 90 ? 'RED' : pct >= 70 ? 'ORANGE' : 'GREEN')) as keyof typeof TRAFFIC_CFG;
    const traffic = TRAFFIC_CFG[trafficKey] ?? TRAFFIC_CFG.GREEN;
    const statusCfg = STATUS_CFG[(temple.status as keyof typeof STATUS_CFG)] ?? STATUS_CFG.CLOSED;

    const loc = typeof temple.location === 'object'
        ? `${temple.location.city}${temple.location.state ? `, ${temple.location.state}` : ''}`
        : (temple.location || '');

    const handleStatusChange = async (s: 'OPEN' | 'CLOSED' | 'MAINTENANCE') => {
        setDropdownOpen(false);
        if (s === temple.status) return;
        setUpdating(true);
        try {
            await adminApi.updateTemple(temple._id, { status: s });
            onStatusChange?.(temple._id, s);
        } catch (e) { console.error(e); }
        finally { setUpdating(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
            layoutId={`temple-${temple._id}`}
            className="bg-white rounded-2xl border border-slate-100/80 shadow-md shadow-slate-200/40
                       hover:shadow-xl hover:shadow-slate-200/60 hover:border-orange-100
                       transition-all duration-200 flex flex-col overflow-hidden"
        >
            {/* ── Image Banner ── */}
            <div className="relative h-44 overflow-hidden shrink-0">
                {imgSrc ? (
                    <motion.img
                        src={imgSrc}
                        alt={temple.name}
                        className="w-full h-full object-cover"
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.07 }}
                        transition={{ duration: 0.5 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <span className="text-7xl opacity-30">🛕</span>
                    </div>
                )}

                {/* Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                {/* Top‑right: Status toggle */}
                <div className="absolute top-3 right-3 z-20">
                    <div className="relative">
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setDropdownOpen(o => !o)}
                            disabled={updating}
                            className={`flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full border backdrop-blur-md
                                        shadow-sm transition-all text-[11px] font-bold tracking-wide
                                        ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}
                        >
                            {updating
                                ? <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : <span className={`w-2 h-2 rounded-full ${statusCfg.dot} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
                            }
                            {statusCfg.label}
                        </motion.button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.88, y: -6 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.88, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-2xl
                                                   border border-slate-100 overflow-hidden min-w-[148px] z-30"
                                    >
                                        {(Object.entries(STATUS_CFG) as [string, typeof STATUS_CFG.OPEN][]).map(([key, cfg]) => (
                                            <button key={key}
                                                onClick={() => handleStatusChange(key as 'OPEN' | 'CLOSED' | 'MAINTENANCE')}
                                                className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-xs font-bold
                                                           hover:bg-slate-50 transition-colors
                                                           ${temple.status === key ? `${cfg.bg} ${cfg.text}` : 'text-slate-700'}`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Top-left: Crowd traffic badge */}
                <div className="absolute top-3 left-3 z-20">
                    <span className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full
                                     backdrop-blur-md border text-[11px] font-bold
                                     ${traffic.bg} bg-opacity-90 border-white/30 ${traffic.text}`}>
                        <span className={`w-2 h-2 rounded-full ${traffic.dot}`} />
                        {traffic.label}
                    </span>
                </div>

                {/* Bottom: Temple name + location */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h3 className="font-black text-white text-[17px] leading-snug drop-shadow-md w-full">
                        {temple.name}
                    </h3>
                    {loc && (
                        <p className="flex items-center gap-1 text-white/85 text-xs mt-0.5 font-medium">
                            <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                            <span>{loc}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-col flex-1 p-4 gap-3">

                {/* Deity */}
                {temple.deity && (
                    <p className="flex items-center gap-2 text-[13px] text-slate-600 font-semibold">
                        <span className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-sm shrink-0">🙏</span>
                        {temple.deity}
                    </p>
                )}

                {/* Live Crowd Bar */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Users className="w-3 h-3" /> Live Crowd
                        </span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${traffic.bg} ${traffic.text}`}>
                            {occupancy.toLocaleString('en-IN')} / {capacity.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${traffic.bar}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-slate-300">0%</span>
                        <span className="text-[10px] font-bold text-slate-400">{pct}% full</span>
                        <span className="text-[9px] text-slate-300">100%</span>
                    </div>
                </div>

                {/* Three Info Pills */}
                <div className="grid grid-cols-3 gap-2">
                    <InfoPill label="Capacity" value={capacity >= 1000 ? `${(capacity / 1000).toFixed(capacity % 1000 === 0 ? 0 : 1)}K` : String(capacity)} color="orange" />
                    <InfoPill label="VIP Fee" value={temple.fees?.specialDarshan ? `₹${temple.fees.specialDarshan}` : 'FREE'} color="blue" />
                    <InfoPill label="Slots" value={String(Array.isArray((temple as any).slots) ? (temple as any).slots.length : 0)} color="green" />
                </div>

                {/* Hours */}
                {(temple as any).operatingHours?.regular && (
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        {(temple as any).operatingHours.regular.opens} – {(temple as any).operatingHours.regular.closes}
                        <span className="text-slate-300 text-[10px]">Weekdays</span>
                    </p>
                )}

                {/* Facilities */}
                {temple.facilities && (
                    <div className="flex flex-wrap gap-1.5">
                        {temple.facilities.parking && <FacilityDot icon={<Car className="w-3.5 h-3.5" />} title="Parking" />}
                        {temple.facilities.wheelchairAccess && <FacilityDot icon={<Accessibility className="w-3.5 h-3.5" />} title="Wheelchair" />}
                        {temple.facilities.drinkingWater && <FacilityDot icon={<Droplets className="w-3.5 h-3.5" />} title="Drinking Water" />}
                        {(temple as any).liveDarshan?.enabled && <FacilityDot icon={<Wifi className="w-3.5 h-3.5" />} title="Live Darshan" />}
                        {temple.facilities.prasadCounter && <FacilityDot emoji="🍬" title="Prasad Counter" />}
                        {(temple.facilities as any).freeFood && <FacilityDot emoji="🍽️" title="Free Food" />}
                    </div>
                )}

                {/* Badge row */}
                <div className="flex flex-wrap gap-1.5">
                    {temple.fees?.general === 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                            Free Entry
                        </span>
                    )}
                    {temple.fees?.vipEntry && temple.fees.vipEntry > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-200 rounded-md flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" /> VIP ₹{temple.fees.vipEntry}
                        </span>
                    )}
                    {temple.status === 'MAINTENANCE' && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 rounded-md flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Maintenance
                        </span>
                    )}
                </div>
            </div>

            {/* ── Footer Actions ── */}
            <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link href={`/admin/temples/${temple._id}`} className="flex-1 min-w-0">
                    <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-2.5 bg-slate-900 hover:bg-orange-600 text-white text-[13px] font-bold rounded-xl
                                   transition-colors duration-200 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        View Details
                        <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                </Link>
                <motion.button
                    whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
                    onClick={() => onEdit(temple)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400
                               hover:text-blue-600 hover:bg-blue-50 border border-transparent
                               hover:border-blue-100 transition-all"
                    title="Edit"
                >
                    <Edit2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
                    onClick={() => onDelete(temple._id, temple.name)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400
                               hover:text-red-600 hover:bg-red-50 border border-transparent
                               hover:border-red-100 transition-all"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoPill({ label, value, color }: { label: string; value: string; color: 'orange' | 'blue' | 'green' }) {
    const colors = {
        orange: 'bg-orange-50 border-orange-100 text-orange-700',
        blue: 'bg-blue-50   border-blue-100   text-blue-700',
        green: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    };
    return (
        <div className={`rounded-xl border p-2.5 text-center ${colors[color]}`}>
            <p className="text-[9px] font-black uppercase tracking-wider opacity-60 mb-0.5">{label}</p>
            <p className="text-[13px] font-black leading-none">{value}</p>
        </div>
    );
}

function FacilityDot({ icon, emoji, title }: { icon?: React.ReactNode; emoji?: string; title: string }) {
    return (
        <span
            title={title}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100
                       text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-default text-sm"
        >
            {icon || emoji}
        </span>
    );
}
