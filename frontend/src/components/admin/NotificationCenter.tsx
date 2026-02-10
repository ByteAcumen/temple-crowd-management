'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'info' | 'warning' | 'error' | 'success';
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'Crowd Limit Alert',
        message: 'Somnath Temple is at 85% capacity.',
        time: '2 mins ago',
        type: 'warning',
        read: false,
    },
    {
        id: '2',
        title: 'New VIP Booking',
        message: 'A VIP booking was confirmed for Kashi Vishwanath.',
        time: '15 mins ago',
        type: 'success',
        read: false,
    },
    {
        id: '3',
        title: 'System Update',
        message: 'Backend services successfully deployed.',
        time: '1 hour ago',
        type: 'info',
        read: true,
    },
    {
        id: '4',
        title: 'Payment Failed',
        message: 'Booking #BK-9821 payment failed.',
        time: '2 hours ago',
        type: 'error',
        read: true,
    },
];

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

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

    const markRead = (id: string) => {
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
                className={`p-2.5 rounded-xl relative transition-colors ${isOpen ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </motion.button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
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
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => markRead(n.id)}
                                        className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-orange-50/50' : ''}`}
                                    >
                                        <div className="text-xl mt-1">{getIcon(n.type)}</div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${!n.read ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                {n.time}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-slate-400 text-sm">
                                    No notifications
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                            <button className="text-xs font-medium text-slate-500 hover:text-slate-800">
                                View Activity Log
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
