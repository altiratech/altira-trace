# Codex Prompts and MVP Backlog

## How to use this file

This file is meant to help you convert the strategy docs into concrete Codex work.

The prompts are intentionally modular. You can run them one at a time and tighten the product incrementally instead of asking Codex to build everything in one shot.

---

## Prompt 1 — Initialize the project

```text
Create a production-minded Next.js + TypeScript app for a product called “RIA Launch & Compliance OS.” Use App Router, Tailwind, shadcn/ui, Prisma, and a multi-tenant architecture centered on organizations/firms. Scaffold auth, an app shell, route groups, a seed system, and a clean folder structure organized by product domain. Seed one demo organization and route authenticated users to a dashboard.
```

### Acceptance criteria
- app shell exists
- auth works in dev
- organization model exists
- dashboard route loads
- seed data works

---

## Prompt 2 — Build the firm profile intake and launch workspace

```text
Implement a guided firm profile intake flow for an emerging RIA. The form should capture registration path, state, AUM band, custody profile, marketing/testimonial usage, private fund involvement, team size, vendors, and service model. Save the result and generate a launch workspace with milestones, tasks, dependencies, and progress indicators.
```

### Acceptance criteria
- intake persists data
- launch milestones render from data
- launch progress is visible
- each task includes a plain-English explanation

---

## Prompt 3 — Implement the obligations engine

```text
Create an obligations engine with an ObligationTemplate model and an ObligationInstance model. Use the saved firm profile to instantiate obligations. Show obligations in a calendar/list view and on the dashboard. Each obligation should include owner, status, due date, evidence requirements, notes, and a rationale/source field.
```

### Acceptance criteria
- templates and instances exist
- obligations are generated from firm inputs
- obligations page supports filtering by status and owner
- dashboard shows upcoming and overdue items

---

## Prompt 4 — Add documents and evidence mapping

```text
Implement a document and evidence center. Users should be able to upload documents, categorize them, version them, and link them to obligations. Obligation pages should show whether required evidence is missing. Add an audit-friendly activity log entry for uploads and links.
```

### Acceptance criteria
- documents can be uploaded or mocked
- obligations can link to documents
- missing evidence is visible
- activity log reflects evidence actions

---

## Prompt 5 — Build annual review and exam room modules

```text
Build two modules: Annual Review and Exam Room. Annual Review should include checklist sections, open findings, notes, linked documents, and a summary/report area. Exam Room should include a request list, status tracking, linked artifacts, and an export placeholder. Both modules should feel like operational workflows, not generic forms.
```

### Acceptance criteria
- annual review page is usable
- exam room page is usable
- linked artifacts appear in both
- statuses and summaries are visible

---

## Prompt 6 — Add marketing review workflow

```text
Create a marketing review queue for advisory firm materials. Include submitter, material type, status, reviewer comments, approval history, and a basic checklist related to disclosures, testimonials/endorsements, and record retention. Build a clean review detail page and surface pending reviews on the main dashboard.
```

### Acceptance criteria
- queue exists
- review detail page exists
- approvals/comments persist
- dashboard surfaces pending items

---

## Prompt 7 — Add vendor oversight and Reg S-P readiness

```text
Create a vendor oversight module with vendor records, risk tier, due diligence status, last reviewed date, linked documents, and incident-readiness placeholders. Also create a simple Reg S-P readiness view that rolls up service-provider oversight, incident-response documentation status, and open gaps.
```

### Acceptance criteria
- vendor list and detail page exist
- due diligence status is visible
- readiness page summarizes gaps
- linked documents appear in vendor records

---

## Prompt 8 — Add contextual AI guidance

```text
Add contextual AI guidance panels to launch tasks, obligation detail pages, annual review sections, and marketing review detail pages. For now, the AI can return mocked or templated outputs, but the data model must support prompt summary, output text, source/rationale, human review status, reviewer identity, and timestamps.
```

### Acceptance criteria
- AI guidance appears in multiple contexts
- AI outputs are stored, not ephemeral
- every AI output can be marked reviewed
- the UI clearly distinguishes draft guidance from approved decisions

---

## Prompt 9 — Tighten permissions and UX

```text
Implement coarse role-based permissions for founder_admin, cco, operations, supervised_person, and external_consultant. Improve visual hierarchy, empty states, and the dashboard so the product feels like a calm compliance control tower.
```

### Acceptance criteria
- role model exists
- basic page/section gating exists
- dashboard feels polished and legible
- empty states guide the user toward next actions

---

## Prompt 10 — Create a demo-ready experience

```text
Turn the prototype into a strong demo environment. Seed multiple realistic firms, obligations, approvals, documents, vendors, and annual review records. Add a concise README and ensure the app can be run locally with clear setup instructions. Make the demo tell a coherent story for a breakaway advisor and a small live RIA.
```

### Acceptance criteria
- at least two demo firms
- demo data tells a coherent product story
- README exists
- local setup is straightforward

---

# Prioritized MVP backlog

## P0 — Must have
- auth + organizations
- firm profile intake
- launch workspace
- obligations engine
- dashboard
- documents/evidence
- annual review
- activity log

## P1 — Strongly recommended
- exam room
- marketing review
- vendor oversight
- AI guidance
- role-based permissions

## P2 — Later / only after pilots
- integrations
- consultant multi-client superview
- report exports
- policy version diffing
- more advanced readiness scoring
- deeper private fund modules

---

# Suggested 30 / 60 / 90 plan

## First 30 days
- build demoable prototype
- validate information architecture
- run customer interviews against screens
- sharpen positioning language

## By 60 days
- tighten obligation logic
- improve evidence model
- add annual review + exam room depth
- decide if the launch wedge resonates more than ongoing-only compliance

## By 90 days
- onboard pilot users or design partners
- test pricing posture
- decide whether the product remains software-first or should include a managed-support layer

---

# What to watch for in user feedback

Positive signal:
- “This makes the path to independence feel much clearer.”
- “I finally know what is due and what is missing.”
- “This could replace a lot of manual coordination.”
- “This would make exam prep much less painful.”

Danger signal:
- “This is just another task manager.”
- “I still need five other systems to understand my compliance posture.”
- “It feels like a generic advisor CRM.”
- “I do not trust what the AI is telling me.”

---

# Final recommendation

Run the prompts in sequence, but keep tightening the narrative as you go.

The real product is not the code alone. The real product is the combination of:
- workflow design,
- compliance logic,
- trust posture,
- and the feeling that the firm is finally under control.
