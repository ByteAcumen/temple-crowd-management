'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Temple } from '@/lib/api';

interface TempleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Temple>) => Promise<void>;
    initialData?: Temple | null;
    isSaving: boolean;
}

const TABS = ['Basic', 'Location', 'Fees & Facilities', 'Media'];

export default function TempleFormModal({ isOpen, onClose, onSave, initialData, isSaving }: TempleFormModalProps) {
    const [activeTab, setActiveTab] = useState('Basic');
    const [formData, setFormData] = useState<Partial<Temple>>({
        name: '',
        deity: '',
        description: '',
        capacity: 1000,
        location: { city: '', state: '', coordinates: { latitude: 0, longitude: 0 } },
        fees: { specialDarshan: 0, general: 0 },
        facilities: { parking: true, wheelchairAccess: false, restrooms: true, drinkingWater: true, prasadCounter: false },
        images: [],
        status: 'OPEN'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                location: typeof initialData.location === 'string'
                    ? { city: initialData.location, state: '', coordinates: { latitude: 0, longitude: 0 } }
                    : initialData.location,
                capacity: typeof initialData.capacity === 'object' ? initialData.capacity.total : initialData.capacity
            });
        } else {
            // Reset form for create mode
            setFormData({
                name: '',
                deity: '',
                description: '',
                capacity: 1000,
                location: { city: '', state: '', coordinates: { latitude: 0, longitude: 0 } },
                fees: { specialDarshan: 0, general: 0 },
                facilities: { parking: true, wheelchairAccess: false, restrooms: true, drinkingWater: true, prasadCounter: false },
                images: [],
                status: 'OPEN'
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const updateLocation = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            location: { ...(prev.location as any), [field]: value }
        }));
    };

    const updateFacilities = (field: string, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            facilities: { ...(prev.facilities as any), [field]: value }
        }));
    };

    const updateFees = (field: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            fees: { ...(prev.fees as any), [field]: value }
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-red-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">{initialData ? '✏️ Edit Temple' : '🛕 Add New Temple'}</h2>
                        <p className="text-xs text-slate-500 font-medium">Fill in all details for the temple listing</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 flex gap-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-bold relative transition-colors ${activeTab === tab ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'Basic' && (
                            <motion.div key="basic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Temple Name *</label>
                                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-slate-700" placeholder="e.g. Kashi Vishwanath" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Deity</label>
                                        <input value={formData.deity} onChange={e => setFormData({ ...formData, deity: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="e.g. Lord Shiva" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Max Capacity *</label>
                                        <input type="number" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                                        <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none" placeholder="Brief history and significance..." />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'Location' && (
                            <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">City *</label>
                                        <input required value={(formData.location as any)?.city} onChange={e => updateLocation('city', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">State *</label>
                                        <input required value={(formData.location as any)?.state} onChange={e => updateLocation('state', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Address</label>
                                        <textarea rows={2} value={(formData.location as any)?.address} onChange={e => updateLocation('address', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" placeholder="Street address..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Latitude</label>
                                        <input type="number" step="any" value={(formData.location as any)?.coordinates?.latitude} onChange={e => updateLocation('coordinates', { ...(formData.location as any).coordinates, latitude: Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="e.g. 25.3176" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Longitude</label>
                                        <input type="number" step="any" value={(formData.location as any)?.coordinates?.longitude} onChange={e => updateLocation('coordinates', { ...(formData.location as any).coordinates, longitude: Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="e.g. 82.9739" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'Fees & Facilities' && (
                            <motion.div key="fees" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                {/* Fees */}
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 mb-3 border-b border-slate-100 pb-2">Entry Fees</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Special Darshan (₹)</label>
                                            <input type="number" value={formData.fees?.specialDarshan} onChange={e => updateFees('specialDarshan', Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">General Entry (₹)</label>
                                            <input type="number" value={formData.fees?.general} onChange={e => updateFees('general', Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Facilities Toggle */}
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 mb-3 border-b border-slate-100 pb-2">Available Facilities</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'parking', label: 'Car Parking', icon: '🚗' },
                                            { key: 'wheelchairAccess', label: 'Wheelchair Access', icon: '♿' },
                                            { key: 'restrooms', label: 'Restrooms', icon: '🚻' },
                                            { key: 'drinkingWater', label: 'Drinking Water', icon: '🚰' },
                                            { key: 'prasadCounter', label: 'Prasad Counter', icon: '🍬' },
                                            { key: 'shoeStand', label: 'Shoe Stand', icon: '👞' },
                                        ].map(item => (
                                            <label key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${(formData.facilities as any)?.[item.key] ? 'border-green-500 bg-green-50/50' : 'border-slate-200 hover:bg-slate-50'
                                                }`}>
                                                <input type="checkbox" checked={(formData.facilities as any)?.[item.key] || false}
                                                    onChange={e => updateFacilities(item.key, e.target.checked)} className="w-5 h-5 accent-green-600 rounded" />
                                                <span className="text-xl">{item.icon}</span>
                                                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'Media' && (
                            <motion.div key="media" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center">
                                    <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                                        🖼️
                                    </div>
                                    <h3 className="text-slate-900 font-bold">Image URL</h3>
                                    <p className="text-xs text-slate-500 mb-4">Past a direct link to a temple image</p>

                                    <input
                                        type="url"
                                        placeholder="https://example.com/temple-image.jpg"
                                        value={formData.images?.[0] || ''}
                                        onChange={e => setFormData({ ...formData, images: [e.target.value] })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none mb-4"
                                    />

                                    {formData.images?.[0] && (
                                        <div className="mt-4 rounded-xl overflow-hidden h-40 w-full relative group">
                                            <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white font-bold text-xs">Image Preview</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 disabled:opacity-50 transition-all flex items-center gap-2">
                        {isSaving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {isSaving ? 'Saving...' : initialData ? 'Update Details' : 'Create Temple'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
