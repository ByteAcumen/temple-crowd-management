'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface TempleFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    isLoading: boolean;
    error: string;
    isEdit?: boolean;
}

// Tab items
const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '🛕' },
    { id: 'fees', label: 'Fees & Donations', icon: '💰' },
    { id: 'facilities', label: 'Facilities', icon: '🏢' },
    { id: 'prasad', label: 'Prasad Menu', icon: '🍲' },
    { id: 'services', label: 'Services & Events', icon: '🎉' },
];

// Input component for reuse
const Input = ({ label, value, onChange, type = 'text', required = false, placeholder = '', className = '' }: any) => (
    <div className={className}>
        <label className="block text-slate-700 text-sm font-semibold mb-2">{label}</label>
        <input
            type={type}
            required={required}
            value={value}
            onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all placeholder:text-slate-400"
        />
    </div>
);

// Checkbox component
const Checkbox = ({ label, checked, onChange, icon }: any) => (
    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-orange-200 hover:bg-orange-50/50 transition-all group">
        <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
        />
        <span className="text-lg">{icon}</span>
        <span className="text-slate-700 font-medium group-hover:text-orange-700">{label}</span>
    </label>
);

export default function TempleForm({ initialData, onSubmit, isLoading, error, isEdit = false }: TempleFormProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        // Basic Info
        name: '',
        description: '',
        deity: '',
        significance: '',
        imageUrl: '',
        location: {
            address: '',
            city: '',
            state: '',
            coordinates: { latitude: 0, longitude: 0 }
        },
        // Capacity
        capacity: {
            total: 1000,
            per_slot: 250,
            threshold_warning: 85,
            threshold_critical: 95
        },
        // Operating Hours
        operatingHours: {
            regular: { opens: '06:00', closes: '21:00' },
            weekend: { opens: '05:00', closes: '22:00' }
        },
        // Fees
        fees: {
            general: 0,
            specialDarshan: 300,
            vipEntry: 500,
            foreigners: 0,
            prasad: 50,
            photography: 100
        },
        // Facilities
        facilities: {
            parking: true,
            wheelchairAccess: false,
            cloakroom: true,
            prasadCounter: true,
            shoeStand: true,
            drinkingWater: true,
            restrooms: true,
            accommodation: false,
            freeFood: false
        },
        // Prasad Menu
        prasadMenu: [] as Array<{ name: string; description: string; price: number; servingSize: string; isAvailable: boolean }>,
        // Special Services
        specialServices: [] as Array<{ name: string; description: string; price: number; duration: string; requiresBooking: boolean }>,
        // Donations
        donations: {
            enabled: true,
            minimumAmount: 11,
            taxExemption: true,
            section80G: true
        },
        // Status
        status: 'OPEN',
        // Contact
        contact: {
            phone: '',
            email: '',
            website: ''
        }
    });

    // Load initial data
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                name: initialData.name || '',
                description: initialData.description || '',
                deity: initialData.deity || '',
                significance: initialData.significance || '',
                imageUrl: initialData.imageUrl || '',
                location: initialData.location || prev.location,
                capacity: typeof initialData.capacity === 'number'
                    ? { ...prev.capacity, total: initialData.capacity }
                    : { ...prev.capacity, ...initialData.capacity },
                operatingHours: initialData.operatingHours || prev.operatingHours,
                fees: initialData.fees || prev.fees,
                facilities: initialData.facilities || prev.facilities,
                prasadMenu: initialData.prasadMenu || [],
                specialServices: initialData.specialServices || [],
                donations: initialData.donations || prev.donations,
                status: initialData.status || 'OPEN',
                contact: initialData.contact || prev.contact
            }));
        }
         
    }, [initialData]);

    // Auto-calculate thresholds when capacity changes
    const handleCapacityChange = (value: number) => {
        setFormData(prev => ({
            ...prev,
            capacity: {
                ...prev.capacity,
                total: value,
                per_slot: Math.round(value / 4)
            }
        }));
    };

    // Add Prasad item
    const addPrasadItem = () => {
        setFormData(prev => ({
            ...prev,
            prasadMenu: [...prev.prasadMenu, { name: '', description: '', price: 0, servingSize: '', isAvailable: true }]
        }));
    };

    // Remove Prasad item
    const removePrasadItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            prasadMenu: prev.prasadMenu.filter((_, i) => i !== index)
        }));
    };

    // Update Prasad item
    const updatePrasadItem = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            prasadMenu: prev.prasadMenu.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }));
    };

    // Add Service
    const addService = () => {
        setFormData(prev => ({
            ...prev,
            specialServices: [...prev.specialServices, { name: '', description: '', price: 0, duration: '', requiresBooking: true }]
        }));
    };

    // Remove Service
    const removeService = (index: number) => {
        setFormData(prev => ({
            ...prev,
            specialServices: prev.specialServices.filter((_, i) => i !== index)
        }));
    };

    // Update Service
    const updateService = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            specialServices: prev.specialServices.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };



    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Temple Details' : 'Add New Temple'}</h2>
                <p className="text-slate-500 text-sm">Fill in all the details to manage the temple</p>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-100 bg-white px-2 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id
                            ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                <AnimatePresence mode="wait">
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <motion.div
                            key="basic"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="grid md:grid-cols-2 gap-6">
                                <Input label="Temple Name *" value={formData.name} onChange={(v: string) => setFormData(p => ({ ...p, name: v }))} required placeholder="e.g. Kashi Vishwanath Temple" className="md:col-span-2" />
                                <Input label="Main Deity" value={formData.deity} onChange={(v: string) => setFormData(p => ({ ...p, deity: v }))} placeholder="e.g. Lord Shiva (Jyotirlinga)" />
                                <Input label="Status" value={formData.status} onChange={(v: string) => setFormData(p => ({ ...p, status: v }))} placeholder="OPEN / CLOSED" />
                            </div>

                            <div>
                                <label className="block text-slate-700 text-sm font-semibold mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    rows={3}
                                    placeholder="Brief description of the temple..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all placeholder:text-slate-400 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 text-sm font-semibold mb-2">Significance</label>
                                <textarea
                                    value={formData.significance}
                                    onChange={e => setFormData(p => ({ ...p, significance: e.target.value }))}
                                    rows={2}
                                    placeholder="Historical/religious significance..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all placeholder:text-slate-400 resize-none"
                                />
                            </div>

                            <Input label="Image URL" value={formData.imageUrl} onChange={(v: string) => setFormData(p => ({ ...p, imageUrl: v }))} placeholder="https://example.com/temple.jpg" />

                            {/* Location */}
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full" /> Location
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input label="Address" value={formData.location.address} onChange={(v: string) => setFormData(p => ({ ...p, location: { ...p.location, address: v } }))} className="md:col-span-2" placeholder="Street address" />
                                    <Input label="City *" value={formData.location.city} onChange={(v: string) => setFormData(p => ({ ...p, location: { ...p.location, city: v } }))} required placeholder="City" />
                                    <Input label="State *" value={formData.location.state} onChange={(v: string) => setFormData(p => ({ ...p, location: { ...p.location, state: v } }))} required placeholder="State" />
                                </div>
                            </div>

                            {/* Capacity & Hours */}
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full" /> Capacity & Timings
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Input label="Max Capacity *" type="number" value={formData.capacity.total} onChange={handleCapacityChange} required />
                                    <div>
                                        <label className="block text-slate-700 text-sm font-semibold mb-2">Opens (Weekday)</label>
                                        <input type="time" value={formData.operatingHours.regular.opens} onChange={e => setFormData(p => ({ ...p, operatingHours: { ...p.operatingHours, regular: { ...p.operatingHours.regular, opens: e.target.value } } }))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-semibold mb-2">Closes (Weekday)</label>
                                        <input type="time" value={formData.operatingHours.regular.closes} onChange={e => setFormData(p => ({ ...p, operatingHours: { ...p.operatingHours, regular: { ...p.operatingHours.regular, closes: e.target.value } } }))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4 mt-4">
                                    <Input label="Per Slot Capacity" type="number" value={formData.capacity.per_slot} onChange={(v: number) => setFormData(p => ({ ...p, capacity: { ...p.capacity, per_slot: v } }))} />
                                    <div>
                                        <label className="block text-slate-700 text-sm font-semibold mb-2">Opens (Weekend)</label>
                                        <input type="time" value={formData.operatingHours.weekend.opens} onChange={e => setFormData(p => ({ ...p, operatingHours: { ...p.operatingHours, weekend: { ...p.operatingHours.weekend, opens: e.target.value } } }))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-semibold mb-2">Closes (Weekend)</label>
                                        <input type="time" value={formData.operatingHours.weekend.closes} onChange={e => setFormData(p => ({ ...p, operatingHours: { ...p.operatingHours, weekend: { ...p.operatingHours.weekend, closes: e.target.value } } }))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                                    </div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full" /> Contact Information
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Input label="Phone" value={formData.contact.phone} onChange={(v: string) => setFormData(p => ({ ...p, contact: { ...p.contact, phone: v } }))} placeholder="+91-XXX-XXXX" />
                                    <Input label="Email" value={formData.contact.email} onChange={(v: string) => setFormData(p => ({ ...p, contact: { ...p.contact, email: v } }))} type="email" placeholder="temple@example.org" />
                                    <Input label="Website" value={formData.contact.website} onChange={(v: string) => setFormData(p => ({ ...p, contact: { ...p.contact, website: v } }))} placeholder="https://..." />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Fees & Donations Tab */}
                    {activeTab === 'fees' && (
                        <motion.div
                            key="fees"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded-full" /> Entry & Darshan Fees
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                <Input label="General Entry (₹)" type="number" value={formData.fees.general} onChange={(v: number) => setFormData(p => ({ ...p, fees: { ...p.fees, general: v } }))} />
                                <Input label="Special Darshan (₹)" type="number" value={formData.fees.specialDarshan} onChange={(v: number) => setFormData(p => ({ ...p, fees: { ...p.fees, specialDarshan: v } }))} />
                                <Input label="VIP Entry (₹)" type="number" value={formData.fees.vipEntry} onChange={(v: number) => setFormData(p => ({ ...p, fees: { ...p.fees, vipEntry: v } }))} />
                                <Input label="Foreigners (₹)" type="number" value={formData.fees.foreigners} onChange={(v: number) => setFormData(p => ({ ...p, fees: { ...p.fees, foreigners: v } }))} />
                                <Input label="Prasad (₹)" type="number" value={formData.fees.prasad} onChange={(v: number) => setFormData(p => ({ ...p, fees: { ...p.fees, prasad: v } }))} />
                                <Input label="Photography (₹)" type="number" value={formData.fees.photography} onChange={(v: number) => setFormData(p => ({ ...p, fees: { ...p.fees, photography: v } }))} />
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full" /> Donation Settings
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Checkbox label="Enable Donations" checked={formData.donations.enabled} onChange={(v: boolean) => setFormData(p => ({ ...p, donations: { ...p.donations, enabled: v } }))} icon="💝" />
                                    <Checkbox label="80G Tax Exemption" checked={formData.donations.section80G} onChange={(v: boolean) => setFormData(p => ({ ...p, donations: { ...p.donations, section80G: v } }))} icon="📄" />
                                </div>
                                <div className="mt-4">
                                    <Input label="Minimum Donation Amount (₹)" type="number" value={formData.donations.minimumAmount} onChange={(v: number) => setFormData(p => ({ ...p, donations: { ...p.donations, minimumAmount: v } }))} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Facilities Tab */}
                    {activeTab === 'facilities' && (
                        <motion.div
                            key="facilities"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded-full" /> Available Facilities
                            </h3>
                            <div className="grid md:grid-cols-3 gap-3">
                                <Checkbox label="Parking" checked={formData.facilities.parking} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, parking: v } }))} icon="🅿️" />
                                <Checkbox label="Wheelchair Access" checked={formData.facilities.wheelchairAccess} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, wheelchairAccess: v } }))} icon="♿" />
                                <Checkbox label="Cloakroom" checked={formData.facilities.cloakroom} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, cloakroom: v } }))} icon="🧥" />
                                <Checkbox label="Prasad Counter" checked={formData.facilities.prasadCounter} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, prasadCounter: v } }))} icon="🍲" />
                                <Checkbox label="Shoe Stand" checked={formData.facilities.shoeStand} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, shoeStand: v } }))} icon="👟" />
                                <Checkbox label="Drinking Water" checked={formData.facilities.drinkingWater} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, drinkingWater: v } }))} icon="🚰" />
                                <Checkbox label="Restrooms" checked={formData.facilities.restrooms} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, restrooms: v } }))} icon="🚻" />
                                <Checkbox label="Accommodation" checked={formData.facilities.accommodation} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, accommodation: v } }))} icon="🏨" />
                                <Checkbox label="Free Food (Langar)" checked={formData.facilities.freeFood} onChange={(v: boolean) => setFormData(p => ({ ...p, facilities: { ...p.facilities, freeFood: v } }))} icon="🍛" />
                            </div>
                        </motion.div>
                    )}

                    {/* Prasad Menu Tab */}
                    {activeTab === 'prasad' && (
                        <motion.div
                            key="prasad"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full" /> Prasad Menu Items
                                </h3>
                                <button type="button" onClick={addPrasadItem} className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-medium text-sm hover:bg-orange-200 transition-colors flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Item
                                </button>
                            </div>

                            {formData.prasadMenu.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <span className="text-4xl mb-3 block">🍲</span>
                                    <p className="text-slate-500">No prasad items added yet</p>
                                    <button type="button" onClick={addPrasadItem} className="mt-3 text-orange-600 font-medium text-sm hover:underline">+ Add your first item</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.prasadMenu.map((item, index) => (
                                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-slate-700">Item #{index + 1}</span>
                                                <button type="button" onClick={() => removePrasadItem(index)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                                            </div>
                                            <div className="grid md:grid-cols-4 gap-3">
                                                <input type="text" value={item.name} onChange={e => updatePrasadItem(index, 'name', e.target.value)} placeholder="Name (e.g. Laddu)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                                <input type="number" value={item.price} onChange={e => updatePrasadItem(index, 'price', Number(e.target.value))} placeholder="Price ₹" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                                <input type="text" value={item.servingSize} onChange={e => updatePrasadItem(index, 'servingSize', e.target.value)} placeholder="Serving (e.g. 2 pcs)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                                <input type="text" value={item.description} onChange={e => updatePrasadItem(index, 'description', e.target.value)} placeholder="Description" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Services & Events Tab */}
                    {activeTab === 'services' && (
                        <motion.div
                            key="services"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full" /> Special Services (Abhishekam, Archana, etc.)
                                </h3>
                                <button type="button" onClick={addService} className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-medium text-sm hover:bg-orange-200 transition-colors flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Service
                                </button>
                            </div>

                            {formData.specialServices.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <span className="text-4xl mb-3 block">🙏</span>
                                    <p className="text-slate-500">No special services added yet</p>
                                    <button type="button" onClick={addService} className="mt-3 text-orange-600 font-medium text-sm hover:underline">+ Add your first service</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.specialServices.map((service, index) => (
                                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-slate-700">Service #{index + 1}</span>
                                                <button type="button" onClick={() => removeService(index)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                                            </div>
                                            <div className="grid md:grid-cols-4 gap-3">
                                                <input type="text" value={service.name} onChange={e => updateService(index, 'name', e.target.value)} placeholder="Name (e.g. Abhishekam)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                                <input type="number" value={service.price} onChange={e => updateService(index, 'price', Number(e.target.value))} placeholder="Price ₹" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                                <input type="text" value={service.duration} onChange={e => updateService(index, 'duration', e.target.value)} placeholder="Duration (e.g. 30 mins)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                                <input type="text" value={service.description} onChange={e => updateService(index, 'description', e.target.value)} placeholder="Description" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                            </div>
                                            <label className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                                                <input type="checkbox" checked={service.requiresBooking} onChange={e => updateService(index, 'requiresBooking', e.target.checked)} className="rounded" />
                                                Requires advance booking
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions - Always visible */}
                <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        Tab {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/admin/temples">
                            <button type="button" className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {isEdit ? 'Update Temple' : 'Create Temple'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-3 animate-pulse">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}
            </form>
        </motion.div>
    );
}
