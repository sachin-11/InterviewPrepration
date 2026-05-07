import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        // openMode reports loggedIn:true without a real session — still show this page
        if (!data.openMode && data.loggedIn) await router.replace('/');
        setAuthInfo({
          supportsRegistration: Boolean(data.supportsRegistration),
          authMode: data.authMode || 'password'
        });
      } catch {
        setAuthInfo({ supportsRegistration: false, authMode: 'password' });
      }
    })();
  }, [router]);

  const showEmailField =
    authInfo &&
    (authInfo.supportsRegistration || authInfo.authMode === 'users');

  if (!authInfo) {
    return (
      <>
        <Head>
          <title>Login · Auto Email Generator</title>
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
              background: '#fff',
              borderRadius: 12,
              padding: 28,
              color: '#64748b',
              fontSize: 14
            }}
          >
            Loading…
          </div>
        </div>
      </>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: showEmailField ? email.trim() : '',
          password
        })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Login failed');
        return;
      }
      await router.replace('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login · Auto Email Generator</title>
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
          <h1 style={{ margin: '0 0 8px', fontSize: 22, color: '#0f172a' }}>
            Sign in
          </h1>
          {showEmailField ? (
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
              Use your account email and password.{' '}
              {authInfo?.authMode === 'password' ? (
                <>
                  Or leave email empty and use the shared{' '}
                  <code>APP_PASSWORD</code>.
                </>
              ) : null}
            </p>
          ) : (
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
              Enter the app password configured in <code>APP_PASSWORD</code>.
            </p>
          )}
          {authInfo?.supportsRegistration ? (
            <p style={{ margin: '0 0 16px', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>New here? </span>
              <Link href="/register" style={{ color: '#2563eb', fontWeight: 600 }}>
                Create an account
              </Link>
            </p>
          ) : null}
          <form onSubmit={submit}>
            {showEmailField ? (
              <>
                <label
                  htmlFor="email"
                  style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}
                >
                  Email {authInfo?.authMode === 'password' ? '(optional)' : ''}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
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
              </>
            ) : null}
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
              autoComplete="current-password"
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
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
