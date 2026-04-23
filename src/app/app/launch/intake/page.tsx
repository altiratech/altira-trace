import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { FirmProfileForm } from "@/components/app/firm-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerContext } from "@/lib/data/workspace";
import { buildGovernancePosture } from "@/lib/governance-posture";
import { buildRegistrationGuide } from "@/lib/launch-guidance";
import { canAccessRoute } from "@/lib/permissions";
import { StatusBadge } from "@/components/app/status-badge";

type IntakeHandoffAction = {
  title: string;
  detail: string;
  href: string;
  badge: string;
  cta: string;
};

export default async function LaunchIntakePage() {
  const { firmProfile, membership } = await getViewerContext();
  const registrationGuide = buildRegistrationGuide(firmProfile);
  const governance = buildGovernancePosture(firmProfile, registrationGuide);
  const totalMissingInformation = registrationGuide.steps.reduce(
    (total, step) => total + step.missingInformation.length,
    0,
  );
  const stepsWithGaps = registrationGuide.steps.filter(
    (step) => step.missingInformation.length > 0,
  );
  const handoffActions: IntakeHandoffAction[] = [];
  const firstStepWithGap = stepsWithGaps[0];
  const leadGovernanceSignal =
    governance.prioritySignals[0] ?? governance.operationalSignals[0] ?? null;

  if (firstStepWithGap) {
    handoffActions.push({
      title: "Tighten the highest-leverage profile gap",
      detail: `${firstStepWithGap.title} is still carrying open launch assumptions. ${firstStepWithGap.missingInformation[0]?.title ?? "Resolve the highlighted fields"} before treating the filing packet as grounded.`,
      href: "/app/launch/intake",
      badge: firstStepWithGap.status,
      cta: "Finish intake updates",
    });
  }

  handoffActions.push({
    title:
      totalMissingInformation > 0
        ? "Open launch workspace with caveats"
        : "Open the live launch workspace",
    detail:
      totalMissingInformation > 0
        ? "You can start assigning owners and reviewing packet items now, but reviewers will still see the current profile gaps."
        : "The saved profile is coherent enough to drive launch packet ownership, evidence linking, and approval routing.",
    href: "/app/launch",
    badge: totalMissingInformation > 0 ? "IN_PROGRESS" : "COMPLETE",
    cta: "Go to launch workspace",
  });

  if (leadGovernanceSignal) {
    handoffActions.push({
      title: "Confirm governed posture",
      detail: leadGovernanceSignal.detail,
      href: "/app/settings",
      badge: leadGovernanceSignal.status,
      cta: "Open settings",
    });
  }

  if (totalMissingInformation === 0) {
    handoffActions.push({
      title: "Start linking evidence",
      detail:
        "Once the profile is stable, the next credibility move is linking proof to launch packet work from the documents center.",
      href: "/app/documents",
      badge: "PENDING_EVIDENCE",
      cta: "Open documents",
    });
  }

  if (!canAccessRoute(membership.role, "launch-intake")) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Firm Intake"
        title="Configure the obligation engine"
        description="The intake form is the control point for profile-driven obligations, launch milestones, registration guidance, and risk visibility. Update these fields whenever the firm's operating facts change."
        actions={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--panel)] px-4 text-sm font-medium text-[var(--panel-ink)] transition-colors hover:bg-[#17384b]"
            href="/app/launch"
          >
            Open launch workspace
          </Link>
        }
      />
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <FirmProfileForm profile={firmProfile} />

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>After you save this profile</CardTitle>
              <CardDescription>
                Intake should hand the team into the next operating surface, not leave them to guess what comes next.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {handoffActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{action.title}</p>
                    <StatusBadge value={action.badge} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{action.detail}</p>
                  <p className="mt-3 text-sm font-medium text-[var(--accent)]">
                    {action.cta}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What this drives</CardTitle>
              <CardDescription>
                The profile is not just metadata. It determines the launch lane the app guides the firm through.
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
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {totalMissingInformation > 0
                    ? `${totalMissingInformation} launch input gap${totalMissingInformation === 1 ? "" : "s"} still need to be clarified before the launch packet reads as decision-ready.`
                    : "The saved profile is coherent enough to drive a cleaner launch packet and reviewer flow."}
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                      Packet items · {step.packetItems.length}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                      Missing info · {step.missingInformation.length}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Missing information</CardTitle>
              <CardDescription>
                These are the profile gaps that keep the launch packet from reading as fully grounded.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {stepsWithGaps.length === 0 ? (
                <p className="rounded-[24px] border border-[color:var(--line)] bg-white p-4 text-sm text-[var(--ink-soft)]">
                  No launch-profile gaps are currently flagged. The next best move is to work from the launch workspace and link evidence to the packet items.
                </p>
              ) : (
                stepsWithGaps.map((step) => (
                  <div
                    key={step.code}
                    className="rounded-[24px] border border-[color:var(--line)] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">{step.title}</p>
                      <StatusBadge value={step.status} />
                    </div>
                    <div className="mt-3 grid gap-3">
                      {step.missingInformation.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[18px] border border-[color:var(--line)] bg-[#fff6ea] p-3"
                        >
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open decisions</CardTitle>
              <CardDescription>
                The product should surface what still needs a real human call before filing work starts.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {registrationGuide.openCalls.length === 0 ? (
                <p className="rounded-[24px] bg-[var(--surface-strong)] p-4 text-sm text-[var(--ink-soft)]">
                  No major open calls are currently flagged from the saved profile.
                </p>
              ) : (
                registrationGuide.openCalls.map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-[color:var(--line)] bg-[#fff6ea] p-4 text-sm text-[var(--ink-soft)]"
                  >
                    {item}
                  </div>
                ))
              )}
              <p className="rounded-[24px] border border-[color:var(--line)] bg-white p-4 text-sm text-[var(--ink-soft)]">
                {registrationGuide.automationBoundary}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governance posture</CardTitle>
              <CardDescription>
                Intake owns the structural facts, but settings-level posture changes the quality of the launch story those facts create.
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
              {governance.operationalSignals.map((signal) => (
                <div
                  key={signal.title}
                  className="rounded-[24px] border border-[color:var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{signal.title}</p>
                    <StatusBadge value={signal.status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{signal.detail}</p>
                </div>
              ))}
              <div className="rounded-[24px] border border-[color:var(--line)] bg-white p-4 text-sm text-[var(--ink-soft)]">
                <span className="font-medium text-[var(--ink)]">Governance note</span>
                <span className="mt-2 block">{governance.governanceNote}</span>
              </div>
              <Link
                href="/app/settings"
                className="inline-flex text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
              >
                Open settings governance controls
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filing packet preview</CardTitle>
              <CardDescription>
                This is the checklist the launch workspace will keep visible once the baseline facts are stable.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {registrationGuide.filingChecklist.map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] bg-[var(--surface-strong)] p-4 text-sm text-[var(--ink-soft)]"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
