import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  assignObligationOwnerAction,
  reviewApprovalAction,
  reviewAiGuidanceAction,
  updateObligationStatusAction,
} from "@/actions/workspace";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getAiGuidanceForContext,
  getObligationDetail,
  getApprovalsForEntity,
  getTeamSnapshot,
  getViewerContext,
} from "@/lib/data/workspace";
import { hasCapability } from "@/lib/permissions";
import { titleCase } from "@/lib/utils";

export default async function ObligationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { organization, membership } = await getViewerContext();
  const { id } = await params;
  const obligation = await getObligationDetail(organization.id, id);

  if (!obligation) {
    notFound();
  }

  const canAssignOwner = hasCapability(membership.role, "assign_obligation_owner");
  const canReviewAiGuidance = hasCapability(membership.role, "review_ai_guidance");
  const canReviewApprovals = hasCapability(membership.role, "review_approvals");
  const canUpdateStatus =
    hasCapability(membership.role, "update_obligation_status") &&
    (membership.role !== "SUPERVISED_PERSON" ||
      obligation.ownerMembershipId === membership.id);
  const [guidance, team, approvals] = await Promise.all([
    getAiGuidanceForContext(organization.id, "obligation", obligation.id),
    canAssignOwner ? getTeamSnapshot(organization.id) : Promise.resolve([]),
    getApprovalsForEntity(organization.id, "obligation", obligation.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Obligation Detail"
        title={obligation.title}
        description={obligation.description}
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Execution details</CardTitle>
            <CardDescription>
              This is where the obligation becomes explainable, owned, and provable.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={obligation.status} />
              <StatusBadge value={obligation.reviewStatus} />
              <StatusBadge value={obligation.riskLevel} />
            </div>

            <div className="rounded-[24px] bg-[var(--surface-strong)] p-5 text-sm leading-7 text-[var(--ink-soft)]">
              <p>
                Due date: <span className="font-medium text-[var(--ink)]">{format(obligation.dueDate, "MMMM d, yyyy")}</span>
              </p>
              <p>
                Cadence: <span className="font-medium text-[var(--ink)]">{obligation.cadenceLabel}</span>
              </p>
              <p>
                Owner: <span className="font-medium text-[var(--ink)]">{obligation.ownerMembership?.user?.name ?? "Unassigned"}</span>
              </p>
            </div>

            {canAssignOwner ? (
              <form action={assignObligationOwnerAction} className="grid gap-3">
                <input name="obligationId" type="hidden" value={obligation.id} />
                <label className="grid gap-2 text-sm">
                  Owner assignment
                  <select
                    className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                    defaultValue={obligation.ownerMembershipId ?? ""}
                    name="ownerMembershipId"
                  >
                    <option value="">Unassigned</option>
                    {team.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.user.name} · {titleCase(member.role)}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <Button size="sm" type="submit" variant="outline">
                    Update owner
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-[24px] bg-[var(--surface-strong)] p-4 text-sm text-[var(--ink-soft)]">
                Owner changes are limited to founder, CCO, and operations roles.
              </div>
            )}

            <div className="grid gap-3">
              <p className="text-sm font-medium">Evidence requirements</p>
              {(
                (Array.isArray(obligation.evidenceRequired)
                  ? obligation.evidenceRequired
                  : []) as string[]
              ).map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink-soft)]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              <p className="text-sm font-medium">Source and rationale</p>
              <div className="rounded-[24px] bg-[var(--surface-strong)] p-5 text-sm leading-7 text-[var(--ink-soft)]">
                {obligation.sourceRationale}
              </div>
            </div>

            {canUpdateStatus ? (
              <div className="flex flex-wrap gap-3">
                <form action={updateObligationStatusAction}>
                  <input name="obligationId" type="hidden" value={obligation.id} />
                  <input name="status" type="hidden" value="IN_PROGRESS" />
                  <Button variant="outline" type="submit">
                    Mark in progress
                  </Button>
                </form>
                <form action={updateObligationStatusAction}>
                  <input name="obligationId" type="hidden" value={obligation.id} />
                  <input name="status" type="hidden" value="COMPLETE" />
                  <Button type="submit">Mark complete</Button>
                </form>
              </div>
            ) : (
              <div className="rounded-[24px] bg-[var(--surface-strong)] p-4 text-sm text-[var(--ink-soft)]">
                This obligation is visible to you, but only the assigned owner can change its status from this role.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval queue</CardTitle>
              <CardDescription>
                Completion should flow into explicit reviewer posture, not silent status drift.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {approvals.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  No approval record yet. Mark the obligation complete to create a review item.
                </p>
              ) : (
                approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge value={approval.status} />
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        {format(approval.createdAt, "MMM d")}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-[var(--ink-soft)]">
                      {approval.comments ?? "Awaiting reviewer decision."}
                    </p>
                    {approval.reviewer?.name ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        Reviewer: {approval.reviewer.name}
                      </p>
                    ) : null}
                    {canReviewApprovals && approval.status === "PENDING" ? (
                      <form action={reviewApprovalAction} className="mt-4 grid gap-3">
                        <input name="approvalId" type="hidden" value={approval.id} />
                        <label className="grid gap-2 text-sm">
                          Reviewer note
                          <Textarea
                            name="comments"
                            defaultValue={approval.comments ?? ""}
                            placeholder="Record the decision basis or changes requested."
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button name="status" size="sm" type="submit" value="APPROVED">
                            Approve
                          </Button>
                          <Button
                            name="status"
                            size="sm"
                            type="submit"
                            value="CHANGES_REQUESTED"
                            variant="outline"
                          >
                            Request changes
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked evidence</CardTitle>
              <CardDescription>
                Evidence is what makes completion defensible.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {obligation.artifactLinks.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  No linked evidence yet. Add a placeholder artifact from the documents center to clear this gap.
                </p>
              ) : (
                obligation.artifactLinks.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-[24px] bg-[var(--surface-strong)] p-4"
                  >
                    <p className="font-medium">{link.artifact.title}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {link.artifact.fileName}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI guidance</CardTitle>
              <CardDescription>
                Stored guidance is reviewable and attributable rather than ephemeral chat output.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {guidance.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">No AI guidance seeded for this obligation.</p>
              ) : (
                guidance.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge value={item.reviewStatus} />
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        {format(item.createdAt, "MMM d")}
                      </p>
                    </div>
                    <p className="mt-3 font-medium">{item.promptSummary}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                      {item.output}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                      Sources: {(Array.isArray(item.sourceRefs) ? item.sourceRefs : []).join(", ")}
                    </p>
                    {canReviewAiGuidance ? (
                      <div className="mt-4 flex gap-2">
                        <form action={reviewAiGuidanceAction}>
                          <input name="guidanceId" type="hidden" value={item.id} />
                          <input name="reviewStatus" type="hidden" value="REVIEWED" />
                          <Button size="sm" variant="outline" type="submit">
                            Mark reviewed
                          </Button>
                        </form>
                        <form action={reviewAiGuidanceAction}>
                          <input name="guidanceId" type="hidden" value={item.id} />
                          <input name="reviewStatus" type="hidden" value="APPROVED" />
                          <Button size="sm" type="submit">
                            Approve guidance
                          </Button>
                        </form>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[var(--ink-soft)]">
                        AI review actions are reserved for founder and CCO roles.
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
