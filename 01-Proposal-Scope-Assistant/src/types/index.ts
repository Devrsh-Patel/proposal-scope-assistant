// ─── Core Domain Types ─────────────────────────────────────────────────────

export type DraftStatus = 'draft' | 'needs-review' | 'ready-for-human-review';

export type SectionStatus = 'confirmed' | 'suggested' | 'missing' | 'unresolved';

export type PricingStatus = 'provided' | 'not-provided';

// ─── Service Package ────────────────────────────────────────────────────────

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  /** Price is NEVER invented. If absent, status is 'not-provided'. */
  price: number | null;
  currency: string | null;
  pricingStatus: PricingStatus;
  includedServices: string[];
  deliverables: string[];
  assumptions: string[];
  exclusions: string[];
  /** Duration string only when explicitly supplied */
  duration: string | null;
  milestones: Milestone[];
  notes: string;
  /** True only when explicitly marked by the user */
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  /** Only when explicitly supplied */
  dueDate: string | null;
  isUserProvided: boolean;
}

// ─── Proposal Template ──────────────────────────────────────────────────────

export interface ProposalTemplate {
  id: string;
  name: string;
  /** True only when explicitly marked approved by the user */
  isApproved: boolean;
  description: string;
  sections: string[];
  headerHtml: string;
  footerNote: string;
}

// ─── Proposal Section ───────────────────────────────────────────────────────

export interface ProposalSection {
  id: string;
  title: string;
  content: string;
  status: SectionStatus;
  /** Unresolved questions/items in this section */
  unresolvedItems: string[];
  isUserEdited: boolean;
  order: number;
}

// ─── Proposal Draft ─────────────────────────────────────────────────────────

export interface ProposalDraft {
  id: string;
  title: string;
  clientName: string | null;
  projectLabel: string;
  discoveryNotes: string;
  supportingContext: string;
  clientRequirements: string;
  servicePackageId: string | null;
  templateId: string;
  status: DraftStatus;
  sections: ProposalSection[];
  /** All questions requiring client confirmation */
  confirmationQuestions: ConfirmationQuestion[];
  /** All unresolved items across the proposal */
  unresolvedItems: UnresolvedItem[];
  targetDate: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Source of AI generation or rule-based fallback */
  generationMethod: 'ai' | 'rule-based' | 'not-generated';
  aiModel: string | null;
}

export interface ConfirmationQuestion {
  id: string;
  sectionId: string;
  question: string;
  isResolved: boolean;
  resolution: string | null;
}

export interface UnresolvedItem {
  id: string;
  sectionId: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

// ─── Form State ─────────────────────────────────────────────────────────────

export interface ProposalFormValues {
  title: string;
  clientName: string;
  projectLabel: string;
  discoveryNotes: string;
  supportingContext: string;
  clientRequirements: string;
  servicePackageId: string;
  templateId: string;
  targetDate: string;
}

export interface PackageFormValues {
  name: string;
  description: string;
  price: string;
  currency: string;
  includedServices: string;
  deliverables: string;
  assumptions: string;
  exclusions: string;
  duration: string;
  notes: string;
}

// ─── AI Generation ──────────────────────────────────────────────────────────

export interface AIGenerationInput {
  discoveryNotes: string;
  supportingContext: string;
  clientRequirements: string;
  clientName: string | null;
  projectLabel: string;
  servicePackage: ServicePackage | null;
  template: ProposalTemplate;
}

export interface AIGenerationOutput {
  sections: Omit<ProposalSection, 'id' | 'isUserEdited'>[];
  confirmationQuestions: Omit<ConfirmationQuestion, 'id' | 'isResolved' | 'resolution'>[];
  unresolvedItems: Omit<UnresolvedItem, 'id'>[];
  generationMethod: 'ai' | 'rule-based';
  aiModel: string | null;
  warnings: string[];
}

// ─── Export ─────────────────────────────────────────────────────────────────

export type ExportFormat = 'docx' | 'pdf' | 'txt';

export interface ExportOptions {
  format: ExportFormat;
  includeDraftLabel: boolean;
  includeUnresolvedMarkers: boolean;
  includeConfirmationQuestions: boolean;
}

// ─── App State ──────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  autoDismissMs?: number;
}
