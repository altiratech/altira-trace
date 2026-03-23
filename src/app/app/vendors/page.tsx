import { format } from "date-fns";
import { notFound } from "next/navigation";
import {
  createIncidentAction,
  linkArtifactAction,
  reviewApprovalAction,
  updateVendorAction,
} from "@/actions/workspace";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getApprovalsForEntity,
  getArtifactCatalog,
  getVendorSnapshot,
  getViewerContext,
} from "@/lib/data/workspace";
import { canAccessRoute, hasCapability } from "@/lib/permissions";

export default async function VendorsPage() {
  const { organization, membership } = await getViewerContext();

  if (!canAccessRoute(membership.role, "vendors")) {
    notFound();
  }

  const [snapshot, artifacts] = await Promise.all([
    getVendorSnapshot(organization.id),
    getArtifactCatalog(organization.id),
  ]);
  const canManageVendors = hasCapability(membership.role, "manage_vendors");
  const canReviewApprovals = hasCapability(membership.role, "review_approvals");
  const approvalEntries: Array<
    readonly [string, Awaited<ReturnType<typeof getApprovalsForEntity>>]
  > = await Promise.all(
    snapshot.vendors.map(async (vendor) => {
      const approvals = await getApprovalsForEntity(organization.id, "vendor", vendor.id);

      return [vendor.id, approvals] as const;
    }),
  );
  const approvalsByVendorId = new Map(approvalEntries);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendors and Reg S-P"
        title="Service-provider oversight"
        description="The pilot keeps vendor diligence and incident-readiness visible without pretending to be a full cybersecurity platform."
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Vendor oversight</CardTitle>
            <CardDescription>
              Focused on service-provider readiness and evidence-linked diligence.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {snapshot.vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{vendor.name}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {vendor.category}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={vendor.riskTier} />
                    <StatusBadge value={vendor.diligenceStatus} />
                    {approvalsByVendorId.get(vendor.id)?.[0] ? (
                      <StatusBadge value={approvalsByVendorId.get(vendor.id)![0].status} />
                    ) : null}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                  {vendor.summary}
                </p>
                <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="grid gap-3">
                    {canManageVendors ? (
                      <form action={updateVendorAction} className="grid gap-3">
                        <input name="vendorId" type="hidden" value={vendor.id} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="grid gap-2 text-sm">
                            Diligence status
                            <select
                              className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                              defaultValue={vendor.diligenceStatus}
                              name="diligenceStatus"
                            >
                              <option value="NOT_STARTED">Not started</option>
                              <option value="IN_PROGRESS">In progress</option>
                              <option value="COMPLETE">Complete</option>
                              <option value="ATTENTION_REQUIRED">Attention required</option>
                            </select>
                          </label>
                          <label className="grid gap-2 text-sm">
                            Risk tier
                            <select
                              className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                              defaultValue={vendor.riskTier}
                              name="riskTier"
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                              <option value="CRITICAL">Critical</option>
                            </select>
                          </label>
                        </div>
                        <label className="grid gap-2 text-sm">
                          Oversight summary
                          <Textarea defaultValue={vendor.summary} name="summary" />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" type="submit">
                            {vendor.diligenceStatus === "COMPLETE"
                              ? "Update signoff packet"
                              : "Save vendor"}
                          </Button>
                        </div>
                      </form>
                    ) : null}
                    <div className="rounded-[24px] border border-[color:var(--line)] bg-white px-4 py-4">
                      <p className="font-medium">Evidence posture</p>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        {vendor.artifactLinks.length === 0
                          ? "No linked diligence support yet. Attach questionnaires, policies, or reviews before requesting signoff."
                          : `${vendor.artifactLinks.length} linked artifact${vendor.artifactLinks.length === 1 ? "" : "s"} support this vendor record.`}
                      </p>
                      {vendor.lastReviewedAt ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                          Last touched {format(vendor.lastReviewedAt, "MMM d")}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-[24px] border border-[color:var(--line)] bg-white px-4 py-4">
                      <p className="font-medium">Signoff history</p>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        {(approvalsByVendorId.get(vendor.id) ?? []).length
                          ? "Reviewer decisions stay attached to the vendor diligence record."
                          : "Mark diligence complete to create the first reviewer decision."}
                      </p>
                    </div>
                    {(approvalsByVendorId.get(vendor.id) ?? []).map((approval) => (
                      <div
                        key={approval.id}
                        className="rounded-[24px] border border-[color:var(--line)] bg-white px-4 py-4"
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
                                placeholder="Document the diligence gap or confirm why the vendor is signoff-ready."
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <Button name="status" size="sm" type="submit" value="APPROVED">
                                Approve diligence
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
                    {canManageVendors ? (
                      <form action={linkArtifactAction} className="grid gap-3">
                        <input name="targetId" type="hidden" value={vendor.id} />
                        <input name="targetType" type="hidden" value="vendor" />
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
                          defaultValue="Vendor oversight evidence"
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
                    {vendor.artifactLinks.length === 0 ? (
                      <p className="text-sm text-[var(--ink-soft)]">
                        No diligence artifacts are linked to this vendor yet.
                      </p>
                    ) : (
                      vendor.artifactLinks.map((link) => (
                        <div
                          key={link.id}
                          className="rounded-[20px] bg-white px-4 py-3 text-sm text-[var(--ink-soft)]"
                        >
                          {link.artifact.title}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident readiness</CardTitle>
            <CardDescription>
              Visible gaps keep Reg S-P readiness tied to execution, not abstract awareness.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {canManageVendors ? (
              <form action={createIncidentAction} className="grid gap-3 rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <label className="grid gap-2 text-sm">
                  Incident title
                  <input
                    className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                    name="title"
                    placeholder="Tabletop evidence gap [Placeholder]"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Severity
                  <select
                    className="h-11 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm"
                    name="severity"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Summary
                  <Textarea
                    name="summary"
                    placeholder="Describe the readiness gap or follow-up needed."
                  />
                </label>
                <div>
                  <Button size="sm" type="submit">
                    Log incident item
                  </Button>
                </div>
              </form>
            ) : null}
            {snapshot.incidents.map((incident) => (
              <div
                key={incident.id}
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{incident.title}</p>
                  <StatusBadge value={incident.severity} />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {incident.summary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
