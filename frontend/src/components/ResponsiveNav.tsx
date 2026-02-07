'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ResponsiveNav() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-slate-900">Temple Smart</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">Features</a>
                        <a href="#how-it-works" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">How It Works</a>
                        <a href="#temples" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">Temples</a>
                        <Link href="/login" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">Login</Link>
                        <Link href="/register" className="btn-primary px-6 py-2.5 text-sm">
                            Get E-Pass
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-2 py-4 border-t border-slate-200">
                        <a
                            href="#features"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-4 py-3 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors min-h-[44px] flex items-center"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-4 py-3 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors min-h-[44px] flex items-center"
                        >
                            How It Works
                        </a>
                        <a
                            href="#temples"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-4 py-3 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors min-h-[44px] flex items-center"
                        >
                            Temples
                        </a>
                        <Link
                            href="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-4 py-3 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors min-h-[44px] flex items-center"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            onClick={() => setMobileMenuOpen(false)}
                            className="btn-primary mx-4 py-3 text-center min-h-[48px] flex items-center justify-center"
                        >
                            Get E-Pass
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
