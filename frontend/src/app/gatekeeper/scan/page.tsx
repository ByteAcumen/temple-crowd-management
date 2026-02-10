'use client';

// Temple Smart E-Pass - Gatekeeper Scanner
// Premium Security Pro Design (High Contrast, Fast, Clear Feedback)


import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useState, useRef, useEffect, useCallback } from 'react';
import { liveApi, bookingsApi, templesApi, Booking, Temple } from '@/lib/api';
import { GatekeeperSupportBot } from '@/components/gatekeeper/GatekeeperSupportBot';
import { SupportModal } from '@/components/gatekeeper/SupportModal';

type ScanMode = 'entry' | 'exit';
type ScanMethod = 'camera' | 'manual';

interface ScanResult {
    success: boolean;
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
    const { user, logout } = useAuth();

    // Core State
    const [scanMode, setScanMode] = useState<ScanMode>('entry');
    const [scanMethod, setScanMethod] = useState<ScanMethod>('camera');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [manualPassId, setManualPassId] = useState('');

    // Data State
    const [temples, setTemples] = useState<Temple[]>([]);
    const [selectedTempleId, setSelectedTempleId] = useState<string>('');
    // State
    const [stats, setStats] = useState({ entries: 0, exits: 0, live: 0 });
    const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
    const [isOnline, setIsOnline] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    // ... other states

    // Fetch Stats
    const fetchStats = useCallback(async () => {
        if (!selectedTempleId) return;
        try {
            const res = await liveApi.getDailyStats(selectedTempleId);
            if (res.success && res.data) {
                setStats({
                    entries: res.data.today_entries,
                    exits: res.data.today_exits,
                    live: res.data.live_count
                });
                setIsOnline(true);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error("Failed to fetch stats", err);
            setIsOnline(false); // Assume offline if stats fail
        }
    }, [selectedTempleId]);

    // Initial Fetch & Interval
    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Update stats immediately after scan
    useEffect(() => {
        if (scanResult?.success) fetchStats();
    }, [scanResult, fetchStats]);



    // UI State
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [showTempleSelector, setShowTempleSelector] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);

    // Refs
    const scannerRef = useRef<any>(null);
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
            if (scannerContainerRef.current && !scannerRef.current) {
                scannerRef.current = new Html5Qrcode('qr-scanner-gk');
                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    { fps: 15, qrbox: { width: 280, height: 280 }, aspectRatio: 1 },
                    onScanSuccess,
                    () => { }
                );
                setIsCameraActive(true);
                setCameraError(null);
            }
        } catch (err) {
            console.error("Camera start failed", err);
            setCameraError("Camera access denied or unavailable.");
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

        // Close camera temporarily if desired, or keep open. 
        // We'll keep open but block processing via isScanning.

        try {
            // A. Check Temple Selection
            if (!currentTempleId) throw new Error("Please select a temple first.");

            // B. Fetch Booking
            const res = await bookingsApi.getByPassId(passId.trim());
            if (!res.success || !res.data) throw new Error("Invalid Pass ID.");

            const booking = res.data;
            const todayStr = new Date().toDateString();
            const bookingDateStr = new Date(booking.date).toDateString();

            // C. Validate Date
            if (bookingDateStr !== todayStr) {
                throw new Error(`Pass date invalid. Valid for: ${new Date(booking.date).toLocaleDateString()}`);
            }

            // D. Validate Temple matching
            // Using loose comparison for ID string in case populated object
            const bookingTempleId = typeof booking.temple === 'object' ? booking.temple._id : booking.temple;
            if (bookingTempleId !== currentTempleId) {
                throw new Error("Pass belongs to a different temple.");
            }

            // E. Validate Status
            if (booking.status === 'CANCELLED') throw new Error("Pass has been CANCELLED.");
            if (booking.status === 'EXPIRED') throw new Error("Pass has EXPIRED.");
            if (currentScanMode === 'entry' && booking.status === 'USED') {
                throw new Error("Pass already USED for entry.");
            }

            // F. Process Action
            let apiRes;
            if (currentScanMode === 'entry') {
                apiRes = await liveApi.recordEntry(currentTempleId, passId.trim());
            } else {
                apiRes = await liveApi.recordExit(currentTempleId, passId.trim());
            }

            // G. Success Result
            const audio = new Audio('/sounds/success.mp3'); // Ensure this exists or catch error
            audio.play().catch(() => { });
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            const result: ScanResult = {
                success: true,
                message: currentScanMode === 'entry' ? 'ENTRY APPROVED' : 'EXIT RECORDED',
                details: `${typeof booking.user === 'object' ? booking.user.name : 'Visitor'} • ${booking.visitors} Person(s)`,
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
            const audio = new Audio('/sounds/error.mp3'); // Ensure this exists or catch error
            audio.play().catch(() => { });
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

            const result: ScanResult = {
                success: false,
                message: 'ACCESS DENIED',
                details: err.message || 'Unknown verification error',
                timestamp: new Date()
            };
            setScanResult(result);
            setRecentScans(prev => [result, ...prev].slice(0, 50));
        } finally {
            setIsScanning(false);
            setManualPassId('');
            // Auto-dismiss result after 3s
            setTimeout(() => setScanResult(null), 3000);
        }
    }, []);

    const currentTemple = temples.find(t => t._id === selectedTempleId);

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 selection:bg-orange-500/30">
            {/* 0. Background Effects (Landing Page Style) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-reverse" />
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-yellow-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float delay-500" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            {/* 1. Top Bar (Glassmorphism) */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
                <div className="max-w-md mx-auto glass rounded-2xl shadow-sm border border-white/50 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                <span className="text-xl">🛡️</span>
                            </div>
                            {/* Live Status Indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full flex items-center justify-center ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} title={isOnline ? "System Online" : "Connection Issues"}>
                                {isOnline && <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse"></div>}
                            </div>
                        </div>
                        <div>
                            <h1 className="font-bold text-base leading-tight text-slate-800">Gatekeeper</h1>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                {user?.name?.split(' ')[0] || 'Security'} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {/* Refresh Button */}
                        <button
                            onClick={fetchStats}
                            className="w-9 h-9 flex items-center justify-center bg-white rounded-xl text-slate-400 border border-slate-200 shadow-sm hover:text-emerald-600 hover:border-emerald-200 transition-colors active:scale-95"
                            title="Refresh Stats"
                        >
                            <svg className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>

                        <button
                            onClick={() => setShowSupportModal(true)}
                            className="w-9 h-9 flex items-center justify-center bg-white rounded-xl text-slate-500 border border-slate-200 shadow-sm hover:text-orange-600 hover:border-orange-200 transition-colors"
                            title="Support"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </button>

                        <button
                            onClick={() => setShowTempleSelector(!showTempleSelector)}
                            className="flex items-center gap-2 bg-white hover:bg-slate-50 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
                        >
                            <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate">
                                {currentTemple ? currentTemple.name : 'Select'}
                            </span>
                            <div className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center">
                                <svg className={`w-3 h-3 text-slate-500 transition-transform ${showTempleSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Temple Selector Dropdown */}
            <AnimatePresence>
                {showTempleSelector && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
                            onClick={() => setShowTempleSelector(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="fixed top-20 right-4 left-4 md:left-auto md:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden origin-top"
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
                                        {t.name}
                                        <span className="block text-[10px] text-slate-400 mt-0.5">{typeof t.location === 'string' ? t.location : t.location.city}</span>
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
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
                    <button
                        onClick={() => setScanMode('entry')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${scanMode === 'entry' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <span className="w-2 h-2 rounded-full bg-white/30" />
                        ENTRY
                    </button>
                    <button
                        onClick={() => setScanMode('exit')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${scanMode === 'exit' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        EXIT
                        <span className="w-2 h-2 rounded-full bg-white/30" />
                    </button>
                </div>

                {/* Scanner/Result Area */}
                {/* Scanner/Result Area */}
                <div className="relative aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-orange-900/10 border-4 border-white ring-1 ring-slate-900/5 rotate-0 transition-transform">

                    {/* B. Camera/Manual View - Always mounted, hidden when result shown */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${scanResult ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {scanMethod === 'camera' ? (
                            <>
                                <div id="qr-scanner-gk" className="w-full h-full object-cover" ref={scannerContainerRef} />

                                {/* Camera UI Overlay - Modern Frame */}
                                <div className="absolute inset-0 z-10 pointer-events-none p-8">
                                    <div className="w-full h-full border-2 border-white/30 rounded-3xl relative overflow-hidden backdrop-blur-[2px]">
                                        {/* Clean clear center */}
                                        <div className="absolute inset-0 border-[40px] border-slate-900/60 transition-all duration-300" style={{ clipPath: 'inset(0 round 24px)' }}></div>

                                        {/* Corner Accents */}
                                        <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-orange-500 rounded-tl-2xl drop-shadow-lg" />
                                        <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-orange-500 rounded-tr-2xl drop-shadow-lg" />
                                        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-orange-500 rounded-bl-2xl drop-shadow-lg" />
                                        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-orange-500 rounded-br-2xl drop-shadow-lg" />

                                        {/* Animated Laser */}
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
                            /* Manual Input Mode */
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
                                        {isScanning ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Verifying...
                                            </>
                                        ) : 'Verify Pass'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Method Switcher (Floating) */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex bg-black/80 backdrop-blur-md rounded-full p-1 border border-white/20 z-20 shadow-xl">
                            <button
                                onClick={() => setScanMethod('camera')}
                                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${scanMethod === 'camera' ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white'}`}
                            >
                                Camera
                            </button>
                            <button
                                onClick={() => setScanMethod('manual')}
                                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${scanMethod === 'manual' ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white'}`}
                            >
                                Manual
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {/* A. Result Overlay */}
                        {scanResult && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center ${scanResult.success ? 'bg-emerald-500' : 'bg-red-500'}`}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl"
                                >
                                    {scanResult.success ? (
                                        <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    )}
                                </motion.div>
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md">{scanResult.message}</h2>
                                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 w-full">
                                    <p className="text-white font-bold text-lg">{scanResult.details?.split('•')[0]}</p>
                                    <p className="text-white/80 text-sm mt-1">{scanResult.details?.split('•')[1]}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Stats & Recent */}
                {/* Stats & Recent */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Entry</p>
                        <p className="text-2xl font-black text-emerald-500 tracking-tight">{stats.entries}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-100/30 animate-pulse-soft"></div>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1 z-10 relative">Inside</p>
                        <p className="text-2xl font-black text-emerald-700 tracking-tight z-10 relative">{stats.live}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Exit</p>
                        <p className="text-2xl font-black text-blue-500 tracking-tight">{stats.exits}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
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
                                    className={`bg-white rounded-2xl p-4 border-l-[6px] shadow-sm flex items-center justify-between group hover:shadow-md transition-all ${scan.success ? (scan.message.includes('ENTRY') ? 'border-emerald-500' : 'border-blue-500') : 'border-red-500'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${scan.success ? (scan.message.includes('ENTRY') ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600') : 'bg-red-100 text-red-600'}`}>
                                            {scan.success ? '✓' : '✕'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 group-hover:text-slate-900">{scan.details?.split('•')[0]}</p>
                                            <p className="text-xs text-slate-500 font-medium">{scan.message}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </motion.div>
                            ))}
                            {recentScans.length === 0 && (
                                <div className="text-center py-8 opacity-50">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center text-slate-300 text-xl">⚡</div>
                                    <p className="text-slate-400 text-sm">Ready to scan. History will appear here.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </main>

            {/* Bottom Nav (Glassmorphism) */}
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

            <GatekeeperSupportBot />
            <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
        </div>
    );
}
