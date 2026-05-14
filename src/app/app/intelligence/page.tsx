import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getExternalIntelligenceSnapshot, getViewerContext } from "@/lib/data/workspace";

function getWorkflowHref(targetType: string | null, targetId: string | null) {
  if (targetType === "obligation" && targetId) {
    return `/app/obligations/${targetId}`;
  }

  if (targetType === "vendor") {
    return "/app/vendors";
  }

  if (targetType === "marketing_review") {
    return "/app/marketing-review";
  }

  if (targetType === "annual_review") {
    return "/app/annual-review";
  }

  if (targetType === "exam_request") {
    return "/app/exam-room";
  }

  return "/app/dashboard";
}

function getWorkflowLabel(targetType: string | null) {
  if (!targetType) {
    return "Unrouted";
  }

  return targetType.replace(/_/g, " ");
}

function readSourceRefs(sourceRefs: unknown) {
  return Array.isArray(sourceRefs)
    ? sourceRefs.filter((item): item is string => typeof item === "string")
    : [];
}

export default async function ExternalIntelligencePage() {
  const { organization } = await getViewerContext();
  const snapshot = await getExternalIntelligenceSnapshot(organization.id);
  const openEvents = snapshot.changeEvents.filter(
    (event) => event.status !== "DISMISSED" && event.status !== "LINKED",
  );
  const highPriorityEvents = openEvents.filter(
    (event) => event.severity === "HIGH" || event.severity === "CRITICAL",
  );
  const sourceCounts = snapshot.sources.reduce(
    (counts, source) => ({
      ...counts,
      [source.kind]: (counts[source.kind] ?? 0) + 1,
    }),
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="External Intelligence"
        title="Source-backed change review"
        description="Trace consumes stable external intelligence artifacts and turns them into reviewable workflow context. Live crawling and parsing stay outside the app runtime."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Active sources</CardDescription>
            <CardTitle className="text-4xl">{snapshot.sources.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--ink-soft)]">
              Regulator {sourceCounts.REGULATOR ?? 0} · Vendor {sourceCounts.VENDOR ?? 0} · Firm site{" "}
              {sourceCounts.FIRM_SITE ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open signals</CardDescription>
            <CardTitle className="text-4xl">{openEvents.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--ink-soft)]">
              Reviewable source changes that have not been linked or dismissed.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>High priority</CardDescription>
            <CardTitle className="text-4xl">{highPriorityEvents.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--ink-soft)]">
              Critical or high signals that should stay visible to founders and CCOs.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Change events</CardTitle>
            <CardDescription>
              Fixture-backed signals today, with room for Cloudflare crawl or RIA Inflection Engine artifacts later.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {snapshot.changeEvents.map((event) => {
              const sourceRefs = readSourceRefs(event.sourceRefs);
              const workflowHref = getWorkflowHref(event.targetType, event.targetId);

              return (
                <div
                  key={event.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-[var(--ink-soft)]">{event.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={event.severity} />
                      <StatusBadge value={event.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-[18px] border border-[color:var(--line)] bg-white p-3 text-sm text-[var(--ink-soft)] md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em]">Source</p>
                      <p className="mt-1 font-medium text-[var(--ink)]">{event.source.name}</p>
                      <p>{event.source.kind.replace(/_/g, " ").toLowerCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em]">Detected</p>
                      <p className="mt-1 font-medium text-[var(--ink)]">
                        {format(event.detectedAt, "MMM d, yyyy")}
                      </p>
                      <p>{event.placeholder ? "Placeholder fixture" : "Imported signal"}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-[var(--ink-soft)]">
                    {event.recommendedAction}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={workflowHref}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]"
                    >
                      Route · {getWorkflowLabel(event.targetType)}
                    </Link>
                    {event.artifacts.map((artifact) => (
                      <StatusBadge key={artifact.id} value={artifact.reviewStatus} />
                    ))}
                  </div>

                  {sourceRefs.length > 0 ? (
                    <div className="mt-4 grid gap-2">
                      {sourceRefs.map((ref) => (
                        <p
                          key={ref}
                          className="rounded-[16px] border border-[color:var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink-soft)]"
                        >
                          {ref}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring sources</CardTitle>
              <CardDescription>
                These are source records only. Crawling and parsing should remain producer work.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {snapshot.sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{source.name}</p>
                    <StatusBadge value={source.active ? "ACTIVE" : "INACTIVE"} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{source.url}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge value={source.kind} />
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                      {source.cadenceLabel}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                      Events {source.changeEvents.length}
                    </span>
                  </div>
                  {source.ownerNote ? (
                    <p className="mt-3 text-sm text-[var(--ink-soft)]">{source.ownerNote}</p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imported artifacts</CardTitle>
              <CardDescription>
                Artifacts keep the producer output reviewable before it changes any workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {snapshot.artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{artifact.title}</p>
                    <StatusBadge value={artifact.reviewStatus} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{artifact.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge value={artifact.artifactType} />
                    {artifact.changeEvent ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                        {artifact.changeEvent.source.kind.replace(/_/g, " ").toLowerCase()}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
