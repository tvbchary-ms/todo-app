import { useState } from 'react';
import { login, register, forgotPassword, ApiError, type User } from './api';

type Mode = 'login' | 'register' | 'forgot';

interface Props {
  onAuthenticated: (user: User) => void;
}

function nameFromEmail(email: string): string {
  const prefix = email.split('@')[0] ?? '';
  return prefix || 'User';
}

export function AuthForm({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
    setPassword('');
    setNewPassword('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        await forgotPassword(email.trim(), newPassword);
        setSuccess('Password reset! You can now sign in with your new password.');
        switchMode('login');
        return;
      }
      const result =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(email.trim(), password, nameFromEmail(email.trim()));
      onAuthenticated(result.user);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container auth-container">
      <div className="header">
        <h1>Tasks</h1>
        <p>{mode === 'forgot' ? 'Reset your password' : 'Sign in to manage your to-dos'}</p>
      </div>

      {mode !== 'forgot' && (
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Create account
          </button>
        </div>
      )}

      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        {mode === 'forgot' ? (
          <label className="auth-field">
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Min 4 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={4}
            />
          </label>
        ) : (
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? 'Min 8 chars, upper + lower + number' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 8 : 1}
            />
          </label>
        )}

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting
            ? 'Please wait…'
            : mode === 'login'
            ? 'Sign in'
            : mode === 'register'
            ? 'Create account'
            : 'Reset password'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            className="auth-forgot-link"
            onClick={() => switchMode('forgot')}
          >
            Forgot password?
          </button>
        )}

        {mode === 'forgot' && (
          <button
            type="button"
            className="auth-forgot-link"
            onClick={() => switchMode('login')}
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
