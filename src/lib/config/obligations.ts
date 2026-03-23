import {
  AumBand,
  MembershipRole,
  RegistrationType,
  RiskLevel,
  type FirmProfile,
} from "@prisma/client";
import { addDays } from "date-fns";

type TriggerConditions = {
  always?: boolean;
  usesTestimonials?: boolean;
  hasCustody?: boolean;
  hasKeyVendors?: boolean;
  registrationTypes?: RegistrationType[];
  aumBands?: AumBand[];
};

export type TemplateDefinition = {
  code: string;
  title: string;
  description: string;
  cadenceLabel: string;
  defaultDueInDays: number;
  ownerRole: MembershipRole;
  riskLevel: RiskLevel;
  evidenceRequirements: string[];
  sourceReference: string;
  rationale: string;
  triggerConditions: TriggerConditions;
};

export const templateDefinitions: TemplateDefinition[] = [
  {
    code: "launch_control_inventory",
    title: "Confirm first-year compliance control inventory",
    description:
      "Translate the firm's profile into an owned calendar, control list, and accountable operating rhythm for the first year after launch.",
    cadenceLabel: "First 30 days",
    defaultDueInDays: 10,
    ownerRole: MembershipRole.FOUNDER_ADMIN,
    riskLevel: RiskLevel.HIGH,
    evidenceRequirements: [
      "Firm profile sign-off",
      "Control inventory worksheet",
      "Assigned owner list",
    ],
    sourceReference: "S2, S4",
    rationale:
      "Newly launched firms need a visible operating baseline before recurring deadlines pile up.",
    triggerConditions: { always: true },
  },
  {
    code: "adv_update_calendar",
    title: "Stand up Form ADV and filing cadence calendar",
    description:
      "Build the recurring filing rhythm and make ownership explicit before the annual update cycle becomes reactive.",
    cadenceLabel: "Recurring annual cadence",
    defaultDueInDays: 18,
    ownerRole: MembershipRole.CCO,
    riskLevel: RiskLevel.HIGH,
    evidenceRequirements: [
      "Calendar owner assignment",
      "Recurring filing checklist",
      "Evidence of review cadence",
    ],
    sourceReference: "S2, S3",
    rationale:
      "The product should tell a newly launched firm what is due soon and who owns it.",
    triggerConditions: { always: true },
  },
  {
    code: "annual_review_readiness",
    title: "Prepare annual review readiness package",
    description:
      "Establish the sections, evidence mapping, and open findings register that will support the first annual review.",
    cadenceLabel: "Annual cycle",
    defaultDueInDays: 25,
    ownerRole: MembershipRole.CCO,
    riskLevel: RiskLevel.HIGH,
    evidenceRequirements: [
      "Annual review checklist",
      "Findings register",
      "Linked policy artifacts",
    ],
    sourceReference: "S2, S4",
    rationale:
      "Annual review should feel like a structured workflow, not a panic exercise.",
    triggerConditions: { always: true },
  },
  {
    code: "exam_room_baseline",
    title: "Organize exam room baseline evidence package",
    description:
      "Create a request-ready document structure so the firm can respond coherently if examined before the operating year is fully mature.",
    cadenceLabel: "First 45 days",
    defaultDueInDays: 30,
    ownerRole: MembershipRole.OPERATIONS,
    riskLevel: RiskLevel.MEDIUM,
    evidenceRequirements: [
      "Exam room request tracker",
      "Linked foundational documents",
      "Response ownership matrix",
    ],
    sourceReference: "S2",
    rationale:
      "Exam readiness is part of the value proposition, so evidence organization should start early.",
    triggerConditions: { always: true },
  },
  {
    code: "marketing_rule_controls",
    title: "Review testimonials and marketing disclosure controls",
    description:
      "Evaluate testimonial, endorsement, and retention workflow readiness before marketing materials spread across channels.",
    cadenceLabel: "Monthly spot-check",
    defaultDueInDays: 12,
    ownerRole: MembershipRole.CCO,
    riskLevel: RiskLevel.HIGH,
    evidenceRequirements: [
      "Marketing checklist",
      "Disclosure reference sheet",
      "Approval history sample",
    ],
    sourceReference: "S7",
    rationale:
      "Marketing review is a concrete, current risk area that buyers immediately understand.",
    triggerConditions: { usesTestimonials: true },
  },
  {
    code: "custody_controls",
    title: "Document custody-related control evidence",
    description:
      "Capture the control owner, supporting evidence, and review rhythm for custody-sensitive workflows.",
    cadenceLabel: "Quarterly review",
    defaultDueInDays: 21,
    ownerRole: MembershipRole.CCO,
    riskLevel: RiskLevel.CRITICAL,
    evidenceRequirements: [
      "Custody control narrative",
      "Supporting vendor evidence",
      "Owner sign-off",
    ],
    sourceReference: "S2",
    rationale:
      "Custody posture increases scrutiny and should visibly change the obligation set.",
    triggerConditions: { hasCustody: true },
  },
  {
    code: "vendor_reg_sp",
    title: "Review service-provider oversight and Reg S-P readiness",
    description:
      "Track service-provider diligence, incident-readiness documents, and open gaps related to Regulation S-P operationalization.",
    cadenceLabel: "Quarterly review",
    defaultDueInDays: 16,
    ownerRole: MembershipRole.OPERATIONS,
    riskLevel: RiskLevel.HIGH,
    evidenceRequirements: [
      "Vendor inventory",
      "Incident response document status",
      "Open gap log",
    ],
    sourceReference: "S5, S6",
    rationale:
      "Smaller firms need a concrete readiness view, not just rule awareness.",
    triggerConditions: { hasKeyVendors: true },
  },
];

export type LaunchMilestoneDefinition = {
  code: string;
  title: string;
  description: string;
  whyItMatters: string;
  evidenceChecklist: string[];
  dueInDays: number;
  blockerCodes?: string[];
};

export const launchMilestoneDefinitions: LaunchMilestoneDefinition[] = [
  {
    code: "entity_setup",
    title: "Lock entity setup and firm baseline facts",
    description:
      "Confirm the entity story, principal office, founding scope, and core firm facts that drive the launch workflow.",
    whyItMatters:
      "If the entity and baseline facts are vague, the registration lane and filing packet will stay muddy.",
    evidenceChecklist: [
      "Entity and ownership facts confirmed",
      "Principal office and service model locked",
      "Founding team responsibilities visible",
    ],
    dueInDays: 5,
  },
  {
    code: "registration_lane",
    title: "Confirm the registration lane and jurisdiction footprint",
    description:
      "Turn the registration decision into an explicit launch lane with visible jurisdiction and filing implications.",
    whyItMatters:
      "The firm cannot assemble the right packet until the registration path and jurisdiction footprint are clear.",
    evidenceChecklist: [
      "Registration path selected",
      "Jurisdictions confirmed",
      "Open filing questions surfaced",
    ],
    dueInDays: 10,
    blockerCodes: ["entity_setup"],
  },
  {
    code: "filing_packet",
    title: "Assemble the ADV and filing packet",
    description:
      "Gather the inputs, disclosures, and draft materials needed to move from planning to filing prep.",
    whyItMatters:
      "The launch process stops feeling magical and starts feeling real once the filing packet has named inputs and missing pieces.",
    evidenceChecklist: [
      "ADV input checklist",
      "Disclosure draft set",
      "Missing-information flags resolved",
    ],
    dueInDays: 18,
    blockerCodes: ["registration_lane"],
  },
  {
    code: "control_stack",
    title: "Prepare policies, vendors, and operational controls",
    description:
      "Stand up the books-and-records, vendor, custody, and marketing control stack the firm needs before going live.",
    whyItMatters:
      "A filing packet without an operating control baseline still leaves the launch exposed.",
    evidenceChecklist: [
      "Core policy set linked",
      "Vendor and custody posture visible",
      "Marketing controls ready before launch",
    ],
    dueInDays: 24,
    blockerCodes: ["filing_packet"],
  },
  {
    code: "launch_signoff",
    title: "Run launch readiness review and go-live signoff",
    description:
      "Use the workspace as a final pre-launch control room, with explicit approval of what is ready, what is missing, and who owns the first-year follow-through.",
    whyItMatters:
      "The product should make launch feel deliberate and defensible, not like a pile of disconnected checklists.",
    evidenceChecklist: [
      "Go-live readiness summary",
      "Open risk list acknowledged",
      "Launch owner and approval recorded",
    ],
    dueInDays: 30,
    blockerCodes: ["control_stack"],
  },
];

function matchesConditions(
  profile: Pick<
    FirmProfile,
    | "targetRegistrationType"
    | "aumBand"
    | "custodyProfile"
    | "usesTestimonials"
    | "keyVendors"
  >,
  conditions: TriggerConditions,
) {
  if (conditions.always) {
    return true;
  }

  if (
    conditions.registrationTypes &&
    !conditions.registrationTypes.includes(profile.targetRegistrationType)
  ) {
    return false;
  }

  if (conditions.aumBands && !conditions.aumBands.includes(profile.aumBand)) {
    return false;
  }

  if (conditions.usesTestimonials && !profile.usesTestimonials) {
    return false;
  }

  if (conditions.hasCustody && profile.custodyProfile === "No custody") {
    return false;
  }

  if (
    conditions.hasKeyVendors &&
    (!Array.isArray(profile.keyVendors) || profile.keyVendors.length === 0)
  ) {
    return false;
  }

  return true;
}

export function buildObligationDrafts(
  profile: Pick<
    FirmProfile,
    | "targetRegistrationType"
    | "aumBand"
    | "custodyProfile"
    | "usesTestimonials"
    | "keyVendors"
  >,
) {
  return templateDefinitions
    .filter((template) => matchesConditions(profile, template.triggerConditions))
    .map((template) => ({
      ...template,
      dueDate: addDays(new Date(), template.defaultDueInDays),
    }));
}

export function buildLaunchMilestones() {
  return launchMilestoneDefinitions.map((milestone, index) => ({
    ...milestone,
    orderIndex: index + 1,
    dueDate: addDays(new Date(), milestone.dueInDays),
  }));
}
