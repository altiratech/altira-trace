import {
  MembershipRole,
  RegistrationType,
  type FirmProfile,
} from "@prisma/client";

export type GuidePacketItem = {
  code: string;
  title: string;
  detail: string;
  status: string;
  ownerRole: MembershipRole;
  evidenceRequired: string[];
};

export type GuideMissingInformation = {
  title: string;
  detail: string;
};

export type GuideStep = {
  code: string;
  title: string;
  detail: string;
  status: string;
  packetItems: GuidePacketItem[];
  missingInformation: GuideMissingInformation[];
};

export type RegistrationGuide = {
  headline: string;
  summary: string;
  automationBoundary: string;
  filingChecklist: string[];
  openCalls: string[];
  steps: GuideStep[];
};

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function packetItem(
  code: string,
  title: string,
  detail: string,
  ready: boolean,
  ownerRole: MembershipRole,
  options?: {
    evidenceRequired?: string[];
  },
): GuidePacketItem {
  return {
    code,
    title,
    detail,
    status: ready ? "COMPLETE" : "ATTENTION_REQUIRED",
    ownerRole,
    evidenceRequired: options?.evidenceRequired ?? [],
  };
}

function missingInformation(title: string, detail: string) {
  return { title, detail };
}

export function buildRegistrationGuide(
  profile: FirmProfile | null,
  milestoneStatusByCode?: Record<string, string>,
): RegistrationGuide {
  const milestoneStatus = milestoneStatusByCode ?? {};

  if (!profile) {
    return {
      headline: "Complete the firm intake to unlock registration guidance",
      summary:
        "The app can guide entity setup, registration-path planning, filing prep, and launch readiness once the baseline firm facts are locked.",
      automationBoundary:
        "This workflow should explain and organize the launch process, but final filing judgment and signoff stay human-reviewed.",
      filingChecklist: [
        "Confirm entity, owners, and principal office facts",
        "Choose the registration path and jurisdiction footprint",
        "Assemble Form ADV / filing packet inputs",
        "Prepare policies, disclosures, and books-and-records baseline",
        "Run a launch readiness review before going live",
      ],
      openCalls: [
        "Registration path has not been selected yet.",
        "Principal office state and jurisdictions still need to be confirmed.",
      ],
      steps: [
        {
          code: "entity_setup",
          title: "Lock formation facts",
          detail: "Confirm the entity story, ownership, office state, service model, and core client profile.",
          status: milestoneStatus.entity_setup ?? "NOT_STARTED",
          packetItems: [
            packetItem(
              "entity_ownership_summary",
              "Entity and ownership summary",
              "A clear statement of who is forming the firm and what the entity story is.",
              false,
              MembershipRole.FOUNDER_ADMIN,
            ),
            packetItem(
              "principal_office_confirmation",
              "Principal office confirmation",
              "A confirmed office state and baseline operating footprint.",
              false,
              MembershipRole.OPERATIONS,
            ),
          ],
          missingInformation: [
            missingInformation(
              "Entity facts are incomplete",
              "The launch wizard needs the baseline entity, office, and service facts before it can generate a reliable packet.",
            ),
          ],
        },
        {
          code: "registration_lane",
          title: "Choose the registration lane",
          detail: "Decide whether the app should guide the firm through a state or SEC filing posture.",
          status: milestoneStatus.registration_lane ?? "NOT_STARTED",
          packetItems: [
            packetItem(
              "registration_path_memo",
              "Registration path memo",
              "State-versus-SEC logic and the jurisdictions the firm expects to touch.",
              false,
              MembershipRole.CCO,
            ),
          ],
          missingInformation: [
            missingInformation(
              "Registration path not confirmed",
              "Choose the path and jurisdiction footprint before assembling filing work.",
            ),
          ],
        },
        {
          code: "filing_packet",
          title: "Build the filing packet",
          detail: "Organize ADV inputs, disclosures, supporting documents, and missing-information flags in one place.",
          status: milestoneStatus.filing_packet ?? "NOT_STARTED",
          packetItems: [
            packetItem(
              "adv_input_worksheet",
              "ADV input worksheet",
              "A structured set of filing inputs, disclosures, and named open questions.",
              false,
              MembershipRole.CCO,
            ),
          ],
          missingInformation: [
            missingInformation(
              "Filing inputs not yet captured",
              "The packet still needs baseline facts before the filing set can be trusted.",
            ),
          ],
        },
        {
          code: "control_stack",
          title: "Prepare the control stack",
          detail: "Stand up the policies, vendor posture, and operating controls the firm needs before going live.",
          status: milestoneStatus.control_stack ?? "NOT_STARTED",
          packetItems: [
            packetItem(
              "core_policy_baseline",
              "Core policy baseline",
              "Policies, books-and-records expectations, and control ownership.",
              false,
              MembershipRole.OPERATIONS,
            ),
          ],
          missingInformation: [
            missingInformation(
              "Control stack is incomplete",
              "The firm still needs policy, vendor, and operational baseline work before launch.",
            ),
          ],
        },
        {
          code: "launch_signoff",
          title: "Approve launch readiness",
          detail: "Run the final go-live review so the app records what is ready, what is open, and who approved launch.",
          status: milestoneStatus.launch_signoff ?? "NOT_STARTED",
          packetItems: [
            packetItem(
              "launch_approval_packet",
              "Launch approval packet",
              "A final summary of readiness, open risks, and first-year ownership.",
              false,
              MembershipRole.FOUNDER_ADMIN,
            ),
          ],
          missingInformation: [
            missingInformation(
              "Launch signoff has not started",
              "A human-reviewed go-live packet still needs to be assembled and approved.",
            ),
          ],
        },
      ],
    };
  }

  const jurisdictions = readStringArray(profile.jurisdictions);
  const vendors = readStringArray(profile.keyVendors);
  const hasCustody =
    profile.custodyProfile.trim().length > 0 &&
    profile.custodyProfile.trim().toLowerCase() !== "no custody";
  const entityFactsReady = Boolean(
    profile.principalOfficeState && profile.serviceModel && profile.clientProfile,
  );
  const pathReady = jurisdictions.length > 0;
  const controlsNeedAttention =
    hasCustody || profile.usesTestimonials || profile.hasPrivateFunds;
  const vendorStackReady = vendors.length > 0;

  const headline =
    profile.targetRegistrationType === RegistrationType.SEC
      ? "SEC registration lane selected"
      : "State registration lane selected";
  const summary =
    profile.targetRegistrationType === RegistrationType.SEC
      ? "Use the launch workspace to organize the federal filing packet, disclosures, and first-year control baseline before the firm goes live."
      : "Use the launch workspace to organize the state filing packet, notice-filing footprint, and launch controls before the firm goes live.";

  const openCalls: string[] = [];

  if (jurisdictions.length > 1) {
    openCalls.push(
      "Multi-jurisdiction launch adds notice-filing and coordination complexity that should stay visible in the packet.",
    );
  }

  if (!vendorStackReady) {
    openCalls.push(
      "Core vendors are still blank, so custodian / CRM / archiving decisions are not yet reflected in the launch workflow.",
    );
  }

  if (profile.usesTestimonials) {
    openCalls.push(
      "Testimonials are enabled, so marketing disclosures and approval retention need to be live before launch.",
    );
  }

  if (hasCustody) {
    openCalls.push(
      "Custody-sensitive operations need an explicit control review before launch and before the first exam cycle.",
    );
  }

  if (profile.hasPrivateFunds) {
    openCalls.push(
      "Private fund complexity sits outside the current narrow alpha lane and should still get expert review before filing.",
    );
  }

  const entityMissingInformation = [
    ...(!profile.principalOfficeState
      ? [
          missingInformation(
            "Principal office state is missing",
            "The launch lane cannot be finalized until the principal office state is confirmed.",
          ),
        ]
      : []),
    ...(!profile.serviceModel
      ? [
          missingInformation(
            "Service model is missing",
            "The filing packet needs a clear description of what the firm actually does.",
          ),
        ]
      : []),
    ...(!profile.clientProfile
      ? [
          missingInformation(
            "Client profile is missing",
            "The ADV and disclosure set need a usable description of the target client base.",
          ),
        ]
      : []),
    ...(profile.teamSize < 1
      ? [
          missingInformation(
            "Founding team size is missing",
            "The launch packet should show who is actually carrying the first-year work.",
          ),
        ]
      : []),
  ];

  const registrationMissingInformation = [
    ...(jurisdictions.length === 0
      ? [
          missingInformation(
            "Jurisdictions are missing",
            "The app cannot generate a credible registration lane without the expected jurisdiction footprint.",
          ),
        ]
      : []),
    ...(!profile.aumBand
      ? [
          missingInformation(
            "AUM band is missing",
            "AUM framing helps explain why the chosen registration lane makes sense.",
          ),
        ]
      : []),
    ...(!profile.custodyProfile
      ? [
          missingInformation(
            "Custody posture is missing",
            "Custody changes both filing and control expectations, so it needs to be explicit.",
          ),
        ]
      : []),
  ];

  const filingMissingInformation = [
    ...(entityMissingInformation.length > 0
      ? [
          missingInformation(
            "Entity facts are still incomplete",
            "The filing packet still depends on unresolved baseline firm facts.",
          ),
        ]
      : []),
    ...(registrationMissingInformation.length > 0
      ? [
          missingInformation(
            "Registration lane still has open questions",
            "The packet should not move into review until the registration path and footprint are stable.",
          ),
        ]
      : []),
    ...(vendors.length === 0
      ? [
          missingInformation(
            "Core vendors are not captured",
            "Custodian, CRM, archiving, and similar vendor choices often affect the packet and readiness story.",
          ),
        ]
      : []),
    ...(!profile.note
      ? [
          missingInformation(
            "Launch notes are blank",
            "Use notes to capture assumptions, edge cases, or counsel follow-up that should stay attached to the packet.",
          ),
        ]
      : []),
  ];

  const controlMissingInformation = [
    ...(profile.usesTestimonials && readStringArray(profile.marketingFlags).length === 0
      ? [
          missingInformation(
            "Marketing controls are not described",
            "Testimonials are enabled, so the product should show the disclosure and approval controls before launch.",
          ),
        ]
      : []),
    ...(vendors.length > 0 && readStringArray(profile.vendorFlags).length === 0
      ? [
          missingInformation(
            "Vendor oversight posture is missing",
            "The launch record should show how service-provider diligence will be handled.",
          ),
        ]
      : []),
    ...(hasCustody
      ? [
          missingInformation(
            "Custody control review is required",
            "Custody-sensitive operations need explicit control review before launch.",
          ),
        ]
      : []),
    ...(profile.hasPrivateFunds
      ? [
          missingInformation(
            "Private fund complexity needs escalation",
            "Private fund work still sits outside the narrow alpha lane and should stay flagged for expert review.",
          ),
        ]
      : []),
  ];

  const launchSignoffMissingInformation = [
    ...(entityMissingInformation.length > 0 ||
    registrationMissingInformation.length > 0 ||
    filingMissingInformation.length > 0 ||
    controlMissingInformation.length > 0
      ? [
          missingInformation(
            "Upstream launch work is still incomplete",
            "The go-live packet should not move into signoff while earlier launch steps still have open missing-information flags.",
          ),
        ]
      : []),
  ];

  const steps: GuideStep[] = [
    {
      code: "entity_setup",
      title: "Lock entity and office facts",
      detail:
        "Confirm principal office, service model, client profile, and the operating facts that drive the launch packet.",
      status:
        milestoneStatus.entity_setup ??
        (entityFactsReady ? "NEEDS_REVIEW" : "IN_PROGRESS"),
      packetItems: [
        packetItem(
          "principal_office_entity_baseline",
          "Principal office and entity baseline",
          "The office state, service scope, and foundational firm facts that shape the launch story.",
          Boolean(profile.principalOfficeState),
          MembershipRole.FOUNDER_ADMIN,
          {
            evidenceRequired: [
              "Entity and ownership fact summary",
              "Principal office confirmation",
            ],
          },
        ),
        packetItem(
          "service_client_narrative",
          "Service and client narrative",
          "A plain-English description of what the firm offers and to whom.",
          Boolean(profile.serviceModel && profile.clientProfile),
          MembershipRole.FOUNDER_ADMIN,
          {
            evidenceRequired: [
              "Service model narrative",
              "Target client profile summary",
            ],
          },
        ),
        packetItem(
          "founding_team_operating_map",
          "Founding team operating map",
          "A basic statement of team size and who is expected to own the launch workload.",
          profile.teamSize >= 1,
          MembershipRole.OPERATIONS,
          {
            evidenceRequired: [
              "Founding team roster",
              "Launch workload ownership note",
            ],
          },
        ),
      ],
      missingInformation: entityMissingInformation,
    },
    {
      code: "registration_lane",
      title: "Confirm the registration path",
      detail:
        profile.targetRegistrationType === RegistrationType.SEC
          ? "Guide the firm through the SEC-oriented lane, while keeping human review on final filing judgments."
          : "Guide the firm through the state-oriented lane, with clear jurisdiction and notice-filing visibility.",
      status:
        milestoneStatus.registration_lane ??
        (pathReady ? "NEEDS_REVIEW" : "IN_PROGRESS"),
      packetItems: [
        packetItem(
          "registration_path_selection",
          "Registration path selection",
          "The selected state-versus-SEC lane for the launch packet.",
          Boolean(profile.targetRegistrationType),
          MembershipRole.CCO,
          {
            evidenceRequired: [
              "Registration lane rationale",
              "Human review note on filing posture",
            ],
          },
        ),
        packetItem(
          "jurisdiction_footprint",
          "Jurisdiction footprint",
          "The expected filing and notice-filing states tied to launch.",
          jurisdictions.length > 0,
          MembershipRole.CCO,
          {
            evidenceRequired: [
              "Jurisdiction list",
              "Notice-filing assumptions",
            ],
          },
        ),
        packetItem(
          "aum_custody_rationale",
          "AUM and custody rationale",
          "Baseline facts that explain why the chosen lane fits the firm.",
          Boolean(profile.aumBand && profile.custodyProfile),
          MembershipRole.CCO,
          {
            evidenceRequired: [
              "AUM band baseline",
              "Custody posture summary",
            ],
          },
        ),
      ],
      missingInformation: registrationMissingInformation,
    },
    {
      code: "filing_packet",
      title: "Assemble the filing packet",
      detail:
        "Prepare ADV inputs, disclosure language, supporting documents, and missing-information flags before submission work starts.",
      status:
        milestoneStatus.filing_packet ??
        (entityFactsReady && pathReady ? "NEEDS_REVIEW" : "IN_PROGRESS"),
      packetItems: [
        packetItem(
          "adv_input_worksheet_live",
          "ADV input worksheet",
          "Named filing inputs and baseline facts organized into one launch packet.",
          entityMissingInformation.length === 0 && registrationMissingInformation.length === 0,
          MembershipRole.CCO,
          {
            evidenceRequired: [
              "ADV fact worksheet",
              "Open-question list",
            ],
          },
        ),
        packetItem(
          "disclosure_draft_set",
          "Disclosure draft set",
          "Narrative disclosures and supporting descriptions tied to the firm profile.",
          Boolean(profile.serviceModel && profile.clientProfile),
          MembershipRole.CCO,
          {
            evidenceRequired: [
              "Disclosure draft copy",
              "Supporting narrative notes",
            ],
          },
        ),
        packetItem(
          "vendor_ops_reference_pack",
          "Vendor and ops reference pack",
          "The vendors and operating facts likely to be referenced in launch prep.",
          vendors.length > 0,
          MembershipRole.OPERATIONS,
          {
            evidenceRequired: [
              "Vendor stack summary",
              "Operating systems notes",
            ],
          },
        ),
      ],
      missingInformation: filingMissingInformation,
    },
    {
      code: "control_stack",
      title: "Prepare the control stack",
      detail:
        "Make sure policies, vendor setup, marketing controls, and books-and-records expectations are ready before launch.",
      status:
        milestoneStatus.control_stack ??
        (controlsNeedAttention || !vendorStackReady ? "BLOCKED" : "NEEDS_REVIEW"),
      packetItems: [
        packetItem(
          "policy_books_records_baseline",
          "Core policy and books-and-records baseline",
          "The operating control layer that turns a filing packet into a real launch posture.",
          Boolean(profile.note),
          MembershipRole.OPERATIONS,
          {
            evidenceRequired: [
              "Core policy baseline artifact",
              "Books-and-records ownership notes",
            ],
          },
        ),
        packetItem(
          "marketing_control_summary",
          "Marketing control summary",
          "Testimonials, endorsements, and approval routing captured before launch.",
          !profile.usesTestimonials || readStringArray(profile.marketingFlags).length > 0,
          MembershipRole.CCO,
          {
            evidenceRequired: [
              "Marketing approval route",
              "Disclosure and retention note",
            ],
          },
        ),
        packetItem(
          "vendor_custody_control_references",
          "Vendor and custody control references",
          "Operational control references for vendors and custody-sensitive workflows.",
          vendorStackReady && !hasCustody,
          MembershipRole.OPERATIONS,
          {
            evidenceRequired: [
              "Vendor diligence support",
              "Custody control reference",
            ],
          },
        ),
      ],
      missingInformation: controlMissingInformation,
    },
    {
      code: "launch_signoff",
      title: "Approve launch readiness",
      detail:
        "Do a final go-live review so the first-year calendar, evidence expectations, and exam posture are owned before launch day.",
      status:
        milestoneStatus.launch_signoff ??
        (entityFactsReady && pathReady && vendorStackReady
          ? "NEEDS_REVIEW"
          : "IN_PROGRESS"),
      packetItems: [
        packetItem(
          "launch_readiness_summary",
          "Launch readiness summary",
          "A final go-live brief that explains what is ready and what still needs explicit follow-up.",
          filingMissingInformation.length === 0 && controlMissingInformation.length === 0,
          MembershipRole.FOUNDER_ADMIN,
          {
            evidenceRequired: [
              "Go-live readiness memo",
              "First-year follow-up note",
            ],
          },
        ),
        packetItem(
          "open_issues_register",
          "Open issues register",
          "A visible list of the issues the launch approver is accepting or sending back.",
          launchSignoffMissingInformation.length === 0,
          MembershipRole.CCO,
          {
            evidenceRequired: [
              "Open issue register",
              "Approver acknowledgment note",
            ],
          },
        ),
        packetItem(
          "first_year_owner_handoff",
          "First-year owner handoff",
          "Ownership of the post-launch calendar, approvals, and evidence expectations.",
          profile.teamSize >= 1,
          MembershipRole.OPERATIONS,
          {
            evidenceRequired: [
              "Owner handoff summary",
              "Calendar and evidence expectations",
            ],
          },
        ),
      ],
      missingInformation: launchSignoffMissingInformation,
    },
  ];

  const filingChecklist = [
    "Entity formation records and ownership details",
    "Registration path memo and jurisdiction list",
    "ADV / filing packet inputs and disclosure draft set",
    "Core policies, code of ethics, and books-and-records baseline",
    "Vendor, custody, and marketing control support",
    "Launch readiness approval and first-year calendar ownership",
  ];

  return {
    headline,
    summary,
    automationBoundary:
      "The app should handhold the launch process and generate draft guidance, but it should not act as a black-box legal opinion engine or auto-file live forms without review.",
    filingChecklist,
    openCalls,
    steps,
  };
}
