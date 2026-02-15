'use client';

// Temple Smart E-Pass - Gatekeeper Scanner
// Premium Security Pro Design (High Contrast, Fast, Clear Feedback)

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useState, useRef, useEffect, useCallback } from 'react';
import { liveApi, bookingsApi, templesApi, Booking, Temple } from '@/lib/api';
import { SupportModal } from '@/components/gatekeeper/SupportModal';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';

type ScanMode = 'entry' | 'exit';
type ScanMethod = 'camera' | 'manual';
type ResultType = 'success' | 'error' | 'warning' | 'info';

interface ScanResult {
    type: ResultType;
    title: string;
    message: string;
    details?: string;
    booking?: Booking;
    timestamp: Date;
}

export default function GatekeeperScanPage() {
    return (
        <ProtectedRoute allowedRoles={['gatekeeper', 'admin']}>
            <GatekeeperContent />
        </ProtectedRoute>
    );
}

function GatekeeperContent() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // Core State
    const [scanMode, setScanMode] = useState<ScanMode>('entry');
    const [scanMethod, setScanMethod] = useState<ScanMethod>('camera');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [manualPassId, setManualPassId] = useState('');

    // Data State
    const [temples, setTemples] = useState<Temple[]>([]);
    const [selectedTempleId, setSelectedTempleId] = useState<string>('');

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'gatekeeper' && user.role !== 'admin') {
            router.replace('/dashboard');
            return;
        }
        console.log('🔌 Gatekeeper Config: API_URL', process.env.NEXT_PUBLIC_API_URL);
    }, [user, router]);

    // State
    const [stats, setStats] = useState({ entries: 0, exits: 0, live: 0 });
    const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
    const [isOnline, setIsOnline] = useState(true);

    // Fetch Stats
    const fetchStats = useCallback(async () => {
        // CRITICAL: Wait for auth loading to complete AND verify role
        if (authLoading) {
            console.log('⏳ Skipping fetchStats - auth still loading');
            return;
        }

        // Skip if no temple selected or user not authorized
        if (!selectedTempleId || !user || (user.role !== 'gatekeeper' && user.role !== 'admin')) {
            console.log('⏭️ Skipping fetchStats - no temple or unauthorized');
            // Don't set offline here - just skip the fetch
            return;
        }

        try {
            console.log(`📊 Fetching stats for temple: ${selectedTempleId}`);
            const res = await liveApi.getDailyStats(selectedTempleId);
            if (res.success && res.data) {
                setStats({
                    entries: res.data.today_entries,
                    exits: res.data.today_exits,
                    live: res.data.live_count
                });
                setIsOnline(true);
                console.log('✅ Stats fetched successfully');
            }
        } catch (err: any) {
            console.error("❌ Failed to fetch stats:", err);
            // Only mark offline if it's NOT an auth error and NOT a client error
            if (err.message && (
                err.message.includes('authorized') ||
                err.message.includes('permission') ||
                err.message.includes('401') ||
                err.message.includes('403')
            )) {
                // Auth error - we are Online, just unauthorized for this specific call
                setIsOnline(true);
            } else {
                // Genuine network/server error
                setIsOnline(false);
            }
        }
    }, [selectedTempleId, user, authLoading]);


    // Initial Fetch & Interval
    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Update stats immediately after scan
    useEffect(() => {
        if (scanResult?.type === 'success') fetchStats();
    }, [scanResult, fetchStats]);

    // UI State
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [showTempleSelector, setShowTempleSelector] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);

    // Refs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scannerRef = useRef<any | null>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastScannedCode = useRef<string | null>(null);
    const lastScanTime = useRef<number>(0);

    // State Refs for stable callbacks
    const startScanModeRef = useRef(scanMode);
    const isScanningRef = useRef(isScanning);
    const selectedTempleIdRef = useRef(selectedTempleId);

    useEffect(() => { startScanModeRef.current = scanMode; }, [scanMode]);
    useEffect(() => { isScanningRef.current = isScanning; }, [isScanning]);
    useEffect(() => { selectedTempleIdRef.current = selectedTempleId; }, [selectedTempleId]);

    // 1. Initialize & Load Temples
    useEffect(() => {
        async function init() {
            try {
                const res = await templesApi.getAll();
                if (res.success && res.data.length > 0) {
                    setTemples(res.data);
                    // Auto-select first temple or previously selected
                    const saved = localStorage.getItem('gk_selected_temple');
                    if (saved && res.data.find(t => t._id === saved)) {
                        setSelectedTempleId(saved);
                    } else {
                        setSelectedTempleId(res.data[0]._id);
                    }
                }
            } catch (err) {
                console.error("Failed to load temples", err);
            }
        }
        init();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Camera Management
    useEffect(() => {
        if (scanMethod === 'camera' && !scannerRef.current && scannerContainerRef.current) {
            startCamera();
        }
        return () => { stopCamera(); };
    }, [scanMethod]);

    const startCamera = async () => {
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            if (scannerContainerRef.current) {
                // Ensure any previous instance is stopped
                if (scannerRef.current) {
                    await stopCamera();
                }

                const scanner = new Html5Qrcode('qr-scanner-gk');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 15, qrbox: { width: 280, height: 280 }, aspectRatio: 1 },
                    onScanSuccess,
                    () => { }
                );
                setIsCameraActive(true);
                setCameraError(null);
            }
        } catch (_err: any) {
            console.error("Camera start failed", _err);
            let errorMessage = "Camera access unavailable.";

            if (_err.name === 'NotAllowedError') {
                errorMessage = "Camera permission denied. Please allow access in browser settings.";
            } else if (_err.name === 'NotFoundError') {
                errorMessage = "No camera device found.";
            } else if (_err.name === 'NotReadableError') {
                errorMessage = "Camera is in use by another app. Please close other apps/tabs using camera.";
            } else if (_err.name === 'OverconstrainedError') {
                errorMessage = "Camera constraints not satisfied.";
            }

            setCameraError(errorMessage);
            setIsCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => { });
            scannerRef.current = null;
            setIsCameraActive(false);
        }
    };

    // 3. Scan Logic
    const onScanSuccess = useCallback((decodedText: string) => {
        const now = Date.now();
        // Prevent duplicate scans of the same code within 3 seconds
        if (decodedText === lastScannedCode.current && now - lastScanTime.current < 3000) {
            return;
        }

        if (!isScanningRef.current) {
            lastScannedCode.current = decodedText;
            lastScanTime.current = now;
            handleScan(decodedText);
        }
    }, []); // No dependencies needed due to Refs/Hoisting (handleScan is now stable)

    const handleScan = useCallback(async (passId: string) => {
        // Use Refs for current state
        const currentIsScanning = isScanningRef.current;
        const currentTempleId = selectedTempleIdRef.current;
        const currentScanMode = startScanModeRef.current;

        if (currentIsScanning || !passId.trim()) return;

        setIsScanning(true);
        if (navigator.vibrate) navigator.vibrate(50); // Haptic ack

        try {
            console.log('🔍 Raw Scan Data:', passId);

            // Parse QR code - it might be JSON or plain passId
            let actualPassId = passId.trim().replace(/\s+/g, ''); // Remove ALL whitespace
            try {
                // Try parsing as JSON first (e.g. {"id":"PAS-123","t":"Temp1"})
                const qrData = JSON.parse(passId);
                // Extract passId from JSON structure
                // Common patterns: id, passId, _id
                actualPassId = (qrData.id || qrData.passId || qrData._id || passId.trim()).replace(/\s+/g, ''); // Remove spaces
                console.log('✅ QR Parsed as JSON:', qrData, 'Derived PassID:', actualPassId);
            } catch {
                // Not JSON, treat as raw text (e.g. "PAS-123")
                console.log('📝 QR Parsed as Text:', actualPassId);
            }

            // A. Check Temple Selection
            if (!currentTempleId) {
                console.error('❌ No temple selected');
                throw new Error("SELECT TEMPLE|Please select a temple from the dropdown first");
            }

            // B. Fetch Booking using extracted passId
            console.log(`🚀 Verifying PassID: ${actualPassId} at temple: ${currentTempleId}`);

            let res;
            try {
                res = await bookingsApi.getByPassId(actualPassId);
                console.log('✅ Booking API Response:', res);
            } catch (apiError: any) {
                console.error("❌ API Call Failed:", apiError);
                throw new Error(`SERVER ERROR|${apiError.message || 'Cannot connect to server'}. Ensure backend is running.`);
            }

            if (!res || !res.success || !res.data) {
                console.error("❌ Invalid API response:", res);
                throw new Error("INVALID PASS|Pass ID not found in system");
            }

            const booking = res.data;
            console.log('📋 Booking Details:', {
                passId: booking.passId,
                status: booking.status,
                temple: booking.temple,
                date: booking.date
            });

            // C. Validate Temple matching
            // Handle populated vs string temple ID
            const bookingTempleId = typeof booking.temple === 'object' ? booking.temple._id : booking.temple;
            const bookingTempleName = typeof booking.temple === 'object' ? booking.temple.name : 'Another Temple';

            console.log(`🏛️ Temple Check: Booking=${bookingTempleId} vs Selected=${currentTempleId}`);
            if (bookingTempleId !== currentTempleId) {
                throw new Error(`WRONG TEMPLE|This pass is for: ${bookingTempleName}`);
            }

            // E. Validate Status
            console.log(`📊 Status Check: Current=${booking.status}, Mode=${currentScanMode}`);
            if (booking.status === 'CANCELLED') throw new Error("CANCELLED|This pass has been cancelled");
            if (booking.status === 'EXPIRED') throw new Error("EXPIRED|This pass has expired");
            if (currentScanMode === 'entry' && booking.status === 'USED') {
                throw new Error("ALREADY USED|Entry already recorded for this pass");
            }
            if (currentScanMode === 'exit' && booking.exitTime) {
                throw new Error("ALREADY EXIT|Exit already recorded for this pass");
            }

            // G. Validate Date (Must be TODAY)
            const today = new Date();
            const bookingDate = new Date(booking.date);

            // Reset times to compare dates only
            today.setHours(0, 0, 0, 0);
            bookingDate.setHours(0, 0, 0, 0);

            console.log(`📅 Date Check: Booking=${bookingDate.toDateString()} vs Today=${today.toDateString()}`);
            if (bookingDate.getTime() !== today.getTime()) {
                // WARN but allow scanning for flexibility in testing (or stricter based on requirements)
                // For now, let's throw ERROR if it's clearly past, but maybe WARNING if future?
                // Actually, stricty speaking, a pass is only valid for its specific slot.
                // Let's keep it strict but ensure the error is CLEAR.
                if (bookingDate < today) throw new Error("EXPIRED DATE|Pass was for a past date");
                if (bookingDate > today) throw new Error(`FUTURE DATE|Valid for: ${new Date(booking.date).toLocaleDateString()}`);
            }

            // F. Process Action
            console.log(`🎯 Recording ${currentScanMode} for temple ${currentTempleId} with pass ${actualPassId}`);
            let apiRes;
            try {
                if (currentScanMode === 'entry') {
                    apiRes = await liveApi.recordEntry(currentTempleId, actualPassId);
                } else {
                    apiRes = await liveApi.recordExit(currentTempleId, actualPassId);
                }
                console.log(`✅ ${currentScanMode.toUpperCase()} recorded:`, apiRes);
            } catch (recordError: any) {
                console.error(`❌ Failed to record ${currentScanMode}:`, recordError);
                throw new Error(`RECORDING FAILED|${recordError.message || 'Could not record entry/exit'}`);
            }

            // G. Success Result
            const audio = new Audio('/sounds/success.mp3');
            audio.play().catch(() => { });
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            const result: ScanResult = {
                type: 'success',
                title: currentScanMode === 'entry' ? 'ENTRY APPROVED' : 'EXIT RECORDED',
                message: 'Welcome!',
                details: `${typeof booking.user === 'object' ? booking.user.name : booking.userName || 'Visitor'} • ${booking.visitors} Person(s)`,
                booking,
                timestamp: new Date()
            };

            setScanResult(result);
            // Optimistic update
            setStats(prev => ({
                ...prev, // Keep existing live if not returned
                entries: currentScanMode === 'entry' ? prev.entries + 1 : prev.entries,
                exits: currentScanMode === 'exit' ? prev.exits + 1 : prev.exits,
                live: (apiRes && typeof apiRes.data?.temple?.live_count === 'number')
                    ? apiRes.data.temple.live_count
                    : (currentScanMode === 'entry' ? prev.live + 1 : Math.max(0, prev.live - 1))
            }));
            setRecentScans(prev => [result, ...prev].slice(0, 50));

        } catch (err: any) {
            // H. Failure Result
            console.error("❌ Scan Failed - Full Error:", err);
            const audio = new Audio('/sounds/error.mp3');
            audio.play().catch(() => { });
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

            let title = 'ACCESS DENIED';
            let message = err.message || 'Verification Failed';
            let type: ResultType = 'error';

            // Handle pipe-separated error format (TITLE|MESSAGE)
            if (message.includes('|')) {
                const parts = message.split('|');
                title = parts[0];
                message = parts[1];
            }

            // Determine error type
            if (title.includes('FUTURE') || title.includes('WRONG TEMPLE') || title.includes('SELECT TEMPLE')) {
                type = 'warning';
            }

            const result: ScanResult = {
                type,
                title: title,
                message: message,
                timestamp: new Date()
            };
            setScanResult(result);
            setRecentScans(prev => [result, ...prev].slice(0, 50));
        } finally {
            setIsScanning(false);
            setManualPassId('');
            // Auto-dismiss result after 3.5s
            setTimeout(() => setScanResult(null), 3500);
        }
    }, []);

    const currentTemple = temples.find(t => t._id === selectedTempleId);

    // Dynamic styles based on result type
    const getResultStyles = (type: ResultType) => {
        switch (type) {
            case 'success': return 'bg-emerald-500';
            case 'warning': return 'bg-amber-500';
            case 'info': return 'bg-blue-500';
            default: return 'bg-red-600';
        }
    };

    const getResultIcon = (type: ResultType) => {
        switch (type) {
            case 'success': return (
                <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            );
            case 'warning': return (
                <svg className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            );
            default: return (
                <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            );
        }
    };

    return (
        <div className="min-h-screen gradient-animated overflow-hidden font-sans text-slate-900 selection:bg-orange-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-reverse" />
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-yellow-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float delay-500" />
            </div>

            {/* 1. Header (Glassmorphism) */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
                <div className="max-w-md mx-auto glass rounded-2xl shadow-lg border border-white/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo size="sm" />
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-sm text-slate-800">Gatekeeper</h1>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={fetchStats}
                            className={`w-9 h-9 flex items-center justify-center bg-white/50 hover:bg-white rounded-xl text-slate-500 transition-all active:scale-95 ${!isOnline ? 'text-red-500 bg-red-100/50' : ''}`}
                            title={isOnline ? "Refresh Stats" : "Offline - Retrying..."}
                        >
                            <svg className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOnline ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" : "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                        </button>

                        <button
                            onClick={() => setShowTempleSelector(!showTempleSelector)}
                            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white pl-3 pr-2 py-1.5 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 hover:brightness-110"
                        >
                            <span className="text-xs font-bold max-w-[80px] truncate">
                                {currentTemple ? currentTemple.name : 'Select'}
                            </span>
                            <svg className={`w-3 h-3 transition-transform ${showTempleSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Temple Selector Overlay */}
            <AnimatePresence>
                {showTempleSelector && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                            onClick={() => setShowTempleSelector(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="fixed top-24 right-4 left-4 md:left-auto md:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden origin-top"
                        >
                            <div className="p-3 bg-slate-50 border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Location</h3>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                {temples.map(t => (
                                    <button
                                        key={t._id}
                                        onClick={() => {
                                            setSelectedTempleId(t._id);
                                            localStorage.setItem('gk_selected_temple', t._id);
                                            setShowTempleSelector(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${selectedTempleId === t._id ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className="font-bold">{t.name}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{typeof t.location === 'string' ? t.location : t.location.city}</div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="pt-24 pb-28 px-4 max-w-md mx-auto space-y-6 relative z-10">
                {/* Mode Switcher */}
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-sm flex gap-1">
                    <button
                        onClick={() => setScanMode('entry')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${scanMode === 'entry' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        <span className="w-2 h-2 rounded-full bg-white/30" />
                        ENTRY
                    </button>
                    <button
                        onClick={() => setScanMode('exit')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${scanMode === 'exit' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        EXIT
                        <span className="w-2 h-2 rounded-full bg-white/30" />
                    </button>
                </div>

                {/* Scanner/Result Area */}
                <div className="relative aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-orange-900/20 border-4 border-white ring-1 ring-slate-900/5 transition-transform hover:scale-[1.01]">
                    {/* B. Camera/Manual View - Always mounted, hidden when result shown */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${scanResult ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {scanMethod === 'camera' ? (
                            <>
                                <div id="qr-scanner-gk" className="w-full h-full object-cover" ref={scannerContainerRef} />
                                {/* Camera UI Overlay */}
                                <div className="absolute inset-0 z-10 pointer-events-none p-8">
                                    <div className="w-full h-full border-2 border-white/30 rounded-3xl relative overflow-hidden backdrop-blur-[1px]">
                                        <div className="absolute inset-0 border-[40px] border-slate-900/60 transition-all duration-300" style={{ clipPath: 'inset(0 round 24px)' }}></div>
                                        {/* Corners */}
                                        <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-orange-500 rounded-tl-2xl drop-shadow-lg" />
                                        <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-orange-500 rounded-tr-2xl drop-shadow-lg" />
                                        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-orange-500 rounded-bl-2xl drop-shadow-lg" />
                                        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-orange-500 rounded-br-2xl drop-shadow-lg" />
                                        {/* Laser */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-50">
                                            <div className="w-full h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] animate-pulse-soft" />
                                        </div>
                                    </div>
                                </div>

                                {!isCameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20">
                                        <button onClick={startCamera} className="group relative">
                                            <div className="absolute inset-0 bg-orange-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                                            <div className="relative bg-gradient-to-br from-orange-500 to-red-600 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                        </button>
                                        <p className="text-slate-400 text-sm mt-4 font-medium">Tap to Start Scanning</p>
                                        {cameraError && <p className="text-red-400 text-xs mt-2 px-6 text-center bg-red-500/10 py-1 rounded-full">{cameraError}</p>}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50">
                                <div className="w-full max-w-xs space-y-4">
                                    <label className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center block">Enter Pass ID</label>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={manualPassId}
                                        onChange={e => setManualPassId(e.target.value.toUpperCase())}
                                        placeholder="PAS-XXXX"
                                        className="w-full bg-white border-2 border-slate-200 text-slate-800 text-center text-3xl font-mono py-4 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none placeholder:text-slate-300 shadow-sm transition-all"
                                        onKeyDown={e => e.key === 'Enter' && handleScan(manualPassId)}
                                    />
                                    <button
                                        onClick={() => handleScan(manualPassId)}
                                        disabled={!manualPassId || isScanning}
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {isScanning ? 'Verifying...' : 'Verify Pass'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Switcher */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex bg-black/80 backdrop-blur-md rounded-full p-1 border border-white/20 z-20 shadow-xl">
                            <button onClick={() => setScanMethod('camera')} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${scanMethod === 'camera' ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white'}`}>Camera</button>
                            <button onClick={() => setScanMethod('manual')} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${scanMethod === 'manual' ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white'}`}>Manual</button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {scanResult && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center ${getResultStyles(scanResult.type)}`}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl"
                                >
                                    {getResultIcon(scanResult.type)}
                                </motion.div>
                                <h2 className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-md uppercase leading-none">{scanResult.title}</h2>
                                <p className="text-white/90 font-medium mb-6 text-lg">{scanResult.message}</p>

                                {scanResult.details && (
                                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 w-full border border-white/10">
                                        <p className="text-white font-bold text-lg">{scanResult.details.split('•')[0] || 'Unknown User'}</p>
                                        {scanResult.details.includes('•') && (
                                            <p className="text-white/80 text-sm mt-1">{scanResult.details.split('•')[1]}</p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-white/40 shadow-sm text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Entry</p>
                        <p className="text-2xl font-black text-emerald-500 tracking-tight">{stats.entries}</p>
                    </div>
                    <div className="bg-emerald-50/80 backdrop-blur rounded-2xl p-4 border border-emerald-100 shadow-sm text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-100/30 animate-pulse-soft"></div>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1 z-10 relative">Inside</p>
                        <p className="text-2xl font-black text-emerald-700 tracking-tight z-10 relative">{stats.live}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-white/40 shadow-sm text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Exit</p>
                        <p className="text-2xl font-black text-blue-500 tracking-tight">{stats.exits}</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Scans</h3>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Live Feed</span>
                    </div>
                    <div className="space-y-3 pb-safe">
                        <AnimatePresence initial={false}>
                            {recentScans.map((scan, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`bg-white/90 backdrop-blur rounded-2xl p-4 border-l-[6px] shadow-sm flex items-center justify-between group hover:shadow-md transition-all ${scan.type === 'success' ? 'border-emerald-500' :
                                        scan.type === 'warning' ? 'border-amber-500' :
                                            scan.type === 'info' ? 'border-blue-500' : 'border-red-500'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${scan.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                            scan.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                scan.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {scan.type === 'success' ? '✓' : scan.type === 'info' ? 'i' : '!'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 group-hover:text-slate-900">{scan.details?.split('•')[0] || scan.title}</p>
                                            <p className="text-xs text-slate-500 font-medium">{scan.message}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </motion.div>
                            ))}
                            {recentScans.length === 0 && (
                                <div className="text-center py-8 opacity-50">
                                    <div className="w-12 h-12 bg-white/50 rounded-full mx-auto mb-2 flex items-center justify-center text-slate-300 text-xl">⚡</div>
                                    <p className="text-slate-500 text-sm">Ready to scan. History will appear here.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <div className="absolute inset-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"></div>
                <div className="relative flex justify-around items-center h-20 max-w-md mx-auto pb-safe">
                    <button className="flex flex-col items-center gap-1 text-orange-600">
                        <div className="w-12 h-1 bg-orange-500 rounded-b-full absolute top-0"></div>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" /></svg>
                        <span className="text-[10px] font-bold">Scan</span>
                    </button>

                    <button onClick={logout} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-colors group">
                        <div className="w-12 h-1 bg-transparent group-hover:bg-red-500/20 rounded-b-full absolute top-0 transition-colors"></div>
                        <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span className="text-[10px] font-bold">Logout</span>
                    </button>
                </div>
            </nav>

            <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
        </div>
    );
}
