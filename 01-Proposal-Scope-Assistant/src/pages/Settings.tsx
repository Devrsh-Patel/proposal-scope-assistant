import { useState, type FormEvent } from 'react';
import { Key, AlertTriangle, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Settings() {
  const { aiApiKey, aiBaseUrl, aiModel, setAiConfig, clearAiConfig, addNotification } = useAppStore();

  const [key, setKey] = useState(aiApiKey);
  const [baseUrl, setBaseUrl] = useState(aiBaseUrl);
  const [model, setModel] = useState(aiModel);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setAiConfig(key.trim(), baseUrl.trim() || 'https://api.openai.com/v1', model.trim() || 'gpt-4o-mini');
    setSaved(true);
    addNotification({ type: 'success', message: 'AI configuration saved (session only — not persisted).', autoDismissMs: 4000 });
    setTimeout(() => setSaved(false), 3000);
  }

  function handleClear() {
    setKey(''); setBaseUrl('https://api.openai.com/v1'); setModel('gpt-4o-mini');
    clearAiConfig();
    addNotification({ type: 'info', message: 'AI configuration cleared.', autoDismissMs: 3000 });
  }

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Configure the AI integration and review privacy limitations.</p>
      </div>

      {/* AI Config Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Key size={15} style={{ marginRight: 8 }} aria-hidden="true" />
            AI Configuration
          </h3>
        </div>
        <div className="card-body">
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
            <Info size={14} aria-hidden="true" />
            <div>
              <strong>AI is optional.</strong> Without configuration, proposals are generated using rule-based logic.
              AI-assisted drafting uses an OpenAI-compatible API. Your API key is stored <strong>in-memory only</strong> for
              this session — it is never written to localStorage, cookies, or any persistent storage.
            </div>
          </div>

          <form onSubmit={handleSave} noValidate aria-label="AI configuration form">
            <div className="form-group">
              <label htmlFor="ai-key" className="form-label">
                API Key <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>(session only — never persisted)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="ai-key"
                  type={showKey ? 'text' : 'password'}
                  className="form-input"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-…"
                  autoComplete="off"
                  aria-describedby="key-hint"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                </button>
              </div>
              <p id="key-hint" className="form-hint">
                Keep API keys in environment variables in production. See <code>.env.example</code>.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="ai-base-url" className="form-label">API Base URL</label>
              <input
                id="ai-base-url"
                type="url"
                className="form-input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
              <p className="form-hint">Change this for OpenAI-compatible providers (e.g. Ollama, Azure OpenAI, Groq).</p>
            </div>

            <div className="form-group">
              <label htmlFor="ai-model" className="form-label">Model</label>
              <input
                id="ai-model"
                type="text"
                className="form-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
              />
              <p className="form-hint">Use any model ID supported by the configured API endpoint.</p>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary" id="save-ai-config-btn">
                {saved ? <><CheckCircle size={14} aria-hidden="true" /> Saved</> : 'Save Configuration'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClear}>
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Privacy & Limitations */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 className="card-title">Privacy &amp; Data Storage</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertTriangle size={14} aria-hidden="true" />
            <strong>Local storage limitation:</strong> Proposal drafts and packages are stored in your browser's localStorage.
            This data is not encrypted, not shared, and is lost if you clear browser data.
            Do not store highly sensitive client data in this tool without understanding this limitation.
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-3)', fontSize: 13 }}>
            {[
              { label: 'Draft storage', value: 'Browser localStorage (local only, not synced)' },
              { label: 'API key storage', value: 'In-memory session only — never persisted' },
              { label: 'AI requests', value: 'Sent to the configured API endpoint when AI is active' },
              { label: 'Logging', value: 'No sensitive data is logged by this application' },
              { label: 'Authentication', value: 'None in this version — all data is local' },
            ].map(({ label, value }) => (
              <div key={label} className="flex" style={{ borderBottom: '1px solid var(--bg-muted)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ fontWeight: 500, color: 'var(--ink-700)', width: 180, flexShrink: 0 }}>{label}</span>
                <span style={{ color: 'var(--ink-500)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsible AI */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Responsible AI Safeguards</h3>
        </div>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--ink-700)', display: 'grid', gap: 'var(--space-3)' }}>
          {[
            'Prices are never invented — missing pricing is always marked as "not provided".',
            'Client identity, dates, and contract terms are never fabricated.',
            'All AI-generated content is clearly labelled as suggested wording requiring review.',
            'Discovery notes are treated as content, not instructions — prompt-injection attempts are flagged and documented.',
            'AI output is validated against a schema before rendering.',
            'Malformed, timeout, or unavailable AI responses fall back to rule-based drafting with clear notification.',
            '"Ready for Human Review" status does not authorise sending a proposal to a client.',
            'Exports always include draft labels and unresolved markers.',
          ].map((rule, i) => (
            <div key={i} className="flex gap-3 items-center">
              <CheckCircle size={14} style={{ color: 'var(--success-fg)', flexShrink: 0 }} aria-hidden="true" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
