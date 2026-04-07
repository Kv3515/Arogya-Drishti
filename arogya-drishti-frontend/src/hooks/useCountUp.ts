'use client';

import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;       // ms, default 700
  delay?: number;          // ms before starting, default 0
  enabled?: boolean;       // default true — set false to skip animation
  decimals?: number;       // decimal places to show, default 0
}

/**
 * Animates a number from `start` to `end` over `duration` ms.
 * Returns the current animated value as a string.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
export function useCountUp({
  start = 0,
  end,
  duration = 700,
  delay = 0,
  enabled = true,
  decimals = 0,
}: UseCountUpOptions): string {
  const [current, setCurrent] = useState(enabled ? start : end);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Guard: skip animation for invalid numbers
    if (!isFinite(end) || isNaN(end)) {
      setCurrent(end);
      return;
    }
    if (!enabled) {
      setCurrent(end);
      return;
    }

    // Validate duration
    const safeDuration = duration > 0 ? duration : 700;

    // Reset on end change
    setCurrent(start);
    startTimeRef.current = null;

    const delayTimer = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / safeDuration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = start + (end - start) * eased;

        setCurrent(value);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setCurrent(end);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [end, start, duration, delay, enabled]);

  return current.toFixed(decimals);
}
