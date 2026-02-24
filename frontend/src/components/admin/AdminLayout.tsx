'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, Variants } from 'framer-motion';
import CommandPalette from '@/components/admin/CommandPalette';
import NotificationCenter from '@/components/admin/NotificationCenter';

// Navigation Items Configuration
const getNavItems = (isSuperAdmin: boolean) => [
    { label: 'Dashboard', icon: '📊', href: '/admin/dashboard', description: 'Overview & Stats' },
    { label: 'Temples', icon: '🛕', href: '/admin/temples', description: 'Manage Temples' },
    { label: 'Bookings', icon: '🎫', href: '/admin/bookings', description: 'Reservations' },
    { label: 'Live Monitor', icon: '📡', href: '/admin/live', description: 'Real-time Crowd' },
    { label: 'Analytics', icon: '📈', href: '/admin/analytics', description: 'Insights & Reports' },
    { label: 'Backend Testing', icon: '🧪', href: '/admin/testing', description: 'Crowd, Predictions & Health' },
    ...(isSuperAdmin ? [{ label: 'Users & Roles', icon: '👥', href: '/admin/users', description: 'Team Management' }] : []),
];

// Sidebar Animation Variants
const sidebarVariants: Variants = {
    expanded: {
        width: 280,
        x: 0,
        transition: { type: "spring", stiffness: 400, damping: 40, mass: 0.8 }
    },
    collapsed: {
        width: 88,
        x: 0,
        transition: { type: "spring", stiffness: 400, damping: 40, mass: 0.8 }
    },
    mobileOpen: {
        x: 0,
        width: 288,
        transition: { type: "spring", stiffness: 400, damping: 40, mass: 0.8 }
    },
    mobileClosed: {
        x: -288,
        width: 288,
        transition: { type: "spring", stiffness: 400, damping: 40, mass: 0.8 }
    }
};

const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.3,
            ease: 'easeOut' as const
        }
    })
};

export default function AdminLayout({
    children,
    title,
    subtitle
}: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Click outside refs
    const profileRef = useRef<HTMLDivElement>(null);
    const quickAddRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
                setIsQuickAddOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Smooth Scroll Progress
    const scrollRef = useRef(null);
    const contentRef = useRef(null);
    const { scrollYProgress } = useScroll({
        container: contentRef
    });

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const navItems = getNavItems(user?.isSuperAdmin || false);

    // Handle responsiveness
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-900 relative selection:bg-orange-500/30">
            {/* Solid fast background */}
            <div className="absolute inset-0 z-0 bg-slate-50/80 pointer-events-none"></div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - Desktop & Mobile */}
            <motion.aside
                initial={isMobile ? "mobileClosed" : "expanded"}
                animate={isMobile ? (isSidebarOpen ? "mobileOpen" : "mobileClosed") : (isDesktopCollapsed ? "collapsed" : "expanded")}
                variants={sidebarVariants}
                className={`
                fixed lg:relative z-50 h-screen flex flex-col 
                border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] 
                bg-white will-change-transform
            `}>
                <div className={`p-6 flex items-center gap-3 border-b border-slate-100/80 ${isDesktopCollapsed && !isMobile ? 'justify-center' : ''}`}>
                    <Link href="/" className="relative group cursor-pointer flex items-center gap-3" onClick={() => isMobile && setIsSidebarOpen(false)}>
                        <div className="relative shrink-0">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                            <img
                                src="/temple-logo.png"
                                alt="Logo"
                                className="w-10 h-10 rounded-xl relative shadow-sm object-contain bg-slate-50 p-1"
                            />
                        </div>
                        {!isDesktopCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight leading-none">
                                    Temple<span className="text-orange-600">Smart</span>
                                </h1>
                                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase ml-0.5 mt-1">Admin Console</p>
                            </motion.div>
                        )}
                    </Link>
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    {navItems.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isDesktopCollapsed ? item.label : ''}
                                className={`
                                    relative flex items-center ${isDesktopCollapsed ? 'justify-center px-2' : 'px-4'} py-3.5 rounded-xl transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-orange-50 text-orange-700 shadow-sm shadow-orange-100 border border-orange-100'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <span className={`text-xl transition-transform duration-300 relative z-10 shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {item.icon}
                                </span>

                                {!isDesktopCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-medium tracking-wide relative z-10 ml-3 whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}

                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full ${isDesktopCollapsed ? 'left-0.5 h-6' : ''}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-slate-100/80 bg-slate-50/50">
                    <button
                        onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                        className="hidden lg:flex items-center justify-center w-full py-2 mb-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                        <svg className={`w-5 h-5 transition-transform duration-300 ${isDesktopCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={logout}
                        className={`flex items-center ${isDesktopCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 w-full rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group border border-transparent hover:border-red-100`}
                    >
                        <span className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:bg-red-100 transition-colors text-slate-400 group-hover:text-red-500 shrink-0">
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </span>
                        {!isDesktopCollapsed && (
                            <div className="text-left">
                                <p className="text-sm font-semibold">Sign Out</p>
                                <p className="text-[10px] text-slate-400 group-hover:text-red-400/70">End session</p>
                            </div>
                        )}
                    </button>

                    {!isDesktopCollapsed && (
                        <div className="mt-4 flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Online</span>
                            </div>
                            <span className="text-[10px] text-slate-400">v2.4.0</span>
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-3xl border-b border-slate-200/60 z-40 flex items-center justify-between px-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                    <button
                        className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/temple-logo.png" alt="Logo" className="w-8 h-8 rounded-lg bg-orange-50 object-contain p-1 border border-orange-100" />
                        <span className="font-bold text-slate-900 tracking-tight text-lg">Temple<span className="text-orange-600">Smart</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mobile Search Action */}
                    <button onClick={() => setIsCommandOpen(true)} className="p-2 text-slate-400 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 rounded-xl transition-colors ring-1 ring-slate-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    {/* Mobile Notification */}
                    <NotificationCenter />
                    {/* Mobile Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="p-1.5 focus:outline-none">
                            <div className="w-8 h-8 rounded-xl bg-orange-100/80 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs ring-2 ring-transparent focus:ring-orange-300 transition-all">
                                {(user?.name || 'AD').substring(0, 2).toUpperCase()}
                            </div>
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-black/5 z-50 p-1"
                                >
                                    <div className="px-4 py-3 border-b border-slate-100/80 mb-1">
                                        <p className="text-sm font-bold text-slate-800">{user?.name || 'Admin User'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{user?.role || 'Super Admin'}</p>
                                    </div>
                                    <button onClick={() => { setIsProfileOpen(false); router.push('/admin/dashboard'); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors font-medium">Dashboard</button>
                                    <button onClick={() => { setIsProfileOpen(false); logout(); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium flex items-center gap-2 mt-1">
                                        <span>Sign out</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-0 relative w-full h-screen overflow-hidden flex flex-col pt-16 lg:pt-0 bg-slate-50/50" ref={scrollRef}>

                {/* Scroll Progress Bar */}
                <motion.div
                    className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 origin-left z-[60] shadow-sm shadow-orange-500/20"
                    style={{ scaleX: scrollYProgress }}
                />

                {/* Top Header - Desktop */}
                <header className="hidden lg:flex items-center justify-between px-8 py-4 sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-100/50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {navItems.find(i => pathname?.startsWith(i.href))?.label || (pathname === '/admin' ? 'Dashboard' : title)}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Welcome back, {user?.name || 'Administrator'}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Trigger */}
                        <div className="relative group cursor-pointer" onClick={() => setIsCommandOpen(true)}>
                            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100/40 hover:bg-slate-100/80 border border-slate-200/60 hover:border-slate-300 rounded-xl transition-all w-[320px] text-slate-500">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-[13px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">Search temples, bookings, settings...</span>
                                <div className="ml-auto text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white px-2 py-1 rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200">⌘K</div>
                            </div>
                        </div>

                        {/* Quick Actions Dropdown */}
                        <div className="relative z-50" ref={quickAddRef}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl shadow-[0_4px_12px_rgba(249,115,22,0.25)] hover:shadow-[0_6px_16px_rgba(249,115,22,0.35)] transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Quick Add
                            </motion.button>

                            <AnimatePresence>
                                {isQuickAddOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden ring-1 ring-black/5"
                                    >
                                        <button
                                            onClick={() => router.push('/admin/temples?action=new')}
                                            className="w-full text-left px-4 py-3 hover:bg-orange-50 text-slate-600 hover:text-orange-700 font-medium text-sm flex items-center gap-3 transition-colors group"
                                        >
                                            <span className="text-lg bg-orange-100 w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">🛕</span>
                                            Add Temple
                                        </button>
                                        <button
                                            onClick={() => router.push('/admin/bookings?action=new')}
                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-medium text-sm flex items-center gap-3 transition-colors border-t border-slate-50 group"
                                        >
                                            <span className="text-lg bg-blue-100 w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">🎫</span>
                                            New Booking
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <NotificationCenter />
                        </div>

                        <div className="h-8 w-px bg-slate-200 mx-2"></div>

                        {/* Desktop Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <div
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 pl-2 pr-1 py-1 cursor-pointer group rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <div className="text-right hidden xl:block">
                                    <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-orange-600 transition-colors">{user?.name || 'Admin User'}</p>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">{user?.role || 'Super Admin'}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-sm ring-2 ring-transparent group-hover:ring-orange-300 transition-all">
                                    {(user?.name || 'AD').substring(0, 2).toUpperCase()}
                                </div>
                                <svg className={`w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden ring-1 ring-black/5 p-1.5 z-50"
                                    >
                                        <div className="px-4 py-3 mb-1 border-b border-slate-100/80 bg-slate-50/50 rounded-xl">
                                            <p className="text-sm font-bold text-slate-800">{user?.name || 'Admin User'}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{user?.email || 'admin@templesmart.com'}</p>
                                        </div>
                                        <button onClick={() => { setIsProfileOpen(false); router.push('/admin/dashboard'); }} className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-colors font-medium flex items-center gap-2">
                                            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                            Dashboard
                                        </button>
                                        <button onClick={() => { setIsProfileOpen(false); router.push('/admin/users'); }} className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors font-medium flex items-center gap-2 mt-1">
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                            Settings
                                        </button>
                                        <div className="h-px bg-slate-100 my-1.5 mx-2"></div>
                                        <button onClick={() => { setIsProfileOpen(false); logout(); }} className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors font-semibold flex items-center gap-2">
                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Sign out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10 custom-scrollbar scroll-smooth" ref={contentRef}>
                    <div className="max-w-7xl mx-auto pb-10 space-y-6">
                        {children}
                    </div>
                </div>
            </main>

            <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
        </div>
    );
}
