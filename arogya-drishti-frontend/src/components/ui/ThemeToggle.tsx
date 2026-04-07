'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>('system');
  
  useEffect(() => {
    // Check for saved theme preference or default to 'system'
    const savedTheme = localStorage.getItem('theme') as ThemeMode || 'system';
    setMode(savedTheme);
    applyTheme(savedTheme);
  }, []);
  
  const applyTheme = (newMode: ThemeMode) => {
    const root = document.documentElement;
    
    if (newMode === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (newMode === 'light') {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      // System mode
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', 'system');
    }
  };
  
  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    
    setMode(newMode);
    applyTheme(newMode);
  };
  
  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };
  
  const getLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };
  
  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200',
        'text-gray-700 dark:text-gray-300',
        className
      )}
      title={`Current: ${getLabel()}. Click to cycle themes.`}
    >
      {getIcon()}
      {showLabel && (
        <span className="text-sm font-medium">
          {getLabel()}
        </span>
      )}
    </button>
  );
}

// Compact version for toolbars
export function CompactThemeToggle({ className }: { className?: string }) {
  return <ThemeToggle className={className} showLabel={false} />;
}

// System status indicator 
export function SystemStatus({ className }: { className?: string }) {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2 rounded-lg',
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      className
    )}>
      {/* System status */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse-slow" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          System Online
        </span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
      
      {/* Time */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {time.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}