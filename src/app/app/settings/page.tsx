import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateGovernancePostureAction } from "@/actions/workspace";
import { getViewerContext } from "@/lib/data/workspace";
import { buildGovernancePosture } from "@/lib/governance-posture";
import { buildRegistrationGuide } from "@/lib/launch-guidance";
import { canAccessRoute, hasCapability } from "@/lib/permissions";
import { titleCase } from "@/lib/utils";

function formatList(items: string[]) {
  return items.length > 0 ? items.join(", ") : "Not yet defined";
}

export default async function SettingsPage() {
  const { organization, membership, firmProfile } = await getViewerContext();

  if (!canAccessRoute(membership.role, "settings")) {
    notFound();
  }

  const canEdit = hasCapability(membership.role, "edit_firm_profile");
  const guide = buildRegistrationGuide(firmProfile);
  const {
    jurisdictions,
    keyVendors,
    marketingFlags,
    vendorFlags,
    postureSignals,
    governanceNote,
  } = buildGovernancePosture(firmProfile, guide);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings and Boundaries"
        title="Governance and control posture"
        description="This page now acts like the place where launch assumptions, control posture, and the human-review boundary are made explicit for the pilot."
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Governed firm assumptions</CardTitle>
            <CardDescription>
              Intake owns the structural firm facts. Settings turns those facts into an explicit operating posture.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-[var(--ink-soft)]">
            <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
              Registration lane:{" "}
              <span className="font-medium text-[var(--ink)]">
                {titleCase(
                  firmProfile?.targetRegistrationType ?? organization.registrationType,
                )}
              </span>
            </div>
            <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
              Principal office:{" "}
              <span className="font-medium text-[var(--ink)]">
                {firmProfile?.principalOfficeState ?? organization.principalOfficeState}
              </span>
            </div>
            <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
              Service model:{" "}
              <span className="font-medium text-[var(--ink)]">
                {firmProfile?.serviceModel ?? organization.serviceModel}
              </span>
            </div>
            <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
              Jurisdictions:{" "}
              <span className="font-medium text-[var(--ink)]">
                {formatList(jurisdictions)}
              </span>
            </div>
            <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
              Core vendors:{" "}
              <span className="font-medium text-[var(--ink)]">
                {formatList(keyVendors)}
              </span>
            </div>
            <div className="rounded-[24px] bg-[var(--surface-strong)] p-4">
              Governance note:{" "}
              <span className="font-medium text-[var(--ink)]">
                {governanceNote}
              </span>
            </div>
            <div className="pt-2">
              <Link
                href="/app/launch/intake"
                className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
              >
                Update structural intake inputs
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Human-review boundary</CardTitle>
            <CardDescription>
              The product can organize, draft, and pressure-test work, but final judgment still stays visibly human-owned.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-7 text-[var(--ink-soft)]">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5">
              {guide.automationBoundary}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  App should do
                </p>
                <p className="mt-2">
                  Turn launch and compliance work into owned tasks, linked evidence, approvals, and exam posture.
                </p>
              </div>
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  Humans still decide
                </p>
                <p className="mt-2">
                  Filing judgment, launch signoff, legal interpretation, and any live compliance claim.
                </p>
              </div>
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  Pilot reminder
                </p>
                <p className="mt-2">
                  Placeholder demo data must be replaced with source-backed facts before any live pilot reliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Control posture signals</CardTitle>
            <CardDescription>
              These are the settings-level signals most likely to change the credibility of the launch and first-year story.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {postureSignals.map((signal) => (
              <div
                key={signal.title}
                className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-[var(--ink)]">{signal.title}</p>
                  <StatusBadge value={signal.status} />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {signal.detail}
                </p>
                <Link
                  href={signal.href}
                  className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {signal.label}
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open governance calls</CardTitle>
            <CardDescription>
              These are the settings-adjacent decisions that are still putting pressure on the launch packet.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {guide.openCalls.length === 0 ? (
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[var(--ink)]">
                    Governance calls are currently quiet
                  </p>
                  <StatusBadge value="COMPLETE" />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  The launch guide does not currently see extra boundary or posture calls beyond the active workflow itself.
                </p>
              </div>
            ) : (
              guide.openCalls.map((call) => (
                <div
                  key={call}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[var(--ink)]">{call}</p>
                    <StatusBadge value="ATTENTION_REQUIRED" />
                  </div>
                </div>
              ))
            )}

            <div className="rounded-[24px] border border-[color:var(--line)] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                Launch guide coverage
              </p>
              <div className="mt-4 grid gap-3">
                {guide.steps.map((step) => (
                  <div
                    key={step.code}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-[var(--ink)]">{step.title}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {step.detail}
                      </p>
                    </div>
                    <StatusBadge value={step.status} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Governance controls</CardTitle>
          <CardDescription>
            Founder and CCO can update the control posture here without revisiting every structural intake field. Saving refreshes workflow guidance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!firmProfile ? (
            <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5">
              <p className="font-medium text-[var(--ink)]">
                Complete intake before governing settings
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                This settings surface depends on a saved firm profile. Once intake is complete, governance notes, marketing posture, and vendor oversight posture can be edited here.
              </p>
              <Link
                href="/app/launch/intake"
                className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
              >
                Go to launch intake
              </Link>
            </div>
          ) : canEdit ? (
            <form action={updateGovernancePostureAction} className="grid gap-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Marketing control flags
                  <Input
                    name="marketingFlags"
                    defaultValue={marketingFlags.join(", ")}
                    placeholder="Testimonials in use, Pre-approval workflow live"
                  />
                </label>

                <label className="grid gap-2 text-sm">
                  Vendor oversight flags
                  <Input
                    name="vendorFlags"
                    defaultValue={vendorFlags.join(", ")}
                    placeholder="Diligence pending, Archiving review required"
                  />
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm">
                  <input
                    name="usesTestimonials"
                    type="checkbox"
                    defaultChecked={firmProfile.usesTestimonials}
                  />
                  Testimonials or endorsements are in scope
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm">
                  <input
                    name="hasPrivateFunds"
                    type="checkbox"
                    defaultChecked={firmProfile.hasPrivateFunds}
                  />
                  Private fund complexity needs explicit escalation
                </label>
              </div>

              <label className="grid gap-2 text-sm">
                Launch assumptions and counsel follow-up
                <Textarea
                  name="note"
                  defaultValue={firmProfile.note ?? ""}
                  placeholder="Capture boundary reminders, assumptions, or questions that should stay attached to launch governance."
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-4">
                <p className="text-sm text-[var(--ink-soft)]">
                  This editor is intentionally narrow. Use launch intake for changes to registration lane, office state, jurisdictions, custody, or vendor list.
                </p>
                <Button type="submit">Save governance posture</Button>
              </div>
            </form>
          ) : (
            <div className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-5">
              <p className="font-medium text-[var(--ink)]">
                Governance editing is limited to founder and CCO
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                Your role can review the current posture here, but structural and governance edits are intentionally limited to the people who own firm-level judgment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
