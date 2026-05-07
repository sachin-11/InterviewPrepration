import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [supportsRegistration, setSupportsRegistration] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.openMode && data.loggedIn) {
          await router.replace('/');
          return;
        }
        setSupportsRegistration(Boolean(data.supportsRegistration));
      } catch {
        setSupportsRegistration(false);
      } finally {
        setReady(true);
      }
    })();
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Registration failed');
        return;
      }
      await router.replace('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const shell = (children) => (
    <>
      <Head>
        <title>Register · Auto Email Generator</title>
      </Head>
      <div
        style={{
          fontFamily: 'system-ui, Arial, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          padding: 24
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#fff',
            borderRadius: 12,
            padding: 28,
            boxShadow: '0 25px 50px rgba(0,0,0,0.35)'
          }}
        >
          {children}
        </div>
      </div>
    </>
  );

  if (!ready) {
    return shell(
      <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Loading…</p>
    );
  }

  if (!supportsRegistration) {
    return shell(
      <>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, color: '#0f172a' }}>
          Registration unavailable
        </h1>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14 }}>
          Set <code>DATABASE_URL</code> and restart the app to enable accounts.
          You can still use shared <code>APP_PASSWORD</code> login if configured.
        </p>
        <Link
          href="/login"
          style={{ color: '#2563eb', fontWeight: 600, fontSize: 14 }}
        >
          ← Back to sign in
        </Link>
      </>
    );
  }

  return shell(
    <>
      <h1 style={{ margin: '0 0 8px', fontSize: 22, color: '#0f172a' }}>
        Create account
      </h1>
      <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
      <form onSubmit={submit}>
        <label
          htmlFor="name"
          style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          autoComplete="name"
          style={{
            width: '100%',
            marginTop: 6,
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 15,
            boxSizing: 'border-box'
          }}
        />
        <label
          htmlFor="email"
          style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{
            width: '100%',
            marginTop: 6,
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 15,
            boxSizing: 'border-box'
          }}
        />
        <label
          htmlFor="pw"
          style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}
        >
          Password
        </label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          style={{
            width: '100%',
            marginTop: 6,
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 15,
            boxSizing: 'border-box'
          }}
        />
        <label
          htmlFor="pw2"
          style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}
        >
          Confirm password
        </label>
        <input
          id="pw2"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          style={{
            width: '100%',
            marginTop: 6,
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 15,
            boxSizing: 'border-box'
          }}
        />
        {error ? (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 10px',
              borderRadius: 8,
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 14
            }}
          >
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 8,
            border: 'none',
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 15
          }}
        >
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
    </>
  );
}
