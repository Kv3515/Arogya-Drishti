'use client';

import React from 'react';

interface StaggerGridProps {
  children: React.ReactNode;
  columns?: string;                  // tailwind grid-cols class, e.g. 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
  gap?: string;                      // tailwind gap class, default 'gap-4'
  staggerMs?: number;               // delay between each child, default 80
  className?: string;
}

/**
 * Wraps children in a CSS grid and applies staggered slide-up animation
 * to each direct child using animationDelay inline style.
 */
export function StaggerGrid({
  children,
  columns = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  gap = 'gap-4',
  staggerMs = 80,
  className = '',
}: StaggerGridProps) {
  const items = React.Children.toArray(children);

  return (
    <div className={`grid ${columns} ${gap} ${className}`}>
      {items.map((child, i) => (
        <div
          key={(child as React.ReactElement).key ?? i}
          className="animate-slide-up"
          style={{
            animationDelay: `${i * staggerMs}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
