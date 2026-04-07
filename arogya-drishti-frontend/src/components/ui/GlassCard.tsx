'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const variants = {
  default: 'card',
  elevated: 'card shadow-lg',
  bordered: 'card border-2',
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6', 
  lg: 'p-8',
};

export function Card({ 
  children, 
  className, 
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick 
}: CardProps) {
  return (
    <div 
      className={cn(
        variants[variant],
        paddings[padding],
        hover && 'card-hover',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Legacy export for compatibility
export { Card as GlassCard };