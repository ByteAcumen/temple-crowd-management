'use client';

// Temple Smart E-Pass - Booking Page
// Multi-step wizard for booking darshan slots

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { templesApi, bookingsApi, Temple } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { TrafficLightBadge } from '@/components/ui/traffic-light';

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
        days.push({
            date: date.toISOString().split('T')[0],
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

    // Booking result
    const [bookingResult, setBookingResult] = useState<any>(null);

    // Availability state
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [filledSlots, setFilledSlots] = useState<string[]>([]);

    const dates = getNext7Days();

    // Fetch temples on mount
    useEffect(() => {
        async function fetchTemples() {
            try {
                const response = await templesApi.getAll();
                if (response.success) {
                    setTemples(response.data);

                    // Pre-select temple from URL param
                    const templeId = searchParams.get('temple');
                    if (templeId) {
                        const temple = response.data.find(t => t._id === templeId);
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

    // Availability Check Effect
    useEffect(() => {
        if (selectedTemple && selectedDate) {
            async function checkSlots() {
                setCheckingAvailability(true);
                try {
                    const res = await bookingsApi.checkAvailability(selectedTemple!._id, selectedDate);
                    if (res && res.filledSlots) {
                        setFilledSlots(res.filledSlots);
                    } else {
                        setFilledSlots([]);
                    }
                } catch (e) {
                    console.error("Failed to check availability", e);
                } finally {
                    setCheckingAvailability(false);
                }
            }
            checkSlots();
        } else {
            setFilledSlots([]);
        }
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
            const response = await bookingsApi.create({
                templeId: selectedTemple._id,
                templeName: selectedTemple.name,
                date: selectedDate,
                timeSlot: selectedSlot,
                visitors: visitors,
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
            case 3: return !!selectedSlot && visitors > 0;
            case 4: return isAuthenticated;
            default: return false;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Book Your Visit</h1>
                            <p className="text-sm text-slate-500">Step {step} of 4</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 h-2 rounded-full transition-colors ${s < step ? 'bg-green-500'
                                    : s === step ? 'bg-orange-500'
                                        : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span className={step >= 1 ? 'text-orange-600 font-medium' : ''}>Temple</span>
                        <span className={step >= 2 ? 'text-orange-600 font-medium' : ''}>Date</span>
                        <span className={step >= 3 ? 'text-orange-600 font-medium' : ''}>Slot</span>
                        <span className={step >= 4 ? 'text-orange-600 font-medium' : ''}>Confirm</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Step 1: Select Temple */}
                {step === 1 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a Temple</h2>
                        <p className="text-slate-600 mb-6">Choose the temple you want to visit</p>

                        {isLoading ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                                        <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {temples.map((temple) => (
                                    <button
                                        key={temple._id}
                                        onClick={() => setSelectedTemple(temple)}
                                        className={`text-left p-4 rounded-xl border-2 transition-all ${selectedTemple?._id === temple._id
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-slate-200 bg-white hover:border-orange-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-slate-900">{temple.name}</h3>
                                            <TrafficLightBadge status={
                                                (temple.currentOccupancy || 0) / ((typeof temple.capacity === 'object' ? temple.capacity.total : temple.capacity) || 1) > 0.95 ? 'RED'
                                                    : (temple.currentOccupancy || 0) / ((typeof temple.capacity === 'object' ? temple.capacity.total : temple.capacity) || 1) > 0.85 ? 'ORANGE'
                                                        : 'GREEN'
                                            } />
                                        </div>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
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
                    </div>
                )}

                {/* Step 2: Select Date */}
                {step === 2 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Date</h2>
                        <p className="text-slate-600 mb-6">Choose your preferred visit date</p>

                        <div className="grid grid-cols-7 gap-2 mb-6">
                            {dates.map((d) => (
                                <button
                                    key={d.date}
                                    onClick={() => setSelectedDate(d.date)}
                                    className={`p-3 rounded-xl text-center transition-all ${selectedDate === d.date
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-white border border-slate-200 hover:border-orange-300'
                                        }`}
                                >
                                    <span className="block text-xs font-medium">{d.day}</span>
                                    <span className="block text-xl font-bold">{d.dayNum}</span>
                                    <span className="block text-xs">{d.month}</span>
                                    {d.isToday && (
                                        <span className={`block text-xs mt-1 ${selectedDate === d.date ? 'text-orange-100' : 'text-orange-500'}`}>
                                            Today
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>


                        {/* Selected Temple Summary */}

                        {/* Selected Temple Summary */}
                        {selectedTemple && (
                            <div className="bg-slate-100 rounded-xl p-4 flex items-center gap-3">
                                <span className="text-2xl">🛕</span>
                                <div>
                                    <p className="font-medium text-slate-900">{selectedTemple.name}</p>
                                    <p className="text-sm text-slate-500">Selected temple</p>
                                </div>
                                <button
                                    onClick={() => { setStep(1); setSelectedTemple(null); }}
                                    className="ml-auto text-orange-600 text-sm font-medium hover:underline"
                                >
                                    Change
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Select Time Slot & Visitors */}
                {step === 3 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Time Slot</h2>
                        <p className="text-slate-600 mb-6">Pick a convenient time for your darshan</p>

                        <div className="space-y-4 mb-8">
                            {['Morning', 'Afternoon', 'Evening'].map((period) => (
                                <div key={period}>
                                    <h3 className="text-sm font-medium text-slate-500 mb-2">{period}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {TIME_SLOTS.filter(s => s.period === period).map((slot) => {
                                            const isFull = filledSlots.includes(slot.id);
                                            return (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => !isFull && setSelectedSlot(slot.id)}
                                                    disabled={isFull || checkingAvailability}
                                                    className={`p-3 rounded-xl text-sm font-medium transition-all relative ${isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-100' :
                                                        selectedSlot === slot.id
                                                            ? 'bg-orange-500 text-white'
                                                            : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300'
                                                        }`}
                                                >
                                                    {slot.label}
                                                    {isFull && (
                                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
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

                        {/* Visitor Count */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <h3 className="font-medium text-slate-900 mb-3">Number of Visitors</h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setVisitors(Math.max(1, visitors - 1))}
                                    className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-xl hover:bg-slate-200 transition-colors"
                                    disabled={visitors <= 1}
                                >
                                    -
                                </button>
                                <span className="text-3xl font-bold text-slate-900 min-w-[60px] text-center">
                                    {visitors}
                                </span>
                                <button
                                    onClick={() => setVisitors(Math.min(10, visitors + 1))}
                                    className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-xl hover:bg-slate-200 transition-colors"
                                    disabled={visitors >= 10}
                                >
                                    +
                                </button>
                                <span className="text-slate-500 text-sm">Max 10 per booking</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirm */}
                {step === 4 && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Confirm Booking</h2>
                        <p className="text-slate-600 mb-6">Review your booking details</p>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                            {/* Booking Summary */}
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                                    <span className="text-3xl">🛕</span>
                                    <div>
                                        <p className="font-bold text-lg text-slate-900">{selectedTemple?.name}</p>
                                        <p className="text-slate-500">
                                            {typeof selectedTemple?.location === 'object'
                                                ? `${selectedTemple.location?.city}, ${selectedTemple.location?.state}`
                                                : selectedTemple?.location}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Date</p>
                                        <p className="font-semibold text-slate-900">
                                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Time Slot</p>
                                        <p className="font-semibold text-slate-900">
                                            {TIME_SLOTS.find(s => s.id === selectedSlot)?.label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Visitors</p>
                                        <p className="font-semibold text-slate-900">{visitors} person(s)</p>
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            {isAuthenticated && user ? (
                                <div className="bg-green-50 p-4 border-t border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                                            {user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-green-900">{user.name}</p>
                                            <p className="text-sm text-green-700">{user.email}</p>
                                        </div>
                                        <svg className="w-6 h-6 text-green-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-orange-50 p-4 border-t border-orange-100">
                                    <p className="text-orange-800 mb-2">Please login to complete your booking</p>
                                    <Link
                                        href={`/login?from=${encodeURIComponent(`/booking?temple=${selectedTemple?._id}`)}`}
                                        className="btn-primary text-sm py-2 px-4 inline-block"
                                    >
                                        Login to Continue
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Free Entry Notice */}
                        <div className="bg-blue-50 rounded-xl p-4 text-blue-800 text-sm flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-medium">Free Entry</p>
                                <p>This is a free darshan slot. No payment required.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Success */}
                {step === 5 && bookingResult && (
                    <div className="animate-fade-in-up text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                        <p className="text-slate-600 mb-6">Your E-Pass has been generated</p>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm mx-auto mb-6">
                            <p className="text-sm text-slate-500 mb-2">E-Pass ID</p>
                            <p className="text-xl font-mono font-bold text-orange-600 mb-4">
                                {bookingResult.passId || bookingResult._id}
                            </p>

                            {/* QR Code Placeholder */}
                            <div className="w-48 h-48 bg-slate-100 rounded-xl mx-auto flex items-center justify-center mb-4">
                                <span className="text-slate-400 text-sm">QR Code</span>
                            </div>

                            <p className="text-sm text-slate-600">
                                Show this QR code at the temple entrance
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href={`/tickets/${bookingResult.passId || bookingResult._id}`}
                                className="btn-primary py-3 px-6"
                            >
                                View E-Pass
                            </Link>
                            <Link
                                href="/dashboard"
                                className="btn-secondary py-3 px-6"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                {step < 5 && (
                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                        <button
                            onClick={() => setStep(Math.max(1, step - 1))}
                            className={`px-6 py-3 rounded-xl font-medium transition-colors ${step === 1
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            disabled={step === 1}
                        >
                            ← Back
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed(step)}
                                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!canProceed(step) || isSubmitting}
                                className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Booking...
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                    <p className="text-slate-600">Loading booking page...</p>
                </div>
            </div>
        }>
            <BookingContent />
        </Suspense>
    );
}
