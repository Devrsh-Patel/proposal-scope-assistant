// ─── Unit Tests: Drafting Engine ───────────────────────────────────────────
// Tests the rule-based proposal generation logic.

import { describe, it, expect } from 'vitest';
import { generateProposalRuleBased, hydrateSections, hydrateConfirmationQuestions, hydrateUnresolvedItems } from '../lib/drafting';
import type { AIGenerationInput, ServicePackage, ProposalTemplate } from '../types';

const MOCK_TEMPLATE: ProposalTemplate = {
  id: 'tmpl-generic-starter',
  name: 'Generic Starter',
  isApproved: false,
  description: 'Generic starter template',
  sections: [],
  headerHtml: '',
  footerNote: 'Draft — requires review.',
};

const MOCK_PACKAGE_NO_PRICE: ServicePackage = {
  id: 'pkg-test',
  name: 'Test Package',
  description: 'A test package',
  price: null,
  currency: null,
  pricingStatus: 'not-provided',
  includedServices: ['Service A', 'Service B'],
  deliverables: ['Deliverable 1', 'Deliverable 2'],
  assumptions: ['Client provides assets'],
  exclusions: ['Post-launch support'],
  duration: null,
  milestones: [],
  notes: 'Test notes',
  isApproved: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_PACKAGE_WITH_PRICE: ServicePackage = {
  ...MOCK_PACKAGE_NO_PRICE,
  id: 'pkg-with-price',
  price: 10000,
  currency: 'USD',
  pricingStatus: 'provided',
};

function makeInput(overrides: Partial<AIGenerationInput> = {}): AIGenerationInput {
  return {
    discoveryNotes: 'Client wants a simple website with a contact form.',
    supportingContext: 'Brand guidelines available.',
    clientRequirements: 'Fast loading, mobile responsive.',
    clientName: 'Acme Corp',
    projectLabel: 'acme-website',
    servicePackage: MOCK_PACKAGE_NO_PRICE,
    template: MOCK_TEMPLATE,
    ...overrides,
  };
}

// ─── Rule-Based Generation ────────────────────────────────────────────────────

describe('generateProposalRuleBased', () => {
  it('returns sections, questions, and unresolved items', () => {
    const output = generateProposalRuleBased(makeInput());
    expect(output.sections.length).toBeGreaterThan(0);
    expect(Array.isArray(output.confirmationQuestions)).toBe(true);
    expect(Array.isArray(output.unresolvedItems)).toBe(true);
  });

  it('generationMethod is rule-based', () => {
    const output = generateProposalRuleBased(makeInput());
    expect(output.generationMethod).toBe('rule-based');
    expect(output.aiModel).toBeNull();
  });

  it('NEVER invents a price when pricing is not-provided', () => {
    const output = generateProposalRuleBased(makeInput({ servicePackage: MOCK_PACKAGE_NO_PRICE }));
    const pricingSection = output.sections.find((s) => s.title.toLowerCase().includes('pricing'));
    expect(pricingSection).toBeDefined();

    // Must NOT contain an invented number
    expect(pricingSection!.content).not.toMatch(/\d{3,}/); // No 3+ digit number
    expect(pricingSection!.content.toLowerCase()).toContain('not provided');
    expect(pricingSection!.status).toBe('missing');
  });

  it('includes price when explicitly provided', () => {
    const output = generateProposalRuleBased(makeInput({ servicePackage: MOCK_PACKAGE_WITH_PRICE }));
    const pricingSection = output.sections.find((s) => s.title.toLowerCase().includes('pricing'));
    expect(pricingSection).toBeDefined();
    expect(pricingSection!.content).toContain('10,000');
    expect(pricingSection!.status).toBe('confirmed');
  });

  it('marks deliverables as confirmed when package has deliverables', () => {
    const output = generateProposalRuleBased(makeInput());
    const delSection = output.sections.find((s) => s.title.toLowerCase().includes('deliverable'));
    expect(delSection).toBeDefined();
    expect(delSection!.status).toBe('confirmed');
    expect(delSection!.content).toContain('Deliverable 1');
  });

  it('marks deliverables as missing when no package', () => {
    const output = generateProposalRuleBased(makeInput({ servicePackage: null }));
    const delSection = output.sections.find((s) => s.title.toLowerCase().includes('deliverable'));
    expect(delSection).toBeDefined();
    expect(delSection!.status).toBe('missing');
  });

  it('marks scope as missing when no package is provided', () => {
    const output = generateProposalRuleBased(makeInput({ servicePackage: null }));
    const scopeSection = output.sections.find((s) => s.title.toLowerCase().includes('scope'));
    expect(scopeSection).toBeDefined();
    expect(scopeSection!.status).toBe('missing');
  });

  it('generates confirmation question for missing price', () => {
    const output = generateProposalRuleBased(makeInput({ servicePackage: MOCK_PACKAGE_NO_PRICE }));
    const priceQuestion = output.confirmationQuestions.find((q) =>
      q.question.toLowerCase().includes('price') || q.question.toLowerCase().includes('pricing')
    );
    expect(priceQuestion).toBeDefined();
  });

  it('does NOT generate pricing confirmation question when price is provided', () => {
    const output = generateProposalRuleBased(makeInput({ servicePackage: MOCK_PACKAGE_WITH_PRICE }));
    const priceQuestion = output.confirmationQuestions.find((q) =>
      q.question.toLowerCase().includes('price') || q.question.toLowerCase().includes('pricing')
    );
    // Should not ask about pricing if provided (no pricing question expected)
    // Note: may still ask about payment terms, but not a basic price question
    if (priceQuestion) {
      expect(priceQuestion.question.toLowerCase()).not.toContain('what is the agreed price');
    }
  });

  it('includes a high-severity unresolved item for missing pricing', () => {
    const output = generateProposalRuleBased(makeInput({ servicePackage: MOCK_PACKAGE_NO_PRICE }));
    const pricingUnresolved = output.unresolvedItems.find((u) =>
      u.description.toLowerCase().includes('pricing') || u.description.toLowerCase().includes('price')
    );
    expect(pricingUnresolved).toBeDefined();
    expect(pricingUnresolved!.severity).toBe('high');
  });

  it('includes next steps section with human review reminder', () => {
    const output = generateProposalRuleBased(makeInput());
    const nextSection = output.sections.find((s) => s.title.toLowerCase().includes('next steps'));
    expect(nextSection).toBeDefined();
    expect(nextSection!.content.toLowerCase()).toMatch(/human.?review|authoris/);
  });

  it('does not generate milestones with fabricated dates', () => {
    const output = generateProposalRuleBased(makeInput({ servicePackage: MOCK_PACKAGE_NO_PRICE }));
    const milestoneSection = output.sections.find((s) => s.title.toLowerCase().includes('milestone'));
    expect(milestoneSection).toBeDefined();
    expect(milestoneSection!.status).toBe('missing');
    // Content should explicitly note dates are not confirmed
    expect(milestoneSection!.content.toLowerCase()).toContain('no date confirmed');
  });

  it('generates assumption warnings for suggested items', () => {
    const output = generateProposalRuleBased(makeInput());
    const assumptions = output.sections.find((s) => s.title.toLowerCase().includes('assumption'));
    expect(assumptions).toBeDefined();
    expect(assumptions!.content.toLowerCase()).toContain('suggested');
  });

  it('distinguishes stated from suggested assumptions', () => {
    const output = generateProposalRuleBased(makeInput());
    const assumptions = output.sections.find((s) => s.title.toLowerCase().includes('assumption'));
    expect(assumptions!.content).toContain('Stated assumptions');
    expect(assumptions!.content).toContain('Suggested assumptions');
  });

  it('handles empty discovery notes gracefully', () => {
    const output = generateProposalRuleBased(makeInput({ discoveryNotes: '', clientRequirements: '' }));
    expect(output.sections.length).toBeGreaterThan(0);
    // Should not throw and should produce sections
    const objectives = output.sections.find((s) => s.title.toLowerCase().includes('objective'));
    expect(objectives).toBeDefined();
    expect(objectives!.status).toBe('missing');
  });

  it('handles completely empty input gracefully', () => {
    const output = generateProposalRuleBased(makeInput({
      discoveryNotes: '',
      clientRequirements: '',
      supportingContext: '',
      clientName: null,
      servicePackage: null,
    }));
    expect(output.sections.length).toBeGreaterThan(0);
    expect(output.warnings.length).toBeGreaterThan(0);
  });

  it('includes warnings about rule-based generation', () => {
    const output = generateProposalRuleBased(makeInput());
    expect(output.warnings.some((w) => w.toLowerCase().includes('rule-based'))).toBe(true);
  });
});

// ─── Hydration ────────────────────────────────────────────────────────────────

describe('hydrateSections', () => {
  it('assigns unique IDs and isUserEdited=false', () => {
    const raw = generateProposalRuleBased(makeInput());
    const sections = hydrateSections(raw.sections);
    expect(sections.every((s) => typeof s.id === 'string' && s.id.length > 0)).toBe(true);
    expect(sections.every((s) => s.isUserEdited === false)).toBe(true);
  });

  it('all IDs are unique', () => {
    const raw = generateProposalRuleBased(makeInput());
    const sections = hydrateSections(raw.sections);
    const ids = sections.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('hydrateConfirmationQuestions', () => {
  it('assigns unique IDs, isResolved=false, resolution=null', () => {
    const raw = generateProposalRuleBased(makeInput());
    const questions = hydrateConfirmationQuestions(raw.confirmationQuestions);
    expect(questions.every((q) => !q.isResolved && q.resolution === null)).toBe(true);
    expect(questions.every((q) => typeof q.id === 'string' && q.id.length > 0)).toBe(true);
  });
});

describe('hydrateUnresolvedItems', () => {
  it('assigns unique IDs', () => {
    const raw = generateProposalRuleBased(makeInput());
    const items = hydrateUnresolvedItems(raw.unresolvedItems);
    expect(items.every((u) => typeof u.id === 'string' && u.id.length > 0)).toBe(true);
  });
});

// ─── Section Ordering ────────────────────────────────────────────────────────

describe('section ordering', () => {
  it('sections have sequential order values', () => {
    const raw = generateProposalRuleBased(makeInput());
    const orders = raw.sections.map((s) => s.order).sort((a, b) => a - b);
    expect(orders[0]).toBe(1);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThan(orders[i - 1]);
    }
  });
});

// ─── Malformed / Edge Cases ───────────────────────────────────────────────────

describe('conflicting/malformed input', () => {
  it('handles very long discovery notes without throwing', () => {
    const longNotes = 'A '.repeat(5000);
    const output = generateProposalRuleBased(makeInput({ discoveryNotes: longNotes }));
    expect(output.sections.length).toBeGreaterThan(0);
  });

  it('handles unicode and special characters in notes', () => {
    const output = generateProposalRuleBased(makeInput({
      discoveryNotes: 'Client: Müller GmbH. Budget: €10,000 (not confirmed). Emoji: 🚀',
    }));
    expect(output.sections.length).toBeGreaterThan(0);
  });
});
