import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  reviewApprovalAction,
  updateLaunchMilestoneAction,
  updateLaunchPacketItemAction,
} from "@/actions/workspace";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getLaunchWorkspace, getViewerContext } from "@/lib/data/workspace";
import {
  buildGovernancePosture,
  type GovernancePostureSignal,
} from "@/lib/governance-posture";
import { buildRegistrationGuide } from "@/lib/launch-guidance";
import { canAccessRoute, hasCapability } from "@/lib/permissions";

function uniqueSignals(signals: GovernancePostureSignal[]) {
  const seen = new Set<string>();

  return signals.filter((signal) => {
    if (seen.has(signal.title)) {
      return false;
    }

    seen.add(signal.title);
    return true;
  });
}

function getLaunchGovernanceContext(
  milestoneCode: string,
  governance: ReturnType<typeof buildGovernancePosture>,
) {
  const boundarySignal = governance.boundarySignal ? [governance.boundarySignal] : [];
  const activeOperationalSignals =
    governance.prioritySignals.length > 0
      ? governance.prioritySignals
      : governance.operationalSignals;

  switch (milestoneCode) {
    case "entity_setup":
      return {
        signals: boundarySignal,
        savePrompt:
          "Use notes to capture formation assumptions, principal-office caveats, or counsel follow-up that should stay attached to this packet item.",
        reviewPrompt:
          "Confirm the governed launch assumptions still match the entity and office facts this item is relying on.",
      };
    case "registration_lane":
      return {
        signals: uniqueSignals([
          ...boundarySignal,
          ...activeOperationalSignals.filter(
            (signal) => signal.title === "Complexity escalation lane",
          ),
        ]),
        savePrompt:
          "Use notes to preserve why the selected registration lane is still credible under the governed assumptions and any active escalation posture.",
        reviewPrompt:
          "Confirm the registration lane still lines up with the saved assumptions, complexity posture, and human-review boundary before approving.",
      };
    case "filing_packet":
      return {
        signals: uniqueSignals([
          ...boundarySignal,
          ...activeOperationalSignals.filter((signal) =>
            [
              "Marketing posture",
              "Vendor oversight posture",
              "Complexity escalation lane",
            ].includes(signal.title),
          ),
        ]),
        savePrompt:
          "Use notes to preserve filing assumptions, disclosure caveats, or settings-level posture that should stay visible to reviewers.",
        reviewPrompt:
          "Confirm the filing packet still matches the governed marketing, vendor, and escalation posture before approving.",
      };
    case "control_stack":
      return {
        signals:
          activeOperationalSignals.length > 0
            ? activeOperationalSignals
            : governance.operationalSignals,
        savePrompt:
          "Use notes to explain how this control record satisfies the governed marketing, vendor, or escalation posture before launch.",
        reviewPrompt:
          "Confirm the evidence and control story really support the governed marketing, vendor, and escalation posture before approving.",
      };
    case "launch_signoff":
      return {
        signals: uniqueSignals([...boundarySignal, ...activeOperationalSignals]),
        savePrompt:
          "Use notes to capture any final launch caveat, expert-review dependency, or policy boundary reminder that should survive signoff.",
        reviewPrompt:
          "Approve only if the launch packet reflects the saved governance note, the human-review boundary, and every active posture signal that still needs attention.",
      };
    default:
      return {
        signals: boundarySignal,
        savePrompt:
          "Use notes to preserve any assumption or follow-up that should stay attached to this launch item.",
        reviewPrompt:
          "Confirm this item still respects the saved launch assumptions and human-review boundary before approving.",
      };
  }
}

export default async function LaunchPage() {
  const { organization, firmProfile, membership } = await getViewerContext();

  if (!canAccessRoute(membership.role, "launch")) {
    notFound();
  }

  const workspace = await getLaunchWorkspace(organization.id);
  const canEditProfile = hasCapability(membership.role, "edit_firm_profile");
  const canManageLaunch = hasCapability(membership.role, "manage_launch_workspace");
  const canLinkArtifacts = hasCapability(membership.role, "link_artifacts");
  const canReviewApprovals = hasCapability(membership.role, "review_approvals");
  const registrationGuide = buildRegistrationGuide(
    firmProfile,
    Object.fromEntries(workspace.milestones.map((milestone) => [milestone.code, milestone.status])),
  );
  const governance = buildGovernancePosture(firmProfile, registrationGuide);
  const hasGovernanceNote = Boolean(firmProfile?.note?.trim());
  const completedMilestones = workspace.milestones.filter(
    (milestone) => milestone.status === "COMPLETE",
  ).length;
  const packetItemsWithMilestone = workspace.milestones.flatMap((milestone) =>
    milestone.packetItems.map((item) => ({
      ...item,
      milestoneTitle: milestone.title,
      blockedByDependency: milestone.isBlockedByDependency,
    })),
  );
  const reviewerQueue = packetItemsWithMilestone.filter(
    (item) => item.reviewStatus === "PENDING_APPROVAL",
  );
  const evidenceNeeded = packetItemsWithMilestone.filter(
    (item) =>
      item.status !== "COMPLETE" &&
      item.reviewStatus !== "PENDING_APPROVAL" &&
      item.artifactLinks.length === 0,
  );
  const blockedItems = packetItemsWithMilestone.filter(
    (item) =>
      item.status !== "COMPLETE" &&
      item.reviewStatus !== "PENDING_APPROVAL" &&
      (item.status === "BLOCKED" || item.blockedByDependency),
  );
  const guideStepByCode = new Map(registrationGuide.steps.map((step) => [step.code, step] as const));
  const totalMissingInformation = registrationGuide.steps.reduce(
    (total, step) => total + step.missingInformation.length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Launch Workspace"
        title="Launch-to-readiness plan"
        description="This workspace is meant to bridge pre-launch formation, registration prep, and first-year control readiness so the firm does not have to stitch the process together manually."
        actions={
          canEditProfile ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--panel)] px-4 text-sm font-medium text-[var(--panel-ink)] transition-colors hover:bg-[#17384b]"
              href="/app/launch/intake"
            >
              Refine firm profile
            </Link>
          ) : null
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {[
          {
            title: "Waiting on reviewer action",
            description:
              "These packet items already have evidence and ownership, and now need reviewer movement.",
            badge: reviewerQueue.length > 0 ? "PENDING_APPROVAL" : "APPROVED",
            items: reviewerQueue,
          },
          {
            title: "Waiting on evidence",
            description:
              "These packet items cannot move into review yet because they still need linked support.",
            badge: evidenceNeeded.length > 0 ? "PENDING_EVIDENCE" : "COMPLETE",
            items: evidenceNeeded,
          },
          {
            title: "Waiting on upstream blockers",
            description:
              "These packet items are being held up by blocked work or earlier launch-step dependencies.",
            badge: blockedItems.length > 0 ? "BLOCKED" : "COMPLETE",
            items: blockedItems,
          },
        ].map((lane) => (
          <Card key={lane.title}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{lane.title}</CardTitle>
                <StatusBadge value={lane.badge} />
              </div>
              <CardDescription>{lane.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-[20px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <p className="text-2xl font-semibold">{lane.items.length}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {lane.items.length === 1 ? "packet item" : "packet items"} currently in this routing lane.
                </p>
              </div>
              {lane.items.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  No launch packet items are currently sitting in this lane.
                </p>
              ) : (
                lane.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[20px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">{item.title}</p>
                      <span className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        {item.dueDate ? `due ${format(item.dueDate, "MMM d")}` : "due tbd"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.milestoneTitle}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                        Owner · {item.ownerMembership?.user.name ?? "Unassigned"}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                        Evidence · {item.artifactLinks.length}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>
              The milestones now act as editable launch records, not just narrative checkpoints.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">Launch progress</p>
                <StatusBadge
                  value={
                    completedMilestones === workspace.milestones.length
                      ? "COMPLETE"
                      : "IN_PROGRESS"
                  }
                />
              </div>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {completedMilestones} of {workspace.milestones.length} launch records are fully complete.
              </p>
            </div>
            {workspace.milestones.map((milestone) => {
              const guideStep = guideStepByCode.get(milestone.code);

              return (
                <div
                  key={milestone.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                        Step {milestone.orderIndex}
                      </p>
                      <h3 className="text-lg font-semibold">{milestone.title}</h3>
                      <p className="text-sm text-[var(--ink-soft)]">
                        {milestone.description}
                      </p>
                    </div>
                    <StatusBadge value={milestone.status} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                    {milestone.whyItMatters}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(
                      (Array.isArray(milestone.evidenceChecklist)
                        ? milestone.evidenceChecklist
                        : []) as string[]
                    ).map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  {guideStep ? (
                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      <div className="rounded-[20px] border border-[color:var(--line)] bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                            Packet items
                          </p>
                          <p className="text-xs text-[var(--ink-soft)]">
                            {
                              milestone.packetItems.filter(
                                (item) =>
                                  item.reviewStatus === "APPROVED" ||
                                  item.status === "COMPLETE",
                              ).length
                            }
                            /
                            {milestone.packetItems.length} advanced
                          </p>
                        </div>
                        {milestone.packetItems.length === 0 ? (
                          <p className="mt-3 text-sm text-[var(--ink-soft)]">
                            Launch packet records will appear here after the launch workflow refreshes.
                          </p>
                        ) : (
                          <div className="mt-3 grid gap-3">
                            {milestone.packetItems.map((item) => {
                              const pendingApproval = item.approvals.find(
                                (approval) => approval.status === "PENDING",
                              );
                              const evidenceRequired = Array.isArray(item.evidenceRequired)
                                ? (item.evidenceRequired as string[])
                                : [];
                              const governanceContext = getLaunchGovernanceContext(
                                milestone.code,
                                governance,
                              );
                              const visibleGovernanceSignals = governanceContext.signals.slice(
                                0,
                                milestone.code === "launch_signoff" ? 4 : 3,
                              );

                              return (
                                <div
                                  key={item.id}
                                  className="rounded-[18px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-3"
                                >
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <p className="font-medium">{item.title}</p>
                                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                                        {item.detail}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <StatusBadge value={item.status} />
                                      <StatusBadge value={item.reviewStatus} />
                                    </div>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                                      Owner · {item.ownerMembership?.user.name ?? "Unassigned"}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                                      Evidence · {item.artifactLinks.length}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                                      Due · {item.dueDate ? format(item.dueDate, "MMM d") : "TBD"}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                                      Approval state · {item.reviewStatus.toLowerCase().replace(/_/g, " ")}
                                    </span>
                                  </div>
                                  {evidenceRequired.length > 0 ? (
                                    <div className="mt-3 rounded-[18px] border border-[color:var(--line)] bg-white p-3">
                                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                                        Evidence expectations
                                      </p>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {evidenceRequired.map((requirement) => (
                                          <span
                                            key={requirement}
                                            className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]"
                                          >
                                            {requirement}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                  {item.notes ? (
                                    <div className="mt-3 rounded-[18px] border border-[color:var(--line)] bg-white p-3">
                                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                                        Working notes
                                      </p>
                                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                                        {item.notes}
                                      </p>
                                    </div>
                                  ) : null}
                                  {visibleGovernanceSignals.length > 0 || hasGovernanceNote ? (
                                    <div className="mt-3 rounded-[18px] border border-[color:var(--line)] bg-white p-3">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                                          Governance posture
                                        </p>
                                        <Link
                                          className="text-xs font-medium text-[var(--accent)] transition-colors hover:text-[#0b5675]"
                                          href="/app/settings"
                                        >
                                          Update settings
                                        </Link>
                                      </div>
                                      <p className="mt-3 text-sm text-[var(--ink-soft)]">
                                        {governanceContext.reviewPrompt}
                                      </p>
                                      {visibleGovernanceSignals.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {visibleGovernanceSignals.map((signal) => (
                                            <span
                                              key={signal.title}
                                              className="rounded-full border border-[color:var(--line)] bg-[var(--surface-strong)] px-3 py-1 text-xs text-[var(--ink-soft)]"
                                            >
                                              {signal.title} · {signal.status.toLowerCase().replace(/_/g, " ")}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                      {hasGovernanceNote ? (
                                        <div className="mt-3 rounded-[16px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-3">
                                          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                                            Saved governance note
                                          </p>
                                          <p className="mt-2 text-sm text-[var(--ink-soft)]">
                                            {firmProfile?.note}
                                          </p>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {item.artifactLinks.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {item.artifactLinks.map((link) => (
                                        <span
                                          key={link.id}
                                          className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]"
                                        >
                                          {link.artifact.title}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-3 text-sm text-[var(--ink-soft)]">
                                      No linked evidence yet. Attach at least one artifact before sending this item into review.
                                    </p>
                                  )}
                                  {canManageLaunch ? (
                                    <form
                                      action={updateLaunchPacketItemAction}
                                      className="mt-4 grid gap-3"
                                    >
                                      <input
                                        name="packetItemId"
                                        type="hidden"
                                        value={item.id}
                                      />
                                      <div className="grid gap-3 md:grid-cols-2">
                                        <label className="grid gap-2 text-sm">
                                          Packet item owner
                                          <select
                                            className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                                            defaultValue={item.ownerMembershipId ?? ""}
                                            name="ownerMembershipId"
                                          >
                                            <option value="">Unassigned</option>
                                            {workspace.memberships.map((teamMember) => (
                                              <option key={teamMember.id} value={teamMember.id}>
                                                {teamMember.user.name} · {teamMember.role.toLowerCase().replace(/_/g, " ")}
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                        <label className="grid gap-2 text-sm">
                                          Packet item status
                                          <select
                                            className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                                            defaultValue={item.status}
                                            name="status"
                                          >
                                            <option value="NOT_STARTED">Not started</option>
                                            <option value="IN_PROGRESS">In progress</option>
                                            <option value="BLOCKED">Blocked</option>
                                            <option value="NEEDS_REVIEW">Needs review</option>
                                            <option value="COMPLETE">Complete</option>
                                          </select>
                                        </label>
                                        <label className="grid gap-2 text-sm">
                                          Target due date
                                          <input
                                            className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                                            defaultValue={
                                              item.dueDate ? format(item.dueDate, "yyyy-MM-dd") : ""
                                            }
                                            name="dueDate"
                                            type="date"
                                          />
                                        </label>
                                      </div>
                                      <label className="grid gap-2 text-sm">
                                        Packet item notes
                                        <Textarea
                                          defaultValue={item.notes ?? ""}
                                          name="notes"
                                          placeholder="Capture counsel follow-up, filing assumptions, or what still needs to be attached before launch."
                                        />
                                      </label>
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-xs text-[var(--ink-soft)]">
                                          {governanceContext.savePrompt} Review and completion require both an owner and at least one linked artifact.
                                        </p>
                                        <Button size="sm" type="submit">
                                          Save packet item
                                        </Button>
                                      </div>
                                    </form>
                                  ) : null}
                                  {canLinkArtifacts ? (
                                    <Link
                                      className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] transition-colors hover:text-[#0b5675]"
                                      href="/app/documents"
                                    >
                                      Link evidence from documents center
                                    </Link>
                                  ) : null}
                                  {item.approvals.length > 0 ? (
                                    <div className="mt-4 rounded-[18px] border border-[color:var(--line)] bg-white p-3">
                                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                                        Approval history
                                      </p>
                                      <div className="mt-3 grid gap-3">
                                        {item.approvals.slice(0, 3).map((approval) => (
                                          <div
                                            key={approval.id}
                                            className="rounded-[16px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-3"
                                          >
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                              <p className="text-sm font-medium">
                                                {approval.reviewer?.name ?? "Pending reviewer"}
                                              </p>
                                              <StatusBadge value={approval.status} />
                                            </div>
                                            <p className="mt-2 text-sm text-[var(--ink-soft)]">
                                              {approval.comments ?? "No reviewer note yet."}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                      {canReviewApprovals && pendingApproval ? (
                                        <form action={reviewApprovalAction} className="mt-4 grid gap-3">
                                          <input
                                            name="approvalId"
                                            type="hidden"
                                            value={pendingApproval.id}
                                          />
                                          <p className="rounded-[16px] border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--ink-soft)]">
                                            {governanceContext.reviewPrompt}
                                          </p>
                                          <label className="grid gap-2 text-sm">
                                            Reviewer note
                                            <Textarea
                                              defaultValue={pendingApproval.comments ?? ""}
                                              name="comments"
                                              placeholder="Capture what aligns with the governed posture, what is missing, or what still needs follow-up before launch."
                                            />
                                          </label>
                                          <div className="flex flex-wrap gap-2">
                                            <Button
                                              name="status"
                                              size="sm"
                                              type="submit"
                                              value="APPROVED"
                                            >
                                              Approve packet item
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
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="rounded-[20px] border border-[color:var(--line)] bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                          Missing information
                        </p>
                        {guideStep.missingInformation.length === 0 ? (
                          <p className="mt-3 text-sm text-[var(--ink-soft)]">
                            No profile gaps are currently blocking this launch step.
                          </p>
                        ) : (
                          <div className="mt-3 grid gap-3">
                            {guideStep.missingInformation.map((item) => (
                              <div
                                key={item.title}
                                className="rounded-[18px] border border-[color:var(--line)] bg-[#fff6ea] p-3"
                              >
                                <p className="font-medium">{item.title}</p>
                                <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.detail}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {guideStep.missingInformation.length > 0 && canEditProfile ? (
                          <Link
                            className="mt-4 inline-flex text-sm font-medium text-[var(--accent)] transition-colors hover:text-[#0b5675]"
                            href="/app/launch/intake"
                          >
                            Resolve launch inputs
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {milestone.blockers.length > 0 ? (
                    <div className="mt-4 rounded-[20px] border border-[color:var(--line)] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        Blockers
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {milestone.blockers.map((blockedBy) => (
                          <span
                            key={blockedBy.code}
                            className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]"
                          >
                            {blockedBy.title} · {blockedBy.status.toLowerCase().replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                      {milestone.isBlockedByDependency ? (
                        <p className="mt-3 text-sm text-[var(--ink-soft)]">
                          This step cannot move into review or completion until the blocker steps above are complete.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                    Due {milestone.dueDate ? format(milestone.dueDate, "MMM d") : "TBD"}
                  </p>
                  {canManageLaunch ? (
                    <form action={updateLaunchMilestoneAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                      <input name="milestoneId" type="hidden" value={milestone.id} />
                      <label className="grid gap-2 text-sm">
                        Launch record status
                        <select
                          className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                          defaultValue={milestone.status}
                          name="status"
                        >
                          <option value="NOT_STARTED">Not started</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="NEEDS_REVIEW">Needs review</option>
                          <option value="COMPLETE">Complete</option>
                        </select>
                      </label>
                      <Button size="sm" type="submit">
                        Save step
                      </Button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration guide</CardTitle>
              <CardDescription>
                {registrationGuide.summary} {totalMissingInformation} launch inputs still need to be clarified across the guide.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{registrationGuide.headline}</p>
                  <StatusBadge value={firmProfile?.targetRegistrationType ?? "NOT_STARTED"} />
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {registrationGuide.automationBoundary}
                </p>
              </div>
              {registrationGuide.steps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{step.title}</p>
                    <StatusBadge value={step.status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{step.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile snapshot</CardTitle>
              <CardDescription>
                These inputs drive the obligation set and the pilot narrative.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-[var(--ink-soft)]">
              <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
                Registration path: <span className="font-medium text-[var(--ink)]">{firmProfile?.targetRegistrationType?.replace("_", " ")}</span>
              </div>
              <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
                AUM band: <span className="font-medium text-[var(--ink)]">{firmProfile?.aumBand?.replace(/_/g, " ")}</span>
              </div>
              <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
                Testimonials: <span className="font-medium text-[var(--ink)]">{firmProfile?.usesTestimonials ? "In use" : "Not in use"}</span>
              </div>
              <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
                Vendors: <span className="font-medium text-[var(--ink)]">{Array.isArray(firmProfile?.keyVendors) ? (firmProfile?.keyVendors as string[]).length : 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filing packet and open calls</CardTitle>
              <CardDescription>
                The app should explain what still needs attention before launch, not just list tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {registrationGuide.filingChecklist.map((item) => (
                <div key={item} className="rounded-[24px] bg-[var(--surface-strong)] p-4">
                  <p className="font-medium">{item}</p>
                </div>
              ))}
              {registrationGuide.openCalls.length === 0 ? (
                <p className="rounded-[24px] bg-[var(--surface-strong)] p-4 text-sm text-[var(--ink-soft)]">
                  No major open calls are currently flagged from the profile inputs.
                </p>
              ) : (
                registrationGuide.openCalls.map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-[color:var(--line)] bg-[#fff6ea] p-4"
                  >
                    <p className="text-sm text-[var(--ink-soft)]">{item}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Obligation preview</CardTitle>
              <CardDescription>
                Generated from the firm profile rather than static one-size-fits-all checklists.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {workspace.obligations.slice(0, 4).map((obligation) => (
                <div
                  key={obligation.id}
                  className="rounded-[24px] bg-[var(--surface-strong)] p-4"
                >
                  <p className="font-medium">{obligation.title}</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {obligation.cadenceLabel}
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
