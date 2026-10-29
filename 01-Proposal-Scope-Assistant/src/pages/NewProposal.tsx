import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { validateProposalForm, detectMissingInfo, detectPromptInjection } from '../lib/validation';
import type { ProposalFormValues } from '../types';

const EMPTY_FORM: ProposalFormValues = {
  title: '',
  clientName: '',
  projectLabel: '',
  discoveryNotes: '',
  supportingContext: '',
  clientRequirements: '',
  servicePackageId: '',
  templateId: 'tmpl-generic-starter',
  targetDate: '',
};

export default function NewProposal() {
  const navigate = useNavigate();
  const { packages, templates, createDraft, addNotification } = useAppStore();

  const [form, setForm] = useState<ProposalFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [injectionWarning, setInjectionWarning] = useState(false);

  function setField(field: keyof ProposalFormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const next = { ...e }; delete next[field]; return next; });

    // Check for prompt injection in discovery notes
    if (field === 'discoveryNotes' && detectPromptInjection(value)) {
      setInjectionWarning(true);
    } else if (field === 'discoveryNotes') {
      setInjectionWarning(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validateProposalForm(form);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((ve) => { errorMap[ve.field] = ve.message; });
      setErrors(errorMap);
      return;
    }

    const missingInfo = detectMissingInfo(form);
    const draftId = createDraft({
      title: form.title.trim(),
      clientName: form.clientName.trim() || null,
      projectLabel: form.projectLabel.trim(),
      discoveryNotes: form.discoveryNotes,
      supportingContext: form.supportingContext,
      clientRequirements: form.clientRequirements,
      servicePackageId: form.servicePackageId || null,
      templateId: form.templateId,
      status: 'draft',
      sections: [],
      confirmationQuestions: [],
      unresolvedItems: [],
      targetDate: form.targetDate || null,
      generatedAt: null,
      generationMethod: 'not-generated',
      aiModel: null,
    });

    addNotification({
      type: 'success',
      message: `Proposal draft created. ${missingInfo.length > 0 ? `Note: ${missingInfo.length} optional fields not provided.` : ''}`,
      autoDismissMs: 4000,
    });

    navigate(`/proposals/${draftId}`);
  }

  const missingOptional = detectMissingInfo(form);

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      {/* Header */}
      <div className="page-header">
        <h2 className="page-title">New Proposal Draft</h2>
        <p className="page-subtitle">
          Enter discovery notes and context. The assistant will generate a structured draft for your review.
        </p>
      </div>

      {/* Note about not inventing info */}
      <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
        <Info size={16} aria-hidden="true" />
        <div>
          The assistant will only include information you provide. It will never invent client details, prices, dates, or commitments.
          Missing fields will be clearly marked in the draft.
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="Create proposal form">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={16} style={{ marginRight: 8 }} aria-hidden="true" />
              Proposal Details
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Title */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="title" className="form-label form-label-required">
                Proposal Title
              </label>
              <input
                id="title"
                type="text"
                className={`form-input${errors.title ? ' error' : ''}`}
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g. E-Commerce MVP — Acme Corp"
                maxLength={200}
                required
                aria-required="true"
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p id="title-error" className="form-error">
                  <AlertCircle size={12} aria-hidden="true" /> {errors.title}
                </p>
              )}
            </div>

            {/* Two-column row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="clientName" className="form-label">
                  Client / Organisation Name <span style={{ color: 'var(--ink-400)', fontSize: 11 }}>(optional)</span>
                </label>
                <input
                  id="clientName"
                  type="text"
                  className="form-input"
                  value={form.clientName}
                  onChange={(e) => setField('clientName', e.target.value)}
                  placeholder="Leave blank if unknown"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="projectLabel" className="form-label form-label-required">
                  Project Label / Slug
                </label>
                <input
                  id="projectLabel"
                  type="text"
                  className={`form-input${errors.projectLabel ? ' error' : ''}`}
                  value={form.projectLabel}
                  onChange={(e) => setField('projectLabel', e.target.value)}
                  placeholder="e.g. acme-ecommerce-mvp"
                  maxLength={100}
                  required
                  aria-required="true"
                  aria-describedby={errors.projectLabel ? 'label-error' : undefined}
                />
                {errors.projectLabel && (
                  <p id="label-error" className="form-error">
                    <AlertCircle size={12} aria-hidden="true" /> {errors.projectLabel}
                  </p>
                )}
              </div>
            </div>

            {/* Discovery Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="discoveryNotes" className="form-label form-label-required">
                Discovery Notes
              </label>
              <textarea
                id="discoveryNotes"
                className={`form-textarea${errors.discoveryNotes ? ' error' : ''}`}
                value={form.discoveryNotes}
                onChange={(e) => setField('discoveryNotes', e.target.value)}
                placeholder="Paste or type your discovery notes, meeting notes, or client brief here…"
                rows={7}
                maxLength={20000}
                required
                aria-required="true"
                aria-describedby={errors.discoveryNotes ? 'notes-error' : 'notes-hint'}
              />
              <p id="notes-hint" className="form-hint">
                {form.discoveryNotes.length}/20,000 characters
              </p>
              {errors.discoveryNotes && (
                <p id="notes-error" className="form-error">
                  <AlertCircle size={12} aria-hidden="true" /> {errors.discoveryNotes}
                </p>
              )}
              {injectionWarning && (
                <div className="alert alert-warning" style={{ marginTop: 'var(--space-2)' }}>
                  <AlertCircle size={14} aria-hidden="true" />
                  <div>
                    <strong>Warning:</strong> Your notes contain text that looks like an instruction to override safeguards.
                    The assistant treats all input as content, not instructions. These phrases will be included in the draft as text, not executed.
                  </div>
                </div>
              )}
            </div>

            {/* Supporting Context */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="supportingContext" className="form-label">
                Supporting Context <span style={{ color: 'var(--ink-400)', fontSize: 11 }}>(optional)</span>
              </label>
              <textarea
                id="supportingContext"
                className="form-textarea"
                value={form.supportingContext}
                onChange={(e) => setField('supportingContext', e.target.value)}
                placeholder="Any additional background, existing work, or reference material…"
                rows={3}
              />
            </div>

            {/* Client Requirements */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="clientRequirements" className="form-label">
                Client Requirements <span style={{ color: 'var(--ink-400)', fontSize: 11 }}>(optional)</span>
              </label>
              <textarea
                id="clientRequirements"
                className="form-textarea"
                value={form.clientRequirements}
                onChange={(e) => setField('clientRequirements', e.target.value)}
                placeholder="Known requirements, constraints, or technical specifications…"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Package & Template Selection */}
        <div className="card" style={{ marginTop: 'var(--space-4)' }}>
          <div className="card-header">
            <h3 className="card-title">Package &amp; Template</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="servicePackageId" className="form-label">
                Service Package <span style={{ color: 'var(--ink-400)', fontSize: 11 }}>(optional but recommended)</span>
              </label>
              <select
                id="servicePackageId"
                className="form-select"
                value={form.servicePackageId}
                onChange={(e) => setField('servicePackageId', e.target.value)}
              >
                <option value="">— None selected —</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}{pkg.isApproved ? ' ✓ Approved' : ' (demo)'}
                    {pkg.pricingStatus === 'not-provided' ? ' — price not set' : ` — ${pkg.currency} ${pkg.price?.toLocaleString()}`}
                  </option>
                ))}
              </select>
              {form.servicePackageId && (
                <p className="form-hint">
                  {packages.find((p) => p.id === form.servicePackageId)?.description}
                </p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="templateId" className="form-label form-label-required">
                Proposal Template
              </label>
              <select
                id="templateId"
                className={`form-select${errors.templateId ? ' error' : ''}`}
                value={form.templateId}
                onChange={(e) => setField('templateId', e.target.value)}
                required
                aria-required="true"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{!t.isApproved ? ' — Generic starter template (not approved)' : ''}
                  </option>
                ))}
              </select>
              <p className="form-hint">
                {templates.find((t) => t.id === form.templateId)?.description}
              </p>
              {errors.templateId && (
                <p className="form-error"><AlertCircle size={12} aria-hidden="true" /> {errors.templateId}</p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="targetDate" className="form-label">
                Target Date <span style={{ color: 'var(--ink-400)', fontSize: 11 }}>(optional — only include if known)</span>
              </label>
              <input
                id="targetDate"
                type="date"
                className={`form-input${errors.targetDate ? ' error' : ''}`}
                value={form.targetDate}
                onChange={(e) => setField('targetDate', e.target.value)}
                aria-describedby="date-hint"
              />
              <p id="date-hint" className="form-hint">
                Do not enter a date unless explicitly agreed with the client.
              </p>
              {errors.targetDate && (
                <p className="form-error"><AlertCircle size={12} aria-hidden="true" /> {errors.targetDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Missing optional fields summary */}
        {missingOptional.length > 0 && (
          <div className="alert alert-warning" style={{ marginTop: 'var(--space-4)' }}>
            <AlertCircle size={16} aria-hidden="true" />
            <div>
              <strong>Optional fields not provided:</strong>{' '}
              {missingOptional.join(', ')}.
              These will be clearly marked as missing in the generated draft.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3" style={{ marginTop: 'var(--space-6)' }}>
          <button type="submit" className="btn btn-primary btn-lg" id="submit-proposal-btn">
            Save Draft &amp; Continue
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/proposals')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
