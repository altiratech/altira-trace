import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  linkArtifactAction,
  reviewApprovalAction,
  updateExamRequestAction,
} from "@/actions/workspace";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getApprovalsForEntity,
  getArtifactCatalog,
  getExamRoomSnapshot,
  getViewerContext,
} from "@/lib/data/workspace";
import { canAccessRoute, hasCapability } from "@/lib/permissions";

export default async function ExamRoomPage() {
  const { organization, membership } = await getViewerContext();

  if (!canAccessRoute(membership.role, "exam-room")) {
    notFound();
  }

  const [examRequests, artifacts] = await Promise.all([
    getExamRoomSnapshot(organization.id),
    getArtifactCatalog(organization.id),
  ]);
  const canManageExamRoom = hasCapability(membership.role, "manage_exam_room");
  const canReviewApprovals = hasCapability(membership.role, "review_approvals");
  const approvalEntries: Array<
    readonly [string, Awaited<ReturnType<typeof getApprovalsForEntity>>]
  > = await Promise.all(
    examRequests.map(async (request) => {
      const approvals = await getApprovalsForEntity(
        organization.id,
        "exam_request",
        request.id,
      );

      return [request.id, approvals] as const;
    }),
  );
  const approvalsByRequestId = new Map(approvalEntries);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam Room"
        title="Request-ready response workflow"
        description="The exam room keeps requests, statuses, and linked evidence in one visible place so the team can respond coherently instead of scrambling."
      />

      <div className="grid gap-4">
        {examRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>{request.title}</CardTitle>
                  <CardDescription>
                    Due {format(request.dueAt, "MMMM d, yyyy")}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={request.status} />
                  {approvalsByRequestId.get(request.id)?.[0] ? (
                    <StatusBadge value={approvalsByRequestId.get(request.id)![0].status} />
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                {canManageExamRoom ? (
                  <form action={updateExamRequestAction} className="grid gap-3">
                    <input name="requestId" type="hidden" value={request.id} />
                    <label className="grid gap-2 text-sm">
                      Request status
                      <select
                        className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                        defaultValue={request.status}
                        name="status"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="READY_TO_SEND">Ready to send</option>
                        <option value="COMPLETE">Complete</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      Response summary
                      <Textarea defaultValue={request.summary} name="summary" />
                    </label>
                    <div>
                      <Button size="sm" type="submit">
                        {request.status === "READY_TO_SEND"
                          ? "Update response packet"
                          : "Save request"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm leading-7 text-[var(--ink-soft)]">
                    {request.summary}
                  </p>
                )}
                {((Array.isArray(request.itemsJson) ? request.itemsJson : []) as Array<{
                  request: string;
                  status: string;
                }>).map((item) => (
                  <div
                    key={item.request}
                    className="rounded-[24px] bg-[var(--surface-strong)] p-4"
                  >
                    <p className="font-medium">{item.request}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{item.status}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                  <p className="font-medium">Evidence posture</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {request.artifactLinks.length === 0
                      ? "No linked support yet. Attach response artifacts before moving this request into signoff."
                      : `${request.artifactLinks.length} linked artifact${request.artifactLinks.length === 1 ? "" : "s"} back this response packet.`}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                  <p className="font-medium">Signoff history</p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {(approvalsByRequestId.get(request.id) ?? []).length
                      ? "The send-ready decision trail stays attached to the request."
                      : "Move the request to ready to send to create the first reviewer decision."}
                  </p>
                </div>
                {(approvalsByRequestId.get(request.id) ?? []).map((approval) => (
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
                            placeholder="Document what still needs work before the response goes out."
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button name="status" size="sm" type="submit" value="APPROVED">
                            Approve packet
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
                {canManageExamRoom ? (
                  <form action={linkArtifactAction} className="grid gap-3">
                    <input name="targetId" type="hidden" value={request.id} />
                    <input name="targetType" type="hidden" value="exam_request" />
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
                      defaultValue="Exam request support"
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
                {request.artifactLinks.length === 0 ? (
                  <p className="text-sm text-[var(--ink-soft)]">
                    No support artifacts are linked to this request yet.
                  </p>
                ) : (
                  request.artifactLinks.map((link) => (
                    <div
                      key={link.id}
                      className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                    >
                      <p className="font-medium">{link.artifact.title}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {link.artifact.fileName}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
