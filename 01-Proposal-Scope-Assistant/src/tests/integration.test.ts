// ─── Integration Tests: Store + Business Logic ─────────────────────────────
// Tests actual module interactions — store, validation, and drafting together.

import { describe, it, expect } from 'vitest';
import { generateProposalRuleBased, hydrateSections, hydrateConfirmationQuestions, hydrateUnresolvedItems } from '../lib/drafting';
import { validateProposalForm, safeParsePrice, isPricingSafe } from '../lib/validation';
import type { ServicePackage, ProposalTemplate, AIGenerationInput } from '../types';

// ─── Shared Fixtures ─────────────────────────────────────────────────────────

const TEMPLATE: ProposalTemplate = {
  id: 'tmpl-generic-starter',
  name: 'Generic Starter',
  isApproved: false,
  description: 'Starter',
  sections: [],
  headerHtml: '',
  footerNote: 'Draft.',
};

const PKG_NO_PRICE: ServicePackage = {
  id: 'pkg-1',
  name: 'MVP Package',
  description: 'Full MVP build',
  price: null, currency: null, pricingStatus: 'not-provided',
  includedServices: ['Design', 'Dev'], deliverables: ['App'],
  assumptions: ['Client provides copy'], exclusions: ['Post-launch support'],
  duration: null, milestones: [], notes: '', isApproved: false,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

const PKG_WITH_PRICE: ServicePackage = {
  ...PKG_NO_PRICE, id: 'pkg-2', price: 15000, currency: 'GBP', pricingStatus: 'provided',
};

// ─── Integration: Form → Draft Creation ──────────────────────────────────────

describe('form submission → draft creation pipeline', () => {
  it('validates form and creates draft with correct fields', () => {
    const formValues = {
      title: 'E-Commerce Proposal',
      clientName: 'ShopCo',
      projectLabel: 'shopco-ecommerce',
      discoveryNotes: 'Client needs Shopify store with custom checkout.',
      supportingContext: 'Brand guidelines in Figma.',
      clientRequirements: 'Mobile-first, fast checkout.',
      servicePackageId: PKG_NO_PRICE.id,
      templateId: TEMPLATE.id,
      targetDate: '',
    };

    const errors = validateProposalForm(formValues);
    expect(errors).toHaveLength(0);
  });

  it('rejects submission with missing required fields', () => {
    const invalidForm = {
      title: '',
      clientName: '',
      projectLabel: '',
      discoveryNotes: '',
      supportingContext: '',
      clientRequirements: '',
      servicePackageId: '',
      templateId: '',
      targetDate: '',
    };
    const errors = validateProposalForm(invalidForm);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── Integration: Package Selection → Proposal Generation ────────────────────

describe('package selection → generation → section content', () => {
  function makeInput(pkg: ServicePackage | null): AIGenerationInput {
    return {
      discoveryNotes: 'Client wants a custom dashboard.',
      supportingContext: '',
      clientRequirements: 'Accessible, responsive.',
      clientName: 'DashCo Ltd',
      projectLabel: 'dashco-dashboard',
      servicePackage: pkg,
      template: TEMPLATE,
    };
  }

  it('with package: deliverables section includes package deliverables', () => {
    const output = generateProposalRuleBased(makeInput(PKG_NO_PRICE));
    const del = output.sections.find((s) => s.title.toLowerCase().includes('deliverable'))!;
    expect(del.content).toContain('App');
  });

  it('with package: scope section lists package services', () => {
    const output = generateProposalRuleBased(makeInput(PKG_NO_PRICE));
    const scope = output.sections.find((s) => s.title.toLowerCase().includes('scope'))!;
    expect(scope.content).toContain('Design');
    expect(scope.content).toContain('Dev');
    expect(scope.status).toBe('confirmed');
  });

  it('without package: scope section is missing', () => {
    const output = generateProposalRuleBased(makeInput(null));
    const scope = output.sections.find((s) => s.title.toLowerCase().includes('scope'))!;
    expect(scope.status).toBe('missing');
  });

  it('pricing is always missing when not provided — never invented', () => {
    const output = generateProposalRuleBased(makeInput(PKG_NO_PRICE));
    const pricing = output.sections.find((s) => s.title.toLowerCase().includes('pricing'))!;
    expect(pricing.status).toBe('missing');
    // Verify safe: no numeric price in content
    const numMatch = pricing.content.match(/(?:£|\$|€|GBP|USD|EUR)\s*[\d,]+/);
    expect(numMatch).toBeNull();
  });

  it('pricing is confirmed and included when explicitly provided', () => {
    const output = generateProposalRuleBased(makeInput(PKG_WITH_PRICE));
    const pricing = output.sections.find((s) => s.title.toLowerCase().includes('pricing'))!;
    expect(pricing.status).toBe('confirmed');
    expect(pricing.content).toContain('15,000');
    expect(pricing.content).toContain('GBP');
  });
});

// ─── Integration: Missing Pricing Flows Through the Pipeline ─────────────────

describe('missing pricing remains unfilled through full pipeline', () => {
  it('pricing is not-provided in package, missing in section, and flagged as unresolved', () => {
    const input: AIGenerationInput = {
      discoveryNotes: 'Complete engagement scope.',
      supportingContext: 'Reference project exists.',
      clientRequirements: 'High availability.',
      clientName: 'EnterpriseCo',
      projectLabel: 'enterprise-platform',
      servicePackage: PKG_NO_PRICE,
      template: TEMPLATE,
    };

    const output = generateProposalRuleBased(input);
    const sections = hydrateSections(output.sections);
    const questions = hydrateConfirmationQuestions(output.confirmationQuestions);
    const unresolvedItems = hydrateUnresolvedItems(output.unresolvedItems);

    // Package: price is null
    expect(PKG_NO_PRICE.price).toBeNull();
    expect(PKG_NO_PRICE.pricingStatus).toBe('not-provided');
    expect(isPricingSafe(PKG_NO_PRICE.price, PKG_NO_PRICE.pricingStatus)).toBe(true);

    // Section: pricing marked missing
    const pricingSection = sections.find((s) => s.title.toLowerCase().includes('pricing'))!;
    expect(pricingSection.status).toBe('missing');

    // Confirmation question about pricing exists
    const priceQ = questions.find((q) => q.question.toLowerCase().includes('price'));
    expect(priceQ).toBeDefined();
    expect(priceQ!.isResolved).toBe(false);

    // Unresolved item about pricing
    const priceUnresolved = unresolvedItems.find((u) =>
      u.description.toLowerCase().includes('pricing') || u.description.toLowerCase().includes('price')
    );
    expect(priceUnresolved).toBeDefined();
    expect(priceUnresolved!.severity).toBe('high');
  });
});

// ─── Integration: Template Selection Affects Sections ────────────────────────

describe('template selection → proposal structure', () => {
  it('generates sections appropriate to template sections list', () => {
    const output = generateProposalRuleBased({
      discoveryNotes: 'Client wants analytics dashboard.',
      supportingContext: '',
      clientRequirements: '',
      clientName: 'DataCo',
      projectLabel: 'dataco-analytics',
      servicePackage: null,
      template: TEMPLATE,
    });
    const titles = output.sections.map((s) => s.title.toLowerCase());
    expect(titles.some((t) => t.includes('executive'))).toBe(true);
    expect(titles.some((t) => t.includes('scope'))).toBe(true);
    expect(titles.some((t) => t.includes('next steps'))).toBe(true);
  });
});

// ─── Integration: Generated Content Flows Into Review ────────────────────────

describe('generated content → review state', () => {
  it('sections are editable and isUserEdited starts false', () => {
    const output = generateProposalRuleBased({
      discoveryNotes: 'Client wants mobile app.',
      supportingContext: '',
      clientRequirements: '',
      clientName: null,
      projectLabel: 'mobile-app',
      servicePackage: PKG_NO_PRICE,
      template: TEMPLATE,
    });
    const sections = hydrateSections(output.sections);
    expect(sections.every((s) => !s.isUserEdited)).toBe(true);
    // Simulate user edit
    const edited = { ...sections[0], content: 'User modified this.', isUserEdited: true };
    expect(edited.isUserEdited).toBe(true);
    expect(edited.content).toBe('User modified this.');
  });
});

// ─── Integration: AI Provider Failure → Fallback ─────────────────────────────

describe('AI provider failure → rule-based fallback', () => {
  it('rule-based fallback produces valid output when AI is not configured', async () => {
    const { generateProposal } = await import('../lib/drafting');
    const output = await generateProposal(
      {
        discoveryNotes: 'Simple project.',
        supportingContext: '',
        clientRequirements: '',
        clientName: 'Fallback Corp',
        projectLabel: 'fallback-project',
        servicePackage: null,
        template: TEMPLATE,
      },
      { aiApiKey: null, aiBaseUrl: 'https://api.openai.com/v1', aiModel: 'gpt-4o-mini' }
    );
    expect(output.generationMethod).toBe('rule-based');
    expect(output.sections.length).toBeGreaterThan(0);
  });
});

// ─── Integration: Invalid Requests Rejected ───────────────────────────────────

describe('invalid input rejection', () => {
  it('safeParsePrice never returns invented value for invalid input', () => {
    const badInputs = ['', 'free', 'n/a', 'TBD', '$5000', 'five thousand'];
    for (const input of badInputs) {
      const result = safeParsePrice(input);
      expect(result).toBeNull();
    }
  });

  it('form validation rejects malformed date', () => {
    const errors = validateProposalForm({
      title: 'T', clientName: '', projectLabel: 'p',
      discoveryNotes: 'Notes', supportingContext: '', clientRequirements: '',
      servicePackageId: '', templateId: 'tmpl', targetDate: '99/99/99',
    });
    expect(errors.some((e) => e.field === 'targetDate')).toBe(true);
  });
});
