import { type FirmProfile } from "@prisma/client";
import { type RegistrationGuide } from "@/lib/launch-guidance";

export type GovernancePostureSignal = {
  title: string;
  status: string;
  detail: string;
  href: string;
  label: string;
};

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function buildGovernancePosture(
  profile: FirmProfile | null,
  guide: RegistrationGuide,
) {
  const jurisdictions = readStringArray(profile?.jurisdictions);
  const keyVendors = readStringArray(profile?.keyVendors);
  const marketingFlags = readStringArray(profile?.marketingFlags);
  const vendorFlags = readStringArray(profile?.vendorFlags);
  const hasCustody = Boolean(
    profile?.custodyProfile &&
      profile.custodyProfile.trim().length > 0 &&
      profile.custodyProfile.trim().toLowerCase() !== "no custody",
  );

  const postureSignals: GovernancePostureSignal[] = [
    {
      title: "Human-review boundary",
      status: guide.openCalls.length === 0 ? "COMPLETE" : "IN_PROGRESS",
      detail: guide.automationBoundary,
      href: "/app/launch",
      label: "Review launch workflow",
    },
    {
      title: "Marketing posture",
      status: profile?.usesTestimonials
        ? marketingFlags.length > 0
          ? "IN_PROGRESS"
          : "ATTENTION_REQUIRED"
        : "COMPLETE",
      detail: profile?.usesTestimonials
        ? marketingFlags.length > 0
          ? `${marketingFlags.length} marketing control flags are captured for the pilot.`
          : "Testimonials are enabled, but the governance record is missing marketing control flags."
        : "Testimonials are off, so the pilot treats marketing review as a lower-pressure lane.",
      href: "/app/marketing-review",
      label: "Open marketing review",
    },
    {
      title: "Vendor oversight posture",
      status:
        keyVendors.length === 0
          ? "NOT_STARTED"
          : vendorFlags.length > 0
            ? "IN_PROGRESS"
            : "ATTENTION_REQUIRED",
      detail:
        keyVendors.length === 0
          ? "The core vendor stack is still blank, so diligence posture is not yet governed here."
          : vendorFlags.length > 0
            ? `${vendorFlags.length} vendor oversight flags are attached to the control posture.`
            : "Named vendors exist, but the governance record still needs vendor oversight flags.",
      href: "/app/vendors",
      label: "Open vendor oversight",
    },
    {
      title: "Complexity escalation lane",
      status:
        profile?.hasPrivateFunds || hasCustody
          ? "ATTENTION_REQUIRED"
          : "COMPLETE",
      detail: profile?.hasPrivateFunds
        ? "Private fund complexity is switched on and should stay explicitly escalated for expert review."
        : hasCustody
          ? "Custody-sensitive operations are in scope, so launch and first-year controls need higher-touch review."
          : "No custody-sensitive or private-fund escalation flags are currently active.",
      href: "/app/launch",
      label: "Review launch assumptions",
    },
  ];

  const [boundarySignal, ...operationalSignals] = postureSignals;
  const prioritySignals = operationalSignals.filter(
    (signal) => signal.status !== "COMPLETE",
  );

  return {
    jurisdictions,
    keyVendors,
    marketingFlags,
    vendorFlags,
    hasCustody,
    boundarySignal,
    operationalSignals,
    postureSignals,
    prioritySignals,
    governanceNote: profile?.note?.trim() || "No explicit governance note saved yet.",
  };
}
