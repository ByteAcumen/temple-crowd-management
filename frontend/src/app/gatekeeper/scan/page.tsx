'use client';

// Temple Smart E-Pass - Gatekeeper Scanner
// Premium Glassmorphism Design (Light Theme)
// Mobile-First Scanner with Real-time Stats

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useState, useRef, useEffect, useCallback } from 'react';
import { liveApi, bookingsApi, templesApi, Booking, Temple } from '@/lib/api';
import { StatCard } from '@/components/admin/StatCard';

type ScanMode = 'entry' | 'exit';
type ScanMethod = 'camera' | 'manual';
type AlertType = 'success' | 'error' | 'warning' | 'info';

interface ScanResult {
    success: boolean;
    message: string;
    details?: string;
    booking?: Booking;
}

interface AlertState {
    type: AlertType;
    title: string;
    message: string;
    show: boolean;
}

function GatekeeperScannerContent() {
    const { user, logout } = useAuth();

    // Demo Mode State
    const [demoMode, setDemoMode] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Scanner state
    const [scanMode, setScanMode] = useState<ScanMode>('entry');
    const [scanMethod, setScanMethod] = useState<ScanMethod>('camera');
    const [isScanning, setIsScanning] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [manualPassId, setManualPassId] = useState('');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    // Temple and stats
    const [temples, setTemples] = useState<Temple[]>([]);
    const [selectedTemple, setSelectedTemple] = useState<string>('');
    const [recentScans, setRecentScans] = useState<Array<{ passId: string; action: string; time: Date; success: boolean; name?: string }>>([]);
    const [todayStats, setTodayStats] = useState({ entries: 0, exits: 0 });

    // UI state
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showTempleSelector, setShowTempleSelector] = useState(false);
    const [alert, setAlert] = useState<AlertState>({ type: 'info', title: '', message: '', show: false });
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<any>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);

    // Load temples
    useEffect(() => {
        async function loadTemples() {
            try {
                setApiError(null);
                setDemoMode(false);
                const response = await templesApi.getAll();

                if (response.success && response.data.length > 0) {
                    setTemples(response.data);
                    setSelectedTemple(response.data[0]._id);
                }
            } catch (err: unknown) {
                console.error('Failed to load temples:', err);
                const errorMessage = err instanceof Error ? err.message : String(err);

                setApiError(errorMessage || 'Backend unreachable');
                setDemoMode(true);
                setAlert({ type: 'warning', title: 'Offline Mode', message: 'Backend unreachable. Using demo data.', show: true });
                setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);

                // Mock Data
                const mockTemples = [
                    { _id: '1', name: 'Somnath Temple', location: { city: 'Veraval' }, capacity: { total: 10000 }, currentOccupancy: 4500 },
                    { _id: '2', name: 'Kashi Vishwanath', location: { city: 'Varanasi' }, capacity: { total: 5000 }, currentOccupancy: 2100 }
                ];
                setTemples(mockTemples as Temple[]);
                setSelectedTemple('1');
            }
        }
        loadTemples();
    }, []);

    // Time update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Initialize QR Scanner
    useEffect(() => {
        if (scanMethod === 'camera' && !scannerRef.current && scannerContainerRef.current) {
            initializeScanner();
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
                scannerRef.current = null;
            }
        };
    }, [scanMethod]);

    const initializeScanner = async () => {
        try {
            const { Html5Qrcode } = await import('html5-qrcode');

            if (scannerContainerRef.current && !scannerRef.current) {
                scannerRef.current = new Html5Qrcode('qr-scanner-container');

                await scannerRef.current.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1,
                    },
                    onQRCodeScanned,
                    () => { } // Ignore scan failures
                );

                setIsCameraActive(true);
                setCameraError(null);
            }
        } catch (err: any) {
            console.error('Camera error:', err);
            setCameraError(err.message || 'Could not access camera');
            setIsCameraActive(false);
        }
    };

    const toggleCamera = async () => {
        if (isCameraActive && scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current = null;
            setIsCameraActive(false);
        } else {
            await initializeScanner();
        }
    };

    // Show alert helper
    const showAlert = (type: AlertType, title: string, message: string) => {
        setAlert({ type, title, message, show: true });
        setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
    };

    // Clear scan result
    useEffect(() => {
        if (scanResult) {
            const timer = setTimeout(() => setScanResult(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [scanResult]);

    // Focus input for manual mode
    useEffect(() => {
        if (scanMethod === 'manual' && inputRef.current && !isScanning) {
            inputRef.current.focus();
        }
    }, [scanMethod, isScanning, scanResult]);

    const currentTemple = temples.find(t => t._id === selectedTemple);
    const capacity = currentTemple ? ((typeof currentTemple.capacity === 'object' ? currentTemple.capacity.total : currentTemple.capacity) || 5000) : 5000;
    const occupancy = currentTemple?.currentOccupancy || 0;
    const occupancyPercent = Math.round((occupancy / capacity) * 100);

    const onQRCodeScanned = useCallback((decodedText: string) => {
        if (!isScanning) {
            handleScan(decodedText);
        }
    }, [isScanning, scanMode]);

    const handleScan = async (passId: string) => {
        if (!passId.trim() || isScanning) return;

        setIsScanning(true);
        setScanResult(null);

        // Vibrate on scan (mobile)
        if (navigator.vibrate) navigator.vibrate(50);

        if (demoMode) {
            // Mock Scan Logic
            setTimeout(() => {
                const isSuccess = Math.random() > 0.2; // 80% success rate
                if (isSuccess) {
                    setScanResult({
                        success: true,
                        message: scanMode === 'entry' ? 'Entry Approved ✓' : 'Exit Recorded ✓',
                        details: `Demo User • 2 Visitors • ${currentTemple?.name}`,
                        booking: { visitors: 2 } as Booking
                    });
                    setTodayStats(prev => ({
                        entries: scanMode === 'entry' ? prev.entries + 1 : prev.entries,
                        exits: scanMode === 'exit' ? prev.exits + 1 : prev.exits,
                    }));
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                } else {
                    setScanResult({
                        success: false,
                        message: 'Access Denied ✗',
                        details: 'Invalid Pass ID (Demo)'
                    });
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                }
                setRecentScans(prev => [
                    { passId: passId.trim(), action: scanMode, time: new Date(), success: isSuccess, name: isSuccess ? 'Demo User' : undefined },
                    ...prev.slice(0, 19)
                ]);
                setIsScanning(false);
                setManualPassId('');
            }, 800);
            return;
        }

        try {
            const bookingResponse = await bookingsApi.getByPassId(passId.trim());

            if (!bookingResponse.success) {
                throw new Error('Invalid E-Pass - Not found');
            }

            const booking = bookingResponse.data;

            // Validate date
            const bookingDate = new Date(booking.date);
            const today = new Date();
            if (bookingDate.toDateString() !== today.toDateString()) {
                throw new Error(`Pass valid for ${bookingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} only`);
            }

            // Check status logic
            if (scanMode === 'entry' && booking.status === 'USED') {
                throw new Error('Pass already used today');
            }
            if (booking.status === 'CANCELLED') throw new Error('Pass cancelled');
            if (booking.status === 'EXPIRED') throw new Error('Pass expired');

            // Record entry or exit
            scanMode === 'entry'
                ? await liveApi.recordEntry(selectedTemple, passId.trim())
                : await liveApi.recordExit(selectedTemple, passId.trim());

            const templeName = typeof booking.temple === 'object' ? booking.temple.name : 'Temple';
            const userName = typeof booking.user === 'object' ? booking.user.name : 'Guest';

            setScanResult({
                success: true,
                message: scanMode === 'entry' ? 'Entry Approved ✓' : 'Exit Recorded ✓',
                details: `${userName} • ${booking.visitors} visitor(s)`,
                booking
            });

            // Play sound/vibrate
            try {
                const audio = new Audio('/sounds/success.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => { });
            } catch { }

            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            setRecentScans(prev => [
                { passId: passId.trim(), action: scanMode, time: new Date(), success: true, name: userName },
                ...prev.slice(0, 19)
            ]);

            setTodayStats(prev => ({
                entries: scanMode === 'entry' ? prev.entries + 1 : prev.entries,
                exits: scanMode === 'exit' ? prev.exits + 1 : prev.exits,
            }));

        } catch (err: any) {
            setScanResult({
                success: false,
                message: 'Access Denied ✗',
                details: err.message || 'Invalid pass'
            });

            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

            setRecentScans(prev => [
                { passId: passId.trim(), action: scanMode, time: new Date(), success: false },
                ...prev.slice(0, 19)
            ]);
        } finally {
            setIsScanning(false);
            setManualPassId('');
        }
    };

    return (
        <motion.div
            className="min-h-screen bg-slate-50 relative pb-20" // Light theme background
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Gradient Overlay */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 -ml-20 -mb-20" />
            </div>

            {/* Alert Toast */}
            <AnimatePresence>
                {alert.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`fixed top-4 left-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border ${alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                        'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                    >
                        <p className="font-bold">{alert.title}</p>
                        <p className="text-sm">{alert.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="relative bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="px-4 py-3 max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900 leading-tight">Gatekeeper</h1>
                            <p className="text-xs text-slate-500 font-medium">{user?.name?.split(' ')[0]}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {demoMode && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase border border-amber-200">
                                Demo Mode
                            </span>
                        )}
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">
                                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                                {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="max-w-lg mx-auto p-4 space-y-6 relative z-10">

                {/* Temple Selector Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1 relative overflow-hidden">
                    <button
                        onClick={() => setShowTempleSelector(!showTempleSelector)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${occupancyPercent > 90 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="font-bold text-slate-900">{currentTemple?.name || 'Loading...'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{occupancyPercent}% Full</span>
                            <svg className={`w-4 h-4 transition-transform ${showTempleSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    <AnimatePresence>
                        {showTempleSelector && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100 mt-1"
                            >
                                <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                                    {temples.map(t => (
                                        <button
                                            key={t._id}
                                            onClick={() => { setSelectedTemple(t._id); setShowTempleSelector(false); }}
                                            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTemple === t._id ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Mode Switcher */}
                <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex gap-2">
                    {(['entry', 'exit'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setScanMode(mode)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${scanMode === mode
                                    ? mode === 'entry' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {mode === 'entry' ? '⬇ Entry' : '⬆ Exit'}
                        </button>
                    ))}
                </div>

                {/* Scan Result Overlay */}
                <AnimatePresence>
                    {scanResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`p-6 rounded-3xl text-center border shadow-xl ${scanResult.success
                                    ? 'bg-emerald-50 border-emerald-100'
                                    : 'bg-red-50 border-red-100'
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 ${scanResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                }`}>
                                <span className="text-3xl">{scanResult.success ? '✓' : '✗'}</span>
                            </div>
                            <h3 className={`text-xl font-black mb-1 ${scanResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                                {scanResult.message}
                            </h3>
                            <p className="text-slate-600 font-medium text-sm">{scanResult.details}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Scanner Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    {/* Method Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button
                            onClick={() => setScanMethod('camera')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${scanMethod === 'camera' ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            📷 Camera
                        </button>
                        <button
                            onClick={() => setScanMethod('manual')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${scanMethod === 'manual' ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            ⌨ Manual
                        </button>
                    </div>

                    <div className="p-6">
                        {scanMethod === 'camera' ? (
                            <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 group cursor-pointer" onClick={toggleCamera}>
                                <div id="qr-scanner-container" className="w-full h-full" ref={scannerContainerRef} />

                                {!isCameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                                        <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-3 shadow-inner">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <p className="font-bold text-slate-900">Tap to Scan</p>
                                        <p className="text-xs text-slate-500">Camera permission required</p>
                                    </div>
                                )}

                                {isCameraActive && (
                                    <>
                                        {/* Guide Markers */}
                                        <div className="absolute top-0 right-0 p-4 z-20">
                                            <button onClick={(e) => { e.stopPropagation(); toggleCamera(); }} className="bg-black/50 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/70">✕</button>
                                        </div>
                                        <div className="absolute inset-0 border-[30px] border-black/30 z-10 pointer-events-none">
                                            <div className="w-full h-full border-2 border-orange-500/50 relative">
                                                <div className="absolute top-0 left-0 w-4 h-4 border-l-4 border-t-4 border-orange-500" />
                                                <div className="absolute top-0 right-0 w-4 h-4 border-r-4 border-t-4 border-orange-500" />
                                                <div className="absolute bottom-0 left-0 w-4 h-4 border-l-4 border-b-4 border-orange-500" />
                                                <div className="absolute bottom-0 right-0 w-4 h-4 border-r-4 border-b-4 border-orange-500" />
                                                <motion.div
                                                    className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_red]"
                                                    animate={{ top: ['0%', '100%', '0%'] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={manualPassId}
                                    onChange={(e) => setManualPassId(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleScan(manualPassId)}
                                    placeholder="Enter Pass ID (e.g., PAS-123)"
                                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-xl font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-0 outline-none transition-colors uppercase"
                                />
                                <button
                                    onClick={() => handleScan(manualPassId)}
                                    disabled={isScanning || !manualPassId}
                                    className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    {isScanning ? 'Verifying...' : 'Verify Pass'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon="⬇"
                        title="Entries"
                        value={todayStats.entries}
                        color="green"
                    />
                    <StatCard
                        icon="⬆"
                        title="Exits"
                        value={todayStats.exits}
                        color="red"
                    />
                </div>

                {/* Recent Scans List */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentScans.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-4">No scans yet today</p>
                        ) : (
                            recentScans.map((scan, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${scan.success
                                                ? scan.action === 'entry' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {scan.success ? (scan.action === 'entry' ? 'IN' : 'OUT') : '!'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{scan.passId}</p>
                                            <p className="text-xs text-slate-500">{scan.name || (scan.success ? 'Valid' : 'Failed')}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-400">
                                        {scan.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] safe-area-pb">
                <Link href="/gatekeeper/scan" className="flex flex-col items-center gap-1 text-orange-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" /></svg>
                    <span className="text-[10px] font-bold">Scan</span>
                </Link>

                <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    <span className="text-[10px] font-bold">Dashboard</span>
                </Link>

                <button onClick={logout} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="text-[10px] font-bold">Logout</span>
                </button>
            </div>
        </motion.div>
    );
}

export default function GatekeeperScanPage() {
    return (
        <ProtectedRoute allowedRoles={['gatekeeper', 'admin']}>
            <GatekeeperScannerContent />
        </ProtectedRoute>
    );
}
