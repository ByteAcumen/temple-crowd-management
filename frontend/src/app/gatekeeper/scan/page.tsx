'use client';

// Temple Smart E-Pass - Gatekeeper QR Scanner
// Mobile-optimized interface for scanning E-Passes

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useState, useRef, useEffect } from 'react';
import { liveApi, bookingsApi, Booking } from '@/lib/api';

type ScanMode = 'entry' | 'exit';
type ScanResult = {
    success: boolean;
    message: string;
    booking?: Booking;
};

function GatekeeperScannerContent() {
    const { user, logout, isLoading } = useAuth();
    const [scanMode, setScanMode] = useState<ScanMode>('entry');
    const [isScanning, setIsScanning] = useState(false);
    const [manualPassId, setManualPassId] = useState('');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [recentScans, setRecentScans] = useState<Array<{ passId: string; action: string; time: Date; success: boolean }>>([]);
    const [todayStats, setTodayStats] = useState({ entries: 0, exits: 0, total: 0 });
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input for barcode scanner
    useEffect(() => {
        if (inputRef.current && !isScanning) {
            inputRef.current.focus();
        }
    }, [isScanning, scanResult]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-800 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400">Loading scanner...</p>
                </div>
            </div>
        );
    }

    // Check if user is gatekeeper or admin
    if (user?.role !== 'gatekeeper' && user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center px-6">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400 mb-6">Only gatekeepers can access the scanner.</p>
                    <Link href="/dashboard" className="btn-primary">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const handleScan = async (passId: string) => {
        if (!passId.trim()) return;

        setIsScanning(true);
        setScanResult(null);

        try {
            // Verify the pass exists
            const bookingResponse = await bookingsApi.getByPassId(passId.trim());

            if (!bookingResponse.success) {
                throw new Error('Invalid E-Pass');
            }

            // Record entry or exit
            const actionResponse = scanMode === 'entry'
                ? await liveApi.recordEntry(passId.trim())
                : await liveApi.recordExit(passId.trim());

            setScanResult({
                success: true,
                message: scanMode === 'entry' ? 'Entry Recorded Successfully!' : 'Exit Recorded Successfully!',
                booking: bookingResponse.data,
            });

            // Add to recent scans
            setRecentScans(prev => [
                { passId: passId.trim(), action: scanMode, time: new Date(), success: true },
                ...prev.slice(0, 9)
            ]);

            // Update stats
            setTodayStats(prev => ({
                ...prev,
                entries: scanMode === 'entry' ? prev.entries + 1 : prev.entries,
                exits: scanMode === 'exit' ? prev.exits + 1 : prev.exits,
                total: prev.total + 1,
            }));

            // Play success sound (in real app)
            // new Audio('/sounds/success.mp3').play();

        } catch (err: any) {
            setScanResult({
                success: false,
                message: err.message || 'Scan Failed - Invalid or Expired Pass',
            });

            // Add to recent scans
            setRecentScans(prev => [
                { passId: passId.trim(), action: scanMode, time: new Date(), success: false },
                ...prev.slice(0, 9)
            ]);

            // Play error sound (in real app)
            // new Audio('/sounds/error.mp3').play();
        } finally {
            setIsScanning(false);
            setManualPassId('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleScan(manualPassId);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-white">E-Pass Scanner</h1>
                            <p className="text-xs text-slate-400">{user?.name}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Entry/Exit Toggle */}
            <div className="p-4">
                <div className="bg-slate-800 rounded-2xl p-2 flex gap-2">
                    <button
                        onClick={() => setScanMode('entry')}
                        className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${scanMode === 'entry'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        ENTRY
                    </button>
                    <button
                        onClick={() => setScanMode('exit')}
                        className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${scanMode === 'exit'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        EXIT
                    </button>
                </div>
            </div>

            {/* Scan Result Display */}
            {scanResult && (
                <div className={`mx-4 mb-4 p-6 rounded-2xl animate-fade-in-up ${scanResult.success
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-red-500/20 border border-red-500/30'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${scanResult.success ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                            {scanResult.success ? (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-lg ${scanResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                {scanResult.message}
                            </h3>
                            {scanResult.booking && (
                                <p className="text-slate-400 text-sm mt-1">
                                    {typeof scanResult.booking.temple === 'object' ? scanResult.booking.temple.name : 'Temple Visit'} •
                                    {scanResult.booking.visitors} visitor(s)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Area */}
            <div className="flex-1 px-4">
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                    <div className="text-center mb-6">
                        <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isScanning ? 'animate-pulse' : ''
                            } ${scanMode === 'entry' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <svg className={`w-12 h-12 ${scanMode === 'entry' ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            {isScanning ? 'Scanning...' : 'Ready to Scan'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Scan QR code or enter Pass ID manually
                        </p>
                    </div>

                    {/* Manual Input */}
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={manualPassId}
                                onChange={(e) => setManualPassId(e.target.value.toUpperCase())}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter Pass ID (e.g., TS-ABC123)"
                                className="w-full px-4 py-4 bg-slate-700 border border-slate-600 rounded-xl text-white text-center text-lg font-mono tracking-wide placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                disabled={isScanning}
                            />
                        </div>
                        <button
                            onClick={() => handleScan(manualPassId)}
                            disabled={isScanning || !manualPassId.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${scanMode === 'entry'
                                ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-500/50'
                                : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-500/50'
                                } disabled:cursor-not-allowed`}
                        >
                            {isScanning ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Record {scanMode === 'entry' ? 'Entry' : 'Exit'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Today's Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                        <p className="text-2xl font-bold text-green-400">{todayStats.entries}</p>
                        <p className="text-xs text-slate-400">Entries</p>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                        <p className="text-2xl font-bold text-red-400">{todayStats.exits}</p>
                        <p className="text-xs text-slate-400">Exits</p>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                        <p className="text-2xl font-bold text-orange-400">{todayStats.total}</p>
                        <p className="text-xs text-slate-400">Total</p>
                    </div>
                </div>

                {/* Recent Scans */}
                {recentScans.length > 0 && (
                    <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700">
                        <div className="px-4 py-3 border-b border-slate-700">
                            <h3 className="font-semibold text-white text-sm">Recent Scans</h3>
                        </div>
                        <div className="divide-y divide-slate-700 max-h-48 overflow-y-auto">
                            {recentScans.map((scan, i) => (
                                <div key={i} className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${scan.success ? 'bg-green-500/20' : 'bg-red-500/20'
                                            }`}>
                                            {scan.success ? (
                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-mono text-white">{scan.passId}</p>
                                            <p className="text-xs text-slate-500">{scan.action.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {scan.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            <nav className="bg-slate-800 border-t border-slate-700 px-4 py-3">
                <div className="flex justify-around">
                    <Link href="/gatekeeper/scan" className="flex flex-col items-center text-orange-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
                        </svg>
                        <span className="text-xs mt-1">Scanner</span>
                    </Link>
                    <Link href="/live" className="flex flex-col items-center text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-xs mt-1">Live</span>
                    </Link>
                    <button onClick={logout} className="flex flex-col items-center text-slate-400 hover:text-red-400 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-xs mt-1">Logout</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}

export default function GatekeeperScanner() {
    return (
        <ProtectedRoute allowedRoles={['gatekeeper', 'admin']}>
            <GatekeeperScannerContent />
        </ProtectedRoute>
    );
}

