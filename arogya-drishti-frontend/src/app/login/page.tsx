'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect in effect, not during render.
  // `router` is intentionally excluded from deps: it is stable by design in
  // Next.js App Router but including it causes the effect to re-fire on every
  // render in React 18 concurrent/strict mode, which produces >100
  // history.replaceState calls per 10 s and a SecurityError in Safari/WebKit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      // Redirect is handled by the useEffect watching `user` below — safe for React 18 concurrent mode
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 flex-col items-center justify-center p-12 text-white">
        <div className="mb-8">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336 .75 .75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0a2.25 2.25 0 00-1.974 2.192v13.5A2.25 2.25 0 008.25 19.5H6a2.25 2.25 0 01-2.25-2.25V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.123-.08M12 3.75H8.25A2.25 2.25 0 006 6v13.5A2.25 2.25 0 008.25 21.75h7.5A2.25 2.25 0 0018 19.5V6a2.25 2.25 0 00-2.25-2.25H12V3.75z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Arogya Drishti</h1>
          <p className="mt-2 text-brand-100 text-sm">
            Military Medical Intelligence Platform
          </p>
        </div>
        <ul className="space-y-3 text-sm text-brand-200 max-w-xs">
          {[
            'Real-time operational readiness intelligence',
            'Secure digital medical identity for 300,000+ personnel',
            'Role-based access — HIPAA-equivalent safeguards',
            'Offline-capable with automatic sync',
          ].map((text) => (
            <li key={text} className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-fit" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {text}
            </li>
          ))}
        </ul>
        <p className="mt-12 text-xs text-brand-300">
          CLASSIFIED — Authorised Personnel Only
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="h-12 w-12 rounded-xl bg-brand-700 flex items-center justify-center mb-3">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336 .75 .75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0a2.25 2.25 0 00-1.974 2.192v13.5A2.25 2.25 0 008.25 19.5H6a2.25 2.25 0 01-2.25-2.25V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.123-.08M12 3.75H8.25A2.25 2.25 0 006 6v13.5A2.25 2.25 0 008.25 21.75h7.5A2.25 2.25 0 0018 19.5V6a2.25 2.25 0 00-2.25-2.25H12V3.75z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Arogya Drishti</h1>
          </div>

          <h2 className="text-2xl font-semibold mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-8">
            Use your assigned credentials to access the system.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-critical-light border border-critical/30 px-4 py-3 text-sm text-critical-dark">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="e.g. dr.sharma"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Unauthorised access is a criminal offence under IT Act 2000.
            <br />All sessions are logged and monitored.
          </p>

          {/* Credential reference */}
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Username format by role</p>
            <div className="space-y-2">
              {[
                { role: 'Medical Officer / Paramedic', fmt: 'dr.surname  or  medic.surname', color: 'bg-blue-100 text-blue-700' },
                { role: 'Commander', fmt: 'col.surname', color: 'bg-violet-100 text-violet-700' },
                { role: 'Individual', fmt: 'ind.svc-XXXXX', color: 'bg-teal-100 text-teal-700' },
                { role: 'Admin', fmt: 'admin', color: 'bg-amber-100 text-amber-700' },
              ].map(({ role, fmt, color }) => (
                <div key={role} className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${color}`}>{role}</span>
                  <span className="text-xs text-slate-500 font-mono">{fmt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
