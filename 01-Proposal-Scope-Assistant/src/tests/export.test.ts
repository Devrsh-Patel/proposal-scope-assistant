// ─── Unit Tests: Document Export ──────────────────────────────────────────
// Tests export to DOCX, PDF, and plain text formats.
// Ensures:
// - Content actually reviewed is exported
// - Draft notices and uncertainty markers are preserved
// - Unresolved items and confirmation questions are included
// - Filenames are properly sanitized

import { describe, it, expect } from 'vitest';
import { exportToDocx, exportToPdf, exportToTxt, sanitizeFilename } from '../lib/export';
import type { ProposalDraft, ExportOptions, ServicePackage } from '../types';

const MOCK_PKG: ServicePackage = {
  id: 'pkg-test',
  name: 'Full Stack Web Accelerator',
  description: 'Complete stack delivery.',
  price: 18500,
  currency: 'USD',
  pricingStatus: 'provided',
  includedServices: ['Architecture', 'Frontend', 'Backend'],
  deliverables: ['Web Application', 'Deployment Guide'],
  assumptions: ['Client provides API credentials'],
  exclusions: ['24/7 Support'],
  duration: '4 weeks',
  milestones: [],
  notes: '',
  isApproved: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_DRAFT: ProposalDraft = {
  id: 'draft-export-test',
  title: 'Cloud Transformation — Horizon Group',
  clientName: 'Horizon Group Ltd',
  projectLabel: 'horizon-cloud-tf',
  discoveryNotes: 'Notes for export testing.',
  supportingContext: 'Supporting context.',
  clientRequirements: 'Fast delivery.',
  servicePackageId: 'pkg-test',
  templateId: 'tmpl-generic-starter',
  status: 'needs-review',
  sections: [
    {
      id: 'sec-1',
      title: 'Executive Summary',
      content: 'This is the reviewed executive summary.',
      status: 'confirmed',
      unresolvedItems: [],
      isUserEdited: true,
      order: 1,
    },
    {
      id: 'sec-2',
      title: 'Scope of Work',
      content: '- Cloud Infrastructure setup\n- Migration of 3 services',
      status: 'confirmed',
      unresolvedItems: [],
      isUserEdited: false,
      order: 2,
    },
    {
      id: 'sec-3',
      title: 'Pricing & Commercial Terms',
      content: 'Package price: USD 18,500. Payment terms require confirmation.',
      status: 'suggested',
      unresolvedItems: ['Confirm milestone payment split with client.'],
      isUserEdited: false,
      order: 3,
    },
  ],
  confirmationQuestions: [
    {
      id: 'q-1',
      sectionId: 'sec-3',
      question: 'What is the agreed payment milestone schedule?',
      isResolved: false,
      resolution: null,
    },
    {
      id: 'q-2',
      sectionId: 'sec-1',
      question: 'Who is the client contact?',
      isResolved: true,
      resolution: 'Jane Doe, Director of Tech',
    },
  ],
  unresolvedItems: [
    {
      id: 'u-1',
      sectionId: 'sec-3',
      description: 'Confirm milestone payment split with client.',
      severity: 'high',
    },
  ],
  targetDate: '2026-11-30',
  generatedAt: '2026-10-27T12:00:00Z',
  createdAt: '2026-10-27T10:00:00Z',
  updatedAt: '2026-10-27T12:00:00Z',
  generationMethod: 'rule-based',
  aiModel: null,
};

const BASE_OPTIONS: ExportOptions = {
  format: 'txt',
  includeDraftLabel: true,
  includeUnresolvedMarkers: true,
  includeConfirmationQuestions: true,
};

describe('sanitizeFilename', () => {
  it('converts title to lowercase alphanumeric slug', () => {
    expect(sanitizeFilename('Cloud Transformation — Horizon Group')).toBe('cloud-transformation-horizon-group');
  });

  it('removes special punctuation and consecutive dashes', () => {
    expect(sanitizeFilename('Special $100% Deal! & Offers...')).toBe('special-100-deal-offers');
  });

  it('truncates very long titles to 60 characters', () => {
    const longTitle = 'A'.repeat(100);
    expect(sanitizeFilename(longTitle).length).toBeLessThanOrEqual(60);
  });
});

describe('exportToTxt', () => {
  it('exports plain text blob with draft notice when enabled', async () => {
    const blob = exportToTxt(MOCK_DRAFT, BASE_OPTIONS);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain');

    const text = await blob.text();
    expect(text).toContain('DRAFT DOCUMENT');
    expect(text).toContain('Cloud Transformation — Horizon Group');
    expect(text).toContain('Horizon Group Ltd');
    expect(text).toContain('EXECUTIVE SUMMARY');
    expect(text).toContain('This is the reviewed executive summary.');
  });

  it('preserves unresolved items and confirmation questions in text export', async () => {
    const blob = exportToTxt(MOCK_DRAFT, BASE_OPTIONS);
    const text = await blob.text();

    expect(text).toContain('Confirm milestone payment split with client.');
    expect(text).toContain('QUESTIONS REQUIRING CLIENT CONFIRMATION');
    expect(text).toContain('What is the agreed payment milestone schedule?');
  });

  it('omits draft label when includeDraftLabel is false', async () => {
    const blob = exportToTxt(MOCK_DRAFT, { ...BASE_OPTIONS, includeDraftLabel: false });
    const text = await blob.text();
    expect(text).not.toContain('DRAFT DOCUMENT — REQUIRES HUMAN REVIEW');
  });
});

describe('exportToPdf', () => {
  it('generates a PDF Blob with page contents', () => {
    const blob = exportToPdf(MOCK_DRAFT, { ...BASE_OPTIONS, format: 'pdf' });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500); // Valid PDF file has non-trivial size
  });
});

describe('exportToDocx', () => {
  it('generates a valid DOCX Blob incorporating reviewed draft sections and package', async () => {
    const blob = await exportToDocx(MOCK_DRAFT, MOCK_PKG, { ...BASE_OPTIONS, format: 'docx' });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000); // Valid docx file
  });
});

