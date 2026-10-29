// ─── Zustand Store ─────────────────────────────────────────────────────────
// Global application state with localStorage persistence.
// Only serialisable data is stored; sensitive keys are never persisted here.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  ProposalDraft,
  ServicePackage,
  ProposalTemplate,
  AppNotification,
  DraftStatus,
  PackageFormValues,
  ProposalSection,
  ConfirmationQuestion,
  UnresolvedItem,
} from '../types';
import { DEMO_PACKAGES, BUILT_IN_TEMPLATES, DEMO_PROPOSALS } from '../lib/sampleData';
import { safeParsePrice } from '../lib/validation';

// ─── State Shape ─────────────────────────────────────────────────────────────

export interface AppState {
  // Data
  drafts: ProposalDraft[];
  packages: ServicePackage[];
  templates: ProposalTemplate[];
  notifications: AppNotification[];

  // AI configuration — API key is intentionally NOT persisted
  aiApiKey: string;
  aiBaseUrl: string;
  aiModel: string;

  // Active draft being edited
  activeDraftId: string | null;

  // Actions — drafts
  createDraft: (draft: Omit<ProposalDraft, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateDraft: (id: string, updates: Partial<ProposalDraft>) => void;
  deleteDraft: (id: string) => void;
  setActiveDraft: (id: string | null) => void;
  updateDraftStatus: (id: string, status: DraftStatus) => void;
  updateSection: (draftId: string, sectionId: string, content: string) => void;
  resolveQuestion: (draftId: string, questionId: string, resolution: string) => void;
  addSections: (draftId: string, sections: ProposalSection[]) => void;
  addConfirmationQuestions: (draftId: string, questions: ConfirmationQuestion[]) => void;
  addUnresolvedItems: (draftId: string, items: UnresolvedItem[]) => void;

  // Actions — packages
  createPackage: (values: PackageFormValues) => string;
  updatePackage: (id: string, values: PackageFormValues) => void;
  deletePackage: (id: string) => void;

  // Actions — notifications
  addNotification: (n: Omit<AppNotification, 'id'>) => void;
  dismissNotification: (id: string) => void;

  // AI config (in-memory only — never persisted)
  setAiConfig: (key: string, baseUrl: string, model: string) => void;
  clearAiConfig: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      drafts: DEMO_PROPOSALS,
      packages: DEMO_PACKAGES,
      templates: BUILT_IN_TEMPLATES,
      notifications: [],
      aiApiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_API_KEY) || '',
      aiBaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_BASE_URL) || 'https://api.openai.com/v1',
      aiModel: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_MODEL) || 'gpt-4o-mini',
      activeDraftId: null,

      // ─── Draft Actions ───────────────────────────────────────────────────

      createDraft: (draft) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newDraft: ProposalDraft = {
          ...draft,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ drafts: [newDraft, ...s.drafts] }));
        return id;
      },

      updateDraft: (id, updates) => {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      deleteDraft: (id) => {
        set((s) => ({
          drafts: s.drafts.filter((d) => d.id !== id),
          activeDraftId: s.activeDraftId === id ? null : s.activeDraftId,
        }));
      },

      setActiveDraft: (id) => set({ activeDraftId: id }),

      updateDraftStatus: (id, status) => {
        get().updateDraft(id, { status });
      },

      updateSection: (draftId, sectionId, content) => {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === draftId
              ? {
                  ...d,
                  updatedAt: new Date().toISOString(),
                  sections: d.sections.map((sec) =>
                    sec.id === sectionId
                      ? { ...sec, content, isUserEdited: true }
                      : sec
                  ),
                }
              : d
          ),
        }));
      },

      resolveQuestion: (draftId, questionId, resolution) => {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === draftId
              ? {
                  ...d,
                  updatedAt: new Date().toISOString(),
                  confirmationQuestions: d.confirmationQuestions.map((q) =>
                    q.id === questionId
                      ? { ...q, isResolved: true, resolution }
                      : q
                  ),
                }
              : d
          ),
        }));
      },

      addSections: (draftId, sections) => {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === draftId
              ? { ...d, sections, updatedAt: new Date().toISOString(), generatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      addConfirmationQuestions: (draftId, questions) => {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === draftId ? { ...d, confirmationQuestions: questions } : d
          ),
        }));
      },

      addUnresolvedItems: (draftId, items) => {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === draftId ? { ...d, unresolvedItems: items } : d
          ),
        }));
      },

      // ─── Package Actions ─────────────────────────────────────────────────

      createPackage: (values) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const price = safeParsePrice(values.price);
        const pkg: ServicePackage = {
          id,
          name: values.name.trim(),
          description: values.description.trim(),
          price,
          currency: price !== null ? values.currency.toUpperCase().trim() : null,
          pricingStatus: price !== null ? 'provided' : 'not-provided',
          includedServices: values.includedServices
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          deliverables: values.deliverables
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          assumptions: values.assumptions
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          exclusions: values.exclusions
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          duration: values.duration.trim() || null,
          milestones: [],
          notes: values.notes.trim(),
          isApproved: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ packages: [...s.packages, pkg] }));
        return id;
      },

      updatePackage: (id, values) => {
        const price = safeParsePrice(values.price);
        set((s) => ({
          packages: s.packages.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: values.name.trim(),
                  description: values.description.trim(),
                  price,
                  currency: price !== null ? values.currency.toUpperCase().trim() : null,
                  pricingStatus: price !== null ? 'provided' : ('not-provided' as const),
                  includedServices: values.includedServices.split('\n').map((s) => s.trim()).filter(Boolean),
                  deliverables: values.deliverables.split('\n').map((s) => s.trim()).filter(Boolean),
                  assumptions: values.assumptions.split('\n').map((s) => s.trim()).filter(Boolean),
                  exclusions: values.exclusions.split('\n').map((s) => s.trim()).filter(Boolean),
                  duration: values.duration.trim() || null,
                  notes: values.notes.trim(),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      deletePackage: (id) => {
        set((s) => ({ packages: s.packages.filter((p) => p.id !== id) }));
      },

      // ─── Notifications ────────────────────────────────────────────────────

      addNotification: (n) => {
        const id = uuidv4();
        set((s) => ({ notifications: [...s.notifications, { ...n, id }] }));
        if (n.autoDismissMs) {
          setTimeout(() => {
            get().dismissNotification(id);
          }, n.autoDismissMs);
        }
      },

      dismissNotification: (id) => {
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
      },

      // ─── AI Config (in-memory; not persisted) ────────────────────────────

      setAiConfig: (key, baseUrl, model) => {
        set({ aiApiKey: key, aiBaseUrl: baseUrl, aiModel: model });
      },

      clearAiConfig: () => {
        set({ aiApiKey: '', aiBaseUrl: 'https://api.openai.com/v1', aiModel: 'gpt-4o-mini' });
      },
    }),
    {
      name: 'scalezix-proposal-assistant',
      storage: createJSONStorage(() => localStorage),
      // Deliberately exclude aiApiKey from persistence — never store secrets in localStorage
      partialize: (state) => ({
        drafts: state.drafts,
        packages: state.packages,
        templates: state.templates,
        aiBaseUrl: state.aiBaseUrl,
        aiModel: state.aiModel,
        // aiApiKey intentionally excluded
      }),
    }
  )
);
