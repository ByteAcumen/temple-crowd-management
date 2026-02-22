'use client';

// Temple Smart E-Pass - Booking Page
// Premium Design: Animated Gradients, Glassmorphism, Smooth Wizards

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useRef } from 'react';
import { templesApi, bookingsApi, Temple } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { TrafficLightBadge } from '@/components/ui/traffic-light';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/ui/Logo';

// Time slots available for booking
const TIME_SLOTS = [
    { id: '06:00-08:00', label: '6:00 AM - 8:00 AM', period: 'Morning' },
    { id: '08:00-10:00', label: '8:00 AM - 10:00 AM', period: 'Morning' },
    { id: '10:00-12:00', label: '10:00 AM - 12:00 PM', period: 'Morning' },
    { id: '12:00-14:00', label: '12:00 PM - 2:00 PM', period: 'Afternoon' },
    { id: '14:00-16:00', label: '2:00 PM - 4:00 PM', period: 'Afternoon' },
    { id: '16:00-18:00', label: '4:00 PM - 6:00 PM', period: 'Evening' },
    { id: '18:00-20:00', label: '6:00 PM - 8:00 PM', period: 'Evening' },
];

// Generate next 7 days for date selection
function getNext7Days() {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');

        days.push({
            date: `${year}-${month}-${dayStr}`,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            isToday: i === 0,
        });
    }
    return days;
}

function BookingContent() {
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Wizard state
    const [step, setStep] = useState(1);
    const [temples, setTemples] = useState<Temple[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [visitors, setVisitors] = useState(1);
    const [visitorDetails, setVisitorDetails] = useState<Array<{
        name: string;
        age: number;
        gender: string;
        idType: string;
        idNumber: string;
    }>>([{ name: '', age: 0, gender: '', idType: 'NONE', idNumber: '' }]);

    // Booking result
    const [bookingResult, setBookingResult] = useState<any>(null);

    // Availability state
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [filledSlots, setFilledSlots] = useState<string[]>([]);

    const [dates, setDates] = useState(getNext7Days());
    useEffect(() => {
        setDates(getNext7Days());
    }, []);
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    // Fetch temples on mount
    useEffect(() => {
        async function fetchTemples() {
            try {
                const response = await templesApi.getAll();
                if (response.success) {
                    setTemples(response.data);

                    // Pre-select temple from URL param
                    const templeIdParam = searchParams.get('temple');
                    if (templeIdParam) {
                        const temple = response.data.find(t => (t._id || (t as any).id) === templeIdParam);
                        if (temple) {
                            setSelectedTemple(temple);
                            setStep(2); // Go to date selection
                        }
                    }
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load temples';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTemples();
    }, [searchParams]);

    // Check slot availability for the selected date
    useEffect(() => {
        async function checkAvailability() {
            if (!selectedTemple || !selectedDate) return;

            setCheckingAvailability(true);
            const filled: string[] = [];

            try {
                const activeTempleId = selectedTemple._id || (selectedTemple as any).id;
                const checks = TIME_SLOTS.map(async (slot) => {
                    try {
                        const slotRes = await bookingsApi.checkAvailability(activeTempleId, selectedDate, slot.id);
                        if (slotRes.success && slotRes.data.status === 'FULL') {
                            return slot.id;
                        }
                    } catch (e) {
                        console.error(`Failed to check slot ${slot.id}`, e);
                    }
                    return null;
                });

                const results = await Promise.all(checks);
                const fullSlots = results.filter((s): s is string => s !== null);
                setFilledSlots(fullSlots);
            } catch (err) {
                console.error("Failed to check availability", err);
            } finally {
                setCheckingAvailability(false);
            }
        }

        checkAvailability();
    }, [selectedTemple, selectedDate]);

    // Handle booking submission
    const handleSubmit = async () => {
        if (!selectedTemple || !selectedDate || !selectedSlot || !isAuthenticated) {
            setError('Please complete all steps and login first');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const activeTempleId = selectedTemple._id || (selectedTemple as any).id;
            const response = await bookingsApi.create({
                templeId: activeTempleId,
                templeName: selectedTemple.name,
                date: selectedDate,
                timeSlot: selectedSlot,
                visitors: visitors,
                visitorDetails: visitorDetails.filter(v => v.name && v.age > 0),
            });

            if (response.success) {
                setBookingResult(response.data);
                setStep(5); // Success step
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Booking failed. Please try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step navigation
    const canProceed = (currentStep: number) => {
        switch (currentStep) {
            case 1: return !!selectedTemple;
            case 2: return !!selectedDate;
            case 3: {
                // Check slot, visitor count, and that all visitor details are filled
                const hasSlot = !!selectedSlot && visitors > 0;
                const allDetailsFilled = visitorDetails
                    .slice(0, visitors)
                    .every(v => v.name.trim() && v.age > 0 && v.gender.trim());
                return hasSlot && allDetailsFilled;
            }
            case 4: return isAuthenticated;
            default: return false;
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
    };

    return (
        <div ref={scrollRef} className="min-h-screen gradient-animated font-sans text-slate-900 selection:bg-orange-500/30 overflow-x-hidden relative">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-reverse" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
                <div className="max-w-4xl mx-auto glass rounded-2xl shadow-lg border border-white/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-white/50 rounded-xl transition-colors text-slate-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <Logo size="sm" />
                        <div>
                            <h1 className="font-bold text-sm text-slate-800">New Booking</h1>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Step {step} of 4</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress Bar (Fixed below header) */}
            <div className="fixed top-24 left-0 right-0 z-40 px-4">
                <div className="max-w-md mx-auto">
                    <div className="bg-white/40 backdrop-blur-md rounded-full h-1.5 overflow-hidden flex shadow-sm">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 transition-all duration-500 ${s <= step ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-transparent'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="pt-32 pb-24 px-4 max-w-4xl mx-auto relative z-10">
                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-3 shadow-lg"
                        >
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* Step 1: Select Temple */}
                    {step === 1 && (
                        <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Select Destination</h2>
                                <p className="text-slate-500 font-medium">Choose a temple for your spiritual journey</p>
                            </div>

                            {isLoading ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="glass rounded-3xl p-6 animate-pulse h-32" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {temples.map((temple) => (
                                        <button
                                            key={temple._id || (temple as any).id}
                                            onClick={() => setSelectedTemple(temple)}
                                            className={`group relative text-left p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl ${(selectedTemple?._id || (selectedTemple as any)?.id) === (temple._id || (temple as any).id)
                                                ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-transparent shadow-lg shadow-orange-500/30'
                                                : 'glass border-white/40 hover:border-orange-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${(selectedTemple?._id || (selectedTemple as any)?.id) === (temple._id || (temple as any).id) ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600'}`}>
                                                    🛕
                                                </div>
                                                <TrafficLightBadge status={
                                                    (temple.currentOccupancy || 0) / ((typeof temple.capacity === 'object' ? temple.capacity.total : temple.capacity) || 1) > 0.95 ? 'RED'
                                                        : (temple.currentOccupancy || 0) / ((typeof temple.capacity === 'object' ? temple.capacity.total : temple.capacity) || 1) > 0.85 ? 'ORANGE'
                                                            : 'GREEN'
                                                } />
                                            </div>
                                            <h3 className={`font-bold text-lg mb-1 ${(selectedTemple?._id || (selectedTemple as any)?.id) === (temple._id || (temple as any).id) ? 'text-white' : 'text-slate-800'}`}>{temple.name}</h3>
                                            <p className={`text-sm flex items-center gap-1 ${(selectedTemple?._id || (selectedTemple as any)?.id) === (temple._id || (temple as any).id) ? 'text-orange-100' : 'text-slate-500'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                                {typeof temple.location === 'object'
                                                    ? `${temple.location?.city}, ${temple.location?.state}`
                                                    : temple.location}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 2: Select Date */}
                    {step === 2 && (
                        <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Pick a Date</h2>
                                <p className="text-slate-500 font-medium">When would you like to visit?</p>
                            </div>

                            <div className="glass rounded-[2rem] p-6 border border-white/40 shadow-xl">
                                <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                                    {dates.map((d) => (
                                        <button
                                            key={d.date}
                                            onClick={() => setSelectedDate(d.date)}
                                            className={`p-4 rounded-2xl text-center transition-all relative overflow-hidden group ${selectedDate === d.date
                                                ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-500 ring-offset-2'
                                                : 'bg-white/50 hover:bg-white border border-white/20 hover:border-orange-200'
                                                }`}
                                        >
                                            <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{d.day}</span>
                                            <span className="block text-2xl font-black mb-1">{d.dayNum}</span>
                                            <span className="block text-xs font-medium opacity-80">{d.month}</span>
                                            {d.isToday && (
                                                <span className={`absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold rounded-bl-lg ${selectedDate === d.date ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                                    TODAY
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Temple Summary */}
                            {selectedTemple && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/40">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🛕</div>
                                    <div>
                                        <p className="font-bold text-slate-800">{selectedTemple.name}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Selected Temple</p>
                                    </div>
                                    <button
                                        onClick={() => { setStep(1); setSelectedTemple(null); }}
                                        className="ml-auto text-orange-600 text-sm font-bold hover:underline px-3 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                    >
                                        Change
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 3: Select Time Slot & Visitors */}
                    {step === 3 && (
                        <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Details</h2>
                                <p className="text-slate-500 font-medium">Select time and add visitors</p>
                            </div>

                            <div className="glass rounded-[2rem] p-6 md:p-8 border border-white/40 shadow-xl space-y-8">
                                {/* Time Slots */}
                                <div className="space-y-6">
                                    {['Morning', 'Afternoon', 'Evening'].map((period) => (
                                        <div key={period}>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">{period}</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {TIME_SLOTS.filter(s => s.period === period).map((slot) => {
                                                    const isFull = filledSlots.includes(slot.id);
                                                    return (
                                                        <button
                                                            key={slot.id}
                                                            onClick={() => !isFull && setSelectedSlot(slot.id)}
                                                            disabled={isFull || checkingAvailability}
                                                            className={`p-3 rounded-xl text-sm font-bold transition-all relative border ${isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' :
                                                                selectedSlot === slot.id
                                                                    ? 'bg-slate-800 text-white border-slate-900 shadow-lg scale-[1.02]'
                                                                    : 'bg-white/50 text-slate-600 border-slate-200 hover:border-orange-400 hover:bg-white'
                                                                }`}
                                                        >
                                                            {slot.label}
                                                            {isFull && (
                                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                                                                    FULL
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-px bg-slate-200/50"></div>

                                {/* Visitor Count */}
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-4">Number of Visitors</h3>
                                    <div className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-200/50 w-max">
                                        <button
                                            onClick={() => {
                                                const newCount = Math.max(1, visitors - 1);
                                                setVisitors(newCount);
                                                setVisitorDetails(prev => prev.slice(0, newCount));
                                            }}
                                            className="w-10 h-10 rounded-xl bg-white text-slate-700 font-bold text-xl hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
                                            disabled={visitors <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="text-2xl font-black text-slate-900 min-w-[40px] text-center">
                                            {visitors}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const newCount = Math.min(10, visitors + 1);
                                                setVisitors(newCount);
                                                setVisitorDetails(prev => [
                                                    ...prev,
                                                    { name: '', age: 0, gender: '', idType: 'NONE', idNumber: '' }
                                                ]);
                                            }}
                                            className="w-10 h-10 rounded-xl bg-white text-slate-700 font-bold text-xl hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
                                            disabled={visitors >= 10}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium mt-2 ml-2">Maximum 10 visitors per booking</p>
                                </div>

                                {/* Visitor Details Forms */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800">Visitor Information</h3>
                                    {Array.from({ length: visitors }, (_, idx) => (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200">
                                            <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-4">
                                                Visitor {idx + 1} {idx === 0 && '(Primary)'}
                                            </h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                                                        Full Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={visitorDetails[idx]?.name || ''}
                                                        onChange={(e) => {
                                                            const newDetails = [...visitorDetails];
                                                            newDetails[idx] = { ...newDetails[idx], name: e.target.value };
                                                            setVisitorDetails(newDetails);
                                                        }}
                                                        placeholder="Enter full name"
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                                                        Age <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={visitorDetails[idx]?.age || ''}
                                                        onChange={(e) => {
                                                            const newDetails = [...visitorDetails];
                                                            newDetails[idx] = { ...newDetails[idx], age: parseInt(e.target.value) || 0 };
                                                            setVisitorDetails(newDetails);
                                                        }}
                                                        placeholder="Age"
                                                        min="1"
                                                        max="120"
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                                                        Gender <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={visitorDetails[idx]?.gender || ''}
                                                        onChange={(e) => {
                                                            const newDetails = [...visitorDetails];
                                                            newDetails[idx] = { ...newDetails[idx], gender: e.target.value };
                                                            setVisitorDetails(newDetails);
                                                        }}
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all appearance-none"
                                                        required
                                                    >
                                                        <option value="">Select gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                                                        ID Type (Optional)
                                                    </label>
                                                    <select
                                                        value={visitorDetails[idx]?.idType || 'NONE'}
                                                        onChange={(e) => {
                                                            const newDetails = [...visitorDetails];
                                                            newDetails[idx] = { ...newDetails[idx], idType: e.target.value };
                                                            setVisitorDetails(newDetails);
                                                        }}
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all appearance-none"
                                                    >
                                                        <option value="NONE">No ID</option>
                                                        <option value="AADHAR">Aadhar Card</option>
                                                        <option value="PAN">PAN Card</option>
                                                        <option value="PASSPORT">Passport</option>
                                                        <option value="DRIVING_LICENSE">Driving License</option>
                                                        <option value="VOTER_ID">Voter ID</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 pl-1">
                                                        ID Number (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={visitorDetails[idx]?.idNumber || ''}
                                                        onChange={(e) => {
                                                            const newDetails = [...visitorDetails];
                                                            newDetails[idx] = { ...newDetails[idx], idNumber: e.target.value };
                                                            setVisitorDetails(newDetails);
                                                        }}
                                                        placeholder="ID number"
                                                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                                                        disabled={visitorDetails[idx]?.idType === 'NONE'}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Confirm */}
                    {step === 4 && (
                        <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Review & Confirm</h2>
                                <p className="text-slate-500 font-medium">Almost there! Review your details.</p>
                            </div>

                            <div className="glass rounded-[2rem] border border-white/40 overflow-hidden shadow-xl mb-6">
                                {/* Booking Summary */}
                                <div className="p-8 space-y-6">
                                    <div className="flex items-center gap-6 pb-6 border-b border-slate-200/50">
                                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
                                            🛕
                                        </div>
                                        <div>
                                            <p className="font-black text-xl text-slate-800">{selectedTemple?.name}</p>
                                            <p className="text-slate-500 font-medium">
                                                {typeof selectedTemple?.location === 'object'
                                                    ? `${selectedTemple.location?.city}, ${selectedTemple.location?.state}`
                                                    : selectedTemple?.location}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="bg-slate-50/80 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                            <p className="font-bold text-slate-900 text-lg">
                                                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50/80 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time Slot</p>
                                            <p className="font-bold text-slate-900 text-lg">
                                                {TIME_SLOTS.find(s => s.id === selectedSlot)?.label.split('-')[0]}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50/80 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Visitors</p>
                                            <p className="font-bold text-slate-900 text-lg">{visitors} Person{visitors > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* User Info */}
                                {isAuthenticated && user ? (
                                    <div className="bg-emerald-50/80 backdrop-blur-sm p-6 border-t border-emerald-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                                                {user.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-emerald-900 text-sm">Logged in as {user.name}</p>
                                                <p className="text-xs text-emerald-700">{user.email}</p>
                                            </div>
                                        </div>
                                        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="bg-orange-50/80 backdrop-blur-sm p-6 border-t border-orange-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-800 font-bold text-sm">Login Required</p>
                                            <p className="text-orange-600 text-xs mt-0.5">You must be logged in to book.</p>
                                        </div>
                                        <Link
                                            href={`/login?from=${encodeURIComponent(`/booking?temple=${selectedTemple?._id || (selectedTemple as any)?.id}`)}`}
                                            className="px-4 py-2 bg-white text-orange-600 font-bold rounded-lg text-sm shadow-sm hover:shadow-md transition-all"
                                        >
                                            Login Now
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Free Entry Notice */}
                            <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 text-blue-800 text-sm flex items-start gap-3 border border-blue-100">
                                <span className="text-xl">ℹ️</span>
                                <div>
                                    <p className="font-bold">Free Entry</p>
                                    <p className="opacity-80 text-xs mt-0.5">This is a free darshan slot. No payment required.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && bookingResult && (
                        <motion.div key="step5" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="text-center">
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }}
                                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30"
                            >
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>

                            <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Booking Confirmed!</h2>
                            <p className="text-slate-500 font-medium mb-8 text-lg">Your E-Pass is ready.</p>

                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-8 max-w-sm mx-auto mb-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-Pass ID</p>
                                <p className="text-3xl font-mono font-black text-slate-800 mb-6 bg-slate-100/50 rounded-lg py-2">
                                    {bookingResult.passId || bookingResult._id}
                                </p>

                                {/* QR Code Placeholder */}
                                <div className="w-48 h-48 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PREVIEW')] opacity-20 blur-sm group-hover:blur-0 transition-all duration-500"></div>
                                    <span className="text-white/50 text-xs font-medium z-10">QR Code Generated</span>
                                </div>

                                <p className="text-xs text-slate-500 font-medium bg-slate-100 rounded-full px-3 py-1 inline-block">
                                    Show this at the temple entrance
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={`/tickets/${bookingResult.passId || bookingResult._id}`}
                                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/30 hover:scale-105 transition-all text-lg"
                                >
                                    View E-Pass
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 text-lg shadow-sm"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                {step < 5 && (
                    <div className="flex justify-between mt-12 pt-8 border-t border-slate-200/50">
                        <button
                            onClick={() => setStep(Math.max(1, step - 1))}
                            className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${step === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-white/50'
                                }`}
                            disabled={step === 1}
                        >
                            ← Back
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed(step)}
                                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                Continue →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!canProceed(step) || isSubmitting}
                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Confiming...
                                    </>
                                ) : (
                                    <>
                                        Confirm Booking
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

// Main export with Suspense for useSearchParams
export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center gradient-animated">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <p className="text-white font-bold animate-pulse">Starting your journey...</p>
                </div>
            </div>
        }>
            <BookingContent />
        </Suspense>
    );
}
