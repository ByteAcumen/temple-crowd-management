import { useState } from 'react';
import { adminApi, liveApi, User, Booking } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface UserVerifyTabProps {
    selectedTempleId: string;
    onCheckInSuccess: () => void;
}

interface SearchResult {
    user: User;
    bookings: Booking[];
}

export function UserVerifyTab({ selectedTempleId, onCheckInSuccess }: UserVerifyTabProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.length < 3) return;

        setIsSearching(true);
        setError(null);
        setResults([]);

        try {
            const res = await adminApi.searchDevotees(query);
            if (res.success) {
                setResults(res.data);
                if (res.count === 0) setError("No devotees found with active bookings for today.");
            }
        } catch (err: any) {
            setError(err.message || "Search failed");
        } finally {
            setIsSearching(false);
        }
    };

    const handleCheckIn = async (passId: string) => {
        if (!selectedTempleId) {
            setError("Please select a temple first (top right)");
            return;
        }

        setProcessingId(passId);
        try {
            await liveApi.recordEntry(selectedTempleId, passId);
            const audio = new Audio('/sounds/success.mp3');
            audio.play().catch(() => { });
            onCheckInSuccess();
            // Remove the booked slot from UI or mark as used
            setResults(prev => prev.map(r => ({
                ...r,
                bookings: r.bookings.map(b => b.passId === passId ? { ...b, status: 'USED' } : b)
            })));
        } catch (err: any) {
            setError(err.message || 'Check-in failed');
            const audio = new Audio('/sounds/error.mp3');
            audio.play().catch(() => { });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6 text-slate-900 text-left">
            {/* Search Input */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email or mobile..."
                    className="w-full bg-white border border-slate-200 text-slate-900 text-lg rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-slate-400 shadow-sm transition-all"
                />
                <button
                    onClick={() => handleSearch()}
                    disabled={isSearching || !query.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-orange-600 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50 disabled:hover:bg-slate-900 shadow-md"
                >
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3"
                >
                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="font-medium">{error}</p>
                </motion.div>
            )}

            {/* Search Results */}
            <div className="space-y-4">
                {results.map((item) => (
                    <motion.div
                        key={item.user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center text-orange-600 font-bold text-xl shadow-inner">
                                    {item.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{item.user.name}</h3>
                                    <p className="text-slate-500 text-sm">{item.user.email}</p>
                                    <p className="text-slate-500 text-sm">{item.user.phone || 'No mobile'}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200">
                                {item.user.role || 'DEVOTEE'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Active Bookings</h4>
                            {item.bookings.length > 0 ? (
                                item.bookings.map(booking => (
                                    <div key={booking._id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between group hover:border-orange-200 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-900">{typeof booking.temple === 'object' ? booking.temple.name : 'Temple'}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                        booking.status === 'USED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">{new Date(booking.date).toLocaleDateString()} • {booking.slot}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCheckIn(booking.passId)}
                                            disabled={processingId === booking.passId || booking.status === 'USED'}
                                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${booking.status === 'USED'
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/30'
                                                }`}
                                        >
                                            {processingId === booking.passId ? '...' : booking.status === 'USED' ? 'Checked In' : 'Check In'}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-sm">No active bookings found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {!isSearching && results.length === 0 && !error && query.length > 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-lg font-medium text-slate-600">No users found</p>
                        <p className="text-sm">Try searching with a different name or email</p>
                    </div>
                )}
            </div>
        </div>
    );
}
