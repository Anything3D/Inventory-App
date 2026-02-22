import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export const Card = ({ children, className, delay = 0 }: CardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            className={twMerge(
                'bg-surface rounded-2xl border border-gray-700/50 p-6 shadow-xl backdrop-blur-sm',
                className
            )}
        >
            {children}
        </motion.div>
    );
};
