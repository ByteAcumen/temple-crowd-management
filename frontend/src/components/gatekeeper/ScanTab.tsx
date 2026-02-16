import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { liveApi, bookingsApi, Temple, Booking } from '@/lib/api';

interface ScanTabProps {
    temples: Temple[];
    selectedTempleId: string;
    onScanSuccess: (type?: 'entry' | 'exit') => void;
}

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

export function ScanTab({ temples, selectedTempleId, onScanSuccess }: ScanTabProps) {
    const [scanMode, setScanMode] = useState<ScanMode>('entry');
    const [scanMethod, setScanMethod] = useState<ScanMethod>('camera');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [manualCode, setManualCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

    // Refs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scannerRef = useRef<any | null>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);
    const lastScannedCode = useRef<string | null>(null);
    const lastScanTime = useRef<number>(0);
    const isScanningRef = useRef(isScanning);
    const selectedTempleIdRef = useRef(selectedTempleId);
    const startScanModeRef = useRef(scanMode);

    // Sync refs
    useEffect(() => { isScanningRef.current = isScanning; }, [isScanning]);
    useEffect(() => { selectedTempleIdRef.current = selectedTempleId; }, [selectedTempleId]);
    useEffect(() => { startScanModeRef.current = scanMode; }, [scanMode]);

    // Update Recent Scans
    useEffect(() => {
        if (scanResult) {
            setRecentScans(prev => [scanResult, ...prev].slice(0, 5));
        }
    }, [scanResult]);

    // Camera Lifecycle
    useEffect(() => {
        if (scanMethod === 'camera' && !scannerRef.current && scannerContainerRef.current) {
            startCamera();
        }
        return () => { stopCamera(); };
    }, [scanMethod]);

    const startCamera = async () => {
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            if (!scannerContainerRef.current) return;

            if (scannerRef.current) {
                await stopCamera();
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (!scannerContainerRef.current) return;
            scannerContainerRef.current.innerHTML = "";

            const scanner = new Html5Qrcode('qr-scanner-gk');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 15, qrbox: { width: 280, height: 280 }, aspectRatio: 1 },
                onScanDetect,
                () => { }
            );

            if (!scannerContainerRef.current) {
                await scanner.stop();
                scannerRef.current = null;
                return;
            }

            setIsCameraActive(true);
            setCameraError(null);

        } catch (_err: any) {
            if (_err?.message?.includes("scanner is running") || _err?.includes?.("scanner is running")) {
                console.log("Scanner already running, skipping start");
                setIsCameraActive(true);
                return;
            }

            console.error("Camera start failed", _err);
            setCameraError("Camera access failed. Please ensure permissions are granted.");
            setIsCameraActive(false);
            scannerRef.current = null;
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => { });
            scannerRef.current = null;
            setIsCameraActive(false);
        }
    };

    const onScanDetect = useCallback((decodedText: string) => {
        const now = Date.now();
        if (decodedText === lastScannedCode.current && now - lastScanTime.current < 3000) return;

        if (!isScanningRef.current) {
            lastScannedCode.current = decodedText;
            lastScanTime.current = now;
            handleScan(decodedText);
        }
    }, []);

    const handleScan = useCallback(async (passId: string) => {
        const currentIsScanning = isScanningRef.current;
        const currentTempleId = selectedTempleIdRef.current;
        const currentScanMode = startScanModeRef.current;

        if (currentIsScanning || !passId.trim()) return;

        setIsScanning(true);
        if (navigator.vibrate) navigator.vibrate(50);

        try {
            // Parse Pass ID
            let actualPassId = passId.trim().replace(/\s+/g, '');
            try {
                const qrData = JSON.parse(passId);
                actualPassId = (qrData.id || qrData.passId || qrData._id || passId.trim()).replace(/\s+/g, '');
            } catch { }

            if (!currentTempleId) throw new Error("SELECT TEMPLE|Please select a temple first");

            // Verify Booking
            let res;
            try {
                res = await bookingsApi.getByPassId(actualPassId);
            } catch (err: any) {
                if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
                    throw new Error("INVALID PASS|Pass ID not found in system");
                }
                throw new Error(`SERVER ERROR|${err.message || 'Connection failed'}`);
            }

            if (!res || !res.success || !res.data) throw new Error("INVALID PASS|Pass ID not found");

            const booking = res.data;
            const bookingTempleId = typeof booking.temple === 'object' ? booking.temple._id : booking.temple;
            const bookingTempleName = typeof booking.temple === 'object' ? booking.temple.name : 'Another Temple';

            if (bookingTempleId !== currentTempleId) throw new Error(`WRONG TEMPLE|Pass is for: ${bookingTempleName}`);

            if (booking.status === 'CANCELLED') throw new Error("CANCELLED|Booking cancelled");
            if (booking.status === 'EXPIRED') throw new Error("EXPIRED|Pass expired");

            if (currentScanMode === 'entry' && booking.status === 'USED') throw new Error("ALREADY USED|Entry already recorded");
            if (currentScanMode === 'exit' && booking.exitTime) throw new Error("ALREADY EXIT|Exit already recorded");

            const today = new Date();
            const bookingDate = new Date(booking.date);
            today.setHours(0, 0, 0, 0);
            bookingDate.setHours(0, 0, 0, 0);

            if (bookingDate < today) throw new Error("EXPIRED DATE|Pass was for a past date");
            if (bookingDate > today) throw new Error(`FUTURE DATE|Valid on: ${new Date(booking.date).toLocaleDateString()}`);

            // Record Action
            if (currentScanMode === 'entry') {
                await liveApi.recordEntry(currentTempleId, actualPassId);
            } else {
                await liveApi.recordExit(currentTempleId, actualPassId);
            }

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
            onScanSuccess(currentScanMode);

        } catch (err: any) {
            console.error("Scan Failed:", err);
            const audio = new Audio('/sounds/error.mp3');
            audio.play().catch(() => { });
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

            let title = 'ACCESS DENIED';
            let message = err.message || 'Failed';
            let type: ResultType = 'error';

            if (message.includes('|')) {
                const parts = message.split('|');
                title = parts[0];
                message = parts[1];
            }

            if (title.includes('FUTURE') || title.includes('WRONG TEMPLE')) type = 'warning';

            setScanResult({ type, title, message, timestamp: new Date() });
        } finally {
            setIsScanning(false);
            setManualCode('');
            setTimeout(() => setScanResult(null), 3500);
        }
    }, [onScanSuccess]);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = manualCode.trim().toUpperCase();
        if (!code) return;

        // Basic validation
        if (code.length < 3) {
            setScanResult({ type: 'error', title: 'INVALID FORMAT', message: 'Code too short', timestamp: new Date() });
            return;
        }

        setIsProcessing(true);
        try {
            await handleScan(code);
        } finally {
            setIsProcessing(false);
        }
    };

    const getResultStyles = (type: ResultType) => {
        switch (type) {
            case 'success': return 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)]';
            case 'warning': return 'bg-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)]';
            case 'info': return 'bg-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)]';
            default: return 'bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.4)]';
        }
    };

    return (
        <div className="space-y-6 text-slate-900 pb-24">
            {/* Mode Switcher */}
            {/* Mode Switcher */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1 relative overflow-hidden ring-1 ring-slate-100">
                <button
                    onClick={() => setScanMode('entry')}
                    className="flex-1 relative py-3.5 rounded-xl font-bold text-sm transition-all duration-300"
                >
                    {scanMode === 'entry' && (
                        <motion.div
                            layoutId="scanModeBg"
                            className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className={`relative z-10 flex items-center justify-center gap-2 ${scanMode === 'entry' ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${scanMode === 'entry' ? 'bg-white' : 'bg-emerald-500/30'}`} />
                        ENTRY
                    </span>
                </button>
                <button
                    onClick={() => setScanMode('exit')}
                    className="flex-1 relative py-3.5 rounded-xl font-bold text-sm transition-all duration-300"
                >
                    {scanMode === 'exit' && (
                        <motion.div
                            layoutId="scanModeBg"
                            className="absolute inset-0 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className={`relative z-10 flex items-center justify-center gap-2 ${scanMode === 'exit' ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        EXIT
                        <span className={`w-2 h-2 rounded-full ${scanMode === 'exit' ? 'bg-white' : 'bg-blue-500/30'}`} />
                    </span>
                </button>
            </div>

            {/* Main Action Area */}
            <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 min-h-[420px] flex flex-col group">
                <AnimatePresence mode="wait">
                    {scanMethod === 'camera' ? (
                        <motion.div
                            key="camera"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-100"
                        >
                            <div className={`absolute inset-0 transition-opacity duration-300 ${scanResult ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                <div id="qr-scanner-gk" className="w-full h-full object-cover" ref={scannerContainerRef} />

                                {isCameraActive && (
                                    <div className="absolute inset-0 pointer-events-none z-10">
                                        {/* Scanning Laser */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-scan-laser opacity-80" />

                                        {/* Viewfinder Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/10 mask-radial-faded" />
                                        <div className="absolute inset-12 border-2 border-white/40 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] backdrop-blur-[1px]" />

                                        {/* Corner Markers */}
                                        <div className="absolute top-12 left-12 w-10 h-10 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl drop-shadow-lg" />
                                        <div className="absolute top-12 right-12 w-10 h-10 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl drop-shadow-lg" />
                                        <div className="absolute bottom-12 left-12 w-10 h-10 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl drop-shadow-lg" />
                                        <div className="absolute bottom-12 right-12 w-10 h-10 border-b-4 border-r-4 border-orange-500 rounded-br-2xl drop-shadow-lg" />

                                        {/* Status Text */}
                                        <div className="absolute bottom-20 left-0 right-0 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest shadow-lg">
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                Scanning
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isCameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-20">
                                        <button onClick={startCamera} className="group relative px-8 py-5 bg-white hover:bg-slate-50 rounded-3xl border border-slate-200 shadow-xl transition-all active:scale-95 flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                            <span className="text-slate-900 font-bold tracking-widest text-sm">TAP TO START</span>
                                            <span className="text-slate-400 text-xs mt-1">Camera Permission Required</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="manual"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white"
                        >
                            <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-8 relative z-10">
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-orange-600 mb-4 shadow-sm ring-1 ring-orange-100">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-orange-600 uppercase tracking-[0.2em] mb-1">Manual Verification</div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Enter Pass ID</h3>
                                        <p className="text-slate-400 text-sm mt-2">Type the ID from the visitor's ticket</p>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="PASS-XXXX"
                                        className="w-full bg-slate-50 border-2 border-slate-100 py-5 text-center font-mono text-3xl font-bold text-slate-900 placeholder:text-slate-300 rounded-2xl focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all tracking-wider shadow-sm"
                                        autoFocus
                                    />
                                    {manualCode && (
                                        <button
                                            type="button"
                                            onClick={() => setManualCode('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!manualCode || isProcessing}
                                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl text-lg hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all active:scale-[0.98] shadow-xl hover:shadow-orange-500/20 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            VERIFYING...
                                        </>
                                    ) : 'VERIFY PASS'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Shared Result Overlay */}
                <AnimatePresence>
                    {scanResult && (
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center ${getResultStyles(scanResult.type)} bg-opacity-95 transition-colors duration-500`}
                        >
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="w-28 h-28 rounded-[2rem] bg-white flex items-center justify-center mb-6 shadow-2xl ring-4 ring-white/20"
                            >
                                {scanResult.type === 'success' && <svg className={`w-14 h-14 text-emerald-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                {scanResult.type === 'error' && <svg className={`w-14 h-14 text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                                {scanResult.type === 'warning' && <svg className={`w-14 h-14 text-amber-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            </motion.div>

                            <h2 className={`text-4xl font-black mb-3 uppercase tracking-tight ${scanResult.type === 'success' ? 'text-emerald-950' : scanResult.type === 'error' ? 'text-red-950' : 'text-amber-950'}`}>{scanResult.title}</h2>
                            <p className={`font-bold mb-8 text-xl max-w-xs mx-auto leading-relaxed ${scanResult.type === 'success' ? 'text-emerald-800' : scanResult.type === 'error' ? 'text-red-800' : 'text-amber-800'}`}>{scanResult.message}</p>

                            {scanResult.details && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 w-full max-w-xs border border-white/40 shadow-lg"
                                >
                                    <p className="text-slate-900 font-bold font-mono text-sm tracking-tight">{scanResult.details}</p>
                                    <div className="h-px bg-slate-900/10 my-2"></div>
                                    <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest opacity-70">{new Date().toLocaleTimeString()}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Method Switcher */}
                {!scanResult && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
                        <div className="bg-white/80 backdrop-blur-xl rounded-full p-1.5 border border-white/50 shadow-xl shadow-slate-200/50 pointer-events-auto flex gap-1 ring-1 ring-white/50">
                            <button
                                onClick={() => setScanMethod('camera')}
                                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${scanMethod === 'camera' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                            >
                                Camera
                            </button>
                            <button
                                onClick={() => setScanMethod('manual')}
                                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${scanMethod === 'manual' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                            >
                                Manual
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Scans - Light Theme */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-slate-900 font-bold text-lg tracking-tight">Recent Activity</h3>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Feed</span>
                    </div>
                </div>
                <div className="space-y-3">
                    {recentScans.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-sm font-medium">No recent scans</p>
                            <p className="text-xs text-slate-300 mt-1">Activity will appear here</p>
                        </div>
                    ) : (
                        recentScans.map((scan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-orange-100 transition-all"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${scan.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                    scan.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {scan.type === 'success' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                    {scan.type === 'warning' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                    {scan.type === 'error' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{scan.booking?.passId || <span className="italic text-slate-400">Unknown ID</span>}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                        <span className="text-slate-300">•</span>
                                        <p className="text-[10px] text-slate-500 font-medium">{scan.details ? scan.details.split('•')[0] : 'Visitor'}</p>
                                    </div>
                                </div>
                                <div className="ml-auto text-right">
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${scan.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                        scan.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {scan.title}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
