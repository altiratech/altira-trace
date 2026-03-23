import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getObligationsList, getViewerContext } from "@/lib/data/workspace";

export default async function ObligationsPage() {
  const { organization, membership } = await getViewerContext();
  const obligations = await getObligationsList(
    organization.id,
    membership.role === "SUPERVISED_PERSON"
      ? { ownerMembershipId: membership.id }
      : undefined,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Obligations Engine"
        title="Profile-driven obligations"
        description="Templates live in explicit configuration and each instance carries cadence, rationale, evidence requirements, and owner visibility."
      />

      <Card>
        <CardHeader>
          <CardTitle>Obligation list</CardTitle>
          <CardDescription>
            The list is intentionally compact so a founder or CCO can scan what matters without hunting through multiple tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {obligations.map((obligation) => (
            <Link
              key={obligation.id}
              href={`/app/obligations/${obligation.id}`}
              className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{obligation.title}</p>
                  <p className="max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
                    {obligation.description}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    {obligation.cadenceLabel} · due {format(obligation.dueDate, "MMM d")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={obligation.riskLevel} />
                  <StatusBadge value={obligation.status} />
                  <StatusBadge value={obligation.reviewStatus} />
                  {obligation.ownerMembership?.user?.name ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                      {obligation.ownerMembership.user.name}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
