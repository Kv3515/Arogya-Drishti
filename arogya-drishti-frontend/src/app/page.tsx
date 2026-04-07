'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/api';
import HeroSection from '@/components/landing/HeroSection';
import FeatureGrid from '@/components/landing/FeatureGrid';
import LandingFooter from '@/components/landing/LandingFooter';

const ROLE_ROUTES: Record<UserRole, string> = {
  super_admin:     '/dashboard/admin',
  medical_officer: '/dashboard/doctor',
  paramedic:       '/dashboard/doctor',
  commander:       '/dashboard/commander',
  individual:      '/dashboard/me',
};

function resolveRoute(role: UserRole): string {
  if (role === 'individual') {
    const isMobile = typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? '/mobile/me' : '/dashboard/me';
  }
  return ROLE_ROUTES[role] ?? '/dashboard/admin';
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // `router` intentionally excluded from deps — stable in Next.js App Router,
  // including it causes infinite re-fires in React 18 concurrent/strict mode.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loading || !user) return;
    router.replace(resolveRoute(user.role));
  }, [user, loading]);

  // While auth is resolving (non-bypass mode on first load), show a dark spinner
  if (loading) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: '#0a0f1e' }}
      >
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(20,184,166,0.30)', borderTopColor: 'transparent' }}
        />
        <p
          className="text-xs font-bold tracking-[0.25em]"
          style={{ color: 'rgba(20,184,166,0.55)' }}
        >
          INITIALISING SYSTEM
        </p>
      </div>
    );
  }

  // User is authenticated → useEffect will redirect; render nothing to avoid flash
  if (user) return null;

  // Unauthenticated → render full landing page
  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: '#0a0f1e' }}
    >
      <HeroSection />
      <FeatureGrid />
      <LandingFooter />
    </div>
  );
}
