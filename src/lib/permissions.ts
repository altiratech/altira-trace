import { MembershipRole } from "@prisma/client";

export type AppRouteId =
  | "dashboard"
  | "launch"
  | "launch-intake"
  | "obligations"
  | "documents"
  | "annual-review"
  | "exam-room"
  | "marketing-review"
  | "vendors"
  | "team"
  | "settings";

export type AppCapability =
  | "edit_firm_profile"
  | "manage_launch_workspace"
  | "update_obligation_status"
  | "assign_obligation_owner"
  | "upload_artifacts"
  | "link_artifacts"
  | "manage_annual_review"
  | "manage_exam_room"
  | "manage_marketing_review"
  | "manage_vendors"
  | "review_ai_guidance"
  | "review_approvals";

type RoleFocus = {
  title: string;
  summary: string;
  primaryHref: string;
  primaryLabel: string;
};

const routeAccess: Record<AppRouteId, MembershipRole[]> = {
  dashboard: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
    MembershipRole.SUPERVISED_PERSON,
    MembershipRole.EXTERNAL_CONSULTANT,
  ],
  launch: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  "launch-intake": [MembershipRole.FOUNDER_ADMIN, MembershipRole.CCO],
  obligations: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
    MembershipRole.SUPERVISED_PERSON,
    MembershipRole.EXTERNAL_CONSULTANT,
  ],
  documents: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
    MembershipRole.SUPERVISED_PERSON,
    MembershipRole.EXTERNAL_CONSULTANT,
  ],
  "annual-review": [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  "exam-room": [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  "marketing-review": [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  vendors: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  team: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
    MembershipRole.SUPERVISED_PERSON,
  ],
  settings: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
    MembershipRole.SUPERVISED_PERSON,
    MembershipRole.EXTERNAL_CONSULTANT,
  ],
};

const capabilityAccess: Record<AppCapability, MembershipRole[]> = {
  edit_firm_profile: [MembershipRole.FOUNDER_ADMIN, MembershipRole.CCO],
  manage_launch_workspace: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  update_obligation_status: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
    MembershipRole.SUPERVISED_PERSON,
  ],
  assign_obligation_owner: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  upload_artifacts: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
    MembershipRole.SUPERVISED_PERSON,
  ],
  link_artifacts: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  manage_annual_review: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  manage_exam_room: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  manage_marketing_review: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  manage_vendors: [
    MembershipRole.FOUNDER_ADMIN,
    MembershipRole.CCO,
    MembershipRole.OPERATIONS,
  ],
  review_ai_guidance: [MembershipRole.FOUNDER_ADMIN, MembershipRole.CCO],
  review_approvals: [MembershipRole.FOUNDER_ADMIN, MembershipRole.CCO],
};

const roleFocusMap: Record<MembershipRole, RoleFocus> = {
  [MembershipRole.FOUNDER_ADMIN]: {
    title: "Keep the control tower coherent",
    summary:
      "Your lane is cross-functional clarity: confirm the workflow stays credible, staffed, and decision-ready.",
    primaryHref: "/app/dashboard",
    primaryLabel: "Review the dashboard",
  },
  [MembershipRole.CCO]: {
    title: "Review evidence and approval posture",
    summary:
      "Your lane is defensibility: approve key work, pressure-test evidence gaps, and keep policy execution tight.",
    primaryHref: "/app/annual-review",
    primaryLabel: "Open the annual review",
  },
  [MembershipRole.OPERATIONS]: {
    title: "Move work forward and attach proof",
    summary:
      "Your lane is execution: unblock obligations, keep artifacts linked, and keep exam response material organized.",
    primaryHref: "/app/documents",
    primaryLabel: "Work from documents",
  },
  [MembershipRole.SUPERVISED_PERSON]: {
    title: "Complete assigned work cleanly",
    summary:
      "Your lane is the assigned obligation set: update status, add evidence, and keep your portion of the record accurate.",
    primaryHref: "/app/obligations",
    primaryLabel: "See assigned obligations",
  },
  [MembershipRole.EXTERNAL_CONSULTANT]: {
    title: "Support the firm with scoped inputs",
    summary:
      "Your lane is advisory support: provide artifacts and observations without owning the firm's internal approvals.",
    primaryHref: "/app/documents",
    primaryLabel: "Review shared documents",
  },
};

export function canAccessRoute(role: MembershipRole, routeId: AppRouteId) {
  return routeAccess[routeId].includes(role);
}

export function hasCapability(role: MembershipRole, capability: AppCapability) {
  return capabilityAccess[capability].includes(role);
}

export function getRoleFocus(role: MembershipRole) {
  return roleFocusMap[role];
}

export function getCapabilitySummary(capability: AppCapability) {
  return capabilityAccess[capability];
}
