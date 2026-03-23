import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamSnapshot, getViewerContext } from "@/lib/data/workspace";
import { canAccessRoute, getRoleFocus } from "@/lib/permissions";
import { titleCase } from "@/lib/utils";

export default async function TeamPage() {
  const { organization, membership } = await getViewerContext();

  if (!canAccessRoute(membership.role, "team")) {
    notFound();
  }

  const team = await getTeamSnapshot(organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team and Roles"
        title="Role-aware operating model"
        description="Permissions in the pilot are coarse by design, but the app already treats founder, CCO, operations, and supervised-person work as meaningfully different."
      />

      <Card>
        <CardHeader>
          <CardTitle>Current membership</CardTitle>
          <CardDescription>
            The multi-tenant model is live even though this pilot uses one active organization at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {team.map((member) => (
            <div
              key={member.id}
              className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{member.user.name}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {member.user.email}
                  </p>
                </div>
                <StatusBadge value={member.role} />
              </div>
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                {titleCase(member.role)} is represented directly in the navigation,
                ownership model, and workflow copy.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                  Obligations · {member.ownershipSummary.obligationCount}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                  Launch items · {member.ownershipSummary.launchPacketCount}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                  Waiting review · {member.ownershipSummary.launchAwaitingReviewCount}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace lanes</CardTitle>
          <CardDescription>
            Each role gets a different operating emphasis even before deeper access control and audit logging hardening.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {team.map((member) => {
            const focus = getRoleFocus(member.role);

            return (
              <div
                key={`${member.id}-lane`}
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  {titleCase(member.role)}
                </p>
                <p className="mt-2 font-medium">{focus.title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                  {focus.summary}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Owned launch work</CardTitle>
          <CardDescription>
            Each role can now see the launch packet work it owns and whether the bottleneck is evidence, review, or an upstream blocker.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {team.map((member) => (
            <div
              key={`${member.id}-launch`}
              className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{member.user.name}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {titleCase(member.role)}
                  </p>
                </div>
                <StatusBadge
                  value={
                    member.ownershipSummary.launchBlockedCount > 0
                      ? "BLOCKED"
                      : member.ownershipSummary.launchAwaitingReviewCount > 0
                        ? "PENDING_APPROVAL"
                        : member.ownershipSummary.launchPacketCount > 0
                          ? "IN_PROGRESS"
                          : "COMPLETE"
                  }
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                  Open launch items · {member.ownershipSummary.launchPacketCount}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                  Blocked · {member.ownershipSummary.launchBlockedCount}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                  Missing evidence · {member.ownershipSummary.launchMissingEvidenceCount}
                </span>
              </div>
              {member.ownedLaunchPacketItems.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--ink-soft)]">
                  No open launch packet items are currently assigned to this role.
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {member.ownedLaunchPacketItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[20px] border border-[color:var(--line)] bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge value={item.status} />
                          <StatusBadge value={item.reviewStatus} />
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        {item.milestone.title}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                          {item.dueDate ? `Due ${format(item.dueDate, "MMM d")}` : "Due TBD"}
                        </span>
                        <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                          Evidence · {item.artifactLinks.length}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--ink-soft)]">
                        {item.reviewStatus === "PENDING_APPROVAL"
                          ? "Waiting on reviewer action."
                          : item.artifactLinks.length === 0
                            ? "Needs linked evidence before review can move."
                            : item.status === "BLOCKED"
                              ? "Blocked and likely waiting on upstream launch work."
                              : "Active launch work currently owned by this role."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
