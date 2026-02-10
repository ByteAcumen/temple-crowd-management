'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
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
const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex overflow-hidden font-sans text-slate-900">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/30 to-amber-100/20 rounded-full blur-3xl animate-float" />
                <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-gradient-to-bl from-blue-100/30 to-indigo-50/20 rounded-full blur-3xl animate-float-reverse" />
                <div className="absolute -bottom-32 left-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-amber-100/30 to-orange-50/20 rounded-full blur-3xl animate-float" />
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Premium Sidebar */}
            <motion.aside
                initial={false}
                animate={isSidebarOpen ? 'expanded' : 'collapsed'}
                variants={sidebarVariants}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`
                    fixed lg:relative z-50 h-screen
                    bg-white/95 backdrop-blur-xl
                    shadow-2xl shadow-slate-900/5
                    border-r border-slate-200/80
                    flex flex-col
                    ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                    transition-transform duration-300
                `}
            >
                {/* Logo Section - Premium Header */}
                <div className="h-20 px-5 border-b border-slate-100/80 flex items-center gap-4 overflow-hidden bg-gradient-to-r from-white to-orange-50/30">
                    <Link href="/" className="flex items-center gap-3.5 min-w-max group">
                        <motion.div
                            className="relative"
                            whileHover={{ scale: 1.08, rotate: 3 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-0.5 shadow-lg shadow-orange-500/30">
                                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                                    <img
                                        src="/temple-logo.png"
                                        alt="Temple Smart"
                                        className="w-8 h-8 object-contain"
                                    />
                                </div>
                            </div>
                            <div className="absolute -inset-1 bg-orange-400 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                        </motion.div>

                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                                        Temple<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Smart</span>
                                    </h1>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                                            {user?.isSuperAdmin ? 'Super Admin' : 'Admin Panel'}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Link>
                </div>

                {/* Navigation - Premium Styled */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                    <div className="space-y-1">
                        {navItems.map((item, index) => {
                            const isActive = pathname?.startsWith(item.href);
                            const isHovered = hoveredItem === item.href;

                            return (
                                <motion.div
                                    key={item.href}
                                    custom={index}
                                    initial="hidden"
                                    animate="visible"
                                    variants={navItemVariants}
                                >
                                    <Link
                                        href={item.href}
                                        onMouseEnter={() => setHoveredItem(item.href)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        className={`
                                            relative flex items-center gap-3 px-3.5 py-3 rounded-xl
                                            transition-all duration-200 group overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }
                                        `}
                                        title={!isSidebarOpen ? item.label : ''}
                                    >
                                        {/* Hover Effect Background */}
                                        {!isActive && isHovered && (
                                            <motion.div
                                                layoutId="navHover"
                                                className="absolute inset-0 bg-gradient-to-r from-orange-50 to-red-50/50 rounded-xl"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                            />
                                        )}

                                        {/* Active Indicator */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full"
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}

                                        {/* Icon */}
                                        <motion.span
                                            className={`text-xl relative z-10 shrink-0 ${isSidebarOpen ? '' : 'mx-auto'
                                                }`}
                                            whileHover={{ scale: 1.15 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                        >
                                            {item.icon}
                                        </motion.span>

                                        {/* Label & Description */}
                                        <AnimatePresence>
                                            {isSidebarOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="relative z-10 min-w-0"
                                                >
                                                    <span className={`block font-semibold text-sm truncate ${isActive ? 'text-white' : ''
                                                        }`}>
                                                        {item.label}
                                                    </span>
                                                    <span className={`block text-[10px] truncate ${isActive ? 'text-white/70' : 'text-slate-400'
                                                        }`}>
                                                        {item.description}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Active Arrow */}
                                        {isActive && isSidebarOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="ml-auto relative z-10"
                                            >
                                                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </motion.div>
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </nav>

                {/* User Profile Section - Premium */}
                <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50/80 to-orange-50/30">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen ? 'justify-center' : ''}`}>
                        {/* Avatar with Status */}
                        <motion.div
                            className="relative shrink-0"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-red-500 p-0.5 shadow-lg shadow-orange-500/20">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-orange-600 font-bold text-base">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </motion.div>

                        <AnimatePresence>
                            {isSidebarOpen && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex-1 min-w-0"
                                    >
                                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                                    </motion.div>

                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={logout}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Sign Out"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </motion.button>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10" ref={scrollRef}>
                {/* Scroll Progress Bar */}
                <motion.div
                    className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 origin-left z-[60] shadow-lg shadow-orange-500/50"
                    style={{ scaleX: scrollYProgress }}
                />

                {/* Premium Header */}
                <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm shadow-slate-900/5">
                    <div className="flex items-center gap-4">
                        <motion.button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M4 6h16M4 12h10M4 18h16" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </motion.button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                            {subtitle && <p className="text-sm text-slate-500 hidden sm:block">{subtitle}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Trigger */}
                        <div className="hidden md:flex relative group cursor-pointer" onClick={() => setIsCommandOpen(true)}>
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all w-64 text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-sm">Search...</span>
                                <div className="ml-auto text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">Ctrl K</div>
                            </div>
                        </div>

                        {/* Quick Actions Dropdown */}
                        <div className="relative z-50">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                                onBlur={() => setTimeout(() => setIsQuickAddOpen(false), 200)}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
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
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => router.push('/admin/temples?action=new')}
                                            className="w-full text-left px-4 py-3 hover:bg-orange-50 text-slate-700 hover:text-orange-700 font-medium text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <span className="text-lg">🛕</span> Add Temple
                                        </button>
                                        <button
                                            onClick={() => router.push('/admin/bookings?action=new')}
                                            className="w-full text-left px-4 py-3 hover:bg-orange-50 text-slate-700 hover:text-orange-700 font-medium text-sm flex items-center gap-2 transition-colors border-t border-slate-50"
                                        >
                                            <span className="text-lg">🎫</span> New Booking
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications */}
                        <NotificationCenter />
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar" ref={contentRef}>
                    <div className="max-w-7xl mx-auto pb-10">
                        {children}
                    </div>
                </div>
            </main>

            <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
        </div>
    );
}
