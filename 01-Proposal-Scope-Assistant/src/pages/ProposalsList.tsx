import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, AlertCircle, CheckCircle, Trash2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { DraftStatus } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusConfig: Record<DraftStatus, { label: string; cls: string }> = {
  draft:                    { label: 'Draft',                    cls: 'badge-draft'  },
  'needs-review':           { label: 'Needs Review',             cls: 'badge-review' },
  'ready-for-human-review': { label: 'Ready for Human Review',   cls: 'badge-ready'  },
};

export default function ProposalsList() {
  const navigate = useNavigate();
  const { drafts, deleteDraft, addNotification } = useAppStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<DraftStatus | ''>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = drafts
    .filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        (d.clientName ?? '').toLowerCase().includes(q) ||
        d.projectLabel.toLowerCase().includes(q);
      const matchesStatus = !filterStatus || d.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  function handleDelete(id: string) {
    deleteDraft(id);
    setDeleteConfirmId(null);
    addNotification({ type: 'info', message: 'Proposal deleted.', autoDismissMs: 3000 });
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Proposals</h2>
            <p className="page-subtitle">{drafts.length} proposal{drafts.length !== 1 ? 's' : ''} in your workspace.</p>
          </div>
          <button
            id="new-proposal-btn"
            className="btn btn-primary"
            onClick={() => navigate('/proposals/new')}
          >
            <Plus size={14} aria-hidden="true" /> New Proposal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search
            size={14}
            aria-hidden="true"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }}
          />
          <input
            id="proposals-search"
            type="search"
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search proposals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search proposals"
          />
        </div>
        <select
          className="form-select"
          style={{ width: 200 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as DraftStatus | '')}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="needs-review">Needs Review</option>
          <option value="ready-for-human-review">Ready for Human Review</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={24} aria-hidden="true" /></div>
            <p className="empty-state-title">{search || filterStatus ? 'No results' : 'No proposals yet'}</p>
            <p className="empty-state-desc">
              {search || filterStatus
                ? 'Try adjusting your search or filter.'
                : 'Create a proposal to get started.'}
            </p>
            {!search && !filterStatus && (
              <button className="btn btn-primary" onClick={() => navigate('/proposals/new')}>
                <Plus aria-hidden="true" /> Create Proposal
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table aria-label="Proposals list">
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Status</th>
                <th>Method</th>
                <th>Updated</th>
                <th>Unresolved</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((draft) => {
                const s = statusConfig[draft.status];
                const highCount = draft.unresolvedItems.filter((u) => u.severity === 'high').length;
                return (
                  <tr
                    key={draft.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/proposals/${draft.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/proposals/${draft.id}`)}
                    tabIndex={0}
                    role="row"
                    aria-label={`Open ${draft.title}`}
                  >
                    <td>
                      <p style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{draft.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--ink-500)' }}>{draft.projectLabel}</p>
                    </td>
                    <td style={{ color: 'var(--ink-500)' }}>{draft.clientName || '—'}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td>
                      <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>
                        {draft.generationMethod === 'not-generated' ? '—'
                          : draft.generationMethod === 'ai' ? 'AI'
                          : 'Rule-based'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
                      {formatDate(draft.updatedAt)}
                    </td>
                    <td>
                      {highCount > 0
                        ? <span className="badge badge-danger"><AlertCircle size={10} /> {highCount} high</span>
                        : draft.unresolvedItems.length > 0
                        ? <span className="badge badge-warning">{draft.unresolvedItems.length}</span>
                        : <span className="badge badge-success"><CheckCircle size={10} /> Clear</span>
                      }
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/proposals/${draft.id}`)}
                          aria-label={`Open ${draft.title}`}
                        >
                          <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        {deleteConfirmId === draft.id ? (
                          <>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(draft.id)}
                              aria-label="Confirm delete"
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDeleteConfirmId(draft.id)}
                            aria-label={`Delete ${draft.title}`}
                          >
                            <Trash2 size={13} style={{ color: 'var(--danger-fg)' }} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
