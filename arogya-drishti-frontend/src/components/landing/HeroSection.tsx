'use client';

import AnimatedBackground from './AnimatedBackground';
import LoginCard from './LoginCard';

const STATUS_PILLS = [
  { label: 'SYSTEM OPERATIONAL', dot: '#22C55E' },
  { label: '5 UNITS ONLINE',     dot: '#14B8A6' },
  { label: '11 PERSONNEL',       dot: '#8B5CF6' },
];

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#0a0f1e' }}
    >
      {/* Animated background layer */}
      <div className="absolute inset-0">
        <AnimatedBackground />
      </div>

      {/* Top system classification bar */}
      <div
        className="relative z-10 flex items-center justify-between px-6 py-2.5"
        style={{
          background: 'rgba(20,184,166,0.06)',
          borderBottom: '1px solid rgba(20,184,166,0.12)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#22C55E', animation: 'breathe 2s ease-in-out infinite' }}
          />
          <span
            className="text-[10px] font-bold tracking-[0.25em]"
            style={{ color: 'rgba(20,184,166,0.80)' }}
          >
            SYSTEM LIVE
          </span>
        </div>
        <span
          className="text-[10px] font-bold tracking-[0.20em]"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          TOP SECRET // RESTRICTED ACCESS // AUTHORISED PERSONNEL ONLY
        </span>
        <span
          className="text-[10px] font-mono hidden sm:block"
          style={{ color: 'rgba(255,255,255,0.20)' }}
        >
          AROGYA DRISHTI v2.0
        </span>
      </div>

      {/* Main hero content */}
      <div className="relative z-10 flex flex-1 items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 xl:px-16">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center py-16 lg:py-0">

            {/* ── Left: Hero copy ── */}
            <div>
              {/* Platform badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
                style={{
                  background: 'rgba(20,184,166,0.08)',
                  border: '1px solid rgba(20,184,166,0.22)',
                  animation: 'fadeInUp 0.6s ease-out 0.1s both',
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#14B8A6' }}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-[11px] font-bold tracking-widest" style={{ color: '#14B8A6' }}>
                  MILITARY MEDICAL INTELLIGENCE
                </span>
              </div>

              {/* App name */}
              <h1
                className="font-black leading-none mb-4"
                style={{
                  fontSize: 'clamp(2.8rem, 6vw, 5rem)',
                  letterSpacing: '-0.02em',
                  animation: 'fadeInUp 0.7s ease-out 0.2s both',
                }}
              >
                <span
                  style={{
                    background: 'linear-gradient(135deg, #E0F2FE 0%, #7DD3FC 30%, #14B8A6 70%, #06B6D4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AROGYA
                </span>
                <br />
                <span className="text-white">DRISHTI</span>
              </h1>

              {/* Tagline */}
              <p
                className="text-base lg:text-lg font-medium mb-8 max-w-md"
                style={{
                  color: 'rgba(255,255,255,0.55)',
                  lineHeight: '1.7',
                  animation: 'fadeInUp 0.7s ease-out 0.35s both',
                }}
              >
                Centralised health intelligence for defence personnel.
                Real-time readiness. Secure medical records.
                Commander-grade insights.
              </p>

              {/* Live status pills */}
              <div
                className="flex flex-wrap gap-2.5 mb-10"
                style={{ animation: 'fadeInUp 0.7s ease-out 0.5s both' }}
              >
                {STATUS_PILLS.map(({ label, dot }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dot, animation: 'breathe 2.5s ease-in-out infinite' }}
                    />
                    <span
                      className="text-[10px] font-bold tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Role quick-ref */}
              <div
                className="rounded-xl p-4 max-w-sm"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  animation: 'fadeInUp 0.7s ease-out 0.65s both',
                }}
              >
                <p
                  className="text-[10px] font-bold tracking-[0.20em] mb-3"
                  style={{ color: 'rgba(255,255,255,0.30)' }}
                >
                  AVAILABLE ROLES
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { role: 'Super Admin',      color: '#F59E0B', icon: '⬡' },
                    { role: 'Medical Officer',  color: '#14B8A6', icon: '⬡' },
                    { role: 'Commander',        color: '#8B5CF6', icon: '⬡' },
                    { role: 'Individual',       color: '#22C55E', icon: '⬡' },
                  ].map(({ role, color, icon }) => (
                    <div key={role} className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color }}>{icon}</span>
                      <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Login card ── */}
            <div className="flex items-center justify-center lg:justify-end">
              <LoginCard />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient bleed into features section */}
      <div
        className="relative z-10 h-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(10,15,30,0.95))',
        }}
      />

      {/* Scroll hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5"
        style={{ animation: 'fadeInUp 0.7s ease-out 1.0s both' }}
      >
        <span className="text-[10px] font-bold tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          SCROLL
        </span>
        <svg
          className="w-4 h-4"
          style={{ color: 'rgba(20,184,166,0.50)', animation: 'breathe 2s ease-in-out infinite' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
