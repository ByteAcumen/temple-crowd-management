'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Temple } from '@/lib/api';
import {
    X, Building2, MapPin, Users, Clock, Star, Image as ImageIcon,
    Phone, ChevronRight, ChevronLeft, Save, Loader2,
    AlertCircle, CheckCircle2, Info,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Tab config
───────────────────────────────────────────────────────────────────────────── */
const TABS = [
    { id: 'basic', label: 'Basic Info', icon: Building2, color: 'from-orange-500 to-red-500', desc: 'Name, deity, status' },
    { id: 'location', label: 'Location', icon: MapPin, color: 'from-blue-500 to-cyan-500', desc: 'City, state, address' },
    { id: 'capacity', label: 'Capacity', icon: Users, color: 'from-violet-500 to-purple-600', desc: 'Limits & hours' },
    { id: 'fees', label: 'Fees', icon: Star, color: 'from-amber-500 to-orange-500', desc: 'Entry & facilities' },
    { id: 'media', label: 'Media', icon: ImageIcon, color: 'from-emerald-500 to-teal-500', desc: 'Image & contact' },
] as const;
type TabId = typeof TABS[number]['id'];

/* ─────────────────────────────────────────────────────────────────────────────
   Default state
───────────────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function defaultForm(): any {
    return {
        name: '', deity: '', description: '', significance: '', status: 'OPEN',
        location: { address: '', city: '', state: '', coordinates: { latitude: 0, longitude: 0 } },
        capacity: { total: 1000, per_slot: 500, threshold_warning: 70, threshold_critical: 90 },
        operatingHours: {
            regular: { opens: '06:00', closes: '21:00' },
            weekend: { opens: '05:00', closes: '22:00' },
        },
        fees: { general: 0, specialDarshan: 300, vipEntry: 500, foreigners: 100 },
        facilities: {
            parking: false, wheelchairAccess: false, cloakroom: false,
            prasadCounter: false, shoeStand: false, drinkingWater: true,
            restrooms: true, accommodation: false, freeFood: false,
        },
        contact: { phone: '', email: '', website: '' },
        imageUrl: '',
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeDefaults(initial: Partial<Temple> | null): any {
    const d = defaultForm();
    if (!initial) return d;
    const cap = typeof initial.capacity === 'object' ? initial.capacity : { total: initial.capacity as any };
    return {
        ...d, ...initial,
        location: { ...d.location, ...(initial.location || {}) },
        capacity: { ...d.capacity, ...(cap || {}) },
        operatingHours: {
            regular: { ...(d.operatingHours?.regular || {}), ...(initial.operatingHours?.regular || {}) },
            weekend: { ...(d.operatingHours?.weekend || {}), ...(initial.operatingHours?.weekend || {}) },
        },
        fees: { ...d.fees, ...(initial.fees || {}) },
        facilities: { ...d.facilities, ...(initial.facilities || {}) },
        contact: { ...d.contact, ...(initial.contact || {}) },
        imageUrl: (initial as any).imageUrl || (initial.images?.[0]) || '',
    };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Micro-components
───────────────────────────────────────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mb-1.5">
            {children}
        </label>
    );
}

function Field({ label, value, onChange, placeholder, type = 'text', hint, required }: {
    label: string; value: string | number; onChange: (v: string) => void;
    placeholder?: string; type?: string; hint?: string; required?: boolean;
}) {
    return (
        <div className="space-y-1">
            <FieldLabel>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</FieldLabel>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800
                           outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400
                           placeholder:text-slate-300 transition-all duration-150 font-medium
                           hover:border-slate-300 shadow-sm"
            />
            {hint && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" />{hint}</p>}
        </div>
    );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; rows?: number;
}) {
    return (
        <div className="space-y-1">
            <FieldLabel>{label}</FieldLabel>
            <textarea
                value={value} onChange={e => onChange(e.target.value)}
                rows={rows} placeholder={placeholder}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800
                           outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400
                           placeholder:text-slate-300 transition-all duration-150 font-medium resize-none
                           hover:border-slate-300 shadow-sm"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }: {
    label: string; value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="space-y-1">
            <FieldLabel>{label}</FieldLabel>
            <select
                value={value} onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800
                           outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400
                           font-medium transition-all duration-150 hover:border-slate-300 shadow-sm
                           appearance-none cursor-pointer"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function FacilityChip({ label, emoji, checked, onChange }: {
    label: string; emoji: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={() => onChange(!checked)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200
                       ${checked
                    ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm shadow-orange-100'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
        >
            <span className="text-base leading-none">{emoji}</span>
            {label}
            {checked && <CheckCircle2 className="w-3 h-3 text-orange-500 ml-auto" />}
        </motion.button>
    );
}

function TimeRange({ label, opens, closes, onOpens, onCloses }: {
    label: string; opens: string; closes: string;
    onOpens: (v: string) => void; onCloses: (v: string) => void;
}) {
    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">{label}</p>
            <div className="flex items-center gap-2">
                <input type="time" value={opens} onChange={e => onOpens(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] font-bold text-slate-700
                               outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 transition-all shadow-sm" />
                <span className="text-slate-300 font-black text-sm">→</span>
                <input type="time" value={closes} onChange={e => onCloses(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] font-bold text-slate-700
                               outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 transition-all shadow-sm" />
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Props
───────────────────────────────────────────────────────────────────────────── */
interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Temple>) => Promise<void>;
    initialData: Temple | null;
    isSaving?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────────── */
export default function TempleFormModal({ isOpen, onClose, onSave, initialData, isSaving = false }: Props) {
    const [tabIdx, setTabIdx] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [form, setForm] = useState<any>(mergeDefaults(initialData));
    const [err, setErr] = useState<string | null>(null);
    const [imgErr, setImgErr] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dir, setDir] = useState(1); // animation direction

    const activeTab = TABS[tabIdx];
    const isEdit = !!initialData;

    // Portal mount
    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

    useEffect(() => {
        if (isOpen) {
            setForm(mergeDefaults(initialData));
            setTabIdx(0); setErr(null); setImgErr(false); setDir(1);
        }
    }, [isOpen, initialData]);

    // Block body scroll
    useEffect(() => {
        if (isOpen) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = ''; }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    /* ── Setters ── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setLoc = (k: string, v: any) => setForm((p: any) => ({ ...p, location: { ...p.location, [k]: v } }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setCap = (k: string, v: any) => setForm((p: any) => ({ ...p, capacity: { ...p.capacity, [k]: Number(v) || 0 } }));
    const setHr = (t: 'regular' | 'weekend', k: string, v: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setForm((p: any) => ({ ...p, operatingHours: { ...(p.operatingHours || {}), [t]: { ...((p.operatingHours || {})[t] || {}), [k]: v } } }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setFee = (k: string, v: any) => setForm((p: any) => ({ ...p, fees: { ...p.fees, [k]: Number(v) || 0 } }));
    const setFac = (k: string, v: boolean) => setForm((p: any) => ({ ...p, facilities: { ...p.facilities, [k]: v } }));
    const setCon = (k: string, v: string) => setForm((p: any) => ({ ...p, contact: { ...p.contact, [k]: v } }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setCoord = (k: string, v: any) => setForm((p: any) => ({
        ...p, location: { ...p.location, coordinates: { ...(p.location?.coordinates || {}), [k]: Number(v) } }
    }));

    /* ── Navigation ── */
    const goTo = (idx: number) => { setDir(idx > tabIdx ? 1 : -1); setTabIdx(idx); };
    const next = () => { if (tabIdx < TABS.length - 1) goTo(tabIdx + 1); };
    const prev = () => { if (tabIdx > 0) goTo(tabIdx - 1); };

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (!form.name?.trim()) { setErr('Temple name is required'); goTo(0); return; }
        if (!form.location?.city?.trim()) { setErr('City is required'); goTo(1); return; }
        setErr(null);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            name: form.name.trim(),
            deity: form.deity?.trim() || undefined,
            description: form.description?.trim() || undefined,
            significance: form.significance?.trim() || undefined,
            status: form.status,
            location: form.location,
            capacity: form.capacity,
            operatingHours: form.operatingHours,
            fees: form.fees,
            facilities: form.facilities,
            contact: form.contact,
        };
        if (form.imageUrl?.trim()) payload.imageUrl = form.imageUrl.trim();
        try { await onSave(payload); }
        catch (e: any) { setErr(e.message || 'Save failed'); }
    };

    /* ── Tab content ── */
    const content = (
        <AnimatePresence mode="wait" custom={dir}>
            <motion.div
                key={activeTab.id}
                custom={dir}
                variants={{
                    enter: (d: number) => ({ x: d * 32, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d * -32, opacity: 0 }),
                }}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="space-y-4 p-6"
            >
                {/* ── BASIC ── */}
                {activeTab.id === 'basic' && (<>
                    <Field label="Temple Name" value={form.name || ''} onChange={v => set('name', v)}
                        placeholder="e.g. Tirupati Balaji Temple" required />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Main Deity" value={form.deity || ''} onChange={v => set('deity', v)}
                            placeholder="e.g. Lord Venkateswara" />
                        <SelectField label="Status" value={form.status || 'OPEN'} onChange={v => set('status', v)}
                            options={[
                                { value: 'OPEN', label: '🟢 Open' },
                                { value: 'CLOSED', label: '🔴 Closed' },
                                { value: 'MAINTENANCE', label: '🔧 Maintenance' },
                            ]} />
                    </div>
                    <TextArea label="Description" value={form.description || ''} onChange={v => set('description', v)}
                        placeholder="Brief description of the temple…" />
                    <TextArea label="Significance" value={form.significance || ''} onChange={v => set('significance', v)}
                        placeholder="Historical or religious significance…" />
                </>)}

                {/* ── LOCATION ── */}
                {activeTab.id === 'location' && (<>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="City" value={form.location?.city || ''} onChange={v => setLoc('city', v)}
                            placeholder="e.g. Varanasi" required />
                        <Field label="State" value={form.location?.state || ''} onChange={v => setLoc('state', v)}
                            placeholder="e.g. Uttar Pradesh" />
                    </div>
                    <Field label="Full Address" value={form.location?.address || ''} onChange={v => setLoc('address', v)}
                        placeholder="Street address or landmark" />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Latitude" type="number" value={form.location?.coordinates?.latitude || 0}
                            onChange={v => setCoord('latitude', v)} hint="Optional — for map widget" />
                        <Field label="Longitude" type="number" value={form.location?.coordinates?.longitude || 0}
                            onChange={v => setCoord('longitude', v)} hint="Optional — for map widget" />
                    </div>
                    {/* Map preview hint */}
                    <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100 flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-600 font-medium leading-relaxed">
                            Coordinates are used for the live map widget. You can find them on Google Maps by right-clicking the location.
                        </p>
                    </div>
                </>)}

                {/* ── CAPACITY ── */}
                {activeTab.id === 'capacity' && (<>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Total Capacity" type="number" value={form.capacity?.total || 0}
                            onChange={v => setCap('total', v)} placeholder="e.g. 5000" />
                        <Field label="Per Slot Capacity" type="number" value={form.capacity?.per_slot || 0}
                            onChange={v => setCap('per_slot', v)} placeholder="e.g. 500" />
                        <Field label="Warning Threshold (%)" type="number" value={form.capacity?.threshold_warning || 70}
                            onChange={v => setCap('threshold_warning', v)} hint="Orange alert level" />
                        <Field label="Critical Threshold (%)" type="number" value={form.capacity?.threshold_critical || 90}
                            onChange={v => setCap('threshold_critical', v)} hint="Red alert level" />
                    </div>

                    <div className="pt-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />Operating Hours
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <TimeRange label="Weekdays"
                                opens={form.operatingHours?.regular?.opens || '06:00'}
                                closes={form.operatingHours?.regular?.closes || '21:00'}
                                onOpens={v => setHr('regular', 'opens', v)}
                                onCloses={v => setHr('regular', 'closes', v)} />
                            <TimeRange label="Weekends"
                                opens={form.operatingHours?.weekend?.opens || '05:00'}
                                closes={form.operatingHours?.weekend?.closes || '22:00'}
                                onOpens={v => setHr('weekend', 'opens', v)}
                                onCloses={v => setHr('weekend', 'closes', v)} />
                        </div>
                    </div>
                </>)}

                {/* ── FEES ── */}
                {activeTab.id === 'fees' && (<>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="General Entry (₹)" type="number" value={form.fees?.general ?? 0}
                            onChange={v => setFee('general', v)} hint="0 = free entry" />
                        <Field label="Special Darshan (₹)" type="number" value={form.fees?.specialDarshan ?? 300}
                            onChange={v => setFee('specialDarshan', v)} />
                        <Field label="VIP Entry (₹)" type="number" value={form.fees?.vipEntry ?? 500}
                            onChange={v => setFee('vipEntry', v)} />
                        <Field label="Foreigners (₹)" type="number" value={form.fees?.foreigners ?? 100}
                            onChange={v => setFee('foreigners', v)} />
                    </div>

                    <div className="pt-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Facilities Available</p>
                        <div className="flex flex-wrap gap-2">
                            {([
                                ['parking', '🚗', 'Parking'],
                                ['wheelchairAccess', '♿', 'Wheelchair'],
                                ['cloakroom', '🧳', 'Cloakroom'],
                                ['prasadCounter', '🍬', 'Prasad'],
                                ['shoeStand', '👟', 'Shoe Stand'],
                                ['drinkingWater', '💧', 'Water'],
                                ['restrooms', '🚻', 'Restrooms'],
                                ['accommodation', '🏨', 'Stay'],
                                ['freeFood', '🍽️', 'Free Food'],
                            ] as const).map(([key, emoji, label]) => (
                                <FacilityChip key={key} label={label} emoji={emoji}
                                    checked={!!(form.facilities?.[key as keyof typeof form.facilities])}
                                    onChange={v => setFac(key, v)} />
                            ))}
                        </div>
                    </div>
                </>)}

                {/* ── MEDIA ── */}
                {activeTab.id === 'media' && (<>
                    <Field label="Image URL" value={form.imageUrl || ''}
                        onChange={v => { set('imageUrl', v); setImgErr(false); }}
                        placeholder="https://images.unsplash.com/photo-…"
                        hint="Direct URL displayed on the temple card" />

                    {/* Preview */}
                    <AnimatePresence>
                        {form.imageUrl && !imgErr && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="relative overflow-hidden rounded-xl border border-slate-200 h-44 shadow-sm"
                            >
                                <img src={form.imageUrl} alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={() => setImgErr(true)} />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                    <p className="text-white text-xs font-bold">Image Preview</p>
                                </div>
                            </motion.div>
                        )}
                        {imgErr && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-3.5 py-2.5 rounded-xl border border-red-100">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Image failed to load — check the URL
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-1 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />Contact Information
                        </p>
                        <Field label="Phone" value={form.contact?.phone || ''}
                            onChange={v => setCon('phone', v)} placeholder="+91 98765 43210" />
                        <Field label="Email" type="email" value={form.contact?.email || ''}
                            onChange={v => setCon('email', v)} placeholder="admin@temple.org" />
                        <Field label="Website" value={form.contact?.website || ''}
                            onChange={v => setCon('website', v)} placeholder="https://temple.org" />
                    </div>
                </>)}
            </motion.div>
        </AnimatePresence>
    );

    /* ── Render ── */
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                // Full-screen portal overlay — sits above EVERYTHING including AdminLayout header
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={isSaving ? undefined : onClose}
                    />

                    {/* Modal card */}
                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.88, opacity: 0, y: 40 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.25)]
                                   flex flex-col overflow-hidden"
                        style={{ maxHeight: 'min(90vh, 720px)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ────── Decorative top gradient bar ────── */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${activeTab.color} transition-all duration-500`} />

                        {/* ────── Header ────── */}
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3.5">
                                    <motion.div
                                        key={activeTab.id}
                                        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${activeTab.color}
                                                    flex items-center justify-center shadow-lg`}
                                    >
                                        <activeTab.icon className="w-5 h-5 text-white" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-[17px] font-black text-slate-800 leading-tight">
                                            {isEdit ? `Edit Temple` : `Add New Temple`}
                                        </h2>
                                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                            {activeTab.label} · {activeTab.desc}
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    onClick={onClose} disabled={isSaving}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400
                                               hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-4.5 h-4.5" />
                                </motion.button>
                            </div>

                            {/* ────── Tab bar ────── */}
                            <div className="flex gap-1">
                                {TABS.map((tab, i) => {
                                    const Icon = tab.icon;
                                    const isActive = i === tabIdx;
                                    const isDone = i < tabIdx;
                                    return (
                                        <button key={tab.id} onClick={() => goTo(i)}
                                            className="relative flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl
                                                       text-[10px] font-black transition-all duration-200
                                                       hover:bg-slate-50"
                                        >
                                            {/* Active / done indicator */}
                                            {isActive && (
                                                <motion.div layoutId="tab-bg"
                                                    className={`absolute inset-0 rounded-xl bg-gradient-to-br ${tab.color} opacity-10`}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                                            )}
                                            <div className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all
                                                           ${isActive ? `bg-gradient-to-br ${tab.color} text-white shadow-md`
                                                    : isDone ? 'bg-emerald-50 text-emerald-500 border border-emerald-200'
                                                        : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                {isDone
                                                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                                                    : <Icon className="w-3.5 h-3.5" />
                                                }
                                            </div>
                                            <span className={`hidden sm:block relative transition-colors
                                                            ${isActive ? 'text-slate-700' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {tab.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ────── Content (scrollable) ────── */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            {content}
                        </div>

                        {/* ────── Footer ────── */}
                        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/60">
                            {/* Error */}
                            <AnimatePresence>
                                {err && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden mb-3"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{err}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between gap-3">
                                {/* Step dots */}
                                <div className="flex items-center gap-1.5">
                                    {TABS.map((_, i) => (
                                        <motion.button key={i} onClick={() => goTo(i)}
                                            animate={{
                                                width: i === tabIdx ? 24 : 8,
                                                backgroundColor: i < tabIdx ? '#10b981' : i === tabIdx ? '#f97316' : '#e2e8f0',
                                            }}
                                            transition={{ duration: 0.3 }}
                                            className="h-2 rounded-full"
                                        />
                                    ))}
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center gap-2">
                                    {tabIdx > 0 && (
                                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                            onClick={prev}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-500
                                                       bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                                        >
                                            <ChevronLeft className="w-4 h-4" />Back
                                        </motion.button>
                                    )}
                                    {tabIdx < TABS.length - 1 ? (
                                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                            onClick={next}
                                            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white
                                                        bg-gradient-to-r ${activeTab.color} shadow-md hover:shadow-lg transition-all`}
                                        >
                                            Next<ChevronRight className="w-4 h-4" />
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                            onClick={handleSubmit} disabled={isSaving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500
                                                       text-white font-black rounded-xl text-[13px] shadow-md shadow-orange-200
                                                       hover:shadow-orange-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isSaving
                                                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                                                : <><Save className="w-4 h-4" />{isEdit ? 'Save Changes' : 'Add Temple'}</>
                                            }
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
