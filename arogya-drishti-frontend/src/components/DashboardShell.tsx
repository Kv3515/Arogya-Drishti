'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, type Notification, type Individual, type UserRole } from '@/lib/api';
import {
  Users, ClipboardList, HeartPulse, BarChart3, Activity,
  Bell, Search, LogOut, Menu, ChevronDown, ChevronLeft,
  ShieldCheck, Stethoscope, Target, CheckCheck, X, KeyRound,
} from 'lucide-react';
import { SystemStatus } from '@/components/ui';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: 'Users',      href: '/dashboard/admin',           icon: <Users className="h-4 w-4" /> },
    { label: 'Audit Logs', href: '/dashboard/admin?tab=audit', icon: <ClipboardList className="h-4 w-4" /> },
  ],
  medical_officer: [
    { label: 'Patients', href: '/dashboard/doctor', icon: <Users className="h-4 w-4" /> },
  ],
  paramedic: [
    { label: 'Patients', href: '/dashboard/doctor', icon: <Users className="h-4 w-4" /> },
  ],
  commander: [
    { label: 'Readiness', href: '/dashboard/commander', icon: <BarChart3 className="h-4 w-4" /> },
  ],
  individual: [
    { label: 'My Health', href: '/dashboard/me', icon: <HeartPulse className="h-4 w-4" /> },
  ],
};

// All-dashboard quick links shown in every sidebar (useful in DEV mode)
const allDashboards: NavItem[] = [
  { label: 'Admin',     href: '/dashboard/admin',     icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'Doctor',    href: '/dashboard/doctor',    icon: <Stethoscope className="h-4 w-4" /> },
  { label: 'Commander', href: '/dashboard/commander', icon: <Target className="h-4 w-4" /> },
  { label: 'My Health', href: '/dashboard/me',        icon: <Activity className="h-4 w-4" /> },
];

const pageTitles: Record<string, string> = {
  '/dashboard/admin':     'Admin Console',
  '/dashboard/doctor':    'Patient Records', 
  '/dashboard/commander': 'Operational Readiness',
  '/dashboard/me':        'My Health Record',
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tabParam, setTabParam]         = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ── Notification bell state ────────────────────────────────────────────────
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // ── Change-credentials modal ──────────────────────────────────────────────
  const [credsModalOpen, setCredsModalOpen]     = useState(false);
  const [credsForm, setCredsForm]               = useState({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
  const [credsError, setCredsError]             = useState('');
  const [credsSuccess, setCredsSuccess]         = useState(false);
  const [credsSaving, setCredsSaving]           = useState(false);

  const openCredsModal = useCallback(() => {
    setCredsForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
    setCredsError('');
    setCredsSuccess(false);
    setCredsModalOpen(true);
    setUserMenuOpen(false);
  }, []);

  const saveCredentials = useCallback(async () => {
    setCredsError('');
    if (!credsForm.currentPassword) { setCredsError('Current password is required.'); return; }
    if (credsForm.newPassword && credsForm.newPassword !== credsForm.confirmPassword) { setCredsError('New passwords do not match.'); return; }
    if (credsForm.newPassword && credsForm.newPassword.length < 8) { setCredsError('New password must be at least 8 characters.'); return; }
    if (!credsForm.newUsername && !credsForm.newPassword) { setCredsError('Enter a new username or new password.'); return; }
    setCredsSaving(true);
    try {
      await api.changeMyCredentials({
        currentPassword: credsForm.currentPassword,
        newUsername: credsForm.newUsername || undefined,
        newPassword: credsForm.newPassword || undefined,
      });
      setCredsSuccess(true);
    } catch (e: unknown) {
      setCredsError(e instanceof Error ? e.message : 'Failed to update credentials');
    } finally {
      setCredsSaving(false);
    }
  }, [credsForm]);

  // ── Global search state ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState<Individual[]>([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Read ?tab= from URL on client — avoids useSearchParams + Suspense
  useEffect(() => {
    setTabParam(new URLSearchParams(window.location.search).get('tab') ?? '');
  }, [pathname]);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounced patient search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.listIndividuals({ search: searchQuery, limit: 8 });
        setSearchResults(Array.isArray(res.data) ? res.data : []);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSelect = useCallback((patient: Individual) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    // Navigate to doctor page with patient pre-selected via query param
    router.push(`/dashboard/doctor?patient=${patient.serviceNumber}`);
  }, [router]);

  // Poll notifications every 60 s
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      api.listNotifications({ limit: 20 })
        .then(({ data, unreadCount: uc }) => { setNotifications(data); setUnreadCount(uc); })
        .catch(() => {/* non-critical */});
    };
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(id);
  }, [user]);

  if (!user) return null;

  const navItems  = roleNavItems[user.role] ?? [];
  const initials  = user.username.slice(0, 2).toUpperCase();
  const pageTitle = Object.entries(pageTitles).find(([p]) => pathname.startsWith(p))?.[1] ?? 'Dashboard';

  const isActive = (item: NavItem) => {
    if (item.href.includes('?')) {
      const [path, qs] = item.href.split('?');
      return pathname === path && tabParam === (new URLSearchParams(qs).get('tab') ?? '');
    }
    const siblingTabActive = navItems.some((n) => {
      if (!n.href.includes('?')) return false;
      const [p, qs] = n.href.split('?');
      return pathname === p && tabParam === (new URLSearchParams(qs).get('tab') ?? '');
    });
    if (siblingTabActive) return false;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  // Dark-sidebar nav links — inline classes, not subject to `.dark` prefix
  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item);
    return (
      <Link
        href={item.href}
        className={active ? 'nav-item-dark-active' : 'nav-item-dark-inactive'}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <span className={`flex-shrink-0 transition-colors duration-150 ${active ? 'text-teal-300' : 'text-slate-400'}`}>
          {item.icon}
        </span>
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {active && <span className="pulse-live" aria-hidden="true" />}
          </>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* ── Logo ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Medical cross icon */}
        <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)', boxShadow: '0 4px 12px rgba(20,184,166,0.40)' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white" aria-hidden="true">
            <path d="M8 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5v5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-5H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5V2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wide">Arogya Drishti</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2DD4BF' }}>
            Medical Intelligence
          </p>
        </div>
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="ml-auto p-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
          style={{ color: '#475569' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className="h-4 w-4 transition-transform duration-300"
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>

      {/* ECG decorative strip */}
      <div className="sidebar-ecg-border" aria-hidden="true" />

      {/* ── User card ──────────────────────────────────────── */}
      <div className="mx-3 my-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #0891B2)' }}>
            {initials}
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2"
              style={{ borderColor: '#1E293B', animation: 'breathe 3s ease-in-out infinite' }} />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.username}</p>
              <p className="text-[11px] capitalize truncate" style={{ color: '#94A3B8' }}>{user.role.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>
          Workspace
        </p>
        {navItems.map((item) => <NavLink key={item.href} item={item} />)}

        {process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' && (
          <div className="pt-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>
              All Dashboards
            </p>
            {allDashboards.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? 'nav-item-dark-active opacity-80' : 'nav-item-dark-inactive opacity-80'}
                >
                  <span className={`flex-shrink-0 ${active ? 'text-teal-300' : 'text-slate-500'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── Sign out ───────────────────────────────────────── */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm transition-all duration-150"
          style={{ color: '#64748B' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748B'; }}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
    <div className="flex h-screen bg-main overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — deep navy */}
      <aside
        style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col shadow-navy md:static md:translate-x-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header — dark navy, teal accent line */}
        <header className="px-4 lg:px-6 h-16 flex items-center gap-4 flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, #0C1526 0%, #0F172A 50%, #0C1526 100%)', borderBottom: '1px solid rgba(20,184,166,0.40)', boxShadow: '0 2px 20px rgba(0,0,0,0.40)' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg transition-colors text-white/80 hover:bg-white/15"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold hidden sm:block text-white">{pageTitle}</h1>
            <span className="live-system-badge hidden md:inline-flex">System Live</span>
          </div>

          {/* Global Patient Search */}
          <div className="flex-1 max-w-sm ml-4" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-white/60" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                placeholder="Search patients… (⌘K)"
                className="w-full rounded-full pl-10 pr-8 py-2 text-sm text-white placeholder-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/40"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.20)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Results dropdown */}
              {searchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  {searchLoading ? (
                    <div className="px-4 py-3 flex items-center gap-2 text-sm text-slate-400">
                      <div className="h-3.5 w-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      Searching…
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">No patients found for "{searchQuery}"</div>
                  ) : (
                    <>
                      <div className="px-3 py-2 border-b border-slate-50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{searchResults.length} patient{searchResults.length !== 1 ? 's' : ''} found</p>
                      </div>
                      {searchResults.map((p) => {
                        const cat = p.medicalCategory || p.fitnessStatus;
                        const catColor =
                          ['1A','1B'].includes(cat) ? 'text-emerald-600 bg-emerald-50'
                          : ['2','3'].includes(cat) ? 'text-amber-600 bg-amber-50'
                          : cat === '4' ? 'text-orange-600 bg-orange-50'
                          : 'text-red-600 bg-red-50';
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSearchSelect(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                              {p.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                              <p className="text-xs text-slate-400 truncate">{p.rank} · {p.serviceNumber}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${catColor}`}>
                              Cat {cat}
                            </span>
                          </button>
                        );
                      })}
                      <div className="px-4 py-2 border-t border-slate-50 bg-slate-50/60">
                        <p className="text-[10px] text-slate-400">Click to open patient record · Esc to close</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* ── Notification Bell ──────────────────────────────────── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-white/80 hover:bg-white/15 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className={`absolute top-1 right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${unreadCount > 0 && notifications.some(n => n.type === 'vitals_critical' && !n.isRead) ? 'bg-red-500' : 'bg-amber-400'}`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">{unreadCount} new</span>
                      )}
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          api.markAllNotificationsRead().then(() => {
                            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            setUnreadCount(0);
                          }).catch(() => {});
                        }}
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-gray-700">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) {
                              api.markNotificationRead(n.id).then(updated => {
                                setNotifications(prev => prev.map(x => x.id === n.id ? updated : x));
                                setUnreadCount(c => Math.max(0, c - 1));
                              }).catch(() => {});
                            }
                          }}
                          className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${n.type === 'vitals_critical' ? 'bg-red-500' : n.type === 'vitals_warning' ? 'bg-amber-400' : 'bg-teal-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${n.type === 'vitals_critical' ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' · '}
                                {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/15 transition-colors"
              >
                <div className="relative h-8 w-8 rounded-full flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0 bg-white">
                  {initials}
                  <span className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-teal-500"
                    style={{ animation: 'breathe 3s ease-in-out infinite' }} />
                </div>
                <span className="hidden lg:block text-sm font-semibold text-white max-w-[100px] truncate">
                  {user.username}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-white/60" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl py-1 z-50 overflow-hidden bg-white border border-slate-100">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                    <p className="text-xs text-slate-400 capitalize">{user.role.replace(/_/g, ' ')}</p>
                  </div>
                  <button
                    onClick={openCredsModal}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <KeyRound className="h-4 w-4" />
                    Change Credentials
                  </button>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-main">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>

    {/* ── Change Credentials modal ─────────────────────────────────────── */}
    {credsModalOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-teal-500" />
              Change Credentials
            </h3>
            <button onClick={() => setCredsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          {credsSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Credentials updated!</p>
              <p className="text-xs text-slate-500">Changes will take effect on your next login.</p>
              <button onClick={() => setCredsModalOpen(false)} className="mt-2 w-full rounded-xl bg-teal-500 text-white text-sm font-semibold py-2.5 hover:bg-teal-600 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {credsError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{credsError}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Password <span className="text-red-400">*</span></label>
                <input type="password" value={credsForm.currentPassword} onChange={(e) => setCredsForm(f => ({ ...f, currentPassword: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="Your current password" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Username <span className="text-slate-300">(optional)</span></label>
                <input type="text" value={credsForm.newUsername} onChange={(e) => setCredsForm(f => ({ ...f, newUsername: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder={user?.username ?? ''} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Password <span className="text-slate-300">(optional)</span></label>
                <input type="password" value={credsForm.newPassword} onChange={(e) => setCredsForm(f => ({ ...f, newPassword: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="Min 8 characters" />
              </div>
              {credsForm.newPassword && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input type="password" value={credsForm.confirmPassword} onChange={(e) => setCredsForm(f => ({ ...f, confirmPassword: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="Repeat new password" />
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setCredsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={saveCredentials} disabled={credsSaving} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50">
                  {credsSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    </>
  );
}
