import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Package,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { DraftStatus } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const statusConfig: Record<DraftStatus, { label: string; className: string; icon: ReactNode }> = {
  draft:                 { label: 'Draft',                    className: 'badge-draft',  icon: <Clock    size={10} /> },
  'needs-review':        { label: 'Needs Review',             className: 'badge-review', icon: <AlertCircle size={10} /> },
  'ready-for-human-review': { label: 'Ready for Human Review', className: 'badge-ready', icon: <CheckCircle size={10} /> },
};

export default function Dashboard() {
  const { drafts, packages } = useAppStore();
  const navigate = useNavigate();

  const recentDrafts = [...drafts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const counts = {
    total: drafts.length,
    draft: drafts.filter((d) => d.status === 'draft').length,
    review: drafts.filter((d) => d.status === 'needs-review').length,
    ready:  drafts.filter((d) => d.status === 'ready-for-human-review').length,
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Proposal Workspace</h2>
            <p className="page-subtitle">
              Convert discovery notes into professional, reviewable proposal drafts.
            </p>
          </div>
          <button
            id="create-proposal-btn"
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/proposals/new')}
          >
            <Plus aria-hidden="true" />
            Create Proposal
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {[
          { label: 'All Proposals', value: counts.total, icon: FileText, color: 'var(--accent-600)' },
          { label: 'Draft',        value: counts.draft,  icon: Clock,    color: 'var(--ink-500)' },
          { label: 'Needs Review', value: counts.review, icon: AlertCircle, color: 'var(--warning-fg)' },
          { label: 'Ready for Review', value: counts.ready, icon: CheckCircle, color: 'var(--success-fg)' },
          { label: 'Packages',     value: packages.length, icon: Package, color: 'var(--ink-700)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="card"
            style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, flexShrink: 0,
              }}
            >
              <Icon size={18} aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer Alert */}
      <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
        <Sparkles size={16} aria-hidden="true" />
        <div>
          <strong>How this works:</strong> Enter discovery notes and select a service package. The assistant generates a structured proposal draft. 
          All commercial terms, pricing, and commitments must be reviewed by an authorised team member before external use.
          <strong> "Ready for Human Review" does not authorise sending to a client.</strong>
        </div>
      </div>

      {/* Recent Drafts */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Proposals</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/proposals')}
          >
            View all <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>

        {recentDrafts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={24} aria-hidden="true" />
            </div>
            <p className="empty-state-title">No proposals yet</p>
            <p className="empty-state-desc">
              Create your first proposal draft to get started. Enter your discovery notes and select a service package.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/proposals/new')}>
              <Plus aria-hidden="true" /> Create Proposal
            </button>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
            {recentDrafts.map((draft) => {
              const s = statusConfig[draft.status];
              const unresolvedCount = draft.unresolvedItems.filter((u) => u.severity === 'high').length;
              return (
                <div
                  key={draft.id}
                  className="draft-card"
                  onClick={() => navigate(`/proposals/${draft.id}`)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open proposal: ${draft.title}`}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/proposals/${draft.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`badge ${s.className}`}>
                      {s.icon}&nbsp;{s.label}
                    </span>
                    {unresolvedCount > 0 && (
                      <span className="badge badge-danger">
                        <AlertCircle size={10} />&nbsp;{unresolvedCount} unresolved
                      </span>
                    )}
                  </div>

                  <p className="draft-card-title">{draft.title}</p>

                  <div className="draft-card-meta">
                    {draft.clientName && (
                      <>
                        <span>{draft.clientName}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>Updated {formatDate(draft.updatedAt)}</span>
                    {draft.generationMethod !== 'not-generated' && (
                      <>
                        <span>·</span>
                        <span
                          style={{
                            background: draft.generationMethod === 'ai' ? 'var(--accent-50)' : 'var(--bg-muted)',
                            color: draft.generationMethod === 'ai' ? 'var(--accent-600)' : 'var(--ink-500)',
                            padding: '1px 6px', borderRadius: 100, fontSize: 10,
                          }}
                        >
                          {draft.generationMethod === 'ai' ? 'AI' : 'Rule-based'}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="draft-card-footer">
                    <span className="text-sm text-muted truncate" style={{ maxWidth: 200 }}>
                      {draft.discoveryNotes
                        ? `${draft.discoveryNotes.slice(0, 80)}…`
                        : 'No discovery notes'}
                    </span>
                    <ArrowRight size={14} style={{ color: 'var(--ink-300)', flexShrink: 0 }} aria-hidden="true" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
