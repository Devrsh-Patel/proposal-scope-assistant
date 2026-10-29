import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, Eye, Download, Save, CheckCircle,
  AlertCircle, AlertTriangle, ChevronDown, ChevronUp,
  Edit3,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  generateProposal,
  hydrateSections,
  hydrateConfirmationQuestions,
  hydrateUnresolvedItems,
} from '../lib/drafting';
import { exportToDocx, exportToPdf, exportToTxt, downloadBlob, sanitizeFilename } from '../lib/export';
import type { DraftStatus, ExportFormat } from '../types';

function StatusBadge({ status }: { status: DraftStatus }) {
  const config = {
    draft:                   { label: 'Draft',                    cls: 'badge-draft' },
    'needs-review':          { label: 'Needs Review',             cls: 'badge-review' },
    'ready-for-human-review':{ label: 'Ready for Human Review',   cls: 'badge-ready' },
  }[status];
  return <span className={`badge ${config.cls}`}>{config.label}</span>;
}

function SectionMarker({ status }: { status: string }) {
  if (status === 'confirmed') return (
    <div className="section-marker section-marker-confirmed">
      <CheckCircle size={12} aria-hidden="true" /> Confirmed facts
    </div>
  );
  if (status === 'missing') return (
    <div className="section-marker section-marker-missing">
      <AlertCircle size={12} aria-hidden="true" /> Information not provided — fill in or mark for confirmation
    </div>
  );
  return (
    <div className="section-marker section-marker-suggested">
      <AlertTriangle size={12} aria-hidden="true" /> Suggested wording — review required before sharing
    </div>
  );
}

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    drafts, packages, templates,
    updateDraft, updateSection, resolveQuestion,
    addSections, addConfirmationQuestions, addUnresolvedItems,
    updateDraftStatus, addNotification,
    aiApiKey, aiBaseUrl, aiModel,
  } = useAppStore();

  const draft = drafts.find((d) => d.id === id);
  const [generating, setGenerating] = useState(false);
  const [generationWarnings, setGenerationWarnings] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  if (!draft) {
    return (
      <div className="fade-in" style={{ maxWidth: 600 }}>
        <div className="alert alert-danger">
          <AlertCircle size={16} aria-hidden="true" />
          Proposal not found. It may have been deleted.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/proposals')}>
          <ArrowLeft size={14} aria-hidden="true" /> Back to Proposals
        </button>
      </div>
    );
  }

  const pkg = packages.find((p) => p.id === draft.servicePackageId) ?? null;
  const template = templates.find((t) => t.id === draft.templateId) ?? templates[0];
  const sortedSections = [...draft.sections].sort((a, b) => a.order - b.order);
  const unresolvedHighCount = draft.unresolvedItems.filter((u) => u.severity === 'high').length;
  const pendingQuestions = draft.confirmationQuestions.filter((q) => !q.isResolved);

  function toggleSection(id: string) {
    setExpandedSections((s) => ({ ...s, [id]: !s[id] }));
  }

  async function handleGenerate() {
    if (!draft) return;
    setGenerating(true);
    setGenerationWarnings([]);
    try {
      const output = await generateProposal(
        {
          discoveryNotes: draft.discoveryNotes,
          supportingContext: draft.supportingContext,
          clientRequirements: draft.clientRequirements,
          clientName: draft.clientName,
          projectLabel: draft.projectLabel,
          servicePackage: pkg,
          template,
        },
        { aiApiKey, aiBaseUrl, aiModel }
      );

      addSections(draft.id, hydrateSections(output.sections));
      addConfirmationQuestions(draft.id, hydrateConfirmationQuestions(output.confirmationQuestions));
      addUnresolvedItems(draft.id, hydrateUnresolvedItems(output.unresolvedItems));
      updateDraft(draft.id, {
        generationMethod: output.generationMethod,
        aiModel: output.aiModel,
        status: 'needs-review',
      });
      setGenerationWarnings(output.warnings);
      setViewMode('edit');

      addNotification({
        type: output.generationMethod === 'ai' ? 'success' : 'info',
        message: output.generationMethod === 'ai'
          ? 'Draft generated using AI. Review all sections carefully.'
          : 'Draft generated using rule-based logic (AI not configured). All suggested content requires review.',
        autoDismissMs: 6000,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        message: `Generation failed: ${err instanceof Error ? err.message : String(err)}`,
        autoDismissMs: 8000,
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport(format: ExportFormat) {
    if (!draft) return;
    setExporting(true);
    try {
      const options = {
        format,
        includeDraftLabel: true,
        includeUnresolvedMarkers: true,
        includeConfirmationQuestions: true,
      };

      const filename = `${sanitizeFilename(draft.title)}-draft`;

      if (format === 'docx') {
        const blob = await exportToDocx(draft, pkg, options);
        downloadBlob(blob, `${filename}.docx`);
      } else if (format === 'pdf') {
        const blob = exportToPdf(draft, options);
        downloadBlob(blob, `${filename}.pdf`);
      } else {
        const blob = exportToTxt(draft, options);
        downloadBlob(blob, `${filename}.txt`);
      }

      addNotification({ type: 'success', message: `Exported as ${format.toUpperCase()}.`, autoDismissMs: 4000 });
    } catch (err) {
      addNotification({
        type: 'error',
        message: `Export failed: ${err instanceof Error ? err.message : String(err)}`,
        autoDismissMs: 6000,
      });
    } finally {
      setExporting(false);
    }
  }

  function handleResolveQuestion(qId: string) {
    if (!draft || !resolutionText.trim()) return;
    resolveQuestion(draft.id, qId, resolutionText.trim());
    setResolvingId(null);
    setResolutionText('');
    addNotification({ type: 'success', message: 'Question marked as resolved.', autoDismissMs: 3000 });
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/proposals')}>
            <ArrowLeft size={14} aria-hidden="true" /> Back
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)' }}>{draft.title}</h2>
              <StatusBadge status={draft.status} />
            </div>
            {draft.clientName && (
              <p className="text-sm text-muted">{draft.clientName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex" style={{ border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              className={`btn btn-sm ${viewMode === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, borderRight: '1px solid var(--ink-100)' }}
              onClick={() => setViewMode('edit')}
              aria-pressed={viewMode === 'edit'}
            >
              <Edit3 size={13} aria-hidden="true" /> Edit
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setViewMode('preview')}
              aria-pressed={viewMode === 'preview'}
            >
              <Eye size={13} aria-hidden="true" /> Preview
            </button>
          </div>

          {/* Generate / Regenerate */}
          <button
            id="generate-btn"
            className="btn btn-secondary"
            onClick={handleGenerate}
            disabled={generating}
            aria-label={draft.generationMethod === 'not-generated' ? 'Generate draft' : 'Regenerate draft'}
          >
            {generating ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} aria-hidden="true" /> Generating…</>
            ) : (
              <><Zap size={14} aria-hidden="true" /> {draft.generationMethod === 'not-generated' ? 'Generate Draft' : 'Regenerate'}</>
            )}
          </button>

          {/* Export */}
          {draft.sections.length > 0 && (
            <div style={{ position: 'relative' }} className="flex gap-1">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleExport('docx')}
                disabled={exporting}
                title="Export as DOCX"
              >
                <Download size={13} aria-hidden="true" /> DOCX
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                title="Export as PDF"
              >
                <Download size={13} aria-hidden="true" /> PDF
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleExport('txt')}
                disabled={exporting}
                title="Export as plain text"
              >
                <Download size={13} aria-hidden="true" /> TXT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generation warnings */}
      {generationWarnings.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
          <AlertTriangle size={16} aria-hidden="true" />
          <div>
            <strong>Generation notes:</strong>
            <ul style={{ marginTop: 4, paddingLeft: 16 }}>
              {generationWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Status controls */}
      <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-6)' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 500 }}>Status:</span>
        {(['draft', 'needs-review', 'ready-for-human-review'] as DraftStatus[]).map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${draft.status === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => updateDraftStatus(draft.id, s)}
          >
            {s === 'draft' ? 'Draft' : s === 'needs-review' ? 'Needs Review' : 'Ready for Human Review'}
          </button>
        ))}
        {draft.status === 'ready-for-human-review' && (
          <span style={{ fontSize: 11, color: 'var(--warning-fg)', fontStyle: 'italic' }}>
            ⚠ This status does not authorise sending to a client.
          </span>
        )}
      </div>

      <div className="editor-layout">
        {/* Main content */}
        <div>
          {/* Pre-generation state */}
          {draft.sections.length === 0 && !generating && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Zap size={24} aria-hidden="true" />
                </div>
                <p className="empty-state-title">Ready to generate</p>
                <p className="empty-state-desc">
                  Click "Generate Draft" to create a structured proposal from your discovery notes.
                  {!aiApiKey && ' AI is not configured — rule-based drafting will be used.'}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  disabled={generating}
                  id="generate-empty-btn"
                >
                  <Zap size={14} aria-hidden="true" /> Generate Draft
                </button>
                {!aiApiKey && (
                  <p style={{ marginTop: 'var(--space-3)', fontSize: 11, color: 'var(--ink-500)' }}>
                    Configure AI in Settings to enable AI-assisted drafting.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Edit View */}
          {viewMode === 'edit' && sortedSections.length > 0 && (
            <div>
              {sortedSections.map((section) => {
                const isExpanded = expandedSections[section.id] !== false; // default expanded
                return (
                  <div key={section.id} className="editor-section">
                    <div
                      className="editor-section-header"
                      onClick={() => toggleSection(section.id)}
                      role="button"
                      aria-expanded={isExpanded}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleSection(section.id)}
                    >
                      <SectionMarker status={section.status} />
                      <span className="editor-section-title">{section.title}</span>
                      {section.isUserEdited && (
                        <span className="badge badge-info" style={{ fontSize: 10 }}>Edited</span>
                      )}
                      {isExpanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                    </div>
                    {isExpanded && (
                      <div className="editor-section-body">
                        <textarea
                          className="editor-textarea"
                          value={section.content}
                          onChange={(e) => updateSection(draft.id, section.id, e.target.value)}
                          aria-label={`Edit section: ${section.title}`}
                          rows={8}
                        />
                        {section.unresolvedItems.length > 0 && (
                          <div style={{ marginTop: 'var(--space-2)' }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger-fg)', marginBottom: 4 }}>
                              Unresolved in this section:
                            </p>
                            <ul className="unresolved-list">
                              {section.unresolvedItems.map((item, i) => (
                                <li key={i} className="unresolved-item">
                                  <span className="severity-dot severity-medium" aria-hidden="true" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Preview View */}
          {viewMode === 'preview' && (
            <div className="document-preview">
              <div className="preview-draft-notice">
                <AlertTriangle size={14} aria-hidden="true" />
                <div>
                  <strong>DRAFT</strong> — This document requires human review and authorisation before external use.
                  Generated: {draft.generationMethod === 'ai' ? `AI (${draft.aiModel})` : 'Rule-based logic'}.
                </div>
              </div>
              <h1 className="preview-title">{draft.title}</h1>
              <div className="preview-meta">
                {draft.clientName && <span>Client: {draft.clientName} · </span>}
                <span>Label: {draft.projectLabel}</span>
                {draft.generatedAt && <span> · Generated: {new Date(draft.generatedAt).toLocaleDateString()}</span>}
              </div>
              {sortedSections.map((section) => (
                <div key={section.id} className="preview-section">
                  <h2 className="preview-section-title">{section.title}</h2>
                  {section.status !== 'confirmed' && (
                    <p style={{
                      fontSize: 11, fontStyle: 'italic', marginBottom: 8,
                      color: section.status === 'missing' ? 'var(--danger-fg)' : 'var(--warning-fg)',
                    }}>
                      {section.status === 'missing' ? '⚠ Information not provided' : '⚠ Suggested wording — review required'}
                    </p>
                  )}
                  <pre className="preview-content">{section.content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^#+\s+/gm, '').replace(/^>\s+/gm, '  ')}</pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Context Panel */}
        <div className="context-panel">
          {/* Unresolved items */}
          {draft.unresolvedItems.length > 0 && (
            <div className="panel-section">
              <div className="panel-section-header" style={{ color: unresolvedHighCount > 0 ? 'var(--danger-fg)' : undefined }}>
                ⚠ Unresolved Items ({draft.unresolvedItems.length})
              </div>
              <ul className="unresolved-list">
                {draft.unresolvedItems.map((item) => (
                  <li key={item.id} className="panel-item unresolved-item">
                    <span className={`severity-dot severity-${item.severity}`} aria-hidden="true" />
                    <span>{item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmation Questions */}
          {draft.confirmationQuestions.length > 0 && (
            <div className="panel-section">
              <div className="panel-section-header">
                Questions ({pendingQuestions.length} pending)
              </div>
              {draft.confirmationQuestions.map((q) => (
                <div key={q.id} className="panel-item">
                  <p style={{ fontSize: 12, marginBottom: 4, color: q.isResolved ? 'var(--ink-300)' : 'var(--ink-700)' }}>
                    {q.isResolved ? '✓ ' : '• '}{q.question}
                  </p>
                  {q.isResolved && q.resolution && (
                    <p style={{ fontSize: 11, color: 'var(--success-fg)', fontStyle: 'italic' }}>
                      Resolution: {q.resolution}
                    </p>
                  )}
                  {!q.isResolved && (
                    resolvingId === q.id ? (
                      <div style={{ marginTop: 4 }}>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          style={{ fontSize: 12, minHeight: 50 }}
                          placeholder="Enter resolution…"
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          aria-label="Resolution text"
                          autoFocus
                        />
                        <div className="flex gap-2" style={{ marginTop: 4 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleResolveQuestion(q.id)}>
                            <Save size={11} aria-hidden="true" /> Save
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setResolvingId(null); setResolutionText(''); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => { setResolvingId(q.id); setResolutionText(''); }}>
                        Resolve…
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Package Info */}
          {pkg && (
            <div className="panel-section">
              <div className="panel-section-header">Package</div>
              <div className="panel-item">
                <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{pkg.name}</p>
                <p style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 6 }}>{pkg.description}</p>
                <p style={{ fontSize: 12 }}>
                  <strong>Price:</strong>{' '}
                  {pkg.pricingStatus === 'provided' && pkg.price !== null
                    ? `${pkg.currency} ${pkg.price.toLocaleString()}`
                    : <span style={{ color: 'var(--danger-fg)', fontWeight: 500 }}>Not provided — confirmation required</span>
                  }
                </p>
                {!pkg.isApproved && (
                  <p style={{ marginTop: 4, fontSize: 11, color: 'var(--warning-fg)', fontStyle: 'italic' }}>
                    Not an approved company package
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Template info */}
          <div className="panel-section">
            <div className="panel-section-header">Template</div>
            <div className="panel-item">
              <p style={{ fontSize: 12, fontWeight: 500 }}>{template.name}</p>
              {!template.isApproved && (
                <p style={{ fontSize: 11, color: 'var(--warning-fg)', fontStyle: 'italic', marginTop: 2 }}>
                  Generic starter — not an approved company template
                </p>
              )}
            </div>
          </div>

          {/* Export reminder */}
          {draft.sections.length > 0 && (
            <div className="alert alert-warning" style={{ margin: 0 }}>
              <AlertTriangle size={13} aria-hidden="true" />
              <div style={{ fontSize: 11 }}>
                Before exporting, resolve all unresolved items and have an authorised team member review commercial terms.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
