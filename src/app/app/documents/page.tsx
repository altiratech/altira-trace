import { format } from "date-fns";
import { createArtifactAction, linkArtifactAction } from "@/actions/workspace";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getDocumentsSnapshot,
  getViewerContext,
  getWorkflowLinkTargets,
} from "@/lib/data/workspace";
import { hasCapability } from "@/lib/permissions";

function ArtifactTargetOptions({
  includeCrossWorkflowTargets,
  targets,
}: {
  includeCrossWorkflowTargets: boolean;
  targets: Awaited<ReturnType<typeof getWorkflowLinkTargets>>;
}) {
  return (
    <>
      <option value="">No workflow selected</option>
      <optgroup label="Obligations">
        {targets.obligations.map((obligation) => (
          <option key={obligation.id} value={`obligation:${obligation.id}`}>
            {obligation.title}
          </option>
        ))}
      </optgroup>
      {includeCrossWorkflowTargets ? (
        <optgroup label="Launch Packet">
          {targets.launchPacketItems.map((item) => (
            <option key={item.id} value={`launch_packet_item:${item.id}`}>
              {item.milestone.title} · {item.title}
              {item.dueDate ? ` · due ${format(item.dueDate, "MMM d")}` : ""}
            </option>
          ))}
        </optgroup>
      ) : null}
      {includeCrossWorkflowTargets ? (
        <>
          <optgroup label="Annual Review">
            {targets.annualReviews.map((review) => (
              <option key={review.id} value={`annual_review:${review.id}`}>
                {review.summary}
              </option>
            ))}
          </optgroup>
          <optgroup label="Exam Room">
            {targets.examRequests.map((request) => (
              <option key={request.id} value={`exam_request:${request.id}`}>
                {request.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Marketing Review">
            {targets.marketingReviews.map((review) => (
              <option key={review.id} value={`marketing_review:${review.id}`}>
                {review.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Vendors">
            {targets.vendors.map((vendor) => (
              <option key={vendor.id} value={`vendor:${vendor.id}`}>
                {vendor.name}
              </option>
            ))}
          </optgroup>
        </>
      ) : null}
    </>
  );
}

function describeArtifactLink(
  link: Awaited<ReturnType<typeof getDocumentsSnapshot>>["artifacts"][number]["links"][number],
) {
  if (link.launchPacketItem) {
    return `Launch packet · ${link.launchPacketItem.milestone.title} · ${link.launchPacketItem.title}`;
  }

  if (link.obligation) {
    return `Obligation · ${link.obligation.title}`;
  }

  if (link.annualReview) {
    return "Annual review";
  }

  if (link.examRequest) {
    return `Exam room · ${link.examRequest.title}`;
  }

  if (link.marketingReview) {
    return `Marketing review · ${link.marketingReview.title}`;
  }

  if (link.vendor) {
    return `Vendor · ${link.vendor.name}`;
  }

  return "Linked workflow";
}

function describeLaunchSupportState(
  item: NonNullable<
    Awaited<ReturnType<typeof getDocumentsSnapshot>>["artifacts"][number]["links"][number]["launchPacketItem"]
  >,
) {
  if (item.reviewStatus === "PENDING_APPROVAL") {
    return "This packet item is waiting on reviewer signoff, so the linked support should stay easy to inspect.";
  }

  if (item.dueDate && item.dueDate < new Date() && item.status !== "COMPLETE") {
    return "This packet item is past due, so the artifact should stay visible until the launch lane is back on schedule.";
  }

  if (item.status === "BLOCKED") {
    return "This packet item is blocked by upstream launch work, so the evidence is present but cannot fully unblock the lane alone.";
  }

  return "This artifact supports an active launch packet item and should stay visible until that record is fully closed.";
}

export default async function DocumentsPage() {
  const { organization, membership } = await getViewerContext();
  const [snapshot, targets] = await Promise.all([
    getDocumentsSnapshot(organization.id),
    getWorkflowLinkTargets(organization.id),
  ]);
  const canLinkAcrossWorkflows = hasCapability(membership.role, "link_artifacts");
  const launchPacketEvidenceQueue = targets.launchPacketItems
    .filter((item) => item.status !== "COMPLETE")
    .sort((left, right) => {
      const leftScore =
        (left.artifactLinks.length === 0 ? 4 : 0) +
        (left.reviewStatus === "PENDING_APPROVAL" ? 3 : 0) +
        (left.dueDate && left.dueDate < new Date() ? 2 : 0);
      const rightScore =
        (right.artifactLinks.length === 0 ? 4 : 0) +
        (right.reviewStatus === "PENDING_APPROVAL" ? 3 : 0) +
        (right.dueDate && right.dueDate < new Date() ? 2 : 0);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (left.dueDate && right.dueDate) {
        return left.dueDate.getTime() - right.dueDate.getTime();
      }

      if (left.dueDate) {
        return -1;
      }

      if (right.dueDate) {
        return 1;
      }

      return left.sortOrder - right.sortOrder;
    })
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evidence Center"
        title="Documents and linked proof"
        description="This pilot uses metadata-only placeholder artifacts to demonstrate evidence mapping without mixing in fake production-like records."
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add placeholder evidence</CardTitle>
            <CardDescription>
              This creates a new metadata record and can link it into the live workflow graph.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createArtifactAction} className="grid gap-4">
              <label className="grid gap-2 text-sm">
                Evidence title
                <Input name="title" placeholder="Control owner map [Placeholder]" />
              </label>
              <label className="grid gap-2 text-sm">
                Filename
                <Input
                  name="fileName"
                  placeholder="placeholder-control-owner-map.pdf"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Category
                <select
                  className="h-11 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 text-sm"
                  name="category"
                >
                  <option value="EVIDENCE">Evidence</option>
                  <option value="POLICY">Policy</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="REVIEW">Review</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                Link to workflow
                <select
                  className="h-11 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 text-sm"
                  name="targetKey"
                >
                  <ArtifactTargetOptions
                    includeCrossWorkflowTargets={canLinkAcrossWorkflows}
                    targets={targets}
                  />
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                Note
                <Textarea
                  name="note"
                  placeholder="Clearly label why this placeholder artifact exists and what real evidence should replace it later."
                />
              </label>
              <button
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                Add artifact
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {!canLinkAcrossWorkflows ? (
            <Card>
              <CardHeader>
                <CardTitle>Role boundary</CardTitle>
                <CardDescription>
                  This role can add evidence and link it to obligation work, but cross-workflow linking stays with founder, CCO, and operations.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {canLinkAcrossWorkflows ? (
            <Card>
              <CardHeader>
                <CardTitle>Link existing evidence</CardTitle>
                <CardDescription>
                  Use the documents center to attach one artifact across multiple workflows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={linkArtifactAction} className="grid gap-4">
                  <label className="grid gap-2 text-sm">
                    Existing artifact
                    <select
                      className="h-11 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 text-sm"
                      name="artifactId"
                    >
                      {snapshot.artifacts.map((artifact) => (
                        <option key={artifact.id} value={artifact.id}>
                          {artifact.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    Workflow target
                    <select
                      className="h-11 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 text-sm"
                      name="targetKey"
                    >
                      <ArtifactTargetOptions
                        includeCrossWorkflowTargets={true}
                        targets={targets}
                      />
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    Link label
                    <Input
                      defaultValue="Linked from documents center"
                      name="label"
                      placeholder="Describe why this artifact belongs in that workflow."
                    />
                  </label>
                  <Button type="submit" variant="outline">
                    Link artifact
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Launch packet evidence queue</CardTitle>
              <CardDescription>
                These launch records currently need the clearest evidence attention from the documents center.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {launchPacketEvidenceQueue.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  No open launch packet items are currently asking for evidence attention.
                </p>
              ) : (
                launchPacketEvidenceQueue.map((item) => {
                  const evidenceRequired = Array.isArray(item.evidenceRequired)
                    ? (item.evidenceRequired as string[])
                    : [];

                  return (
                    <div
                      key={item.id}
                      className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-[var(--ink-soft)]">
                            {item.milestone.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                            {item.dueDate ? `Due ${format(item.dueDate, "MMM d")}` : "Due TBD"}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                            Evidence {item.artifactLinks.length}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-[var(--ink-soft)]">{item.detail}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                          Owner · {item.ownerMembership?.user.name ?? "Unassigned"}
                        </span>
                        <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                          Review · {item.reviewStatus.toLowerCase().replace(/_/g, " ")}
                        </span>
                      </div>
                      {evidenceRequired.length > 0 ? (
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
                      ) : null}
                      <p className="mt-3 text-sm text-[var(--ink-soft)]">
                        {item.artifactLinks.length === 0
                          ? "No evidence is linked yet. Use the workflow target selector above to attach a placeholder artifact."
                          : "Evidence is linked, but this item should still stay visible until the packet is fully ready."}
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current artifacts</CardTitle>
              <CardDescription>
                Each record shows whether evidence is actually tied to a workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {snapshot.artifacts.map((artifact) => (
                (() => {
                  const launchLinks = artifact.links.filter(
                    (link) => link.launchPacketItem,
                  );

                  return (
                    <div
                      key={artifact.id}
                      className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{artifact.title}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                          {artifact.category}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        {artifact.fileName}
                      </p>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        Uploaded by {artifact.uploadedBy?.name ?? "Unknown"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {artifact.links.length === 0 ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                            No workflow links yet
                          </span>
                        ) : (
                          artifact.links.map((link) => (
                            <span
                              key={link.id}
                              className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]"
                            >
                              {describeArtifactLink(link)}
                            </span>
                          ))
                        )}
                      </div>
                      {launchLinks.length > 0 ? (
                        <div className="mt-4 rounded-[20px] border border-[color:var(--line)] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                              Launch packet support
                            </p>
                            <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                              {launchLinks.length} linked item{launchLinks.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-3">
                            {launchLinks.map((link) => {
                              const item = link.launchPacketItem;

                              if (!item) {
                                return null;
                              }

                              const evidenceRequired = Array.isArray(item.evidenceRequired)
                                ? (item.evidenceRequired as string[])
                                : [];

                              return (
                                <div
                                  key={link.id}
                                  className="rounded-[18px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-3"
                                >
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <p className="font-medium">{item.title}</p>
                                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                                        {item.milestone.title}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <StatusBadge value={item.status} />
                                      <StatusBadge value={item.reviewStatus} />
                                      <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                                        {item.dueDate
                                          ? `Due ${format(item.dueDate, "MMM d")}`
                                          : "Due TBD"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                                      Owner · {item.ownerMembership?.user.name ?? "Unassigned"}
                                    </span>
                                    <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                                      Link label · {link.label ?? "Linked from documents center"}
                                    </span>
                                  </div>
                                  {evidenceRequired.length > 0 ? (
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
                                  ) : null}
                                  <p className="mt-3 text-sm text-[var(--ink-soft)]">
                                    {describeLaunchSupportState(item)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })()
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent evidence activity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {snapshot.activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-[24px] bg-[var(--surface-strong)] p-4 text-sm text-[var(--ink-soft)]"
                >
                  {log.summary}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
