'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
export default function Login() {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <main className="admin-login">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const data = new FormData(e.currentTarget);
          try {
            await api('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
            });
            router.replace('/admin');
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to sign in.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <a href="/" className="admin-brand">
          GR.<span>PORTFOLIO STUDIO</span>
        </a>
        <div className="login-icon">
          <LockKeyhole />
        </div>
        <h1>Welcome back.</h1>
        <p>Your work. Your story. Your control room.</p>
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <button disabled={busy} className="admin-button primary">
          {busy ? 'Signing in…' : 'Sign in to your studio'}
          <ArrowRight size={17} />
        </button>
        <span className="login-note">Secure access for the portfolio owner.</span>
      </form>
    </main>
  );
}
