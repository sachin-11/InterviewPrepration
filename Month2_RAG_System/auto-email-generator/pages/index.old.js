import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

function extractKeys(template) {
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  const keys = new Set();
  let m;
  while ((m = re.exec(template)) !== null) keys.add(m[1]);
  return [...keys];
}

function applyTemplate(template, values) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = values[key];
    return v != null && String(v).trim() !== ''
      ? String(v)
      : `{{${key}}}`;
  });
}

function splitEmails(s) {
  return s
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Lines that will be merged into the main "Prompt" box when user clicks Build. */
function buildPromptTextFromBuilder(v) {
  const parts = [];
  if (v.pbName?.trim()) parts.push(`Recipient name: ${v.pbName.trim()}`);
  if (v.pbCompany?.trim()) parts.push(`Company: ${v.pbCompany.trim()}`);
  if (v.pbDate?.trim()) parts.push(`Date: ${v.pbDate.trim()}`);
  if (v.pbTime?.trim()) parts.push(`Time: ${v.pbTime.trim()}`);
  if (v.pbAddress?.trim()) parts.push(`Address / location: ${v.pbAddress.trim()}`);
  if (v.pbContext?.trim()) parts.push(`Context: ${v.pbContext.trim()}`);
  if (v.pbReason?.trim()) parts.push(`Reason: ${v.pbReason.trim()}`);
  if (v.pbTopic?.trim()) parts.push(`Topic: ${v.pbTopic.trim()}`);
  parts.push(
    'Write a concise, professional email using the details above. Match the subject intent.'
  );
  return parts.join('\n');
}

function isBuilderEmpty(v) {
  return ![
    v.pbName,
    v.pbCompany,
    v.pbDate,
    v.pbTime,
    v.pbAddress,
    v.pbContext,
    v.pbReason,
    v.pbTopic
  ].some((x) => x && String(x).trim());
}

const tabs = [
  { id: 'compose', label: 'Compose' },
  { id: 'history', label: 'History' },
  { id: 'templates', label: 'Templates' },
  { id: 'analytics', label: 'Analytics' }
];

export default function Home() {
  const router = useRouter();
  const [auth, setAuth] = useState({
    loading: true,
    loggedIn: false,
    openMode: false
  });

  const [tab, setTab] = useState('compose');
  const [notice, setNotice] = useState({ type: '', text: '' });

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [previewBody, setPreviewBody] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateFields, setTemplateFields] = useState({});
  const [files, setFiles] = useState(null);

  const [pbName, setPbName] = useState('');
  const [pbCompany, setPbCompany] = useState('');
  const [pbDate, setPbDate] = useState('');
  const [pbTime, setPbTime] = useState('');
  const [pbAddress, setPbAddress] = useState('');
  const [pbContext, setPbContext] = useState('');
  const [pbReason, setPbReason] = useState('');
  const [pbTopic, setPbTopic] = useState('');

  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [histQ, setHistQ] = useState('');
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');
  const [analytics, setAnalytics] = useState(null);

  const [newTpl, setNewTpl] = useState({
    slug: '',
    name: '',
    category: 'general',
    prompt_template: '',
    description: ''
  });

  const [busy, setBusy] = useState(false);

  const selectedTemplate = useMemo(() => {
    if (!templateId) return null;
    return templates.find((t) => String(t.id) === String(templateId)) || null;
  }, [templateId, templates]);

  const placeholderKeys = useMemo(() => {
    if (!selectedTemplate) return [];
    return extractKeys(selectedTemplate.prompt_template);
  }, [selectedTemplate]);

  const builderDraft = useMemo(
    () =>
      buildPromptTextFromBuilder({
        pbName,
        pbCompany,
        pbDate,
        pbTime,
        pbAddress,
        pbContext,
        pbReason,
        pbTopic
      }),
    [
      pbName,
      pbCompany,
      pbDate,
      pbTime,
      pbAddress,
      pbContext,
      pbReason,
      pbTopic
    ]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (cancelled) return;
        if (!data.loggedIn) {
          await router.replace('/login');
          return;
        }
        setAuth({
          loading: false,
          loggedIn: data.loggedIn,
          openMode: Boolean(data.openMode)
        });
      } catch {
        if (!cancelled) setAuth({ loading: false, loggedIn: false, openMode: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (auth.loading || !auth.loggedIn) return;
    if (tab !== 'templates' && tab !== 'compose') return;
    (async () => {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.success) setTemplates(data.templates || []);
      } catch {
        /* ignore */
      }
    })();
  }, [tab, auth.loading, auth.loggedIn]);

  useEffect(() => {
    if (tab === 'history' && auth.loggedIn && !auth.loading) {
      loadHistory();
    }
    if (tab === 'analytics' && auth.loggedIn && !auth.loading) {
      loadAnalytics();
    }
  }, [tab, auth.loggedIn, auth.loading]);

  async function loadHistory() {
    const params = new URLSearchParams();
    if (histQ.trim()) params.set('q', histQ.trim());
    if (histFrom) params.set('dateFrom', histFrom);
    if (histTo) params.set('dateTo', histTo);
    params.set('limit', '100');
    const res = await fetch(`/api/history?${params.toString()}`);
    const data = await res.json();
    if (data.success) setHistory(data.history || []);
    else setNotice({ type: 'err', text: data.error || 'History failed' });
  }

  async function loadAnalytics() {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    if (data.success) setAnalytics(data);
    else setNotice({ type: 'err', text: data.error || 'Analytics failed' });
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await router.replace('/login');
  }

  function buildPromptFromFields() {
    setPrompt(builderDraft);
    setPreviewBody('');
    setNotice({ type: 'ok', text: 'Prompt updated from builder fields.' });
  }

  function clearPromptBuilder() {
    setPbName('');
    setPbCompany('');
    setPbDate('');
    setPbTime('');
    setPbAddress('');
    setPbContext('');
    setPbReason('');
    setPbTopic('');
    setNotice({ type: '', text: '' });
  }

  function applySelectedTemplate() {
    if (!selectedTemplate) return;
    const merged = applyTemplate(
      selectedTemplate.prompt_template,
      templateFields
    );
    setPrompt(merged);
    setPreviewBody('');
    setNotice({ type: 'ok', text: 'Template merged into prompt. Edit as needed.' });
  }

  async function runPreview() {
    setNotice({ type: '', text: '' });
    if (!prompt.trim()) {
      setNotice({ type: 'err', text: 'Prompt is required for preview.' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/email/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        credentials: 'same-origin'
      });
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        setNotice({
          type: 'err',
          text: `Server returned non-JSON (${res.status}). Restart dev server after code changes, or check terminal logs. ${raw.slice(0, 120)}`
        });
        return;
      }
      if (!data.success) {
        setNotice({ type: 'err', text: data.error || 'Preview failed' });
        return;
      }
      setPreviewBody(data.body || '');
      setNotice({ type: 'ok', text: 'Preview generated. Review below, then send.' });
    } catch (e) {
      setNotice({ type: 'err', text: e.message || 'Preview failed' });
    } finally {
      setBusy(false);
    }
  }

  async function runSend() {
    setNotice({ type: '', text: '' });
    const toList = splitEmails(to);
    if (!toList.length) {
      setNotice({ type: 'err', text: 'At least one recipient in To is required.' });
      return;
    }
    if (!subject.trim()) {
      setNotice({ type: 'err', text: 'Subject is required.' });
      return;
    }
    const bodyToSend = previewBody.trim();
    const promptForLog = prompt.trim();
    if (!bodyToSend && !promptForLog) {
      setNotice({
        type: 'err',
        text: 'Provide a prompt or generate a preview before sending.'
      });
      return;
    }
    if (
      !window.confirm(
        bodyToSend
          ? 'Send this email now with the preview below?'
          : 'No preview — the server will generate the body again. Continue?'
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const scheduleIso = scheduleAt
        ? new Date(scheduleAt).toISOString()
        : undefined;

      const payload = {
        to: toList,
        cc: splitEmails(cc),
        bcc: splitEmails(bcc),
        subject: subject.trim(),
        prompt: promptForLog || undefined,
        body: bodyToSend || undefined,
        templateId: templateId ? Number(templateId) : undefined,
        scheduleAt: scheduleIso
      };

      const hasFiles = files && files.length > 0;
      let res;
      if (hasFiles) {
        const fd = new FormData();
        fd.append('to', toList.join(','));
        fd.append('cc', splitEmails(cc).join(','));
        fd.append('bcc', splitEmails(bcc).join(','));
        fd.append('subject', payload.subject);
        if (payload.prompt) fd.append('prompt', payload.prompt);
        if (payload.body) fd.append('body', payload.body);
        if (payload.templateId) fd.append('templateId', String(payload.templateId));
        if (scheduleIso) fd.append('scheduleAt', scheduleIso);
        for (const f of Array.from(files)) {
          fd.append('attachments', f);
        }
        res = await fetch('/api/email/send', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200));
      }
      if (res.status === 429) {
        setNotice({ type: 'err', text: data.error || 'Too many requests' });
        return;
      }
      if (!data.success) {
        setNotice({
          type: 'err',
          text: data.error || 'Send failed'
        });
        return;
      }
      if (data.scheduled) {
        setNotice({
          type: 'ok',
          text: `Scheduled for ${new Date(data.sendAt).toLocaleString()}`
        });
      } else {
        setNotice({ type: 'ok', text: 'Email sent successfully.' });
      }
      setPreviewBody('');
      setFiles(null);
    } catch (e) {
      setNotice({ type: 'err', text: e.message || 'Send failed' });
    } finally {
      setBusy(false);
    }
  }

  async function createTemplate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTpl)
      });
      const data = await res.json();
      if (!data.success) {
        setNotice({ type: 'err', text: data.error || 'Save failed' });
        return;
      }
      setTemplates((prev) => [...prev, data.template]);
      setNewTpl({
        slug: '',
        name: '',
        category: 'general',
        prompt_template: '',
        description: ''
      });
      setNotice({ type: 'ok', text: 'Template saved.' });
    } catch (err) {
      setNotice({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function deleteTemplate(id) {
    if (!window.confirm('Delete this template?')) return;
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (String(templateId) === String(id)) setTemplateId('');
    } else setNotice({ type: 'err', text: data.error || 'Delete failed' });
  }

  if (auth.loading) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui', color: '#64748b' }}>
        Loading…
      </div>
    );
  }

  if (!auth.loggedIn) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Auto Email Generator</title>
      </Head>
      <div
        style={{
          fontFamily: 'system-ui, Arial, sans-serif',
          background: '#f1f5f9',
          minHeight: '100vh',
          margin: 0
        }}
      >
        <header
          style={{
            background: '#0f172a',
            color: '#fff',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 18 }}>Auto Email Generator</div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === t.id ? '#2563eb' : '#1e293b',
                  color: '#fff',
                  fontWeight: 600
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {auth.openMode ? (
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Open mode</span>
            ) : null}
            {!auth.openMode ? (
              <button
                type="button"
                onClick={logout}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #475569',
                  background: 'transparent',
                  color: '#e2e8f0',
                  cursor: 'pointer'
                }}
              >
                Log out
              </button>
            ) : null}
          </div>
        </header>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: 22 }}>
          {notice.text ? (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 10,
                background: notice.type === 'ok' ? '#ecfdf5' : '#fef2f2',
                color: notice.type === 'ok' ? '#047857' : '#b91c1c',
                border:
                  notice.type === 'ok'
                    ? '1px solid #6ee7b7'
                    : '1px solid #fecaca'
              }}
            >
              {notice.text}
            </div>
          ) : null}

          {tab === 'compose' ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 22,
                boxShadow: '0 10px 30px rgba(15,23,42,0.08)'
              }}
            >
              <h2 style={{ marginTop: 0 }}>Compose</h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  marginBottom: 14
                }}
              >
                <Field label="To *">
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="a@x.com, b@y.com"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Subject *">
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="CC">
                  <input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="BCC">
                  <input
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="Template (optional)">
                <select
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    setTemplateFields({});
                    setPreviewBody('');
                  }}
                  style={inputStyle}
                >
                  <option value="">— None —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              </Field>

              {placeholderKeys.length ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 10,
                    marginBottom: 12
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    Template fields
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10
                    }}
                  >
                    {placeholderKeys.map((k) => (
                      <Field key={k} label={k}>
                        <input
                          value={templateFields[k] || ''}
                          onChange={(e) =>
                            setTemplateFields((prev) => ({
                              ...prev,
                              [k]: e.target.value
                            }))
                          }
                          style={inputStyle}
                        />
                      </Field>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={applySelectedTemplate}
                    style={btnSecondary}
                  >
                    Apply template to prompt
                  </button>
                </div>
              ) : null}

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#f8fafc',
                  borderRadius: 10,
                  marginBottom: 12
                }}
              >
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Prompt builder
                </div>
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: 13,
                    color: '#64748b',
                    lineHeight: 1.45
                  }}
                >
                  Fill these fields, check the <strong>live preview</strong>, then click{' '}
                  <strong>Build prompt from fields</strong> to copy into the main{' '}
                  <strong>Prompt (editable)</strong> — you can still edit there. Use a{' '}
                  <strong>Template</strong> above if you prefer.
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 10
                  }}
                >
                  <Field label="Name">
                    <input
                      value={pbName}
                      onChange={(e) => setPbName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      autoComplete="off"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Company">
                    <input
                      value={pbCompany}
                      onChange={(e) => setPbCompany(e.target.value)}
                      placeholder="e.g. Acme Pvt Ltd"
                      autoComplete="organization"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Date">
                    <input
                      type="date"
                      value={pbDate}
                      onChange={(e) => setPbDate(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Time">
                    <input
                      type="time"
                      value={pbTime}
                      onChange={(e) => setPbTime(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      value={pbAddress}
                      onChange={(e) => setPbAddress(e.target.value)}
                      placeholder="Office address or Meet link"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Context">
                    <input
                      value={pbContext}
                      onChange={(e) => setPbContext(e.target.value)}
                      placeholder="e.g. after yesterday’s call"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Reason">
                    <input
                      value={pbReason}
                      onChange={(e) => setPbReason(e.target.value)}
                      placeholder="e.g. for scheduling the interview"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Topic">
                    <input
                      value={pbTopic}
                      onChange={(e) => setPbTopic(e.target.value)}
                      placeholder="e.g. Q1 invoice payment"
                      style={inputStyle}
                    />
                  </Field>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 8,
                    border: '1px dashed #cbd5e1',
                    background: '#fff',
                    minHeight: 72
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: 6
                    }}
                  >
                    Live preview (before copying to Prompt below)
                  </div>
                  {isBuilderEmpty({
                    pbName,
                    pbCompany,
                    pbDate,
                    pbTime,
                    pbAddress,
                    pbContext,
                    pbReason,
                    pbTopic
                  }) ? (
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>
                      Fill at least one field to see a draft preview here.
                    </span>
                  ) : (
                    <pre
                      style={{
                        margin: 0,
                        fontSize: 13,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        color: '#0f172a'
                      }}
                    >
                      {builderDraft}
                    </pre>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 12
                  }}
                >
                  <button
                    type="button"
                    onClick={buildPromptFromFields}
                    style={btnSecondary}
                  >
                    Build prompt from fields
                  </button>
                  <button
                    type="button"
                    onClick={clearPromptBuilder}
                    style={{
                      ...btnSecondary,
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      color: '#334155'
                    }}
                  >
                    Clear builder
                  </button>
                </div>
              </div>

              <Field label="Prompt (editable) *">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setPreviewBody('');
                  }}
                  rows={6}
                  style={{ ...inputStyle, minHeight: 120 }}
                />
              </Field>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  marginTop: 10
                }}
              >
                <Field label="Schedule send (optional, local time)">
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Attachments">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    style={{ marginTop: 6 }}
                  />
                  <small style={{ color: '#64748b' }}>
                    Not supported for scheduled sends.
                  </small>
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={runPreview}
                  style={btnSecondary}
                >
                  {busy ? 'Working…' : 'Generate preview'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={runSend}
                  style={btnPrimary}
                >
                  {busy ? 'Working…' : 'Send email'}
                </button>
              </div>

              {previewBody ? (
                <div
                  style={{
                    marginTop: 18,
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Preview</div>
                  {previewBody}
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'history' ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 22,
                boxShadow: '0 10px 30px rgba(15,23,42,0.08)'
              }}
            >
              <h2 style={{ marginTop: 0 }}>Sent history</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr auto',
                  gap: 10,
                  marginBottom: 14,
                  alignItems: 'end'
                }}
              >
                <Field label="Search (recipient, subject, body)">
                  <input
                    value={histQ}
                    onChange={(e) => setHistQ(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="From date">
                  <input
                    type="date"
                    value={histFrom}
                    onChange={(e) => setHistFrom(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="To date">
                  <input
                    type="date"
                    value={histTo}
                    onChange={(e) => setHistTo(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <button type="button" onClick={loadHistory} style={btnPrimary}>
                  Apply filters
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={th}>Date</th>
                      <th style={th}>Status</th>
                      <th style={th}>To / CC / BCC</th>
                      <th style={th}>Subject</th>
                      <th style={th}>Body</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}>{new Date(h.sent_at).toLocaleString()}</td>
                        <td style={td}>{h.status}</td>
                        <td style={td}>
                          <div>
                            <strong>To:</strong> {h.recipients}
                          </div>
                          {h.cc ? (
                            <div>
                              <strong>CC:</strong> {h.cc}
                            </div>
                          ) : null}
                          {h.bcc ? (
                            <div>
                              <strong>BCC:</strong> {h.bcc}
                            </div>
                          ) : null}
                        </td>
                        <td style={td}>{h.subject}</td>
                        <td style={{ ...td, maxWidth: 360, whiteSpace: 'pre-wrap' }}>
                          {h.body}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!history.length ? (
                  <p style={{ color: '#64748b' }}>No rows yet.</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === 'templates' ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 22,
                boxShadow: '0 10px 30px rgba(15,23,42,0.08)'
              }}
            >
              <h2 style={{ marginTop: 0 }}>Templates</h2>
              <ul style={{ paddingLeft: 18 }}>
                {templates.map((t) => (
                  <li key={t.id} style={{ marginBottom: 10 }}>
                    <strong>{t.name}</strong> <code>{t.slug}</code> — {t.category}
                    <div style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>
                      {t.description}
                    </div>
                    <pre
                      style={{
                        background: '#f8fafc',
                        padding: 8,
                        borderRadius: 8,
                        fontSize: 12,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {t.prompt_template}
                    </pre>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(t.id)}
                      style={{ ...btnSecondary, marginTop: 6 }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>

              <h3>New template</h3>
              <form onSubmit={createTemplate}>
                <Field label="Slug (kebab-case)">
                  <input
                    value={newTpl.slug}
                    onChange={(e) =>
                      setNewTpl((p) => ({ ...p, slug: e.target.value }))
                    }
                    required
                    style={inputStyle}
                  />
                </Field>
                <Field label="Name">
                  <input
                    value={newTpl.name}
                    onChange={(e) =>
                      setNewTpl((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                    style={inputStyle}
                  />
                </Field>
                <Field label="Category">
                  <input
                    value={newTpl.category}
                    onChange={(e) =>
                      setNewTpl((p) => ({ ...p, category: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </Field>
                <Field label="Description">
                  <input
                    value={newTpl.description}
                    onChange={(e) =>
                      setNewTpl((p) => ({ ...p, description: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </Field>
                <Field label="Prompt template (use {{field}} placeholders)">
                  <textarea
                    value={newTpl.prompt_template}
                    onChange={(e) =>
                      setNewTpl((p) => ({ ...p, prompt_template: e.target.value }))
                    }
                    required
                    rows={5}
                    style={{ ...inputStyle, minHeight: 100 }}
                  />
                </Field>
                <button type="submit" disabled={busy} style={btnPrimary}>
                  Save template
                </button>
              </form>
            </div>
          ) : null}

          {tab === 'analytics' && analytics ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14
              }}
            >
              {[
                ['Total sends logged', analytics.summary.total],
                ['Successful', analytics.summary.sent],
                ['Failed', analytics.summary.failed]
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: '0 10px 30px rgba(15,23,42,0.08)'
                  }}
                >
                  <div style={{ color: '#64748b', fontSize: 13 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                    {val}
                  </div>
                </div>
              ))}
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#fff',
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.08)'
                }}
              >
                <h3 style={{ marginTop: 0 }}>Template usage</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={th}>Template</th>
                      <th style={th}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.templateUsage.map((row) => (
                      <tr key={String(row.templateId)}>
                        <td style={td}>{row.name}</td>
                        <td style={td}>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155' }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle = {
  width: '100%',
  marginTop: 6,
  padding: '10px 10px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  boxSizing: 'border-box'
};

const btnPrimary = {
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer'
};

const btnSecondary = {
  ...btnPrimary,
  background: '#e2e8f0',
  color: '#0f172a',
  marginTop: 10
};

const th = { padding: '8px 6px', color: '#64748b', fontSize: 12 };
const td = { padding: '10px 6px', verticalAlign: 'top' };
