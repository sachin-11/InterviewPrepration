import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Head from 'next/head';

const TEMPLATES = {
  interview: {
    name: 'Interview Invite',
    icon: '🎯',
    desc: 'Schedule candidate interviews',
    prompt:
      'Write a professional email inviting the candidate for an interview. Include candidate name, company name, interview date and time. Ask them to confirm attendance.'
  },
  followup: {
    name: 'Follow-up',
    icon: '🔄',
    desc: 'Follow up on pending matters',
    prompt:
      'Write a professional follow-up email. Include the reason for follow-up and what action you are requesting from the recipient.'
  },
  thankyou: {
    name: 'Thank You',
    icon: '🙏',
    desc: 'Express gratitude professionally',
    prompt:
      'Write a professional thank you email. Mention what you are thanking the person for and express your appreciation.'
  },
  reminder: {
    name: 'Reminder',
    icon: '⏰',
    desc: 'Send polite reminders',
    prompt:
      'Write a polite reminder email. Include what the reminder is about and the deadline or date if applicable.'
  }
};

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

  .seg-app { min-height: 100vh; background: #f1f5f9; }

  /* NAV */
  .seg-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #e2e8f0;
    padding: 0 24px;
    height: 60px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .seg-nav-brand {
    display: flex; align-items: center; gap: 10px;
    font-size: 17px; font-weight: 700; color: #0f172a; text-decoration: none;
  }
  .seg-nav-brand span { font-size: 22px; }
  .seg-nav-actions { display: flex; align-items: center; gap: 8px; }
  .seg-nav-user { font-size: 13px; color: #475569; font-weight: 500; }
  .seg-btn-ghost {
    padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
    color: #475569; background: transparent; border: 1px solid #e2e8f0;
    cursor: pointer; transition: all 0.15s;
  }
  .seg-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
  .seg-btn-primary-sm {
    padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
    color: #fff; background: #6366f1; border: none; cursor: pointer; transition: all 0.15s;
  }
  .seg-btn-primary-sm:hover { background: #4f46e5; }

  /* HERO */
  .seg-hero {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
    padding: 56px 24px 48px;
    text-align: center;
    color: #fff;
  }
  .seg-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3);
    border-radius: 100px; padding: 5px 14px; font-size: 12px; font-weight: 600;
    letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px;
  }
  .seg-hero h1 { font-size: clamp(28px, 5vw, 42px); font-weight: 800; line-height: 1.15; margin-bottom: 14px; }
  .seg-hero p { font-size: 16px; opacity: 0.85; max-width: 480px; margin: 0 auto; line-height: 1.6; }
  .seg-steps {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 28px; flex-wrap: wrap;
  }
  .seg-step {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.15); border-radius: 100px;
    padding: 6px 14px; font-size: 13px; font-weight: 500;
  }
  .seg-step-num {
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(255,255,255,0.3); display: flex; align-items: center;
    justify-content: center; font-size: 11px; font-weight: 700;
  }
  .seg-step-arrow { opacity: 0.5; font-size: 12px; }

  /* MAIN */
  .seg-main { max-width: 760px; margin: 0 auto; padding: 36px 20px 60px; }

  /* TEMPLATE GRID */
  .seg-section-label {
    font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    color: #94a3b8; margin-bottom: 14px;
  }
  .seg-templates { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 28px; }
  @media (min-width: 560px) { .seg-templates { grid-template-columns: repeat(4, 1fr); } }
  .seg-tpl-btn {
    padding: 16px 12px; border-radius: 12px; cursor: pointer;
    border: 2px solid #e2e8f0; background: #fff;
    text-align: center; transition: all 0.18s;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .seg-tpl-btn:hover { border-color: #a5b4fc; background: #f5f3ff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.12); }
  .seg-tpl-btn.active { border-color: #6366f1; background: #eef2ff; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
  .seg-tpl-icon { font-size: 24px; }
  .seg-tpl-name { font-size: 13px; font-weight: 700; color: #1e293b; }
  .seg-tpl-desc { font-size: 11px; color: #94a3b8; line-height: 1.3; }
  .seg-tpl-btn.active .seg-tpl-name { color: #4f46e5; }

  /* CARD */
  .seg-card {
    background: #fff; border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    overflow: hidden;
  }
  .seg-card-header {
    padding: 20px 24px 0;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .seg-card-header-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .seg-card-title { font-size: 15px; font-weight: 700; color: #0f172a; }
  .seg-card-subtitle { font-size: 12px; color: #94a3b8; margin-top: 1px; }
  .seg-card-body { padding: 24px; }

  /* FORM */
  .seg-field { margin-bottom: 18px; }
  .seg-field:last-child { margin-bottom: 0; }
  .seg-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; color: #374151;
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px;
  }
  .seg-label-req { color: #f43f5e; font-size: 14px; }
  .seg-label-opt {
    font-size: 10px; font-weight: 600; color: #94a3b8;
    background: #f1f5f9; border-radius: 4px; padding: 1px 6px;
    text-transform: uppercase; letter-spacing: 0.3px;
  }
  .seg-input, .seg-textarea {
    width: 100%; padding: 11px 14px;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 14px; color: #0f172a; background: #fafafa;
    transition: all 0.15s; outline: none;
    font-family: inherit;
  }
  .seg-input:focus, .seg-textarea:focus {
    border-color: #6366f1; background: #fff;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .seg-input::placeholder, .seg-textarea::placeholder { color: #cbd5e1; }
  .seg-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

  /* GRID 2 */
  .seg-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 500px) { .seg-grid2 { grid-template-columns: 1fr; } }

  /* ALERT */
  .seg-alert {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 14px; border-radius: 10px; font-size: 13px;
    margin-bottom: 18px; line-height: 1.5;
  }
  .seg-alert.error { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; }
  .seg-alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
  .seg-alert-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }

  /* BUTTONS */
  .seg-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
  @media (max-width: 400px) { .seg-actions { grid-template-columns: 1fr; } }
  .seg-btn {
    padding: 13px 20px; border-radius: 10px; font-size: 14px; font-weight: 700;
    border: none; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .seg-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }
  .seg-btn-generate {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.35);
  }
  .seg-btn-generate:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.45); }
  .seg-btn-send { background: #10b981; color: #fff; box-shadow: 0 2px 8px rgba(16,185,129,0.3); }
  .seg-btn-send:not(:disabled):hover { background: #059669; transform: translateY(-1px); }
  .seg-btn-sent { background: #d1fae5; color: #065f46; cursor: default; }

  /* SPINNER */
  @keyframes spin { to { transform: rotate(360deg); } }
  .seg-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }

  /* PREVIEW */
  .seg-preview { margin-top: 20px; }
  .seg-preview-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; border-bottom: 1px solid #f1f5f9;
  }
  .seg-preview-title { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  .seg-preview-badge {
    font-size: 11px; font-weight: 600; color: #6366f1;
    background: #eef2ff; border-radius: 6px; padding: 3px 8px;
  }
  .seg-preview-body {
    padding: 24px; font-size: 14px; line-height: 1.75; color: #334155;
    white-space: pre-wrap; word-wrap: break-word;
    background: #fafafa; min-height: 120px;
  }

  /* OPEN MODE BANNER */
  .seg-banner {
    background: #fffbeb; border-bottom: 1px solid #fde68a;
    padding: 10px 24px; font-size: 12px; color: #92400e;
    display: flex; align-items: center; gap: 8px; justify-content: center;
  }
`;

export default function Home() {
  const [authMe, setAuthMe] = useState(null);
  const [template, setTemplate] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [senderName, setSenderName] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [sent, setSent] = useState(false);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setAuthMe(data);
    } catch {
      setAuthMe({});
    }
  }, []);

  useEffect(() => { refreshAuth(); }, [refreshAuth]);

  const sessionActive = authMe && !authMe.openMode && authMe.loggedIn;

  const handleSignOut = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); }
    finally { await refreshAuth(); }
  };

  const handleTemplateClick = (key) => {
    setTemplate(key);
    setPreview('');
    setSent(false);
    setMessage(null);
  };

  const buildPrompt = () => {
    const tpl = TEMPLATES[template];
    let p = tpl.prompt;
    if (quickNote.trim()) p += `\n\nAdditional details: ${quickNote}`;
    if (senderName.trim()) p += `\n\nSender name for signature: ${senderName.trim()}`;
    return p;
  };

  const handleGenerate = async () => {
    if (!template) return setMessage({ type: 'error', text: 'Please select a template first.' });
    if (!to.trim()) return setMessage({ type: 'error', text: 'Recipient email is required.' });
    if (!subject.trim()) return setMessage({ type: 'error', text: 'Subject line is required.' });
    if (!senderName.trim()) return setMessage({ type: 'error', text: 'Your name is required for the signature.' });

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/email/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt() })
      });
      const data = await res.json();
      if (data.success) {
        setPreview(data.body || '');
        setMessage({ type: 'success', text: 'Email generated! Review below and send when ready.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Generation failed. Please try again.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!preview.trim()) return setMessage({ type: 'error', text: 'Generate the email first.' });
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: [to.trim()], subject: subject.trim(), body: preview.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setMessage({ type: 'success', text: `Email successfully sent to ${to}` });
        setTimeout(() => {
          setTo(''); setSubject(''); setSenderName('');
          setQuickNote(''); setPreview(''); setSent(false); setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send. Please try again.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = !loading && template && to && subject && senderName;
  const canSend = !loading && preview && !sent;

  return (
    <>
      <Head>
        <title>Smart Email Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style>{css}</style>

      <div className="seg-app">
        {/* Open mode banner */}
        {authMe?.openMode && (
          <div className="seg-banner">
            <span>⚠️</span>
            <span>App is running in open mode. Add <code>APP_PASSWORD</code> or <code>DATABASE_URL</code> to require sign-in.</span>
          </div>
        )}

        {/* Navbar */}
        <nav className="seg-nav">
          <a href="/" className="seg-nav-brand">
            <span>✉️</span> Smart Email
          </a>
          <div className="seg-nav-actions">
            {sessionActive ? (
              <>
                <span className="seg-nav-user">
                  {authMe.user?.email || authMe.user?.name || 'Account'}
                </span>
                <button className="seg-btn-ghost" onClick={handleSignOut}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="seg-btn-ghost">Sign in</Link>
                <Link href="/register" className="seg-btn-primary-sm">Register</Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="seg-hero">
          <div className="seg-hero-badge">✨ AI-Powered</div>
          <h1>Smart Email Generator</h1>
          <p>Generate professional emails in seconds using AI. Pick a template, fill in the details, and send.</p>
          <div className="seg-steps">
            <div className="seg-step"><div className="seg-step-num">1</div> Choose Template</div>
            <div className="seg-step-arrow">→</div>
            <div className="seg-step"><div className="seg-step-num">2</div> Fill Details</div>
            <div className="seg-step-arrow">→</div>
            <div className="seg-step"><div className="seg-step-num">3</div> Generate & Send</div>
          </div>
        </div>

        {/* Main content */}
        <main className="seg-main">
          {/* Template picker */}
          <div className="seg-section-label">Choose a template</div>
          <div className="seg-templates">
            {Object.entries(TEMPLATES).map(([key, tpl]) => (
              <button
                key={key}
                className={`seg-tpl-btn${template === key ? ' active' : ''}`}
                onClick={() => handleTemplateClick(key)}
              >
                <span className="seg-tpl-icon">{tpl.icon}</span>
                <span className="seg-tpl-name">{tpl.name}</span>
                <span className="seg-tpl-desc">{tpl.desc}</span>
              </button>
            ))}
          </div>

          {/* Form card */}
          {template && (
            <div className="seg-card">
              <div className="seg-card-header">
                <div className="seg-card-header-icon">{TEMPLATES[template].icon}</div>
                <div>
                  <div className="seg-card-title">{TEMPLATES[template].name}</div>
                  <div className="seg-card-subtitle">{TEMPLATES[template].desc}</div>
                </div>
              </div>
              <div className="seg-card-body">
                <div className="seg-grid2">
                  <div className="seg-field">
                    <label className="seg-label">
                      To (Email) <span className="seg-label-req">*</span>
                    </label>
                    <input
                      className="seg-input"
                      type="email"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="seg-field">
                    <label className="seg-label">
                      Subject <span className="seg-label-req">*</span>
                    </label>
                    <input
                      className="seg-input"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Interview Invitation"
                    />
                  </div>
                </div>

                <div className="seg-field">
                  <label className="seg-label">
                    Your Name <span className="seg-label-req">*</span>
                  </label>
                  <input
                    className="seg-input"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g., Rajesh Singh"
                  />
                </div>

                <div className="seg-field">
                  <label className="seg-label">
                    Quick Note <span className="seg-label-opt">Optional</span>
                  </label>
                  <textarea
                    className="seg-textarea"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="e.g., Name: Sachin, Company: Moontechlabs, Date: 13-04-2026, Time: 10AM"
                    rows={3}
                  />
                </div>

                {message && (
                  <div className={`seg-alert ${message.type}`}>
                    <span className="seg-alert-icon">
                      {message.type === 'error' ? '⚠️' : '✅'}
                    </span>
                    {message.text}
                  </div>
                )}

                <div className="seg-actions">
                  <button
                    className="seg-btn seg-btn-generate"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                  >
                    {loading && !sent ? (
                      <><div className="seg-spinner" /> Generating…</>
                    ) : (
                      <><span>⚡</span> Generate Preview</>
                    )}
                  </button>
                  <button
                    className={`seg-btn ${sent ? 'seg-btn-sent' : 'seg-btn-send'}`}
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    {sent ? <><span>✓</span> Sent!</> : loading ? (
                      <><div className="seg-spinner" style={{ borderTopColor: '#fff' }} /> Sending…</>
                    ) : (
                      <><span>📤</span> Send Email</>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview */}
              {preview && (
                <div className="seg-preview">
                  <div className="seg-preview-header">
                    <span className="seg-preview-title">Email Preview</span>
                    <span className="seg-preview-badge">AI Generated</span>
                  </div>
                  <div className="seg-preview-body">{preview}</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
