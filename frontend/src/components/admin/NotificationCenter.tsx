'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'info' | 'warning' | 'error' | 'success';
    read: boolean;
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch live notifications
    useEffect(() => {
        let mounted = true;

        const fetchAlerts = async () => {
            try {
                const newNotifications: Notification[] = [];

                // 1. Check System Health
                try {
                    const health = await api.admin.getSystemHealth();
                    if (!health.success || health.data?.status === 'down') {
                        newNotifications.push({
                            id: `health-err-${Date.now()}`,
                            title: 'System Offline',
                            message: 'Backend services or DB unreachable.',
                            time: 'Just now',
                            type: 'error',
                            read: false
                        });
                    }
                } catch (e) {
                    newNotifications.push({
                        id: `health-err-${Date.now()}`,
                        title: 'Connection Lost',
                        message: 'Unable to reach the backend server.',
                        time: 'Just now',
                        type: 'error',
                        read: false
                    });
                }

                // 2. Check Crowd Alerts
                try {
                    const live = await api.live.getCrowdData();
                    if (live.success && live.data?.temples) {
                        live.data.temples.forEach((t: any) => {
                            if (t.traffic_status === 'RED' || t.capacity_percentage >= 95) {
                                newNotifications.push({
                                    id: `crowd-red-${t.temple_id}-${Date.now()}`,
                                    title: 'Critical Crowd Alert',
                                    message: `${t.temple_name} is at ${t.capacity_percentage}% capacity.`,
                                    time: 'Just now',
                                    type: 'error',
                                    read: false
                                });
                            } else if (t.traffic_status === 'ORANGE' || t.capacity_percentage >= 80) {
                                newNotifications.push({
                                    id: `crowd-org-${t.temple_id}-${Date.now()}`,
                                    title: 'High Traffic Warning',
                                    message: `${t.temple_name} is nearing capacity (${t.capacity_percentage}%).`,
                                    time: 'Just now',
                                    type: 'warning',
                                    read: false
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to load live footprint", e);
                }

                if (mounted) {
                    // Prepend new alerts, keeping unread ones
                    setNotifications(prev => {
                        const existingUnread = prev.filter(n => !n.read);
                        const merged = [...newNotifications, ...existingUnread].slice(0, 10); // Keep top 10
                        // Deduplicate by title to avoid spam during polling
                        const unique = merged.filter((v, i, a) => a.findIndex(t => (t.title === v.title && t.message === v.message)) === i);
                        return unique;
                    });
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) setLoading(false);
            }
        };

        fetchAlerts();

        // Poll every 60 seconds
        const interval = setInterval(fetchAlerts, 60000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Keep dropdown open when clicking a notification
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return '⚠️';
            case 'error': return '🚨';
            case 'success': return '✅';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="relative z-50" ref={dropdownRef}>
            {/* Bell Icon Trigger */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2.5 rounded-xl relative transition-all duration-300 ${isOpen ? 'bg-orange-50 text-orange-600 shadow-inner' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 hover:shadow-sm'}`}
            >
                {unreadCount > 0 && (
                    <>
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse z-10" />
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-400 rounded-full blur-sm animate-pulse" />
                    </>
                )}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </motion.button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-3xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-200/80 overflow-hidden ring-1 ring-slate-100/50"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            {loading && notifications.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                                    Checking systems...
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((n, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + (i * 0.05) }}
                                        key={n.id}
                                        onClick={(e) => markRead(e, n.id)}
                                        className={`px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 group ${!n.read ? 'bg-orange-50/30 hover:bg-orange-50/60' : ''}`}
                                    >
                                        <div className="text-xl mt-1 group-hover:scale-110 transition-transform">{getIcon(n.type)}</div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${!n.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider">
                                                {n.time}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-slate-400 text-sm">
                                    System is fully operational.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                            <button className="text-xs font-medium text-slate-500 hover:text-slate-800">
                                View Activity Log (Coming Soon)
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
