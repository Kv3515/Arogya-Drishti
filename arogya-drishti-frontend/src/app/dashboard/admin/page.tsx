'use client';

import { useState, useEffect, FormEvent } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { StatCard } from '@/components/StatCard';
import { api, type UserInfo, type UserRole } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Users, ClipboardList, Plus, X, ChevronLeft, ChevronRight, ShieldCheck, Pencil } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'users' | 'audit'>('users');

  // Read ?tab= query param on client only (avoids Suspense requirement)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t === 'users' || t === 'audit') setTab(t);
  }, []);

  // Users
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);

  // Audit
  const [auditLogs, setAuditLogs] = useState<Record<string, unknown>[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);

  // Edit user modal
  const [editUser, setEditUser] = useState<UserInfo | null>(null);
  const [editForm, setEditForm] = useState({ username: '', newPassword: '', role: 'individual' as UserRole, is_active: true });
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);

  const openEditModal = (u: UserInfo) => {
    setEditUser(u);
    setEditForm({ username: u.username, newPassword: '', role: u.role, is_active: true });
    setEditError('');
  };

  const handleEditUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditError('');
    setEditing(true);
    try {
      const updated = await api.adminUpdateUser(editUser.id, {
        username: editForm.username !== editUser.username ? editForm.username : undefined,
        password: editForm.newPassword || undefined,
        role: editForm.role !== editUser.role ? editForm.role : undefined,
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      setEditUser(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditing(false);
    }
  };

  // Create user form
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', email: '', role: 'medical_officer' as UserRole, unitId: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
    if (!authLoading && user && user.role !== 'super_admin') router.replace('/');
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'super_admin') return;
    if (tab === 'users') {
      setUsersLoading(true);
      api.listUsers({ page: usersPage, limit: 20 })
        .then((res) => { setUsers(Array.isArray(res.data) ? res.data : []); setTotalUsers(res.pagination?.total ?? 0); })
        .catch(console.error)
        .finally(() => setUsersLoading(false));
    }
    if (tab === 'audit') {
      setAuditLoading(true);
      api.listAuditLogs({ page: auditPage, limit: 50 })
        .then((res) => setAuditLogs(Array.isArray(res.data) ? res.data as Record<string, unknown>[] : []))
        .catch(console.error)
        .finally(() => setAuditLoading(false));
    }
  }, [tab, usersPage, auditPage, authLoading, user]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.username || !createForm.password || !createForm.unitId) {
      setCreateError('Username, password and unit ID are required.');
      return;
    }
    setCreating(true);
    try {
      const newUser = await api.createUser({
        username: createForm.username,
        password: createForm.password,
        email: createForm.email || undefined,
        role: createForm.role,
        unitId: createForm.unitId,
      });
      setUsers((prev) => [newUser, ...prev]);
      setShowCreateUser(false);
      setCreateForm({ username: '', password: '', email: '', role: 'medical_officer', unitId: '' });
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const roleBadge: Record<UserRole, string> = {
    super_admin:     'bg-purple-50 text-purple-700 border border-purple-200',
    medical_officer: 'bg-teal-50 text-teal-700 border border-teal-200',
    paramedic:       'bg-cyan-50 text-cyan-700 border border-cyan-200',
    commander:       'bg-indigo-50 text-indigo-700 border border-indigo-200',
    individual:      'bg-slate-50 text-slate-600 border border-slate-200',
  };

  if (authLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <svg className="h-12 w-12 animate-spin text-brand-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9 2h6v6h6v6h-6v6H9v-6H3V8h6z" />
        </svg>
        <p className="text-sm text-gray-400 font-medium">Loading console…</p>
      </div>
    );
  }

  return (
    <>
    <DashboardShell>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-500" />
              Admin Console
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage users and review system audit logs.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={totalUsers} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Active Tab" value={tab === 'users' ? 'Users' : 'Audit Logs'} />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          {([
            { key: 'users', label: 'Users', Icon: Users },
            { key: 'audit', label: 'Audit Logs', Icon: ClipboardList },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === key
                  ? 'bg-white text-teal-700 shadow-sm ring-1 ring-teal-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${tab === key ? 'text-teal-600' : ''}`} />
              {label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">{totalUsers} users registered</p>
              <button onClick={() => setShowCreateUser(true)} className="btn-primary text-sm">
                <Plus className="h-4 w-4" />
                New User
              </button>
            </div>

            {showCreateUser && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ring-1 ring-black/[0.03]">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-brand-500" />
                    Create New User
                  </h3>
                  <button onClick={() => setShowCreateUser(false)} className="btn-ghost p-1.5">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleCreateUser}>
                  {createError && (
                    <p className="text-sm text-critical mb-3">{createError}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {[
                      { id: 'username', label: 'Username', type: 'text', required: true },
                      { id: 'password', label: 'Password', type: 'password', required: true },
                      { id: 'email', label: 'Email (optional)', type: 'email', required: false },
                      { id: 'unitId', label: 'Unit ID (UUID)', type: 'text', required: true },
                    ].map(({ id, label, type, required }) => (
                      <div key={id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                          type={type}
                          required={required}
                          value={createForm[id as keyof typeof createForm] as string}
                          onChange={(e) => setCreateForm((f) => ({ ...f, [id]: e.target.value }))}
                          className="input"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={createForm.role}
                        onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                        className="input"
                      >
                        {(['super_admin', 'medical_officer', 'paramedic', 'commander', 'individual'] as UserRole[]).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={creating} className="btn-primary">
                      {creating ? 'Creating…' : 'Create User'}
                    </button>
                    <button type="button" onClick={() => setShowCreateUser(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm ring-1 ring-black/[0.03]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-th rounded-tl-2xl">Username</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Role</th>
                    <th className="table-th rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-4 py-3.5"><div className="skeleton h-4 w-28" /></td>
                        <td className="px-4 py-3.5"><div className="skeleton h-4 w-36" /></td>
                        <td className="px-4 py-3.5"><div className="skeleton h-5 w-24 rounded-full" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">No users found.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="table-row">
                        <td className="table-td font-semibold text-gray-900">{u.username}</td>
                        <td className="table-td text-gray-400 font-mono text-xs">{u.email ?? '—'}</td>
                        <td className="table-td">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleBadge[u.role]}`}>
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="table-td">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalUsers > 20 && (
                <div className="px-4 py-3 flex items-center gap-2 border-t border-slate-50">
                  <button onClick={() => setUsersPage((p) => Math.max(1, p - 1))} disabled={usersPage === 1} className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="pagination-active rounded-lg px-3 py-1.5 text-xs">{usersPage}</span>
                  <button onClick={() => setUsersPage((p) => p + 1)} disabled={usersPage * 20 >= totalUsers} className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-slate-400 ml-1">of {Math.ceil(totalUsers / 20)} pages</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit tab */}
        {tab === 'audit' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm ring-1 ring-black/[0.03]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Timestamp</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Resource</th>
                  <th className="table-th">User</th>
                  <th className="table-th">IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-4 py-3"><div className="skeleton h-3 w-24" /></td>
                      <td className="px-4 py-3"><div className="skeleton h-3 w-16" /></td>
                      <td className="px-4 py-3"><div className="skeleton h-3 w-20" /></td>
                      <td className="px-4 py-3"><div className="skeleton h-3 w-14" /></td>
                      <td className="px-4 py-3"><div className="skeleton h-3 w-20" /></td>
                    </tr>
                  ))
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">No audit logs found.</td>
                  </tr>
                ) : (
                  auditLogs.map((log, i) => {
                    const action = String(log.action ?? '');
                    const rowTint = /DELETE|REMOVE/i.test(action) ? 'status-row-critical'
                                  : /UPDATE|EDIT|MODIFY/i.test(action) ? 'status-row-warning'
                                  : '';
                    return (
                    <tr key={i} className={`table-row text-xs ${rowTint}`}>
                      <td className="table-td font-mono text-gray-400 whitespace-nowrap">
                        {log.createdAt
                          ? new Date(log.createdAt as string).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="table-td font-semibold text-gray-800">{String(log.action ?? '—')}</td>
                      <td className="table-td text-gray-500">{String(log.resource ?? '—')}</td>
                      <td className="table-td font-mono text-gray-400">{String(log.userId ?? '—').slice(0, 8)}…</td>
                      <td className="table-td font-mono text-gray-400">{String(log.ipAddress ?? '—')}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 flex items-center gap-2 border-t border-slate-50">
              <button onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage === 1} className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="pagination-active rounded-lg px-3 py-1.5 text-xs">{auditPage}</span>
              <button onClick={() => setAuditPage((p) => p + 1)} disabled={auditLogs.length < 50} className="btn-secondary text-xs px-2.5 py-1.5 disabled:opacity-40">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>

    {/* ── Edit User Modal ─────────────────────────────────────────────── */}
    {editUser && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
            <button onClick={() => setEditUser(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleEditUser} className="space-y-4">
            {editError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{editError}</p>}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                required
                value={editForm.username}
                onChange={(e) => setEditForm(f => ({ ...f, username: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Password <span className="text-slate-300">(leave blank to keep)</span></label>
              <input
                type="password"
                value={editForm.newPassword}
                onChange={(e) => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="New password…"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              >
                {(['super_admin', 'medical_officer', 'paramedic', 'commander', 'individual'] as UserRole[]).map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditUser(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={editing} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50">
                {editing ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
