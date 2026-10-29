# Scalezix Proposal & Scope-of-Work Drafting Assistant

> **AI Developer Intern Project 1** — Scalezix Ventures LLP  
> An editorial-grade, AI-assisted proposal and scope-of-work workspace designed for client-services teams. Converts discovery notes and service package parameters into structured, reviewable draft proposals with guaranteed commercial safety, fact traceability, and multi-format document export.

---

## 1. Overview and Core Features

The **Proposal & Scope-of-Work Assistant** is a professional client-services application built to accelerate proposal creation without sacrificing human oversight or risking legal and financial commitments.

### Core Value Proposition
- **Assistive, Never Autonomous Finalisation**: The application assists human team members. It never silently finalises contracts, approves commercial terms, or sends documents to clients.
- **Strict Commercial Safety**: Pricing, discounts, payment schedules, and dates are **never invented**. Missing commercial terms are explicitly flagged as *"Not provided — confirmation required"*.
- **Fact vs. Suggestion Distinction**: User-provided package facts and client requirements are clearly distinguished from AI-suggested or rule-suggested draft wording.
- **Traceable Unresolved Items**: Real gaps in scope, milestones, and client responsibilities are tracked with high/medium/low severity badges and dedicated client confirmation questions.
- **Multi-Format Export**: Generates client-ready drafts in **DOCX**, **PDF**, and **Plain Text (TXT)** formats, preserving draft notices and uncertainty markers.
- **Dual Engine Architecture**: Full functionality operates deterministically via rule-based logic out-of-the-box, with optional OpenAI-compatible AI acceleration (GPT-4o, Claude via proxy, Ollama, Groq).

---

## 2. Screens and Workflows Implemented

| Screen / Workflow | Route | Description |
|---|---|---|
| **Dashboard** | `/` | Operational workspace displaying proposal metrics (Total, Draft, Needs Review, Ready for Review, Packages), quick actions, responsible AI disclaimers, and recent proposals. |
| **Proposals List** | `/proposals` | Searchable, status-filtered repository of all proposal drafts with metadata, generation method indicator, unresolved counters, and delete confirmation dialogs. |
| **New Proposal Creation** | `/proposals/new` | Multi-field proposal intake form with inline validation, prompt-injection detection alerts, service package selection, and template selection. |
| **Proposal Review & Editor** | `/proposals/:id` | Dual-mode workspace (Interactive Section Editor and Document Preview) featuring collapsible sections, inline content editing with `[Edited]` tracking, status management, unresolved item register, inline question resolution, and one-click exports (DOCX, PDF, TXT). |
| **Service Packages Management** | `/packages` | Catalogue of standard offerings with pricing status flags (*Price not set* vs. explicit pricing), approval badges, accordion inspection, creation, editing, and deletion. |
| **Settings & Safeguards** | `/settings` | In-memory session AI configuration (API key, base URL, model), local storage limitation explanations, and an 8-point Responsible AI Safeguards register. |

---

## 3. Technology Stack and Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript 7 (strict type safety, zero `any`).
- **Build Tool**: Vite 8 (ESM, lightning-fast HMR and optimised roll-up bundling).
- **Routing**: React Router DOM v7 (nested route layout, URL parameters, navigation guards).
- **State Management**: Zustand v5 with selective `persist` middleware (session-safe partialization excluding sensitive API keys).
- **Styling System**: Handcrafted CSS Design Tokens in `src/index.css` following an editorial direction:
  - *Color Palette*: Warm off-white canvas (`#F7F5F2`), Deep Ink Navy (`#1B2A4A`), and Tasteful Teal Accent (`#007A75`).
  - *Typography*: Inter (body typography) + DM Serif Display (headings).
  - *Responsiveness*: Fluid layouts tested from mobile (375px) to desktop (1440px+).
- **Iconography**: Lucide React.
- **Document Generation**:
  - `docx`: Native Word document generation with custom tables, badges, headers, and bullet structures.
  - `jspdf`: Direct client-side PDF document rendering with auto-pagination, headers, footers, and brand palette styling.

### Project Directory Structure
```
01-Proposal-Scope-Assistant/
├── .env.example              # Variable placeholders for AI configuration
├── .gitignore                # Production ignore rules
├── .oxlintrc.json            # Fast Oxlint configuration
├── index.html                # Application root HTML
├── package.json              # Dependencies and scripts
├── tsconfig.json             # Root TypeScript project references
├── tsconfig.app.json         # Application TypeScript configuration
├── tsconfig.node.json        # Build-tool TypeScript configuration
├── vite.config.ts            # Vite & Vitest configuration
├── public/                   # Favicon and static assets
└── src/
    ├── App.tsx               # Route declarations
    ├── App.css               # App-level styling
    ├── index.css             # Design tokens, reset, typography, and responsive styles
    ├── main.tsx              # Application entry point
    ├── components/
    │   ├── AppLayout.tsx     # Shell layout with topbar and mobile drawer
    │   ├── Notifications.tsx # Toast notification banner system
    │   └── Sidebar.tsx       # Primary navigation sidebar
    ├── lib/
    │   ├── drafting.ts       # Rule-based & AI drafting engine, section hydrators
    │   ├── export.ts         # DOCX, PDF, and TXT document export generators
    │   ├── sampleData.ts     # Fictional demo packages, templates, and proposals
    │   └── validation.ts     # Deterministic form validation, pricing safety, prompt-injection detector
    ├── pages/
    │   ├── Dashboard.tsx     # Workspace dashboard & overview
    │   ├── NewProposal.tsx   # Proposal creation form
    │   ├── Packages.tsx      # Service packages catalogue & editor
    │   ├── ProposalDetail.tsx# Proposal section editor, preview, and export
    │   ├── ProposalsList.tsx # Searchable proposal draft catalogue
    │   └── Settings.tsx      # In-memory AI config & privacy documentation
    ├── store/
    │   └── useAppStore.ts    # Central Zustand store with localStorage persistence
    ├── tests/
    │   ├── aiEvaluation.test.ts  # 8 scenario tests evaluating AI quality criteria
    │   ├── components.test.tsx    # React Testing Library component & workflow tests
    │   ├── drafting.test.ts      # Unit tests for drafting & hydration logic
    │   ├── export.test.ts        # Unit tests for DOCX, PDF, TXT exports
    │   ├── integration.test.ts   # Store + validation + drafting pipeline integration tests
    │   ├── setup.ts              # Vitest Jest-DOM setup
    │   └── validation.test.ts    # Form validation & pricing safety unit tests
    └── types/
        └── index.ts          # Core domain models and TypeScript interfaces
```

---

## 4. Prerequisites

- **Node.js**: `v20.0.0` or higher (tested on Node v20/v22).
- **npm**: `v10.0.0` or higher.
- Modern web browser (Chrome, Edge, Firefox, Safari).

---

## 5. Local Setup and Installation

### 1. Navigate to the project directory
```powershell
cd Scalezix-Projects/01-Proposal-Scope-Assistant
```

### 2. Install dependencies
```powershell
npm install
```

### 3. Configure environment variables (Optional)
Copy the example environment configuration:
```powershell
copy .env.example .env.local
```
Edit `.env.local` to specify optional OpenAI-compatible AI keys or leave blank to use deterministic rule-based generation.

### 4. Start development server
```powershell
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Create production build
```powershell
npm run build
```

---

## 6. Running Tests and Quality Checks

The project includes **131 automated tests** covering unit logic, integration pipelines, AI evaluation scenarios, component workflows, and document export.

### Run All Tests
```powershell
npm test
```

### Run Tests with Coverage Report
```powershell
npm run test:coverage
```

### Run Oxlint Linter
```powershell
npm run lint
```

### Run TypeScript Type Check
```powershell
npm run type-check
```

---

## 7. How Proposal Generation Works

The drafting system uses an evidence-first, 13-section structure adapted to available inputs:

1. **Title & Client Details**: Sourced from input fields. Unknown clients are left blank without invention.
2. **Executive Summary**: Contextual summary clearly badged *"Suggested wording — review required"*.
3. **Objectives & Intended Outcomes**: Extracted from discovery notes; tagged for confirmation.
4. **Scope of Work**: Based on selected service package inclusions or explicitly marked missing.
5. **Deliverables**: Formed from package deliverables or marked missing if undefined.
6. **Assumptions**: Clearly partitions *Stated assumptions* (from package) from *Suggested assumptions* (requiring review).
7. **Exclusions / Out-of-Scope**: Preserves explicit package exclusions; labels supplementary items as unapproved suggestions.
8. **Milestones & Timeline**: Uses confirmed dates from package/user input. If absent, renders a neutral structure explicitly badged with *"No confirmed dates — MUST NOT be shared with client without explicit agreement"*.
9. **Client Responsibilities**: Actionable dependency list marked as suggestions requiring confirmation.
10. **Pricing & Commercial Terms**: **Strictly guarded.** Sourced from package only when `pricingStatus === 'provided'`. If absent, renders *"Pricing: Not provided — confirmation required"* and creates a high-severity unresolved item.
11. **Questions Requiring Client Confirmation**: Specific questions targeted at resolving real information gaps.
12. **Risks & Dependencies**: Suggested potential operational risks badged for review.
13. **Next Steps & Human-Review Reminder**: Standard operational guidance warning that human internal sign-off is required before external transmission.

---

## 8. AI Configuration and Fallback Behavior

- **Zero-Config Rule-Based Fallback**: If no AI API key is configured in Settings or `.env`, proposal generation immediately uses the deterministic rule-based engine. The draft is clearly labelled `generationMethod: 'rule-based'`.
- **OpenAI-Compatible Integration**: When configured, requests are sent via `fetch` to `${aiBaseUrl}/chat/completions` using JSON schema response format (`response_format: { type: 'json_object' }`).
- **Prompt Injection Defense**: Discovery notes and client briefs are treated strictly as untrusted content, never system instructions. The engine scans for adversarial patterns (`detectPromptInjection`) and alerts the user without executing injected commands.
- **Graceful Error Handling**: If an AI request times out (30s abort signal), returns invalid JSON, fails schema validation, or encounters network errors, it logs a warning, falls back to rule-based drafting, and displays an informative banner in the editor.

---

## 9. Export Formats Supported

All exports preserve the **exact content reviewed by the human user**, including unresolved markers and draft warnings:

1. **DOCX (.docx)**:
   - Formatted Microsoft Word document generated via `docx`.
   - Distinct heading hierarchy, metadata header block, colored status badges (`[MISSING]`, `[SUGGESTED]`), bullet lists, unresolved item lists, and confirmation questions.
2. **PDF (.pdf)**:
   - Formatted document generated via `jspdf`.
   - Brand color accents, clean margin spacing, section headers, badges, multi-page numbering, and human-review footer disclaimer on every page.
3. **Plain Text (.txt)**:
   - Clean, universal ASCII/UTF-8 text export with visual section dividers and draft notices for copy-pasting into ticketing systems or emails.

---

## 10. Security and Privacy Considerations

- **In-Memory API Key Lifecycle**: API keys entered in Settings are kept **strictly in session memory** inside the Zustand store. They are deliberately excluded from `localStorage` persistence.
- **No Third-Party Analytics / Tracking**: No tracking pixels, analytics scripts, or external telemetry are embedded.
- **Client-Side Data Storage**: Proposal drafts and custom packages are saved in browser `localStorage`. While convenient for local development, users are informed in Settings that localStorage is unencrypted and local to the browser.
- **XSS & Script Injection Prevention**: Text rendering is defensively sanitised against malicious script tags and HTML injection.
- **Fictional Demo Data**: All sample packages and mock proposals included in `sampleData.ts` use fictional names, generic scopes, and explicitly carry demo notices.

---

## 11. Known Limitations and Future Work

1. **Local-Only Storage**: Drafts and packages reside in browser `localStorage`. Clearing browser cache removes drafts unless exported. Future versions will introduce an optional encrypted REST/PostgreSQL backend.
2. **Single User / No Authentication**: Designed for single-operator local use. Role-based access control (RBAC) and team collaboration workflows are planned for enterprise iterations.
3. **Template Customisation**: The starter template is neutral and unapproved. Uploading and customising corporate brand templates (.docx / .dotx) will be supported in Project 2+.
