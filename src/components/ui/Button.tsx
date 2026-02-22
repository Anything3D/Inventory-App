import React, { ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...props
}: ButtonProps) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
        secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary',
        outline: 'border border-gray-600 text-gray-300 hover:bg-gray-800 focus:ring-gray-500',
        ghost: 'text-gray-400 hover:text-white hover:bg-white/10 focus:ring-gray-500',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={twMerge(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </motion.button>
    );
};
