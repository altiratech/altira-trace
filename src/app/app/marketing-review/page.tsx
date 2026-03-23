import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import {
  linkArtifactAction,
  reviewApprovalAction,
  updateMarketingReviewAction,
} from "@/actions/workspace";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getApprovalsForEntity,
  getArtifactCatalog,
  getMarketingSnapshot,
  getViewerContext,
} from "@/lib/data/workspace";
import { buildGovernancePosture } from "@/lib/governance-posture";
import { buildRegistrationGuide } from "@/lib/launch-guidance";
import { canAccessRoute, hasCapability } from "@/lib/permissions";

function getMarketingGovernanceContext(
  governance: ReturnType<typeof buildGovernancePosture>,
) {
  const signals = [
    governance.boundarySignal,
    ...governance.prioritySignals.filter((signal) =>
      ["Marketing posture", "Complexity escalation lane"].includes(signal.title),
    ),
  ].filter(Boolean);

  return {
    signals,
    updatePrompt:
      "Use reviewer comments to show whether disclosure, support, and retention still match the governed marketing posture.",
    reviewPrompt:
      "Approve only if the material and support match the governed marketing posture, any active escalation lane, and the review boundary.",
  };
}

export default async function MarketingReviewPage() {
  const { organization, membership, firmProfile } = await getViewerContext();

  if (!canAccessRoute(membership.role, "marketing-review")) {
    notFound();
  }

  const [items, artifacts] = await Promise.all([
    getMarketingSnapshot(organization.id),
    getArtifactCatalog(organization.id),
  ]);
  const canManageMarketing = hasCapability(membership.role, "manage_marketing_review");
  const canReviewApprovals = hasCapability(membership.role, "review_approvals");
  const registrationGuide = buildRegistrationGuide(firmProfile);
  const governance = buildGovernancePosture(firmProfile, registrationGuide);
  const governanceContext = getMarketingGovernanceContext(governance);
  const hasGovernanceNote = Boolean(firmProfile?.note?.trim());
  const approvalEntries: Array<
    readonly [string, Awaited<ReturnType<typeof getApprovalsForEntity>>]
  > = await Promise.all(
    items.map(async (item) => {
      const approvals = await getApprovalsForEntity(
        organization.id,
        "marketing_review",
        item.id,
      );

      return [item.id, approvals] as const;
    }),
  );
  const approvalsByItemId = new Map(approvalEntries);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing Review"
        title="Concrete high-risk module"
        description="Marketing review is intentionally thin but real in the pilot because it is easy for buyers to understand and connects directly to approval and retention workflows."
      />

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>
                    {item.materialType} · submitted by {item.submitter?.name ?? "Unknown"}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={item.status} />
                  {approvalsByItemId.get(item.id)?.[0] ? (
                    <StatusBadge value={approvalsByItemId.get(item.id)![0].status} />
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-3">
                {canManageMarketing ? (
                  <form action={updateMarketingReviewAction} className="grid gap-3">
                    <input name="reviewId" type="hidden" value={item.id} />
                    <label className="grid gap-2 text-sm">
                      Review status
                      <select
                        className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                        defaultValue={item.status}
                        name="status"
                      >
                        <option value="SUBMITTED">Submitted</option>
                        <option value="IN_REVIEW">In review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="NEEDS_CHANGES">Needs changes</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      Reviewer comment
                      <Textarea
                        defaultValue={item.reviewerComment ?? ""}
                        name="reviewerComment"
                        placeholder="Capture disclosure, substantiation, retention, or governed-posture concerns."
                      />
                    </label>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {governanceContext.updatePrompt}
                    </p>
                    <div>
                      <Button size="sm" type="submit">
                        {item.status === "IN_REVIEW" ? "Update review packet" : "Save review state"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm leading-7 text-[var(--ink-soft)]">
                    {item.reviewerComment}
                  </p>
                )}
                {((Array.isArray(item.checklistJson) ? item.checklistJson : []) as Array<{
                  item: string;
                  status: string;
                }>).map((check) => (
                  <div
                    key={check.item}
                    className="rounded-[24px] bg-[var(--surface-strong)] p-4"
                  >
                    <p className="font-medium">{check.item}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{check.status}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">Governance posture</p>
                    <Link
                      className="text-sm font-medium text-[var(--accent)] transition-colors hover:text-[#0b5675]"
                      href="/app/settings"
                    >
                      Open settings
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {governanceContext.reviewPrompt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {governanceContext.signals.map((signal) => (
                      <span
                        key={signal.title}
                        className="rounded-full border border-[color:var(--line)] bg-white px-3 py-1 text-xs text-[var(--ink-soft)]"
                      >
                        {signal.title} · {signal.status.toLowerCase().replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                  {hasGovernanceNote ? (
                    <div className="mt-3 rounded-[20px] border border-[color:var(--line)] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        Saved governance note
                      </p>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        {firmProfile?.note}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                  <p className="font-medium">Approval history</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {approvalsByItemId.get(item.id)?.length
                      ? "Each reviewer decision is retained so the material has a visible audit trail."
                      : "Move an item into review to create an approval record."}
                  </p>
                </div>
                {(approvalsByItemId.get(item.id) ?? []).map((approval) => (
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
                        <p className="rounded-[16px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink-soft)]">
                          {governanceContext.reviewPrompt}
                        </p>
                        <label className="grid gap-2 text-sm">
                          Reviewer note
                          <Textarea
                            name="comments"
                            defaultValue={approval.comments ?? item.reviewerComment ?? ""}
                            placeholder="Document how the material aligns with the governed posture or what disclosure, substantiation, or retention changes are still needed."
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button name="status" size="sm" type="submit" value="APPROVED">
                            Approve material
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
                ))}
                {canManageMarketing ? (
                  <form action={linkArtifactAction} className="grid gap-3">
                    <input name="targetId" type="hidden" value={item.id} />
                    <input name="targetType" type="hidden" value="marketing_review" />
                    <label className="grid gap-2 text-sm">
                      Link existing artifact
                      <select
                        className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                        name="artifactId"
                      >
                        {artifacts.map((artifact) => (
                          <option key={artifact.id} value={artifact.id}>
                            {artifact.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                      defaultValue="Marketing review support"
                      name="label"
                      placeholder="Link label"
                    />
                    <div>
                      <Button size="sm" type="submit" variant="outline">
                        Link artifact
                      </Button>
                    </div>
                  </form>
                ) : null}
                {item.artifactLinks.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                  >
                    <p className="font-medium">{link.artifact.title}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {link.artifact.fileName}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
