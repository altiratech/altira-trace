# Product Strategy and Roadmap

## Product definition

The product is an **RIA Launch & Compliance OS**.

In plain language, it should help a firm do three things well:

1. understand what needs to happen;
2. execute the work in the right order;
3. preserve proof that the work happened.

That third point matters more than most product teams initially assume. In this category, the workflow is not complete unless the evidence exists.

## Product north star

A user should be able to log in and answer these questions immediately:

- What matters right now?
- What is due soon?
- What is blocked?
- What risk areas are undercontrolled?
- What documentation is missing?
- What would worry me in an exam today?
- What should I do next?

## Product principles

### 1) Explain the “why,” not just the “what”
Do not show generic tasks without context. Every major task should have:
- purpose,
- trigger,
- owner,
- deadline/cadence,
- required evidence,
- plain-English explanation.

### 2) Be exam-ready by design
Every important action should make the firm more exam-ready:
- task completion,
- evidence upload,
- approvals,
- policy acknowledgment,
- review history,
- versioning,
- audit log.

### 3) Use AI as a guide, not a black box
AI should:
- summarize,
- recommend,
- generate drafts,
- flag risk,
- explain logic,
- surface missing information.

AI should not:
- silently make legal judgments,
- auto-file live forms without review,
- obscure why it made a recommendation.

### 4) Keep the product opinionated
The product should not feel like a blank workflow tool. It should embody a point of view about how a small advisory firm should operationalize compliance.

### 5) Focus on the founder / CCO / ops user first
This product should feel deeply useful to the person who is carrying the compliance and operational burden personally.

## Core user roles

### Founder / principal
Needs clarity, control, visibility, and confidence.

### CCO or acting CCO
Needs task orchestration, documentation, policy control, review workflows, and defensibility.

### Operations lead
Needs coordination, deadlines, documents, workflow completion, and internal accountability.

### Supervised person / IAR
Needs a clean experience for attestations, document acknowledgments, marketing submissions, training, and task completion.

### External consultant or outsourced CCO
Needs a multi-client view, collaboration tools, and the ability to standardize and monitor across firms.

## V1 product shape

### Module 1 — Firm profile and readiness intake
Purpose:
- capture the firm’s baseline facts,
- determine applicable obligations,
- set up the system.

Inputs might include:
- registration type,
- target jurisdictions,
- expected AUM band,
- custody profile,
- services offered,
- fee model,
- client types,
- marketing practices,
- use of testimonials/endorsements,
- vendors,
- private fund involvement,
- current policies and documents.

### Module 2 — Launch wizard
Purpose:
- turn “I want to launch” into a visible, staged project.

Should include:
- milestones,
- dependencies,
- document requirements,
- role assignments,
- missing-information flags,
- timeline view,
- “what this means” explanations.

### Module 3 — Compliance cockpit
Purpose:
- ongoing homepage for the firm.

Should show:
- overdue items,
- next 30/60/90 day items,
- recent completions,
- high-risk gaps,
- pending approvals,
- annual review progress,
- exam-readiness status,
- policy acknowledgments,
- document issues.

### Module 4 — Obligations engine
Purpose:
- generate obligations dynamically based on the firm’s actual profile.

Each obligation should have:
- title,
- description,
- rationale,
- cadence,
- owner,
- due date logic,
- required evidence,
- related policy/docs,
- risk rating,
- jurisdiction/regulatory tags.

### Module 5 — Evidence and document center
Purpose:
- store the artifacts that make tasks defensible.

Capabilities:
- upload and version documents,
- map artifacts to obligations,
- show missing evidence,
- preserve approvals,
- maintain history.

### Module 6 — Annual review workflow
Purpose:
- make annual review a structured process rather than a panic exercise.

Should include:
- review checklist,
- policy update prompts,
- incident/change log,
- evidence rollup,
- open issue register,
- final summary/report output.

### Module 7 — Exam room
Purpose:
- allow a firm to respond quickly and coherently during an exam.

Should include:
- document request lists,
- pre-organized folders,
- exportable evidence packages,
- status tracking on responses,
- cross-links to policies, logs, and prior activity.

### Module 8 — Marketing review
Purpose:
- operationalize a concrete, current risk area.

Should include:
- submission queue,
- reviewer comments,
- required-disclosure checklists,
- approval history,
- retention of final approved materials.

### Module 9 — Reg S-P / vendor / incident readiness
Purpose:
- operationalize a second major risk area without overbuilding full cybersecurity tech.

Should include:
- vendor inventory,
- due diligence reminders,
- incident response plan status,
- tabletop exercise tracking,
- required policy/document placeholders,
- service-provider oversight steps.

## Suggested navigation

- Home
- Launch
- Calendar
- Obligations
- Documents
- Marketing Review
- Annual Review
- Exam Room
- Vendors & Incidents
- Team
- AI Assistant
- Settings / Firm Profile

## Ideal dashboard widgets

- Today / This Week / This Month
- Upcoming filing deadlines
- Missing evidence count
- Open approvals
- High-priority risk alerts
- Recently updated policies
- Exam readiness score
- Annual review status
- Marketing submissions pending
- Team acknowledgments overdue

## AI assistant design principles

The AI layer should not live as a chatbot only. It should appear in context.

Examples:
- on a task card: “Why does this matter?”
- on a missing document: “What would usually satisfy this?”
- on a launch step: “What information is still needed?”
- on a marketing submission: “What disclosure issues might exist?”
- on an annual review: “What changed since last cycle?”
- on a vendor record: “What due diligence items appear incomplete?”

Every AI output should ideally include:
- a confidence note,
- source tag or rationale,
- editable draft output,
- human review status.

## Proposed data model (working sketch)

```text
Organization
- id
- name
- registration_type
- principal_office_state
- launch_stage
- aum_band
- client_profile
- custody_profile
- created_at

User
- id
- organization_id
- role
- name
- email

FirmProfile
- organization_id
- services_offered
- marketing_flags
- vendor_flags
- private_fund_flags
- jurisdictions
- notes

ObligationTemplate
- id
- title
- description
- trigger_conditions
- cadence_type
- evidence_requirements
- risk_level
- source_reference

ObligationInstance
- id
- organization_id
- template_id
- owner_user_id
- status
- due_date
- review_status
- completion_notes

Artifact
- id
- organization_id
- file_name
- category
- version
- linked_obligation_ids
- uploaded_by
- uploaded_at

Approval
- id
- entity_type
- entity_id
- reviewer_id
- status
- comments
- approved_at

AnnualReview
- id
- organization_id
- period_start
- period_end
- status
- summary
- report_artifact_id

ExamRequest
- id
- organization_id
- title
- requested_at
- due_at
- status

Vendor
- id
- organization_id
- name
- category
- diligence_status
- last_reviewed_at

AiGuidance
- id
- organization_id
- context_type
- context_id
- prompt_summary
- output
- source_refs
- human_review_status
```

## Roadmap

### Phase 0 — Prototype and design partner system
Goal:
- prove workflow clarity.

Build:
- app shell,
- firm profile intake,
- launch wizard,
- seeded obligations,
- dashboard,
- basic documents,
- demo annual review and exam room.

No live integrations required.

### Phase 1 — Launch + compliance cockpit MVP
Goal:
- make the product real enough for pilot use.

Build:
- multi-tenant auth,
- dynamic obligations generator,
- calendar,
- evidence upload,
- approvals,
- annual review workflow,
- exam room,
- role permissions,
- audit log.

### Phase 2 — High-value control modules
Goal:
- deepen trust and recurring value.

Build:
- marketing review workflow,
- vendor oversight,
- Reg S-P readiness workspace,
- incident log,
- policy acknowledgments,
- recurring certifications,
- exportable reports.

### Phase 3 — Expansion into adjacent operations
Goal:
- become more central without losing focus.

Possible additions:
- CRM integrations,
- email/calendar sync,
- customer communication governance,
- selected operational dashboards,
- private fund modules,
- consultant multi-client workspace improvements.

## Non-goals for V1

To avoid losing the plot, V1 should not attempt:

- full portfolio accounting;
- performance reporting engine;
- custodial operations platform;
- billing engine;
- general CRM replacement;
- direct IARD filing integrations in the first build;
- full cyber tooling;
- broad surveillance stack.

## Design language

The product should feel:

- serious,
- modern,
- structured,
- trustable,
- calm under pressure.

A good design metaphor is **control tower**, not “social feed” and not “generic SaaS admin.”

## Metrics to track

### Product engagement
- weekly active firms,
- weekly active CCO/founder users,
- tasks completed on time,
- evidence attachments per completed obligation.

### Launch value
- time from signup to launch-plan completion,
- percentage of launch checklist completed,
- conversion from launch module to ongoing subscription.

### Compliance value
- annual review completion rate,
- overdue item reduction,
- exam room usage,
- policy acknowledgment completion,
- marketing review turnaround time.

### Commercial signals
- conversion from design partner to paid,
- retention after first annual cycle,
- consultant referrals,
- number of firms managed by consultant users.

## Strategic recommendation

The right first version of the product is not huge. It is sharp.

A strong MVP should make a user say:

> I finally know what has to happen, what is missing, and how to keep the firm organized.

That is enough to start.

---

See `08_RESEARCH_NOTES_AND_SOURCES.md` for source IDs and research grounding.
