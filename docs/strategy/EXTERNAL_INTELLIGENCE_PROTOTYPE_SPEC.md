# External Intelligence Prototype Spec

Status: Trace-side prototype scope

## Decision

Trace should add an external intelligence lane, but the first build should stay fixture-backed.

Trace should not crawl regulators, vendors, firm websites, SEC, or IAPD directly in the application runtime. The app should consume stable, source-backed artifacts produced by RIA Inflection Engine or a future Cloudflare sidecar.

## Prototype Goal

Prove that external intelligence is useful when it becomes workflow context.

The first prototype should answer:
- What changed outside the firm?
- Why might it matter to this RIA?
- Which Trace workflow should review it?
- What evidence or approval should follow?

## Source Types

Start with three monitored source categories:
- Regulator: public rule, exam priority, guidance, or enforcement-priority pages.
- Vendor: trust center, privacy notice, security documentation, status page, or subprocessors page.
- Firm site: public marketing pages, disclosure language, testimonials, claims, and offer pages.

## First Trace Records

Trace owns these records:
- `MonitoringSource`: the external page or source being watched.
- `ExternalSnapshot`: a captured point-in-time output from the source.
- `ExternalChangeEvent`: a reviewer-facing change signal tied to a source and optional Trace workflow.
- `ExternalIntelligenceArtifact`: a structured summary, diff, or evidence packet imported into Trace.

External producers own crawling, parsing, source pairing, and model reasoning. Trace owns workflow routing, review state, evidence posture, and operator presentation.

## User Workflows

Regulator watch:
- A regulator page changes.
- Trace creates a reviewable event with severity, source refs, and recommended action.
- The event routes toward obligations, annual review, or exam readiness.

Vendor watch:
- A vendor trust, privacy, or service-provider page changes.
- Trace creates a vendor oversight signal.
- The event routes toward vendor diligence, incident readiness, or evidence refresh.

Firm-site watch:
- A public firm page changes.
- Trace creates a marketing review signal.
- The event routes toward marketing review, retention evidence, or approval follow-up.

## Product Boundary

External intelligence is never a legal conclusion.

The UI should use language like:
- "review signal"
- "source-backed change"
- "recommended workflow"
- "human review needed"

The UI should avoid language like:
- "violation"
- "noncompliant"
- "approved automatically"
- "filing decision"

## First Implementation

1. Add the Trace-side data model.
2. Seed clearly labeled placeholder sources and change events.
3. Surface the highest-priority events on the dashboard.
4. Add an intelligence page that shows sources, events, artifacts, source refs, and workflow routing.
5. Defer live Cloudflare `/crawl`, Workers AI summarization, and Agents until the fixture-backed workflow proves useful.

## Later Producer Shape

A future Cloudflare sidecar or RIA Inflection Engine integration can:
- run scheduled crawls,
- produce snapshots,
- generate structured change events,
- attach source provenance,
- optionally draft reviewable AI guidance,
- post artifacts into Trace through a stable import contract.

## Success Criteria

The prototype is working if a founder or CCO can open Trace and understand:
- which external change needs attention,
- which workflow owns the review,
- what evidence supports the signal,
- what human decision is still required.
