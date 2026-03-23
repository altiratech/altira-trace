import Link from "next/link";
import { format } from "date-fns";
import { reviewApprovalAction } from "@/actions/workspace";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getDashboardSnapshot, getObligationsList, getViewerContext } from "@/lib/data/workspace";
import { buildGovernancePosture } from "@/lib/governance-posture";
import { buildRegistrationGuide } from "@/lib/launch-guidance";
import { getRoleFocus, hasCapability } from "@/lib/permissions";

export default async function DashboardPage() {
  const { organization, membership, firmProfile } = await getViewerContext();
  const [dashboard, assignedObligations] = await Promise.all([
    getDashboardSnapshot(organization.id),
    getObligationsList(organization.id, {
      ownerMembershipId: membership.id,
    }),
  ]);
  const roleFocus = getRoleFocus(membership.role);
  const canReviewApprovals = hasCapability(membership.role, "review_approvals");
  const registrationGuide = buildRegistrationGuide(firmProfile);
  const governance = buildGovernancePosture(firmProfile, registrationGuide);
  const totalMissingInformation = registrationGuide.steps.reduce(
    (total, step) => total + step.missingInformation.length,
    0,
  );
  const launchPacketPressure =
    dashboard.metrics.launchPacketOverdue +
    dashboard.metrics.launchPacketAwaitingApproval +
    dashboard.metrics.launchPacketMissingEvidence;
  const nextLaunchStep =
    registrationGuide.steps.find((step) => step.missingInformation.length > 0) ??
    registrationGuide.steps.find((step) => step.status !== "COMPLETE") ??
    registrationGuide.steps[0];
  const openLaunchCalls = registrationGuide.openCalls.slice(0, 2);
  const topGovernanceSignals =
    governance.prioritySignals.length > 0
      ? governance.prioritySignals.slice(0, 2)
      : governance.operationalSignals.slice(0, 1);

  const metrics = [
    {
      label: "Overdue",
      value: dashboard.metrics.overdue,
      helper: "Needs immediate owner attention",
    },
    {
      label: "Awaiting approval",
      value: dashboard.metrics.awaitingApproval,
      helper: "Decision-ready work sitting in reviewer queues",
    },
    {
      label: "Launch progress",
      value: `${dashboard.metrics.launchProgress}%`,
      helper: "Milestones completed in the first-year plan",
    },
    {
      label: "Evidence still missing",
      value: dashboard.metrics.missingEvidence,
      helper: "Open proof gaps across launch packet and obligation work",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control Tower"
        title="What matters now"
        description="This dashboard is built to answer the core pilot question in one screen: what needs attention, what is missing, and what the team should do next."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-4xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--ink-soft)]">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming obligations</CardTitle>
            <CardDescription>
              The first few items should make the newly launched RIA story feel concrete.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard.obligations.map((obligation) => (
              <Link
                key={obligation.id}
                href={`/app/obligations/${obligation.id}`}
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{obligation.title}</p>
                    <p className="text-sm text-[var(--ink-soft)]">
                      {obligation.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={obligation.riskLevel} />
                    <StatusBadge value={obligation.status} />
                    <span className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                      due {format(obligation.dueDate, "MMM d")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Launch story today</CardTitle>
              <CardDescription>
                The product should explain the current launch lane before the user opens the deeper workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{registrationGuide.headline}</p>
                  <StatusBadge value={firmProfile?.targetRegistrationType ?? "NOT_STARTED"} />
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {registrationGuide.summary}
                </p>
              </div>
              {nextLaunchStep ? (
                <Link
                  href={totalMissingInformation > 0 ? "/app/launch/intake" : "/app/launch"}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">Next launch move</p>
                    <StatusBadge value={nextLaunchStep.status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {nextLaunchStep.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {totalMissingInformation > 0
                      ? `${totalMissingInformation} launch input gap${totalMissingInformation === 1 ? "" : "s"} still need clarification.`
                      : "The intake is stable enough to work from the launch packet and approval workflow."}
                  </p>
                </Link>
              ) : null}
              {openLaunchCalls.length > 0 ? (
                openLaunchCalls.map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-[color:var(--line)] bg-[#fff6ea] p-4 text-sm text-[var(--ink-soft)]"
                  >
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-[color:var(--line)] bg-white p-4 text-sm text-[var(--ink-soft)]">
                  No major launch calls are currently flagged from the saved profile.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attention now</CardTitle>
              <CardDescription>
                The alpha should make review bottlenecks and proof gaps obvious without extra clicks.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link
                href={
                  dashboard.metrics.awaitingApproval > 0
                    ? (dashboard.approvals[0]?.entityHref ?? "/app/annual-review")
                    : "/app/annual-review"
                }
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Approval queue</p>
                  <StatusBadge
                    value={
                      dashboard.metrics.awaitingApproval > 0 ? "PENDING_APPROVAL" : "APPROVED"
                    }
                  />
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {dashboard.metrics.awaitingApproval > 0
                    ? `${dashboard.metrics.awaitingApproval} workflow item${dashboard.metrics.awaitingApproval === 1 ? "" : "s"} awaiting reviewer decision.`
                    : "No workflow items are waiting for reviewer approval right now."}
                </p>
              </Link>
              <Link
                href={dashboard.metrics.missingEvidence > 0 ? "/app/documents" : "/app/obligations"}
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Evidence coverage</p>
                  <StatusBadge
                    value={
                      dashboard.metrics.missingEvidence > 0 ? "PENDING_EVIDENCE" : "COMPLETE"
                    }
                  />
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {dashboard.metrics.missingEvidence > 0
                    ? `${dashboard.metrics.missingEvidence} launch or obligation item${dashboard.metrics.missingEvidence === 1 ? "" : "s"} still need linked support.`
                    : "Current launch and obligation work all have at least one linked artifact."}
                </p>
              </Link>
              {dashboard.annualReview ? (
                <Link
                  href="/app/annual-review"
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Annual review posture</p>
                    <StatusBadge value={dashboard.annualReview.status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {dashboard.annualReview.status === "READY_FOR_SIGNOFF"
                      ? "The annual review narrative is ready for signoff."
                      : dashboard.annualReview.status === "COMPLETE"
                        ? "The latest review cycle is complete and visible."
                        : "The annual review is still being worked through."}
                  </p>
                </Link>
              ) : null}
              <Link
                href="/app/launch"
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Launch packet pressure</p>
                  <StatusBadge
                    value={launchPacketPressure > 0 ? "ATTENTION_REQUIRED" : "COMPLETE"}
                  />
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {launchPacketPressure > 0
                    ? `${dashboard.metrics.launchPacketOverdue} overdue, ${dashboard.metrics.launchPacketAwaitingApproval} awaiting approval, and ${dashboard.metrics.launchPacketMissingEvidence} missing evidence inside the launch packet.`
                    : "Current launch packet items are covered for due dates, evidence, and approval posture."}
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governance posture</CardTitle>
              <CardDescription>
                Settings-level assumptions should stay visible here because they change how trustworthy the launch story feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">Human-review boundary</p>
                  <StatusBadge value={governance.boundarySignal?.status ?? "IN_PROGRESS"} />
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {registrationGuide.automationBoundary}
                </p>
              </div>
              {topGovernanceSignals.map((signal) => (
                <Link
                  key={signal.title}
                  href={signal.href}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{signal.title}</p>
                    <StatusBadge value={signal.status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {signal.detail}
                  </p>
                </Link>
              ))}
              <Link
                href="/app/settings"
                className="rounded-[24px] border border-[color:var(--line)] bg-white p-4 text-sm text-[var(--ink-soft)] transition-transform hover:-translate-y-0.5"
              >
                <span className="font-medium text-[var(--ink)]">Governance note</span>
                <span className="mt-2 block">{governance.governanceNote}</span>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current lane</CardTitle>
              <CardDescription>{roleFocus.summary}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <p className="font-medium">{roleFocus.title}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Next best move: {roleFocus.primaryLabel.toLowerCase()}.
                </p>
              </div>
              {assignedObligations.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  No obligations are directly assigned to this membership yet.
                </p>
              ) : (
                assignedObligations.slice(0, 3).map((obligation) => (
                  <Link
                    key={obligation.id}
                    href={`/app/obligations/${obligation.id}`}
                    className="rounded-[24px] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{obligation.title}</p>
                      <StatusBadge value={obligation.status} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      Due {format(obligation.dueDate, "MMM d")}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top launch packet calls</CardTitle>
              <CardDescription>
                These are the launch records most likely to stall readiness if they sit untouched.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.launchPacketFocus.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  No open launch packet items are competing for attention right now.
                </p>
              ) : (
                dashboard.launchPacketFocus.map((item) => (
                  <Link
                    key={item.id}
                    href="/app/launch"
                    className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-[var(--ink-soft)]">{item.detail}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={item.status} />
                        <StatusBadge value={item.reviewStatus} />
                        <span className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                          {item.dueDate ? `due ${format(item.dueDate, "MMM d")}` : "no due date"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                        Step · {item.milestone.title}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                        Owner · {item.ownerMembership?.user.name ?? "Unassigned"}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                        Evidence · {item.artifactLinks.length}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[var(--ink-soft)]">
                      {item.reviewStatus === "PENDING_APPROVAL"
                        ? "Waiting on reviewer signoff."
                        : item.artifactLinks.length === 0
                          ? "Still missing linked evidence before review can stick."
                          : item.status === "BLOCKED"
                            ? "Blocked and likely needs upstream launch work resolved first."
                            : "Open launch work that should stay visible from the dashboard."}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending approvals</CardTitle>
              <CardDescription>
                Reviewable workflow is part of the trust posture, not an afterthought.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.approvals.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">No open approvals.</p>
              ) : (
                dashboard.approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link href={approval.entityHref} className="font-medium hover:underline">
                        {approval.entityLabel}
                      </Link>
                      <StatusBadge value={approval.status} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      {approval.comments ?? "Awaiting reviewer decision."}
                    </p>
                    {approval.contextLine ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                          {approval.contextLine}
                        </span>
                        {approval.entityStatus ? (
                          <StatusBadge value={approval.entityStatus} />
                        ) : null}
                        {approval.entityReviewStatus ? (
                          <StatusBadge value={approval.entityReviewStatus} />
                        ) : null}
                      </div>
                    ) : null}
                    {canReviewApprovals ? (
                      <form action={reviewApprovalAction} className="mt-4 grid gap-3">
                        <input name="approvalId" type="hidden" value={approval.id} />
                        <label className="grid gap-2 text-sm">
                          Reviewer note
                          <Textarea
                            name="comments"
                            defaultValue={approval.comments ?? ""}
                            placeholder="Add a short decision note for the activity trail."
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
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>
                The operating memory should show why the firm feels more under control.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.activityLogs.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={item.entityHref} className="font-medium hover:underline">
                      {item.entityLabel}
                    </Link>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                      {format(item.createdAt, "MMM d, h:mm a")}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.summary}</p>
                  {item.contextLine ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                        {item.contextLine}
                      </span>
                      {item.entityStatus ? <StatusBadge value={item.entityStatus} /> : null}
                      {item.entityReviewStatus ? (
                        <StatusBadge value={item.entityReviewStatus} />
                      ) : null}
                    </div>
                  ) : null}
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                    {item.entityType.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
