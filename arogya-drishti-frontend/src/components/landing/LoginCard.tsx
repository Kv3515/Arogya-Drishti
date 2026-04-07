'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_CREDS = [
  { role: 'Admin',           username: 'admin',              password: 'Admin@12345678', color: '#F59E0B' },
  { role: 'Medical Officer', username: 'dr.sharma',          password: 'Admin@12345678', color: '#14B8A6' },
  { role: 'Commander',       username: 'col.verma',          password: 'Admin@12345678', color: '#8B5CF6' },
  { role: 'Individual',      username: 'ind.svc-10001',      password: 'Admin@12345678', color: '#22C55E' },
];

export default function LoginCard() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setDemoOpen(false);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      // onLoginSuccess will be called by parent watching AuthContext user state
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative w-full max-w-sm"
      style={{ animation: 'slideInFromBottom 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}
    >
      {/* Glow ring behind card */}
      <div
        className="absolute -inset-px rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(20,184,166,0.35) 0%, rgba(6,182,212,0.20) 50%, rgba(20,184,166,0.10) 100%)',
          filter: 'blur(1px)',
          animation: 'borderGlow 3s ease-in-out infinite',
        }}
      />

      {/* Card body */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(10, 15, 30, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(20,184,166,0.22)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Top accent stripe */}
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #14B8A6, #06B6D4, transparent)' }}
        />

        <div className="px-8 pt-7 pb-8">
          {/* Header */}
          <div className="mb-6">
            <p
              className="text-[10px] font-bold tracking-[0.25em] mb-1"
              style={{ color: '#14B8A6' }}
            >
              SECURE ACCESS
            </p>
            <h2 className="text-xl font-bold text-white">Sign in to System</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Use your assigned credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-3 py-2.5 text-xs"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.30)',
                  color: '#FCA5A5',
                }}
              >
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label
                htmlFor="landing-username"
                className="block text-xs font-semibold mb-1.5 tracking-wide"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                USERNAME
              </label>
              <input
                id="landing-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="block w-full rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(20,184,166,0.60)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.10)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="landing-password"
                className="block text-xs font-semibold mb-1.5 tracking-wide"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="landing-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(20,184,166,0.60)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.10)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full rounded-lg py-3 text-sm font-bold text-white tracking-wider transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden mt-2"
              style={{
                background: 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)',
                animation: 'glowPulse 3s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(20,184,166,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AUTHENTICATING…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  SIGN IN
                </span>
              )}
            </button>
          </form>

          {/* Demo credentials reveal */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setDemoOpen(!demoOpen)}
              className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest transition-opacity hover:opacity-80"
              style={{ color: 'rgba(20,184,166,0.65)' }}
            >
              <svg className={`w-3 h-3 transition-transform duration-200 ${demoOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              DEMO CREDENTIALS
            </button>

            {demoOpen && (
              <div
                className="mt-2.5 rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(20,184,166,0.05)',
                  border: '1px solid rgba(20,184,166,0.15)',
                  animation: 'fadeInUp 0.2s ease-out both',
                }}
              >
                {DEMO_CREDS.map(({ role, username: u, password: p, color }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => fillDemo(u, p)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all duration-150 hover:bg-white/5"
                  >
                    <span
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-semibold" style={{ color, minWidth: '7rem' }}>
                      {role}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      {u}
                    </span>
                  </button>
                ))}
                <div
                  className="px-3.5 py-2 text-[10px]"
                  style={{
                    color: 'rgba(255,255,255,0.30)',
                    borderTop: '1px solid rgba(20,184,166,0.10)',
                  }}
                >
                  All demo accounts share password: Admin@12345678
                </div>
              </div>
            )}
          </div>

          {/* Security notice */}
          <p
            className="mt-5 text-center text-[10px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            All sessions are logged and monitored.
            <br />Unauthorised access is a criminal offence — IT Act 2000.
          </p>
        </div>
      </div>
    </div>
  );
}
