'use client';

// Animated wrapper components for consistent motion design
// Re-usable animation containers

import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import {
    pageVariants,
    fadeInUp,
    staggerContainer,
    cardHover,
    buttonHover,
    scaleUp,
    modalVariants,
    backdropVariants,
} from '@/lib/animations';

// Page wrapper with fade-in animation
interface PageWrapperProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
}

export function PageWrapper({ children, className = '', ...props }: PageWrapperProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageVariants}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

// Section that fades in when visible
export function FadeInSection({ children, className = '', delay = 0 }: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

// Container that staggers children animations
export function StaggerContainer({ children, className = '' }: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Stagger item (child of StaggerContainer)
export function StaggerItem({ children, className = '' }: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div variants={fadeInUp} className={className}>
            {children}
        </motion.div>
    );
}

// Animated card with hover effects
export function AnimatedCard({ children, className = '', onClick }: {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}) {
    return (
        <motion.div
            variants={cardHover}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            className={className}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

// Animated button with hover/tap effects
export function AnimatedButton({ children, className = '', onClick, disabled, type = 'button' }: {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}) {
    return (
        <motion.button
            variants={buttonHover}
            initial="rest"
            whileHover={disabled ? 'rest' : 'hover'}
            whileTap={disabled ? 'rest' : 'tap'}
            className={className}
            onClick={onClick}
            disabled={disabled}
            type={type}
        >
            {children}
        </motion.button>
    );
}

// Scale up on scroll into view
export function ScaleOnView({ children, className = '' }: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleUp}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Modal with backdrop
export function AnimatedModal({ children, isOpen, onClose }: {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Animated counter (counts up to target number)
export function AnimatedCounter({ value, duration = 1 }: {
    value: number;
    duration?: number;
}) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {value.toLocaleString()}
        </motion.span>
    );
}

// Loading skeleton with shimmer
export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded ${className}`}
            style={{
                animation: 'shimmer 1.5s infinite',
            }}
        />
    );
}

// Floating animation (for decorative elements)
export function FloatingElement({ children, className = '' }: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            animate={{
                y: [0, -10, 0],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export { AnimatePresence, motion };
