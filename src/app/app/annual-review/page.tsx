import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import {
  linkArtifactAction,
  reviewApprovalAction,
  updateAnnualReviewAction,
} from "@/actions/workspace";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getAnnualReviewSnapshot,
  getApprovalsForEntity,
  getArtifactCatalog,
  getViewerContext,
} from "@/lib/data/workspace";
import { buildGovernancePosture } from "@/lib/governance-posture";
import { buildRegistrationGuide } from "@/lib/launch-guidance";
import { canAccessRoute, hasCapability } from "@/lib/permissions";

function getAnnualReviewGovernanceContext(
  governance: ReturnType<typeof buildGovernancePosture>,
) {
  const signals = [
    governance.boundarySignal,
    ...governance.prioritySignals.filter((signal) =>
      ["Vendor oversight posture", "Complexity escalation lane"].includes(
        signal.title,
      ),
    ),
  ].filter(Boolean);

  return {
    signals,
    updatePrompt:
      "Use the summary to show whether this cycle still matches the governance note, any active escalation posture, and the review boundary.",
    reviewPrompt:
      "Approve only if the annual review narrative and support still match the governance note, any active escalation posture, and the review boundary.",
  };
}

export default async function AnnualReviewPage() {
  const { organization, membership, firmProfile } = await getViewerContext();

  if (!canAccessRoute(membership.role, "annual-review")) {
    notFound();
  }

  const [review, artifacts] = await Promise.all([
    getAnnualReviewSnapshot(organization.id),
    getArtifactCatalog(organization.id),
  ]);
  const canManageReview = hasCapability(membership.role, "manage_annual_review");
  const canReviewApprovals = hasCapability(membership.role, "review_approvals");
  const registrationGuide = buildRegistrationGuide(firmProfile);
  const governance = buildGovernancePosture(firmProfile, registrationGuide);
  const governanceContext = getAnnualReviewGovernanceContext(governance);
  const hasGovernanceNote = Boolean(firmProfile?.note?.trim());

  if (!review) {
    return <div>No annual review seeded.</div>;
  }

  const approvals = await getApprovalsForEntity(organization.id, "annual_review", review.id);
  const latestApproval = approvals[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Annual Review"
        title="Structured review workflow"
        description="Annual review is modeled as an operating workflow with sections, findings, and linked support rather than one big narrative memo."
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Review summary</CardTitle>
            <CardDescription>{review.summary}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={review.status} />
              {latestApproval ? <StatusBadge value={latestApproval.status} /> : null}
            </div>
            {latestApproval ? (
              <p className="text-sm text-[var(--ink-soft)]">
                Latest signoff activity was recorded {format(latestApproval.createdAt, "MMM d")}.
              </p>
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">
                Move this review to ready for signoff when the narrative and linked support are ready
                for founder or CCO review.
              </p>
            )}
            {canManageReview ? (
              <form action={updateAnnualReviewAction} className="grid gap-3">
                <input name="reviewId" type="hidden" value={review.id} />
                <label className="grid gap-2 text-sm">
                  Review status
                  <select
                    className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                    defaultValue={review.status}
                    name="status"
                  >
                    <option value="NOT_STARTED">Not started</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="READY_FOR_SIGNOFF">Ready for signoff</option>
                    <option value="COMPLETE">Complete</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Summary
                  <Textarea
                    defaultValue={review.summary}
                    name="summary"
                    placeholder="Capture how this review cycle reflects the governed posture and what still needs follow-up."
                  />
                </label>
                <p className="text-xs text-[var(--ink-soft)]">
                  {governanceContext.updatePrompt}
                </p>
                <div>
                  <Button size="sm" type="submit">
                    {review.status === "READY_FOR_SIGNOFF"
                      ? "Update signoff packet"
                      : "Save annual review"}
                  </Button>
                </div>
              </form>
            ) : null}
            {((Array.isArray(review.sectionsJson) ? review.sectionsJson : []) as Array<{
              title: string;
              progress: string;
              note: string;
            }>).map((section) => (
              <div
                key={section.title}
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{section.title}</p>
                  <StatusBadge value={section.progress.toUpperCase().replace(/ /g, "_")} />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {section.note}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Signoff queue</CardTitle>
              <CardDescription>
                Annual review should move through visible reviewer posture instead of finishing
                silently.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
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
              {approvals.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  No signoff history yet. Set the review to ready for signoff to create the first
                  reviewer decision.
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
                        <p className="rounded-[16px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink-soft)]">
                          {governanceContext.reviewPrompt}
                        </p>
                        <label className="grid gap-2 text-sm">
                          Reviewer note
                          <Textarea
                            name="comments"
                            defaultValue={approval.comments ?? ""}
                            placeholder="Document how the signoff aligns with the governed posture or what still needs follow-up."
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button name="status" size="sm" type="submit" value="APPROVED">
                            Approve signoff
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
              <CardTitle>Open findings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {((Array.isArray(review.findingsJson) ? review.findingsJson : []) as Array<{
                severity: string;
                title: string;
              }>).map((finding) => (
                <div
                  key={finding.title}
                  className="rounded-[24px] bg-[var(--surface-strong)] p-4"
                >
                  <StatusBadge value={finding.severity.toUpperCase()} />
                  <p className="mt-3 text-sm text-[var(--ink-soft)]">{finding.title}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked support</CardTitle>
              <CardDescription>
                Evidence attached here becomes part of the visible review record.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {canManageReview ? (
                <form action={linkArtifactAction} className="grid gap-3">
                  <input name="targetId" type="hidden" value={review.id} />
                  <input name="targetType" type="hidden" value="annual_review" />
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
                    defaultValue="Annual review support"
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
              {review.artifactLinks.map((link) => (
                <div
                  key={link.id}
                  className="rounded-[24px] bg-[var(--surface-strong)] p-4"
                >
                  <p className="font-medium">{link.artifact.title}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {link.artifact.fileName}
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
