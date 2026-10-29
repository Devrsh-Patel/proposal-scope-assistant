// ─── Validation Logic ─────────────────────────────────────────────────────
// Deterministic validation for forms and business rules.
// Commercial rules are enforced here, not by AI.

import type { ProposalFormValues, PackageFormValues } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Proposal Form Validation ────────────────────────────────────────────────

export function validateProposalForm(values: ProposalFormValues): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!values.title.trim()) {
    errors.push({ field: 'title', message: 'Proposal title is required.' });
  }
  if (values.title.trim().length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or fewer.' });
  }
  if (!values.projectLabel.trim()) {
    errors.push({ field: 'projectLabel', message: 'Project label is required.' });
  }
  if (values.projectLabel.trim().length > 100) {
    errors.push({ field: 'projectLabel', message: 'Project label must be 100 characters or fewer.' });
  }
  if (!values.discoveryNotes.trim()) {
    errors.push({ field: 'discoveryNotes', message: 'Discovery notes are required to generate a draft.' });
  }
  if (values.discoveryNotes.length > 20_000) {
    errors.push({ field: 'discoveryNotes', message: 'Discovery notes must be 20,000 characters or fewer.' });
  }
  if (!values.templateId) {
    errors.push({ field: 'templateId', message: 'A template must be selected.' });
  }
  if (values.targetDate) {
    const parsed = Date.parse(values.targetDate);
    if (isNaN(parsed)) {
      errors.push({ field: 'targetDate', message: 'Target date must be a valid date.' });
    }
  }

  return errors;
}

// ─── Package Form Validation ─────────────────────────────────────────────────

export function validatePackageForm(values: PackageFormValues): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!values.name.trim()) {
    errors.push({ field: 'name', message: 'Package name is required.' });
  }
  if (values.name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Package name must be 150 characters or fewer.' });
  }
  if (!values.description.trim()) {
    errors.push({ field: 'description', message: 'A description is required.' });
  }

  // Price validation — never invent or coerce a price
  if (values.price.trim()) {
    const numPrice = parseFloat(values.price);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.push({ field: 'price', message: 'Price must be a non-negative number, or leave blank if not yet agreed.' });
    }
    if (!values.currency.trim()) {
      errors.push({ field: 'currency', message: 'Currency is required when a price is provided.' });
    }
    if (values.currency.trim().length !== 3) {
      errors.push({ field: 'currency', message: 'Currency must be a 3-letter code (e.g. USD, GBP, INR).' });
    }
  }

  return errors;
}

// ─── Pricing Safety Checks ───────────────────────────────────────────────────

/**
 * Ensure a price value is never silently changed to zero or invented.
 * Returns the original price or null — never a default.
 */
export function safeParsePrice(raw: string): number | null {
  if (!raw.trim()) return null;
  const parsed = parseFloat(raw);
  if (isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

/**
 * Asserts that pricing has not been invented in a draft.
 * Returns true if pricing is safe (explicitly provided or clearly marked missing).
 */
export function isPricingSafe(price: number | null, pricingStatus: 'provided' | 'not-provided'): boolean {
  if (pricingStatus === 'not-provided' && price !== null) {
    // Price was not provided but a value appeared — this is a violation
    return false;
  }
  return true;
}

// ─── Missing Information Detection ──────────────────────────────────────────

export function detectMissingInfo(values: Partial<ProposalFormValues>): string[] {
  const missing: string[] = [];

  if (!values.clientName?.trim()) missing.push('Client/organisation name');
  if (!values.servicePackageId) missing.push('Service package selection');
  if (!values.targetDate) missing.push('Target date or timeline context');
  if (!values.supportingContext?.trim()) missing.push('Supporting context');
  if (!values.clientRequirements?.trim()) missing.push('Client requirements');

  return missing;
}

// ─── Fact vs Suggestion Distinction ─────────────────────────────────────────

export function isFactual(content: string): boolean {
  const suggestionMarkers = [
    '(suggested',
    'suggested',
    'suggestion',
    'suggestions',
    'suggested wording',
    'review required',
    'information not provided',
    'requires confirmation',
    'confirm or remove',
    'not yet confirmed',
    'must be confirmed',
    'to be confirmed',
  ];
  const lower = content.toLowerCase();
  return !suggestionMarkers.some((m) => lower.includes(m));
}

// ─── Input Sanitisation ──────────────────────────────────────────────────────

/**
 * Sanitise user-supplied text to prevent script injection when rendered.
 * Does NOT strip legitimate content — this is for defensive rendering only.
 */
export function sanitiseText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Detect and flag potential prompt-injection attempts in discovery notes.
 * Returns true if the text contains suspicious instruction patterns.
 */
export function detectPromptInjection(text: string): boolean {
  const patterns = [
    /ignore (previous|all|above) instructions/i,
    /disregard (your|the) (system|rules|guidelines)/i,
    /pretend (you are|to be)/i,
    /invent (a price|pricing|cost|date)/i,
    /make up (a|the) (price|cost|date|commitment)/i,
    /override (safety|rules|guidelines)/i,
    /act as if (you have|you can)/i,
  ];
  return patterns.some((p) => p.test(text));
}
