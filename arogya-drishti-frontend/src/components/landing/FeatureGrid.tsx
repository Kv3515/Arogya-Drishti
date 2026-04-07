'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  tag: string;
}

const FEATURES: Feature[] = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Unit Readiness Intelligence',
    subtitle: 'Commander-grade overview',
    description:
      'Real-time SHAPE medical category tracking across units. Instant visibility into operational readiness — fitness trends, injury trends, and deployment eligibility by rank.',
    accent: '#14B8A6',
    tag: 'COMMANDER',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    title: 'Medical Officer Dashboard',
    subtitle: 'Clinical workflow intelligence',
    description:
      'Manage patient records, log vitals, prescribe medications, document injuries, and track medical history — all in a purpose-built clinical interface designed for field conditions.',
    accent: '#06B6D4',
    tag: 'MEDICAL',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Commander Overview',
    subtitle: 'Unit-level analytics',
    description:
      'Aggregate health metrics by unit. Monitor readiness grades, fitness distributions, injury trends, and personnel breakdown — with multi-unit selector for formation-level commanders.',
    accent: '#8B5CF6',
    tag: 'COMMAND',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'Individual Health Record',
    subtitle: 'Personal medical identity',
    description:
      'Every service member has a secure digital medical identity — vitals history, annual exams, prescriptions, injury log, risk flags, and SHAPE medical category — accessible anywhere.',
    accent: '#22C55E',
    tag: 'INDIVIDUAL',
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setVisible(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const delay = index * 120;

  return (
    <div
      ref={ref}
      className="group relative rounded-2xl p-6 cursor-default transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.08)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms, border-color 0.3s ease, box-shadow 0.3s ease`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${feature.accent}40`;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${feature.accent}20, 0 8px 32px rgba(0,0,0,0.3), 0 0 40px ${feature.accent}10`;
        e.currentTarget.style.background = `rgba(255,255,255,0.05)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      {/* Accent corner glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${feature.accent}15, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />

      {/* Role tag */}
      <div className="flex items-start justify-between mb-5">
        {/* Icon */}
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
          style={{
            background: `${feature.accent}15`,
            border: `1px solid ${feature.accent}30`,
            color: feature.accent,
          }}
        >
          {feature.icon}
        </div>
        <span
          className="text-[9px] font-black tracking-[0.25em] px-2.5 py-1 rounded-full"
          style={{
            background: `${feature.accent}12`,
            border: `1px solid ${feature.accent}25`,
            color: feature.accent,
          }}
        >
          {feature.tag}
        </span>
      </div>

      {/* Text content */}
      <h3 className="text-base font-bold text-white mb-1">{feature.title}</h3>
      <p
        className="text-xs font-semibold mb-3 tracking-wide"
        style={{ color: feature.accent }}
      >
        {feature.subtitle}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
        {feature.description}
      </p>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}60, transparent)` }}
      />
    </div>
  );
}

export default function FeatureGrid() {
  const headingRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setHeadingVisible(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHeadingVisible(true); observer.disconnect(); } },
      { threshold: 0.2 },
    );
    if (headingRef.current) observer.observe(headingRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative py-24 px-6 lg:px-12 xl:px-16"
      style={{ background: '#0a0f1e' }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(20,184,166,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20,184,166,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Section heading */}
        <div
          ref={headingRef}
          className="text-center mb-14"
          style={{
            opacity: headingVisible ? 1 : 0,
            transform: headingVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
          <p
            className="text-[11px] font-black tracking-[0.30em] mb-3"
            style={{ color: '#14B8A6' }}
          >
            PLATFORM CAPABILITIES
          </p>
          <h2
            className="text-3xl lg:text-4xl font-black text-white mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Built for the field.
            <br />
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>Designed for command.</span>
          </h2>
          <p
            className="text-sm max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.40)', lineHeight: '1.8' }}
          >
            Four role-specific dashboards covering every tier of military medical operations —
            from individual health records to formation-level readiness intelligence.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom connector line */}
        <div
          className="mt-16 flex items-center gap-4"
          style={{
            opacity: headingVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out 0.6s',
          }}
        >
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(20,184,166,0.06)',
              border: '1px solid rgba(20,184,166,0.15)',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#22C55E', animation: 'breathe 2s ease-in-out infinite' }}
            />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: 'rgba(20,184,166,0.70)' }}>
              DEV PHASE 5 — CROSS-ROLE DATA FLOWS
            </span>
          </div>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    </section>
  );
}
