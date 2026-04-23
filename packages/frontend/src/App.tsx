import { useEffect, useState } from 'react';
import './index.css';
import {
  listTodos,
  createTodo,
  setTodoStatus,
  deleteTodo,
  getStoredToken,
  me,
  logout as apiLogout,
  changePassword,
  ApiError,
  type BackendTodo,
  type User,
} from './api';
import { AuthForm } from './AuthForm';
import { AdminPanel } from './AdminPanel';

type AuthState =
  | { kind: 'loading' }
  | { kind: 'anonymous' }
  | { kind: 'authenticated'; user: User };

function App() {
  const [auth, setAuth] = useState<AuthState>(() =>
    getStoredToken() ? { kind: 'loading' } : { kind: 'anonymous' }
  );

  useEffect(() => {
    if (auth.kind !== 'loading') return;
    let cancelled = false;
    me()
      .then((user) => {
        if (!cancelled) setAuth({ kind: 'authenticated', user });
      })
      .catch(() => {
        if (!cancelled) setAuth({ kind: 'anonymous' });
      });
    return () => {
      cancelled = true;
    };
  }, [auth.kind]);

  if (auth.kind === 'loading') {
    return (
      <div className="app-container">
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading…</p>
      </div>
    );
  }

  if (auth.kind === 'anonymous') {
    return (
      <AuthForm
        onAuthenticated={(user) => setAuth({ kind: 'authenticated', user })}
      />
    );
  }

  if (auth.user.role === 'admin') {
    return (
      <AdminPanel
        admin={auth.user}
        onLogout={() => setAuth({ kind: 'anonymous' })}
      />
    );
  }

  return (
    <TodoApp
      user={auth.user}
      onLogout={() => setAuth({ kind: 'anonymous' })}
    />
  );
}

interface TodoAppProps {
  user: User;
  onLogout: () => void;
}

function TodoApp({ user, onLogout }: TodoAppProps) {
  const [todos, setTodos] = useState<BackendTodo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listTodos()
      .then((data) => {
        if (!cancelled) setTodos(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          onLogout();
        } else {
          setError((err as Error).message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  const handleApiError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      onLogout();
      return;
    }
    setError((err as Error).message);
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;
    try {
      const created = await createTodo(title);
      setTodos((prev) => [created, ...prev]);
      setInputValue('');
    } catch (err) {
      handleApiError(err);
    }
  };

  const toggleTodo = async (id: string) => {
    const current = todos.find((t) => t.id === id);
    if (!current) return;
    const nextStatus = current.status === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await setTodoStatus(id, nextStatus);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      handleApiError(err);
    }
  };

  const removeTodo = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } finally {
      onLogout();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);
    setPwdSubmitting(true);
    try {
      await changePassword(currentPwd, newPwd);
      setPwdSuccess('Password updated.');
      setCurrentPwd('');
      setNewPwd('');
    } catch (err) {
      if (err instanceof ApiError) setPwdError(err.message);
      else setPwdError((err as Error).message);
    } finally {
      setPwdSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Tasks</h1>
        <div className="user-bar">
          <span className="user-email">{user.email}</span>
          <button
            type="button"
            className="logout-btn"
            onClick={() => { setShowChangePwd((v) => !v); setPwdError(null); setPwdSuccess(null); }}
          >
            {showChangePwd ? 'Cancel' : 'Change password'}
          </button>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>

      {showChangePwd && (
        <form className="change-pwd-form" onSubmit={handleChangePassword}>
          <input
            type="password"
            placeholder="Current password"
            autoComplete="current-password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New password (min 4)"
            autoComplete="new-password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
            minLength={4}
          />
          <button type="submit" disabled={pwdSubmitting}>
            {pwdSubmitting ? 'Saving…' : 'Update'}
          </button>
          {pwdError && <span className="pwd-msg pwd-err">{pwdError}</span>}
          {pwdSuccess && <span className="pwd-msg pwd-ok">{pwdSuccess}</span>}
        </form>
      )}

      <form className="input-group" onSubmit={addTodo}>
        <input
          type="text"
          placeholder="What needs to be done?"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </form>

      {error && (
        <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem' }}>
          {error}
        </p>
      )}

      <ul className="todo-list">
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
            Loading…
          </p>
        ) : todos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
            All caught up! Add a task to get started.
          </p>
        ) : (
          todos.map((todo) => {
            const completed = todo.status === 'completed';
            return (
              <li key={todo.id} className={`todo-item ${completed ? 'completed' : ''}`}>
                <div className="todo-content" onClick={() => toggleTodo(todo.id)}>
                  <div className={`todo-checkbox ${completed ? 'completed' : ''}`}>
                    {completed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="todo-text">{todo.title}</span>
                </div>
                <button className="delete-btn" onClick={() => removeTodo(todo.id)} title="Delete task">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export default App;
