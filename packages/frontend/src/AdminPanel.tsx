import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  getAdminStats,
  listAllUsers,
  updateAdminUser,
  resetUserPassword,
  deleteAdminUser,
  listAdminSessions,
  revokeAdminSession,
  listAdminAuditLogs,
  logout as apiLogout,
  ApiError,
  type AdminUser,
  type AdminSession,
  type AdminAuditLog,
  type AdminStats,
  type User,
} from './api';

// ─── Helpers ──────────────────────────────────────────────────

type Section = 'dashboard' | 'users' | 'sessions' | 'audit-logs';

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function Pager({ page, total, limit, onChange }: {
  page: number; total: number; limit: number; onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="ap-pager">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ Prev</button>
      <span>{page} / {pages} &nbsp;({total} rows)</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>Next ›</button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────

function DashboardSection({ onError }: { onError: (m: string) => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getAdminStats().then(setStats).catch((e) => onError((e as Error).message));
  }, [onError]);

  return (
    <div>
      <h2 className="ap-section-title">Dashboard</h2>
      <div className="ap-stats">
        {([
          { label: 'Total Users',       value: stats?.totalUsers     ?? '…' },
          { label: 'Active Sessions',   value: stats?.activeSessions ?? '…' },
          { label: 'Audit Events Today',value: stats?.auditToday     ?? '…' },
        ] as { label: string; value: number | string }[]).map(({ label, value }) => (
          <div key={label} className="ap-stat-card">
            <span className="ap-stat-value">{value}</span>
            <span className="ap-stat-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────

function UsersSection({ currentAdminId, onError, onFlash }: {
  currentAdminId: string; onError: (m: string) => void; onFlash: (m: string) => void;
}) {
  const [users,           setUsers]           = useState<AdminUser[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [editingId,       setEditingId]       = useState<string | null>(null);
  const [editName,        setEditName]        = useState('');
  const [editRole,        setEditRole]        = useState<'admin' | 'user'>('user');
  const [resetId,         setResetId]         = useState<string | null>(null);
  const [resetPw,         setResetPw]         = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy,            setBusy]            = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listAllUsers()
      .then(setUsers)
      .catch((e) => onError((e as Error).message))
      .finally(() => setLoading(false));
  }, [onError]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (u: AdminUser) => {
    setEditingId(u.id); setEditName(u.name); setEditRole(u.role);
    setResetId(null); setConfirmDeleteId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    setBusy(true);
    try {
      const updated = await updateAdminUser(id, { name: editName, role: editRole });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditingId(null);
      onFlash('User updated.');
    } catch (e) { onError((e as Error).message); }
    finally { setBusy(false); }
  };

  const toggleReset = (id: string) => {
    setResetId((prev) => (prev === id ? null : id));
    setResetPw(''); setEditingId(null); setConfirmDeleteId(null);
  };

  const saveReset = async (id: string) => {
    if (resetPw.length < 4) { onError('Password must be at least 4 characters'); return; }
    setBusy(true);
    try {
      await resetUserPassword(id, resetPw);
      setResetId(null); setResetPw('');
      onFlash('Password reset. All sessions for that user were invalidated.');
    } catch (e) { onError((e as Error).message); }
    finally { setBusy(false); }
  };

  const askDelete = (id: string) => {
    setConfirmDeleteId(id); setEditingId(null); setResetId(null);
  };

  const confirmDelete = async (id: string) => {
    setBusy(true);
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setConfirmDeleteId(null);
      onFlash('User deleted.');
    } catch (e) { onError((e as Error).message); }
    finally { setBusy(false); }
  };

  if (loading) return <p className="ap-empty">Loading…</p>;

  return (
    <div>
      <h2 className="ap-section-title">
        Users <span className="ap-count">{users.length}</span>
      </h2>

      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Created</th>
              <th className="ap-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isEditing  = editingId       === u.id;
              const isResetting = resetId        === u.id;
              const isDeleting = confirmDeleteId === u.id;
              const rowActive  = isEditing || isResetting || isDeleting;

              return (
                <Fragment key={u.id}>
                  {/* ── Main row ── */}
                  <tr className={rowActive ? 'ap-row-active' : ''}>
                    <td data-label="Email">{u.email}</td>

                    <td data-label="Name">
                      {isEditing
                        ? <input
                            className="ap-inline-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        : u.name}
                    </td>

                    <td data-label="Role">
                      {isEditing
                        ? <select
                            className="ap-inline-select"
                            value={editRole}
                            disabled={u.id === currentAdminId}
                            onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        : <span className={`role-pill role-${u.role}`}>{u.role}</span>}
                    </td>

                    <td data-label="Created">{fmtDate(u.createdAt)}</td>

                    <td data-label="Actions" className="ap-td-actions">
                      <div className="ap-actions">
                        {isEditing ? (
                          <>
                            <button className="ap-btn ap-btn-primary" disabled={busy} onClick={() => saveEdit(u.id)}>Save</button>
                            <button className="ap-btn" onClick={cancelEdit}>Cancel</button>
                          </>
                        ) : isDeleting ? (
                          <>
                            <button className="ap-btn ap-btn-danger" disabled={busy} onClick={() => confirmDelete(u.id)}>Confirm delete</button>
                            <button className="ap-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="ap-btn" onClick={() => startEdit(u)}>Edit</button>
                            <button className="ap-btn" onClick={() => toggleReset(u.id)}>
                              {isResetting ? 'Cancel reset' : 'Reset pw'}
                            </button>
                            {u.id !== currentAdminId && (
                              <button className="ap-btn ap-btn-danger-outline" onClick={() => askDelete(u.id)}>
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* ── Password reset expand row ── */}
                  {isResetting && (
                    <tr className="ap-row-expand">
                      <td colSpan={5} data-label="">
                        <div className="ap-expand">
                          <span className="ap-expand-label">
                            New password for <strong>{u.email}</strong>:
                          </span>
                          <input
                            className="ap-inline-input ap-expand-input"
                            type="password"
                            placeholder="min 4 chars"
                            value={resetPw}
                            onChange={(e) => setResetPw(e.target.value)}
                          />
                          <div className="ap-expand-btns">
                            <button className="ap-btn ap-btn-primary" disabled={busy} onClick={() => saveReset(u.id)}>
                              Set password
                            </button>
                            <button className="ap-btn" onClick={() => { setResetId(null); setResetPw(''); }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sessions ─────────────────────────────────────────────────

const PAGE_SIZE = 20;

function SessionsSection({ onError, onFlash }: {
  onError: (m: string) => void; onFlash: (m: string) => void;
}) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    listAdminSessions(p, PAGE_SIZE)
      .then(({ data, total: t }) => { setSessions(data); setTotal(t); })
      .catch((e) => onError((e as Error).message))
      .finally(() => setLoading(false));
  }, [onError]);

  useEffect(() => { load(page); }, [load, page]);

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await revokeAdminSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
      onFlash('Session revoked.');
    } catch (e) { onError((e as Error).message); }
    finally { setRevoking(null); }
  };

  if (loading) return <p className="ap-empty">Loading…</p>;

  return (
    <div>
      <h2 className="ap-section-title">
        Active Sessions <span className="ap-count">{total}</span>
      </h2>
      {sessions.length === 0
        ? <p className="ap-empty">No active sessions.</p>
        : (
          <>
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr><th>User</th><th>Started</th><th>Expires</th><th className="ap-th-actions"></th></tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td data-label="User">{s.userEmail}</td>
                      <td data-label="Started">{fmt(s.createdAt)}</td>
                      <td data-label="Expires">{fmt(s.expiresAt)}</td>
                      <td data-label="Actions" className="ap-td-actions">
                        <button
                          className="ap-btn ap-btn-danger-outline"
                          disabled={revoking === s.id}
                          onClick={() => revoke(s.id)}
                        >
                          {revoking === s.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={total} limit={PAGE_SIZE} onChange={(p) => { setPage(p); load(p); }} />
          </>
        )}
    </div>
  );
}

// ─── Audit Logs ───────────────────────────────────────────────

function AuditLogsSection({ onError }: { onError: (m: string) => void }) {
  const [logs,    setLogs]    = useState<AdminAuditLog[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: number) => {
    setLoading(true);
    listAdminAuditLogs(p, PAGE_SIZE)
      .then(({ data, total: t }) => { setLogs(data); setTotal(t); })
      .catch((e) => onError((e as Error).message))
      .finally(() => setLoading(false));
  }, [onError]);

  useEffect(() => { load(page); }, [load, page]);

  if (loading) return <p className="ap-empty">Loading…</p>;

  return (
    <div>
      <h2 className="ap-section-title">
        Audit Logs <span className="ap-count">{total}</span>
      </h2>
      <p className="ap-note">Todo content is redacted — only action metadata is shown.</p>
      {logs.length === 0
        ? <p className="ap-empty">No audit events yet.</p>
        : (
          <>
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td data-label="Time" style={{ whiteSpace: 'nowrap' }}>{fmt(l.createdAt)}</td>
                      <td data-label="User">{l.userEmail}</td>
                      <td data-label="Action"><span className="ap-action-pill">{l.action}</span></td>
                      <td data-label="Entity">{l.entity}</td>
                      <td data-label="Details" className="ap-meta">
                        {l.metadata
                          ? JSON.stringify(l.metadata)
                          : <span style={{ color: '#475569' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={total} limit={PAGE_SIZE} onChange={(p) => { setPage(p); load(p); }} />
          </>
        )}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────

interface Props { admin: User; onLogout: () => void; }

export function AdminPanel({ admin, onLogout }: Props) {
  const [section, setSection] = useState<Section>('dashboard');
  const [error,   setError]   = useState<string | null>(null);
  const [flash,   setFlash]   = useState<string | null>(null);

  const showFlash = (msg: string) => {
    setFlash(msg); setError(null);
    setTimeout(() => setFlash(null), 4000);
  };
  const showError = (msg: string) => { setError(msg); setFlash(null); };

  const navigate = (id: Section) => {
    setSection(id); setError(null); setFlash(null);
  };

  const handleLogout = async () => {
    try { await apiLogout(); } finally { onLogout(); }
  };

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'dashboard',  label: 'Dashboard',  icon: '◈' },
    { id: 'users',      label: 'Users',      icon: '⊙' },
    { id: 'sessions',   label: 'Sessions',   icon: '◎' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '≡' },
  ];

  return (
    <div className="ap-shell">
      {/* ── Top bar ── */}
      <header className="ap-topbar">
        <div className="ap-brand">
          <span className="ap-brand-icon">⬡</span>
          <span className="ap-brand-text">Tasks</span>
          <span className="ap-brand-badge">Admin</span>
        </div>
        <div className="ap-topbar-right">
          <span className="ap-topbar-email">{admin.email}</span>
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="ap-body">
        {/* Sidebar (desktop/tablet) + bottom bar (mobile) */}
        <nav className="ap-sidebar">
          {navItems.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`ap-nav-item ${section === id ? 'active' : ''}`}
              onClick={() => navigate(id)}
              title={label}
            >
              <span className="ap-nav-icon">{icon}</span>
              <span className="ap-nav-label">{label}</span>
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="ap-main">
          {error && (
            <div className="ap-alert ap-alert-error">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}
          {flash && (
            <div className="ap-alert ap-alert-success">
              <span>✓ {flash}</span>
            </div>
          )}

          {section === 'dashboard'  && <DashboardSection  onError={showError} />}
          {section === 'users'      && <UsersSection currentAdminId={admin.id} onError={showError} onFlash={showFlash} />}
          {section === 'sessions'   && <SessionsSection   onError={showError} onFlash={showFlash} />}
          {section === 'audit-logs' && <AuditLogsSection  onError={showError} />}
        </main>
      </div>
    </div>
  );
}
