# Codex Build Brief — RIA Launch & Compliance OS

## Use case

Paste or adapt this document directly into Codex as the main build brief for the repo.

---

## Project

Build a web application prototype called **RIA Launch & Compliance OS**.

This is a product for small and emerging registered investment advisers (RIAs), especially breakaway advisors and newly launched firms. The product helps a firm:

1. go from “thinking about independence” to “launch-ready” through a guided workflow;
2. set up an ongoing compliance operating system after launch;
3. manage deadlines, obligations, documents, approvals, and evidence;
4. maintain an exam-ready posture;
5. use AI carefully to explain, draft, and flag issues without acting as black-box legal advice.

The product should feel like a **control tower for launching and operating an examination-ready RIA**.

## Product goals

The prototype should demonstrate these core ideas well:

- a founder can see what matters now;
- the app can generate obligations from a firm profile;
- the launch workflow feels concrete and understandable;
- ongoing compliance is visible on one dashboard;
- evidence and documents are tied to tasks;
- annual review and exam prep feel like structured workflows;
- AI is contextual, explainable, and clearly human-reviewed.

## Product constraints

This is not a full wealth management platform.

Do **not** build:
- portfolio accounting,
- performance reporting,
- custody infrastructure,
- billing engine,
- full CRM replacement,
- live regulatory filing integrations,
- legal opinion engine.

This is a **workflow + compliance operating system prototype**, not a complete advisor stack.

## Technical stack

Use:

- **Next.js** with App Router
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** for UI primitives
- **Prisma**
- **PostgreSQL** (or SQLite in dev if faster for initial scaffold, but structure for Postgres)
- **Zod** for validation
- **React Hook Form** for forms
- **TanStack Query** if needed for client data fetching
- **Auth.js** or Clerk for authentication
- file upload abstraction suitable for later S3-compatible storage
- seed scripts for demo data

Keep the codebase organized, readable, and production-minded even if the first version is still a prototype.

## Architecture principles

### 1. Multi-tenant from the start
Organizations/firms should be first-class entities.

### 2. Auditability first
Major user actions should create event history or audit log records.

### 3. Configuration over hard-coding
Use obligation templates and metadata so the product can grow without rewriting everything.

### 4. AI outputs must be reviewable
Any AI-generated guidance should be stored as draft guidance with:
- context,
- source references or rationale,
- reviewer status,
- timestamps.

### 5. Make the domain model explicit
Do not bury regulatory logic in random UI components.

## Required entities

Build a first-pass schema that includes at minimum:

- Organization
- User
- FirmProfile
- LaunchMilestone
- ObligationTemplate
- ObligationInstance
- Artifact / Document
- Approval
- AnnualReview
- ExamRequest
- Vendor
- IncidentLog
- AiGuidance
- ActivityLog

## Core routes / pages

Build these routes or their close equivalents:

- `/app`
- `/app/dashboard`
- `/app/launch`
- `/app/launch/intake`
- `/app/calendar`
- `/app/obligations`
- `/app/obligations/[id]`
- `/app/documents`
- `/app/annual-review`
- `/app/exam-room`
- `/app/marketing-review`
- `/app/vendors`
- `/app/team`
- `/app/settings`

If you think a better route structure makes more sense, keep the same functional concepts.

## Required features

### 1. Auth + organization setup
- sign in
- create/select an organization
- create a firm profile
- seed a demo organization automatically in dev

### 2. Firm profile intake
Build a guided intake form that asks for things like:
- registration type or expected registration path
- principal office state
- AUM band
- custody profile
- whether the firm uses testimonials/endorsements
- whether the firm has private funds
- key vendors
- team size
- service model

The form should produce a saved firm profile and trigger obligation generation.

### 3. Launch workspace
Create a launch page with:
- milestone cards,
- step-by-step tasks,
- blocked/unblocked logic,
- clear progress indicators,
- “why this matters” explanations.

Use realistic placeholder steps such as:
- entity setup
- registration path selection
- ADV / filing prep checklist
- policy and document preparation
- vendor / service-provider setup
- launch readiness review

### 4. Dashboard
The dashboard should feel like a command center and include widgets such as:
- overdue obligations
- upcoming obligations
- launch progress
- missing evidence count
- pending approvals
- annual review status
- marketing review queue
- exam readiness summary

### 5. Obligations engine
Seed a structured set of obligation templates and instantiate obligations based on the firm profile.

Each obligation instance should support:
- status
- owner
- due date
- linked evidence
- notes
- audit history
- approval state
- source/rationale

### 6. Documents and evidence
Allow users to:
- upload documents,
- categorize them,
- version them,
- link them to obligations,
- see which obligations are missing evidence.

### 7. Annual review module
Create a first-pass annual review workflow with:
- checklist sections,
- open findings,
- document links,
- summary notes,
- draft export/report page.

### 8. Exam room
Create an exam room feature with:
- document request list,
- request statuses,
- linked artifacts,
- export-ready folder view or downloadable package placeholder.

### 9. Marketing review module
Create a queue for marketing items with:
- submitter
- material type
- status
- reviewer comments
- basic compliance checklist
- approval history

### 10. Vendor / Reg S-P readiness module
Create a simple vendor oversight area with:
- vendor list
- risk tier
- last reviewed date
- due diligence status
- linked documents
- incident-response readiness placeholders

### 11. Activity log
Create a centralized timeline showing important events:
- task completion
- uploads
- approvals
- comments
- generated AI guidance

### 12. AI assistant surfaces
Do not build only a standalone chat page. Add contextual AI panels/buttons in places like:
- launch tasks,
- obligation detail pages,
- annual review sections,
- marketing review items.

For the prototype, AI can use mocked outputs if needed, but the data model must support:
- prompt summary
- output
- rationale/source refs
- review status
- reviewed by
- reviewed at

## UX requirements

- clean professional design
- calm visual hierarchy
- minimal visual clutter
- serious / trustable tone
- clear actionability
- rich empty states
- obvious next steps

The app should feel more like a modern operations cockpit than a consumer SaaS dashboard.

## Demo data

Seed at least two demo firms:

### Demo firm 1
**Harbor Ridge Advisory**
- newly launched independent RIA
- small team
- uses testimonials
- no private funds
- several upcoming obligations

### Demo firm 2
**Northline Strategic Partners**
- more established small RIA
- consultant-supported
- more documents
- annual review in progress
- mock exam request in motion

Also seed:
- obligations,
- documents,
- approvals,
- vendors,
- marketing submissions,
- annual review notes,
- activity logs.

## Suggested component list

Build reusable components for:

- app shell / sidebar
- status badge
- risk badge
- deadline pill
- obligation card
- launch milestone card
- evidence panel
- approval timeline
- document table
- dashboard widget
- AI guidance drawer
- activity feed
- review checklist section

## Suggested folder structure

Use a clean structure such as:

```text
src/
  app/
  components/
  features/
    auth/
    organizations/
    firm-profile/
    launch/
    obligations/
    documents/
    annual-review/
    exam-room/
    marketing-review/
    vendors/
    ai-guidance/
    activity-log/
  lib/
    db/
    auth/
    ai/
    validation/
    permissions/
    seed/
  prisma/
```

You may refine this, but keep domain areas explicit.

## Permission model

Support at least these roles:

- founder_admin
- cco
- operations
- supervised_person
- external_consultant

Permissions can be coarse in V1, but the schema and UI should acknowledge role-based access.

## Output expectations

Please generate:

1. the app scaffold,
2. schema/models,
3. seed data,
4. core pages,
5. reusable UI components,
6. sensible sample data,
7. brief README instructions for local setup.

Where appropriate:
- include comments,
- keep types explicit,
- avoid fragile mock code,
- favor maintainable structure.

## Important product posture

This product should **assist** a human compliance process. It should not present itself as making legal determinations. Build the product so that drafts, recommendations, and guidance are clearly reviewable and attributable.

## Definition of success for this prototype

A user should be able to click through the demo and immediately understand:

- what this company is building,
- who it is for,
- how it solves launch/compliance pain,
- and why it could become a real product.

---

End of build brief.
