import { MembershipRole } from "@prisma/client";
import { getRoleFocus } from "@/lib/permissions";

type DemoAccountDefinition = {
  id: string;
  label: string;
  email: string;
  role: MembershipRole;
  roleLabel: string;
  preview: string;
};

const demoPassword = "LaunchReady123!";

const demoAccountDefinitions: DemoAccountDefinition[] = [
  {
    id: "founder-admin",
    label: "Founder Admin [Placeholder]",
    email: "founder@placeholder-ria.local",
    role: MembershipRole.FOUNDER_ADMIN,
    roleLabel: "Founder admin",
    preview:
      "Best for seeing the control tower, launch pressure, and cross-functional approval flow first.",
  },
  {
    id: "cco",
    label: "CCO User [Placeholder]",
    email: "cco@placeholder-ria.local",
    role: MembershipRole.CCO,
    roleLabel: "CCO",
    preview:
      "Best for reviewing signoff posture, evidence quality, and the human-review boundary.",
  },
  {
    id: "operations",
    label: "Operations User [Placeholder]",
    email: "ops@placeholder-ria.local",
    role: MembershipRole.OPERATIONS,
    roleLabel: "Operations",
    preview:
      "Best for seeing how launch work, evidence linking, and execution lanes move day to day.",
  },
  {
    id: "supervised-person",
    label: "Supervised Person [Placeholder]",
    email: "advisor@placeholder-ria.local",
    role: MembershipRole.SUPERVISED_PERSON,
    roleLabel: "Supervised person",
    preview:
      "Best for the narrow assigned-work view where an advisor completes tasks and attaches proof.",
  },
];

export function getDemoAccounts() {
  return demoAccountDefinitions.map((account) => {
    const roleFocus = getRoleFocus(account.role);

    return {
      ...account,
      password: demoPassword,
      initialHref: roleFocus.primaryHref,
      initialLabel: roleFocus.primaryLabel,
      laneTitle: roleFocus.title,
      laneSummary: roleFocus.summary,
    };
  });
}
