'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
    delay?: number;
}

export const GlassCard = ({ children, className = '', hoverEffect = true, delay = 0 }: GlassCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            whileHover={hoverEffect ? {
                y: -5,
                boxShadow: "0 20px 40px -12px rgba(251, 191, 36, 0.15)", // Gold glow
                borderColor: "rgba(251, 191, 36, 0.3)"
            } : {}}
            className={`
                relative overflow-hidden
                bg-white/80 backdrop-blur-3xl
                border border-white/60
                rounded-2xl
                shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100/50
                ${className}
            `}
        >
            {/* Glossy Overlay - Light Mode */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

            {/* Content using Relative to sit above overlay */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    );
};
