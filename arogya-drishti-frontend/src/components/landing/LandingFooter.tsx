'use client';

const NAV_LINKS = [
  { label: 'Admin Console',    href: '/dashboard/admin' },
  { label: 'Medical Dashboard', href: '/dashboard/doctor' },
  { label: 'Commander View',   href: '/dashboard/commander' },
  { label: 'My Health Record', href: '/dashboard/me' },
];

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative"
      style={{
        background: '#060b16',
        borderTop: '1px solid rgba(20,184,166,0.10)',
      }}
    >
      {/* Top accent line */}
      <div
        className="h-px w-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(20,184,166,0.40) 30%, rgba(6,182,212,0.40) 70%, transparent 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-10">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* Shield icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(20,184,166,0.10)',
                  border: '1px solid rgba(20,184,166,0.20)',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#14B8A6' }}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black text-white tracking-wider">AROGYA DRISHTI</p>
                <p className="text-[10px] tracking-widest" style={{ color: 'rgba(20,184,166,0.60)' }}>
                  MEDICAL INTELLIGENCE PLATFORM
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Centralised health intelligence for defence personnel.
              Secure. Real-time. Role-aware.
            </p>
          </div>

          {/* Dashboard links */}
          <div>
            <p
              className="text-[10px] font-black tracking-[0.25em] mb-3"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              DASHBOARDS
            </p>
            <ul className="space-y-2">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-xs transition-colors duration-150 hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Stack info */}
          <div>
            <p
              className="text-[10px] font-black tracking-[0.25em] mb-3"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              SYSTEM INFO
            </p>
            <div className="space-y-2">
              {[
                { label: 'Frontend',  value: 'Next.js 14 App Router' },
                { label: 'Backend',   value: 'Express 5 · :3001' },
                { label: 'Database',  value: 'PostgreSQL · Prisma 7' },
                { label: 'Auth mode', value: 'DEV_BYPASS_AUTH · Phase 5' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-baseline gap-2">
                  <span
                    className="text-[10px] font-semibold tracking-wider w-20 flex-shrink-0"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {label}
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar — classification label */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Classification label — styled like a government document header */}
          <div
            className="flex items-center gap-3 px-5 py-2 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              className="text-[10px] font-black tracking-[0.30em]"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              UNCLASSIFIED
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>//</span>
            <span
              className="text-[10px] font-black tracking-[0.20em]"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              FOR OFFICIAL DEMO USE ONLY
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>//</span>
            <span
              className="text-[10px] font-black tracking-[0.20em]"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              NOT FOR OPERATIONAL DEPLOYMENT
            </span>
          </div>

          {/* Copyright */}
          <p
            className="text-[10px] font-mono"
            style={{ color: 'rgba(255,255,255,0.20)' }}
          >
            © {year} Arogya Drishti · Build Phase 5
          </p>
        </div>
      </div>
    </footer>
  );
}
