'use client';

// Animation utilities and variants for consistent motion design
// Uses Framer Motion for premium, smooth animations

import { Variants } from 'framer-motion';

// Page transition variants
export const pageVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
        },
    },
};

// Fade in from bottom (for cards, sections)
export const fadeInUp: Variants = {
    hidden: {
        opacity: 0,
        y: 30,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: 'easeOut',
        },
    },
};

// Stagger children animation
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

// Card hover animation
export const cardHover: Variants = {
    rest: {
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    hover: {
        scale: 1.02,
        y: -5,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    tap: {
        scale: 0.98,
    },
};

// Button hover animation
export const buttonHover: Variants = {
    rest: {
        scale: 1,
    },
    hover: {
        scale: 1.05,
        transition: {
            duration: 0.2,
            ease: 'easeOut',
        },
    },
    tap: {
        scale: 0.95,
    },
};

// Slide in from left
export const slideInLeft: Variants = {
    hidden: {
        opacity: 0,
        x: -50,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
};

// Slide in from right
export const slideInRight: Variants = {
    hidden: {
        opacity: 0,
        x: 50,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
};

// Scale up animation
export const scaleUp: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

// Pulse animation (for notifications, badges)
export const pulse: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.1, 1],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Shimmer loading effect
export const shimmer: Variants = {
    initial: {
        backgroundPosition: '-200% 0',
    },
    animate: {
        backgroundPosition: '200% 0',
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

// Modal/Dialog animation
export const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 10,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: {
            duration: 0.15,
        },
    },
};

// Backdrop animation
export const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15 },
    },
};

// Number count-up animation helper
export const countUpTransition = {
    duration: 1,
    ease: 'easeOut',
};

// Spring physics for natural motion
export const springTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
};

// Smooth elastic transition
export const elasticTransition = {
    type: 'spring',
    stiffness: 400,
    damping: 25,
};
