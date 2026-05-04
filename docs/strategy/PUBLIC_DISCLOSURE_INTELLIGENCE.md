# Public Disclosure Intelligence

Status: Trace integration strategy note

## Decision

Trace is the customer-facing RIA compliance product.
RIA Inflection Engine is the public-disclosure intelligence engine that should feed Trace.

The repos should remain separate for now, but they should follow one product strategy.

## Why This Matters

Trace already owns the operator surface:
- launch workflow
- obligations
- evidence capture
- annual review
- exam room
- marketing review
- vendor oversight
- dashboards

RIA Inflection Engine owns a different problem:
- SEC / IAPD source ingestion
- brochure snapshot pairing
- section-level filing deltas
- evidence-backed scoring
- peer context
- public-disclosure intelligence artifacts

Trace should not absorb experimental public-data parsing logic directly. It should consume stable artifacts from the engine once the contract is clear.

## Intended Trace Value

Public-disclosure intelligence can strengthen Trace by adding external, source-backed signals to existing workflows:
- annual review prep
- exam readiness
- marketing-rule review
- firm profile change monitoring
- peer benchmarking and self-benchmarking
- consultant multi-client review queues

## First Integration Shape

Use static or fixture-based imports first.

Likely imported objects:
- `firm_delta`
- `review_signal`
- `evidence_packet`
- `theme_mapping`
- `peer_context`
- `source_provenance`

Do not start with live ingestion inside Trace.
Do not duplicate SEC / IAPD parsing logic in Trace.

## Product Boundary

Trace should turn public-disclosure intelligence into operator-facing workflow context.

RIA Inflection Engine should produce the intelligence and preserve source provenance.

Trace should own the final user experience, including:
- where the signal appears
- whether it creates a review item
- how evidence is attached
- how the reviewer acts on it
- how the follow-through becomes exam-ready

## Near-Term Path

1. Keep RIA Inflection Engine separate.
2. Stabilize a Trace-facing artifact contract.
3. Import one static canonical artifact into Trace.
4. Display it in one bounded workflow, likely annual review or exam readiness.
5. Add live refresh or deeper integration only after the static contract proves useful.
