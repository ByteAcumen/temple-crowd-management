'use client';

// Temple Smart E-Pass - Ultimate Futuristic Landing Page
// Premium Design with Advanced Animations

import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    return (
        <div className="min-h-screen bg-white overflow-hidden">
            {/* Floating Background Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-orange-200 blob animate-float opacity-30"></div>
                <div className="absolute top-1/2 -right-32 w-80 h-80 bg-orange-300 blob animate-float-reverse opacity-20"></div>
                <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-yellow-200 blob animate-float opacity-20"></div>
            </div>

            {/* Premium Navbar */}
            <nav className="fixed top-4 left-4 right-4 z-50 glass rounded-2xl shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo with Image */}
                    <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <img
                                src="/temple-logo.png"
                                alt="Temple Smart E-Pass Logo"
                                className="w-12 h-12 rounded-xl object-contain transition-transform group-hover:scale-110"
                            />
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-orange-400 rounded-xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-xl font-bold text-slate-900 tracking-tight">Temple Smart</span>
                            <span className="block text-xs text-orange-600 font-medium">AI-Powered E-Pass</span>
                        </div>
                    </Link>

                    {/* Nav Links with Hover Underline */}
                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'How It Works', 'Safety', 'Temples'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                className="relative text-slate-600 hover:text-orange-600 transition-colors font-medium cursor-pointer group py-2"
                            >
                                {item}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"></span>
                            </a>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="hidden sm:block text-slate-600 hover:text-orange-600 font-medium cursor-pointer transition-colors">
                            Sign In
                        </Link>
                        <Link href="/register" className="btn-primary cursor-pointer hidden sm:inline-block">
                            Get Free E-Pass
                        </Link>
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-slate-600 hover:text-orange-600 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-orange-100 px-6 py-4 animate-fade-in-up">
                        <div className="flex flex-col gap-3">
                            {['Features', 'How It Works', 'Safety', 'Temples'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-slate-600 hover:text-orange-600 transition-colors font-medium py-2"
                                >
                                    {item}
                                </a>
                            ))}
                            <div className="flex flex-col gap-2 pt-3 border-t border-orange-100">
                                <Link href="/login" className="text-center py-2 text-slate-600 hover:text-orange-600 font-medium">
                                    Sign In
                                </Link>
                                <Link href="/register" className="btn-primary text-center">
                                    Get Free E-Pass
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* ========== HERO SECTION ========== */}
            <section className="relative pt-32 pb-20 min-h-screen flex items-center overflow-hidden">
                {/* Background Image with Overlay - High Quality Unsplash Temple */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1920&q=80"
                        alt="Majestic South Indian Temple at Golden Hour"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/60"></div>
                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-50/50 via-transparent to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left - Content */}
                        <div className="stagger-children text-center lg:text-left">
                            {/* Live Badge */}
                            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white shadow-lg border border-orange-100 mb-6 sm:mb-8">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-slate-700">🕉️ 50+ Temples Live • 1 Lakh+ Pilgrims Served</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 sm:mb-8">
                                <span className="block">Safe Darshan,</span>
                                <span className="block text-gradient">Zero Crowds</span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-lg sm:text-xl text-slate-600 mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                India&apos;s first <strong className="text-orange-600">AI-powered crowd management</strong> for temples.
                                Book your darshan slot, check live crowd status, and enter with a <span className="text-green-600 font-semibold">secure digital E-Pass</span>.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 mb-10 sm:mb-12">
                                <Link href="/register" className="btn-primary flex items-center justify-center gap-3 text-base sm:text-lg cursor-pointer">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                    Get Free E-Pass
                                </Link>
                                <a href="#how-it-works" className="btn-secondary flex items-center justify-center gap-3 text-base sm:text-lg cursor-pointer">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Watch Demo
                                </a>
                            </div>

                            {/* Trust Stats */}
                            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-orange-200/50">
                                {[
                                    { value: '50+', label: 'Partner Temples', color: 'text-orange-600' },
                                    { value: '1L+', label: 'Happy Pilgrims', color: 'text-blue-600' },
                                    { value: 'Zero', label: 'Incidents', color: 'text-green-600' }
                                ].map((stat, i) => (
                                    <div key={i} className="text-center px-2">
                                        <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                                        <div className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right - App Preview / E-Pass Mockup */}
                        {/* Mobile/Tablet: Show E-Pass mockup image */}
                        <div className="lg:hidden flex justify-center animate-fade-in-up delay-200">
                            <div className="relative">
                                <img
                                    src="/epass-mockup.png"
                                    alt="Temple E-Pass Digital Pass Preview"
                                    className="w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl"
                                />
                                <div className="absolute -bottom-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                    ✓ Verified Pass
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Show Phone Mockup */}
                        <div className="relative hidden lg:block animate-fade-in-right delay-300">
                            {/* Main Phone Mockup */}
                            <div className="relative mx-auto w-[320px]">
                                {/* Phone Frame */}
                                <div className="bg-slate-900 rounded-[3rem] p-3 shadow-2xl shadow-slate-900/30">
                                    {/* Screen */}
                                    <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-[2.5rem] overflow-hidden">
                                        {/* Status Bar */}
                                        <div className="flex items-center justify-between px-8 py-3 text-white/80 text-xs">
                                            <span>9:41</span>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 18c3.31 0 6-2.69 6-6 0-1.01-.25-1.97-.7-2.8L5.2 21.3c.83.45 1.79.7 2.8.7zm0-14c-3.31 0-6 2.69-6 6 0 1.01.25 1.97.7 2.8L18.8 2.7C17.97 2.25 17.01 2 16 2z" /></svg>
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
                                                <svg className="w-6 h-3" fill="currentColor" viewBox="0 0 24 12"><rect x="0" y="2" width="20" height="8" rx="2" fill="currentColor" /><rect x="21" y="4" width="2" height="4" rx="0.5" fill="currentColor" /></svg>
                                            </div>
                                        </div>

                                        {/* App Content */}
                                        <div className="px-6 pb-8 pt-4">
                                            {/* Temple Header */}
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                                <div className="text-white">
                                                    <h3 className="font-bold text-lg">Tirupati Balaji</h3>
                                                    <p className="text-orange-100 text-sm">Andhra Pradesh</p>
                                                </div>
                                                <div className="ml-auto px-3 py-1 bg-green-400/90 rounded-full text-xs font-bold text-green-900">
                                                    OPEN
                                                </div>
                                            </div>

                                            {/* Crowd Status Card */}
                                            <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-5 mb-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-white/90 font-medium">Live Crowd Status</span>
                                                    <div className="flex gap-1">
                                                        <span className="w-3 h-3 rounded-full bg-green-400"></span>
                                                        <span className="w-3 h-3 rounded-full bg-white/30"></span>
                                                        <span className="w-3 h-3 rounded-full bg-white/30"></span>
                                                    </div>
                                                </div>
                                                <div className="text-5xl font-black text-white mb-2 tracking-tight">LOW</div>
                                                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full w-[32%] bg-gradient-to-r from-green-400 to-green-300 rounded-full"></div>
                                                </div>
                                                <p className="text-orange-100 text-sm mt-2">1,600 / 5,000 devotees</p>
                                            </div>

                                            {/* Next Slot Card */}
                                            <div className="bg-white rounded-2xl p-4 flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
                                                    <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-900">Next Available</p>
                                                    <p className="text-slate-500 text-sm">10:30 - 11:30 AM</p>
                                                </div>
                                                <button className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute -left-20 top-16 animate-float">
                                    <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">Today&apos;s Visits</p>
                                                <p className="text-blue-600 font-semibold">3,240+</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -right-16 bottom-32 animate-float-reverse delay-300">
                                    <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">E-Pass</p>
                                                <p className="text-green-600 font-semibold">Confirmed!</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== FEATURES ========== */}
            <section id="features" className="py-24 bg-white relative">
                <div className="absolute inset-0 dot-pattern opacity-30"></div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-4">FEATURES</span>
                        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Smart Features for <span className="text-gradient">Safer Darshan</span>
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            AI-powered technology that ensures crowd safety while providing a seamless spiritual experience
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                                title: 'Real-Time Crowd Dashboard',
                                description: 'Live occupancy with traffic light indicators. GREEN means go, YELLOW means wait, RED means full.',
                                strokeColor: '#0ea5e9',
                                bgLight: 'bg-blue-50'
                            },
                            {
                                iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                                title: 'Instant Slot Booking',
                                description: 'Pick your preferred darshan time slot online. Skip queues with confirmed entry windows.',
                                strokeColor: '#f97316',
                                bgLight: 'bg-orange-50'
                            },
                            {
                                iconPath: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
                                title: 'QR Code Digital E-Pass',
                                description: 'Secure, contactless entry with encrypted QR codes. Scan in under 2 seconds.',
                                strokeColor: '#10b981',
                                bgLight: 'bg-green-50'
                            },
                            {
                                iconPath: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                                title: 'Admin Analytics Dashboard',
                                description: 'Comprehensive insights with crowd heatmaps, revenue tracking, and temple utilization metrics.',
                                strokeColor: '#8b5cf6',
                                bgLight: 'bg-purple-50'
                            },
                            {
                                iconPath: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                                title: 'Role-Based Access Control',
                                description: 'Secure portals for Devotees, Gatekeepers, and Admins with JWT authentication.',
                                strokeColor: '#f43f5e',
                                bgLight: 'bg-rose-50'
                            },
                            {
                                iconPath: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
                                title: 'Smart Capacity Alerts',
                                description: 'Automatic notifications at 85% and 95% capacity. Prevent overcrowding before it happens.',
                                strokeColor: '#f59e0b',
                                bgLight: 'bg-amber-50'
                            }
                        ].map((feature, i) => (
                            <div key={i} className="card p-8 hover-lift cursor-pointer group">
                                <div className={`w-16 h-16 rounded-2xl ${feature.bgLight} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <svg className="w-8 h-8" fill="none" stroke={feature.strokeColor} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.iconPath} />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== HOW IT WORKS ========== */}
            <section id="how-it-works" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-4">HOW IT WORKS</span>
                        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Book in <span className="text-gradient">3 Simple Steps</span>
                        </h2>
                        <p className="text-xl text-slate-600">
                            From booking to blessing in under a minute
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-300 rounded-full"></div>

                        {[
                            { step: '1', title: 'Check Crowd Status', desc: 'Open the app, view real-time crowd levels at your temple, and pick the perfect slot for a peaceful darshan' },
                            { step: '2', title: 'Get Your E-Pass', desc: 'Book your slot in seconds. Receive your digital E-Pass with unique QR code instantly on your phone' },
                            { step: '3', title: 'Scan & Enter', desc: 'Show your QR code at the gate. Quick touchless scan and you&apos;re in - no waiting, no pushing, pure devotion' }
                        ].map((item, i) => (
                            <div key={i} className="text-center relative z-10">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 text-white text-3xl font-black flex items-center justify-center mx-auto mb-8 shadow-xl shadow-orange-500/30 hover:scale-110 transition-transform cursor-pointer">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
                                <p className="text-slate-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== BUILT FOR EVERYONE (USER ROLES) ========== */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-20"></div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-4">FOR EVERYONE</span>
                        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Built for <span className="text-gradient">Every Role</span>
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Whether you&apos;re a devotee, gatekeeper, or temple administrator - we&apos;ve got you covered
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Devotee Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-orange-100 hover:-translate-y-2 transition-all">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">🙏 Devotee</h3>
                                <ul className="space-y-3 text-slate-600">
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">✓</span>
                                        Book darshan slots online
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">✓</span>
                                        Get instant QR E-Pass
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">✓</span>
                                        Check live crowd status
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">✓</span>
                                        Email confirmations
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Gatekeeper Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-blue-100 hover:-translate-y-2 transition-all">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">🔐 Gatekeeper</h3>
                                <ul className="space-y-3 text-slate-600">
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</span>
                                        Scan QR codes for entry
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</span>
                                        Track live crowd count
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</span>
                                        Prevent duplicate entries
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</span>
                                        Capacity alert notifications
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Admin Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-purple-100 hover:-translate-y-2 transition-all">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">👑 Temple Admin</h3>
                                <ul className="space-y-3 text-slate-600">
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">✓</span>
                                        Full analytics dashboard
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">✓</span>
                                        Manage temples & slots
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">✓</span>
                                        Revenue & crowd reports
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">✓</span>
                                        User access control
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== SAFETY SECTION ========== */}
            <section id="safety" className="py-24 gradient-dark text-white relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 rounded-full bg-orange-500/20 text-orange-300 text-sm font-semibold mb-4">SAFETY FIRST</span>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                            Built for <span className="text-orange-400">Crowd Safety</span>
                        </h2>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                            Preventing stampedes and ensuring peaceful worship through intelligent technology
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { value: '< 2s', label: 'QR Scan Speed', icon: '⚡' },
                            { value: '24/7', label: 'Live Monitoring', icon: '📡' },
                            { value: '99.9%', label: 'System Uptime', icon: '✓' },
                            { value: '1 Lakh+', label: 'Safe Visits', icon: '🛡️' }
                        ].map((stat, i) => (
                            <div key={i} className="glass-dark rounded-2xl p-8 text-center hover:bg-white/10 transition-all cursor-pointer group">
                                <div className="text-4xl mb-4 group-hover:scale-125 transition-transform">{stat.icon}</div>
                                <div className="text-3xl font-bold text-orange-400 mb-2">{stat.value}</div>
                                <div className="text-slate-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-500/20 rounded-full border border-green-500/30">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-green-400 font-medium">All safety systems operational • Real-time monitoring active</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== TECHNOLOGY STACK ========== */}
            <section className="py-16 bg-slate-50 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-10">
                        <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Powered By Modern Technology</span>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                        {[
                            { name: 'Node.js', color: '#339933' },
                            { name: 'MongoDB', color: '#47A248' },
                            { name: 'Redis', color: '#DC382D' },
                            { name: 'Socket.IO', color: '#010101' },
                            { name: 'Next.js', color: '#000000' },
                            { name: 'Docker', color: '#2496ED' }
                        ].map((tech, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:scale-105 transition-all cursor-pointer group"
                            >
                                <div
                                    className="w-3 h-3 rounded-full group-hover:animate-pulse"
                                    style={{ backgroundColor: tech.color }}
                                ></div>
                                <span className="font-semibold text-slate-700">{tech.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <p className="text-slate-500 text-sm">
                            Enterprise-grade infrastructure • 99.9% uptime • Real-time WebSocket updates
                        </p>
                    </div>
                </div>
            </section>

            {/* ========== CTA SECTION ========== */}
            <section className="py-24 relative overflow-hidden">
                {/* Temple Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1621427642869-0f968d7d9e48?w=1920&q=80"
                        alt="Temple Silhouette"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/95 via-orange-500/90 to-red-500/95"></div>
                </div>
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                        Ready for Your<br />Peaceful Darshan?
                    </h2>
                    <p className="text-xl text-orange-100 mb-12">
                        Join lakhs of devotees enjoying safer, queue-free temple visits across India
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <Link href="/register" className="bg-white text-orange-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all hover:-translate-y-2 cursor-pointer shadow-2xl shadow-orange-900/30">
                            Book Your Free E-Pass
                        </Link>
                        <a href="#temples" className="border-2 border-white/40 text-white px-10 py-5 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-colors cursor-pointer">
                            View Partner Temples
                        </a>
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <footer className="bg-slate-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-8 border-b border-slate-800">
                        <div className="flex items-center gap-4">
                            <img
                                src="/temple-logo.png"
                                alt="Temple Smart Logo"
                                className="w-14 h-14 rounded-xl object-contain"
                            />
                            <div>
                                <span className="text-xl font-bold">Temple Smart</span>
                                <span className="block text-sm text-slate-400">AI-Powered E-Pass System</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 text-sm">
                            {['Features', 'How It Works', 'Safety', 'Contact'].map((item) => (
                                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                        <p>© 2026 Temple Smart. Making temple visits safer across India.</p>
                        <div className="flex items-center gap-6">
                            <a href="#" className="hover:text-white transition-colors cursor-pointer">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors cursor-pointer">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
