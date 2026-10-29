import { useState, type FormEvent } from 'react';
import { Plus, Package, Trash2, Edit, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { validatePackageForm } from '../lib/validation';
import type { PackageFormValues, ServicePackage } from '../types';

const EMPTY_FORM: PackageFormValues = {
  name: '', description: '', price: '', currency: 'USD',
  includedServices: '', deliverables: '', assumptions: '',
  exclusions: '', duration: '', notes: '',
};

function pkgToForm(pkg: ServicePackage): PackageFormValues {
  return {
    name: pkg.name,
    description: pkg.description,
    price: pkg.price !== null ? String(pkg.price) : '',
    currency: pkg.currency ?? 'USD',
    includedServices: pkg.includedServices.join('\n'),
    deliverables: pkg.deliverables.join('\n'),
    assumptions: pkg.assumptions.join('\n'),
    exclusions: pkg.exclusions.join('\n'),
    duration: pkg.duration ?? '',
    notes: pkg.notes,
  };
}

function PackageForm({
  initial, onSave, onCancel,
}: { initial: PackageFormValues; onSave: (v: PackageFormValues) => void; onCancel: () => void }) {
  const [form, setForm] = useState<PackageFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField(f: keyof PackageFormValues, v: string) {
    setForm((prev) => ({ ...prev, [f]: v }));
    if (errors[f]) setErrors((e) => { const n = { ...e }; delete n[f]; return n; });
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const errs = validatePackageForm(form);
    if (errs.length) {
      const map: Record<string, string> = {};
      errs.forEach((ve) => { map[ve.field] = ve.message; });
      setErrors(map);
      return;
    }
    onSave(form);
  }

  return (
    <form onSubmit={handleSave} noValidate aria-label="Service package form">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="pkg-name" className="form-label form-label-required">Package Name</label>
          <input id="pkg-name" type="text" className={`form-input${errors.name ? ' error' : ''}`}
            value={form.name} onChange={(e) => setField('name', e.target.value)} maxLength={150} required />
          {errors.name && <p className="form-error"><AlertCircle size={12} /> {errors.name}</p>}
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="pkg-desc" className="form-label form-label-required">Description</label>
          <textarea id="pkg-desc" className={`form-textarea${errors.description ? ' error' : ''}`}
            value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} required />
          {errors.description && <p className="form-error"><AlertCircle size={12} /> {errors.description}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="pkg-price" className="form-label">
            Price <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>(leave blank if not agreed)</span>
          </label>
          <input id="pkg-price" type="number" min="0" step="0.01"
            className={`form-input${errors.price ? ' error' : ''}`}
            value={form.price} onChange={(e) => setField('price', e.target.value)}
            placeholder="Not provided" />
          {errors.price && <p className="form-error"><AlertCircle size={12} /> {errors.price}</p>}
          <p className="form-hint">⚠ Never invent a price. Only enter if explicitly agreed.</p>
        </div>
        <div className="form-group">
          <label htmlFor="pkg-currency" className="form-label">Currency Code</label>
          <input id="pkg-currency" type="text" maxLength={3}
            className={`form-input${errors.currency ? ' error' : ''}`}
            value={form.currency} onChange={(e) => setField('currency', e.target.value.toUpperCase())}
            placeholder="USD" disabled={!form.price} />
          {errors.currency && <p className="form-error"><AlertCircle size={12} /> {errors.currency}</p>}
        </div>
        {[
          { id: 'pkg-services', field: 'includedServices' as const, label: 'Included Services', hint: 'One per line' },
          { id: 'pkg-deliverables', field: 'deliverables' as const, label: 'Deliverables', hint: 'One per line' },
          { id: 'pkg-assumptions', field: 'assumptions' as const, label: 'Assumptions', hint: 'One per line' },
          { id: 'pkg-exclusions', field: 'exclusions' as const, label: 'Exclusions', hint: 'One per line' },
        ].map(({ id, field, label, hint }) => (
          <div key={id} className="form-group">
            <label htmlFor={id} className="form-label">{label}</label>
            <textarea id={id} className="form-textarea" rows={4}
              value={form[field]} onChange={(e) => setField(field, e.target.value)}
              placeholder={hint} />
            <p className="form-hint">{hint}</p>
          </div>
        ))}
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="pkg-duration" className="form-label">
            Duration <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>(only if explicitly agreed)</span>
          </label>
          <input id="pkg-duration" type="text" className="form-input"
            value={form.duration} onChange={(e) => setField('duration', e.target.value)}
            placeholder="e.g. 8 weeks (leave blank if unknown)" />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="pkg-notes" className="form-label">Notes / Source</label>
          <textarea id="pkg-notes" className="form-textarea" rows={2}
            value={form.notes} onChange={(e) => setField('notes', e.target.value)}
            placeholder="Source of this information, any caveats…" />
        </div>
      </div>

      <div className="alert alert-warning">
        <AlertCircle size={14} aria-hidden="true" />
        <span>
          Only include information explicitly provided or agreed. Never invent prices, dates, or terms.
          This package will be labelled as <strong>not approved</strong> by default.
        </span>
      </div>

      <div className="flex gap-3" style={{ marginTop: 'var(--space-4)' }}>
        <button type="submit" className="btn btn-primary">Save Package</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function PackageCard({ pkg, onEdit, onDelete }: { pkg: ServicePackage; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpanded((e) => !e)}
        role="button" aria-expanded={expanded} tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{pkg.name}</span>
            {pkg.isApproved
              ? <span className="badge badge-success"><CheckCircle size={10} /> Approved</span>
              : <span className="badge badge-warning">Not approved</span>}
            {pkg.pricingStatus === 'not-provided'
              ? <span className="badge badge-danger">Price not set</span>
              : <span className="badge badge-info">{pkg.currency} {pkg.price?.toLocaleString()}</span>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{pkg.description}</p>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit} aria-label={`Edit ${pkg.name}`}>
            <Edit size={13} aria-hidden="true" />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete} aria-label={`Delete ${pkg.name}`}>
            <Trash2 size={13} style={{ color: 'var(--danger-fg)' }} aria-hidden="true" />
          </button>
          {expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </div>
      </div>

      {expanded && (
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {[
            { label: 'Included Services', items: pkg.includedServices },
            { label: 'Deliverables',      items: pkg.deliverables },
            { label: 'Assumptions',       items: pkg.assumptions },
            { label: 'Exclusions',        items: pkg.exclusions },
          ].map(({ label, items }) => (
            <div key={label}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {label}
              </p>
              {items.length > 0
                ? <ul style={{ paddingLeft: 16, fontSize: 12, color: 'var(--ink-700)' }}>
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                : <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>None specified</p>}
            </div>
          ))}
          {pkg.duration && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Duration</p>
              <p style={{ fontSize: 12, color: 'var(--ink-700)' }}>{pkg.duration}</p>
            </div>
          )}
          {pkg.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Notes</p>
              <p style={{ fontSize: 12, color: 'var(--ink-500)', fontStyle: 'italic' }}>{pkg.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Packages() {
  const { packages, createPackage, updatePackage, deletePackage, addNotification } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function handleCreate(values: PackageFormValues) {
    createPackage(values);
    setShowForm(false);
    addNotification({ type: 'success', message: 'Package created.', autoDismissMs: 3000 });
  }

  function handleUpdate(id: string, values: PackageFormValues) {
    updatePackage(id, values);
    setEditingId(null);
    addNotification({ type: 'success', message: 'Package updated.', autoDismissMs: 3000 });
  }

  function handleDelete(id: string) {
    deletePackage(id);
    setDeleteConfirmId(null);
    addNotification({ type: 'info', message: 'Package deleted.', autoDismissMs: 3000 });
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Service Packages</h2>
            <p className="page-subtitle">Define the services and deliverables available for proposals.</p>
          </div>
          <button id="new-package-btn" className="btn btn-primary" onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus size={14} aria-hidden="true" /> New Package
          </button>
        </div>
      </div>

      <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
        <AlertCircle size={14} aria-hidden="true" />
        <div>
          <strong>Commercial rules:</strong> Never invent prices, discounts, payment terms, or service inclusions.
          Packages are not considered approved company offerings unless explicitly marked approved.
          Pricing must be left blank if not explicitly agreed.
        </div>
      </div>

      {/* New package form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header"><h3 className="card-title">New Service Package</h3></div>
          <div className="card-body">
            <PackageForm
              initial={EMPTY_FORM}
              onSave={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Package list */}
      {packages.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={24} aria-hidden="true" /></div>
            <p className="empty-state-title">No packages yet</p>
            <p className="empty-state-desc">Create a service package to use when generating proposals.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus aria-hidden="true" /> New Package
            </button>
          </div>
        </div>
      ) : (
        packages.map((pkg) =>
          editingId === pkg.id ? (
            <div key={pkg.id} className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="card-header"><h3 className="card-title">Edit: {pkg.name}</h3></div>
              <div className="card-body">
                <PackageForm
                  initial={pkgToForm(pkg)}
                  onSave={(v) => handleUpdate(pkg.id, v)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            </div>
          ) : deleteConfirmId === pkg.id ? (
            <div key={pkg.id} className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
              <div className="alert alert-danger" style={{ marginBottom: 'var(--space-3)' }}>
                <AlertCircle size={14} aria-hidden="true" />
                Are you sure you want to delete <strong>{pkg.name}</strong>? Existing proposals referencing this package will retain their generated content.
              </div>
              <div className="flex gap-3">
                <button className="btn btn-danger" onClick={() => handleDelete(pkg.id)}>Delete</button>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={() => setEditingId(pkg.id)}
              onDelete={() => setDeleteConfirmId(pkg.id)}
            />
          )
        )
      )}
    </div>
  );
}
