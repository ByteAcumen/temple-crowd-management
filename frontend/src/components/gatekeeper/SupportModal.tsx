'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white border border-white/50 rounded-3xl p-6 z-[70] shadow-2xl overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -z-10 opacity-50"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-100 rounded-full blur-3xl -z-10 opacity-50"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Support & Help</h2>
                                <p className="text-slate-500 text-sm font-medium">Emergency contacts and assistance</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Emergency Config */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest bg-red-50 inline-block px-2 py-1 rounded-md">Emergency</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <a href="tel:100" className="flex flex-col items-center justify-center bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 p-4 rounded-2xl transition-all shadow-sm group">
                                        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">👮‍♂️</span>
                                        <span className="font-bold text-red-600 text-sm">Police (100)</span>
                                    </a>
                                    <a href="tel:108" className="flex flex-col items-center justify-center bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 p-4 rounded-2xl transition-all shadow-sm group">
                                        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🚑</span>
                                        <span className="font-bold text-red-600 text-sm">Ambulance (108)</span>
                                    </a>
                                </div>
                            </div>

                            {/* Tech Support */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Technical Support</h3>
                                <a href="tel:+919876543210" className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-105 transition-transform">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">IT Admin / Control Room</p>
                                        <p className="text-sm text-slate-500 font-mono">+91 98765 43210</p>
                                    </div>
                                </a>
                            </div>

                            {/* Self Help */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Quick Fixes</h3>
                                <div className="space-y-2">
                                    <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <span className="text-sm font-bold text-slate-700">Scanner not focusing?</span>
                                            <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </summary>
                                        <div className="p-4 pt-0 text-sm text-slate-600 border-t border-slate-200 mt-2 bg-white">
                                            Ensure adequate lighting and hold the device steady. Tap the "Camera" button to restart the scanner if it freezes.
                                        </div>
                                    </details>
                                    <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <span className="text-sm font-bold text-slate-700">Sync Issues?</span>
                                            <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </summary>
                                        <div className="p-4 pt-0 text-sm text-slate-600 border-t border-slate-200 mt-2 bg-white">
                                            Check your internet connection. Data syncs automatically. If stats look wrong, refresh the page.
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
