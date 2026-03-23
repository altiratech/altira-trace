import { hash } from "bcryptjs";
import {
  ActivityType,
  AiReviewStatus,
  AnnualReviewStatus,
  ApprovalStatus,
  ArtifactCategory,
  DiligenceStatus,
  ExamRequestStatus,
  IncidentSeverity,
  IncidentStatus,
  MarketingReviewStatus,
  MembershipRole,
  PrismaClient,
  RegistrationType,
  ReviewStatus,
  VendorRiskTier,
  WorkStatus,
} from "@prisma/client";
import { ensureObligationTemplates, refreshOrganizationWorkflows } from "../src/lib/data/bootstrap";

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.artifactLink.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.aiGuidance.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.marketingReview.deleteMany();
  await prisma.incidentLog.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.examRequest.deleteMany();
  await prisma.annualReview.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.obligationInstance.deleteMany();
  await prisma.launchPacketItem.deleteMany();
  await prisma.launchMilestone.deleteMany();
  await prisma.obligationTemplate.deleteMany();
  await prisma.firmProfile.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

async function main() {
  await resetDatabase();
  await ensureObligationTemplates(prisma);

  const passwordHash = await hash("LaunchReady123!", 10);

  const founder = await prisma.user.create({
    data: {
      name: "Founder Admin [Placeholder]",
      email: "founder@placeholder-ria.local",
      passwordHash,
    },
  });

  const cco = await prisma.user.create({
    data: {
      name: "CCO User [Placeholder]",
      email: "cco@placeholder-ria.local",
      passwordHash,
    },
  });

  const operations = await prisma.user.create({
    data: {
      name: "Operations User [Placeholder]",
      email: "ops@placeholder-ria.local",
      passwordHash,
    },
  });

  const supervised = await prisma.user.create({
    data: {
      name: "Supervised Person [Placeholder]",
      email: "advisor@placeholder-ria.local",
      passwordHash,
    },
  });

  const launchedOrg = await prisma.organization.create({
    data: {
      name: "Demo Newly Launched RIA [Placeholder]",
      slug: "demo-newly-launched-ria-placeholder",
      registrationType: RegistrationType.STATE,
      principalOfficeState: "NY",
      serviceModel: "Fee-only planning and discretionary portfolio management",
    },
  });

  const operatingOrg = await prisma.organization.create({
    data: {
      name: "Demo Operating RIA [Placeholder]",
      slug: "demo-operating-ria-placeholder",
      registrationType: RegistrationType.SEC,
      principalOfficeState: "TX",
      serviceModel: "Small multi-advisor wealth management practice",
    },
  });

  const launchedMemberships = await Promise.all([
    prisma.membership.create({
      data: {
        organizationId: launchedOrg.id,
        userId: founder.id,
        role: MembershipRole.FOUNDER_ADMIN,
      },
    }),
    prisma.membership.create({
      data: {
        organizationId: launchedOrg.id,
        userId: cco.id,
        role: MembershipRole.CCO,
      },
    }),
    prisma.membership.create({
      data: {
        organizationId: launchedOrg.id,
        userId: operations.id,
        role: MembershipRole.OPERATIONS,
      },
    }),
    prisma.membership.create({
      data: {
        organizationId: launchedOrg.id,
        userId: supervised.id,
        role: MembershipRole.SUPERVISED_PERSON,
      },
    }),
  ]);

  await prisma.membership.create({
    data: {
      organizationId: operatingOrg.id,
      userId: founder.id,
      role: MembershipRole.FOUNDER_ADMIN,
    },
  });

  const launchedProfile = await prisma.firmProfile.create({
    data: {
      organizationId: launchedOrg.id,
      targetRegistrationType: RegistrationType.STATE,
      principalOfficeState: "NY",
      aumBand: "UNDER_25M",
      custodyProfile: "No custody",
      serviceModel: "Fee-only planning and portfolio oversight",
      clientProfile: "Founders, executives, and multi-generational households",
      teamSize: 4,
      usesTestimonials: true,
      hasPrivateFunds: false,
      jurisdictions: ["NY", "NJ", "CT"],
      keyVendors: ["Custodian platform [Placeholder]", "CRM vendor [Placeholder]"],
      marketingFlags: ["Testimonials in use", "Social distribution workflow"],
      vendorFlags: ["Service-provider diligence pending"],
      note: "Explicitly placeholder demo data for workflow testing only.",
    },
  });

  await prisma.firmProfile.create({
    data: {
      organizationId: operatingOrg.id,
      targetRegistrationType: RegistrationType.SEC,
      principalOfficeState: "TX",
      aumBand: "BETWEEN_100M_500M",
      custodyProfile: "Qualified custodian with surprise exam support",
      serviceModel: "Retainer plus AUM advisory services",
      clientProfile: "Entrepreneurs and family office households",
      teamSize: 9,
      usesTestimonials: false,
      hasPrivateFunds: false,
      jurisdictions: ["TX", "FL", "AZ"],
      keyVendors: ["Archiving vendor [Placeholder]"],
      marketingFlags: ["No testimonials", "Newsletter workflow"],
      vendorFlags: ["Reg S-P vendor mapping underway"],
      note: "Secondary placeholder org for multi-tenant structure validation.",
    },
  });

  await refreshOrganizationWorkflows(prisma, {
    organizationId: launchedOrg.id,
    profile: launchedProfile,
    memberships: launchedMemberships,
  });

  const obligations = await prisma.obligationInstance.findMany({
    where: { organizationId: launchedOrg.id },
    orderBy: { dueDate: "asc" },
  });
  const launchPacketItems = await prisma.launchPacketItem.findMany({
    where: { organizationId: launchedOrg.id },
    orderBy: [{ milestoneId: "asc" }, { sortOrder: "asc" }],
  });

  const annualReview = await prisma.annualReview.create({
    data: {
      organizationId: launchedOrg.id,
      periodStart: new Date("2026-01-01T00:00:00.000Z"),
      periodEnd: new Date("2026-12-31T00:00:00.000Z"),
      status: AnnualReviewStatus.IN_PROGRESS,
      summary:
        "First-year review is framed around building a consistent evidence trail and reducing single-person dependency.",
      sectionsJson: [
        {
          title: "Compliance program baseline",
          progress: "In progress",
          note: "Owner assignments exist, but not every recurring evidence item is linked yet.",
        },
        {
          title: "Vendor and incident readiness",
          progress: "Attention needed",
          note: "Service-provider oversight is visible but not fully evidenced.",
        },
      ],
      findingsJson: [
        {
          severity: "high",
          title: "Evidence gaps remain on core operational obligations",
        },
        {
          severity: "medium",
          title: "Marketing approval path is live but not yet deeply used",
        },
      ],
    },
  });

  const examRequest = await prisma.examRequest.create({
    data: {
      organizationId: launchedOrg.id,
      title: "Exam readiness baseline request set [Placeholder]",
      requestedAt: new Date(),
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
      status: ExamRequestStatus.IN_PROGRESS,
      summary:
        "Placeholder request bundle used to demonstrate a document-ready response workflow.",
      itemsJson: [
        {
          request: "Compliance calendar and owner matrix",
          status: "linked",
        },
        {
          request: "Foundational policies and annual review notes",
          status: "partial",
        },
      ],
    },
  });

  const vendor = await prisma.vendor.create({
    data: {
      organizationId: launchedOrg.id,
      name: "Service Provider Review [Placeholder]",
      category: "Technology / recordkeeping",
      riskTier: VendorRiskTier.HIGH,
      diligenceStatus: DiligenceStatus.IN_PROGRESS,
      lastReviewedAt: new Date(),
      summary:
        "Placeholder vendor record used to show Reg S-P style oversight and evidence mapping.",
    },
  });

  await prisma.incidentLog.create({
    data: {
      organizationId: launchedOrg.id,
      title: "Incident tabletop planning gap [Placeholder]",
      severity: IncidentSeverity.MEDIUM,
      status: IncidentStatus.MONITORING,
      occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
      summary:
        "The team has a documented response outline, but the tabletop exercise cadence is not yet evidenced.",
    },
  });

  const marketingReview = await prisma.marketingReview.create({
    data: {
      organizationId: launchedOrg.id,
      submitterId: founder.id,
      title: "Client testimonial landing page draft [Placeholder]",
      materialType: "Web copy",
      status: MarketingReviewStatus.IN_REVIEW,
      reviewerComment:
        "Disclosure placement is visible, but approval history and retention evidence should be linked before release.",
      checklistJson: [
        { item: "Disclosure present", status: "partial" },
        { item: "Compensation/conflict reviewed", status: "in progress" },
        { item: "Record retention path identified", status: "complete" },
      ],
    },
  });

  const evidenceArtifact = await prisma.artifact.create({
    data: {
      organizationId: launchedOrg.id,
      uploadedByUserId: operations.id,
      title: "Compliance calendar owner map [Placeholder]",
      fileName: "placeholder-compliance-calendar-owner-map.pdf",
      category: ArtifactCategory.EVIDENCE,
      versionLabel: "v1-placeholder",
      storageStatus: "metadata_only",
      note: "Placeholder evidence record for the pilot workspace.",
      placeholder: true,
    },
  });

  const policyArtifact = await prisma.artifact.create({
    data: {
      organizationId: launchedOrg.id,
      uploadedByUserId: cco.id,
      title: "Privacy and incident response packet [Placeholder]",
      fileName: "placeholder-privacy-incident-packet.pdf",
      category: ArtifactCategory.POLICY,
      versionLabel: "v1-placeholder",
      storageStatus: "metadata_only",
      note: "Used to demonstrate Reg S-P and incident-readiness mapping.",
      placeholder: true,
    },
  });

  await prisma.artifactLink.create({
    data: {
      artifactId: evidenceArtifact.id,
      obligationId: obligations[0]?.id,
      label: "Initial evidence link",
    },
  });

  await prisma.artifactLink.create({
    data: {
      artifactId: policyArtifact.id,
      annualReviewId: annualReview.id,
      label: "Annual review support",
    },
  });

  await prisma.artifactLink.create({
    data: {
      artifactId: policyArtifact.id,
      examRequestId: examRequest.id,
      label: "Exam room baseline packet",
    },
  });

  await prisma.artifactLink.create({
    data: {
      artifactId: policyArtifact.id,
      vendorId: vendor.id,
      label: "Vendor oversight evidence",
    },
  });

  await prisma.artifactLink.create({
    data: {
      artifactId: evidenceArtifact.id,
      marketingReviewId: marketingReview.id,
      label: "Approval retention example",
    },
  });

  const entityBaselinePacketItem = launchPacketItems.find(
    (item) => item.code === "principal_office_entity_baseline",
  );
  const launchReadinessPacketItem = launchPacketItems.find(
    (item) => item.code === "launch_readiness_summary",
  );

  if (entityBaselinePacketItem) {
    await prisma.launchPacketItem.update({
      where: { id: entityBaselinePacketItem.id },
      data: {
        ownerMembershipId: launchedMemberships[0]?.id,
        status: WorkStatus.NEEDS_REVIEW,
        reviewStatus: ReviewStatus.PENDING_APPROVAL,
        notes:
          "Baseline formation facts are assembled, but the final filing assumptions still need explicit reviewer confirmation.",
      },
    });

    await prisma.artifactLink.create({
      data: {
        artifactId: evidenceArtifact.id,
        launchPacketItemId: entityBaselinePacketItem.id,
        label: "Formation baseline packet",
      },
    });

    await prisma.approval.create({
      data: {
        organizationId: launchedOrg.id,
        reviewerId: cco.id,
        entityType: "launch_packet_item",
        entityId: entityBaselinePacketItem.id,
        status: ApprovalStatus.PENDING,
        comments: "Ready for review once the remaining filing packet facts are attached.",
      },
    });
  }

  if (launchReadinessPacketItem) {
    await prisma.launchPacketItem.update({
      where: { id: launchReadinessPacketItem.id },
      data: {
        ownerMembershipId: launchedMemberships[2]?.id,
        status: WorkStatus.IN_PROGRESS,
        notes:
          "Go-live handoff still needs a final owner note covering first-quarter evidence expectations.",
      },
    });

    await prisma.artifactLink.create({
      data: {
        artifactId: policyArtifact.id,
        launchPacketItemId: launchReadinessPacketItem.id,
        label: "Go-live readiness support",
      },
    });
  }

  await prisma.approval.create({
    data: {
      organizationId: launchedOrg.id,
      reviewerId: cco.id,
      entityType: "obligation",
      entityId: obligations[0]?.id ?? launchedOrg.id,
      status: ApprovalStatus.PENDING,
      comments: "Ready for review once the remaining evidence link is attached.",
    },
  });

  await prisma.aiGuidance.create({
    data: {
      organizationId: launchedOrg.id,
      contextType: "obligation",
      contextId: obligations[0]?.id ?? launchedOrg.id,
      promptSummary: "Explain why this first-year control matters to a newly launched RIA.",
      output:
        "This obligation exists because the firm is newly launched and still turning institutional memory into repeatable workflow. Completing it clarifies ownership, reduces deadline risk, and creates proof that the process is under control.",
      sourceRefs: ["S2", "S4"],
      reviewStatus: AiReviewStatus.DRAFT,
    },
  });

  await prisma.aiGuidance.create({
    data: {
      organizationId: launchedOrg.id,
      contextType: "marketing_review",
      contextId: marketingReview.id,
      promptSummary: "Surface disclosure and retention risks in a testimonial workflow.",
      output:
        "The highest near-term risk is not whether testimonials exist, but whether disclosure placement, reviewer approval, and retention evidence are clearly preserved in one workflow.",
      sourceRefs: ["S7"],
      reviewStatus: AiReviewStatus.REVIEWED,
      reviewedById: cco.id,
      reviewedAt: new Date(),
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        organizationId: launchedOrg.id,
        userId: founder.id,
        activityType: ActivityType.PROFILE_UPDATED,
        entityType: "firm_profile",
        entityId: launchedProfile.id,
        summary: "Firm profile confirmed and first-year workflow generated.",
      },
      {
        organizationId: launchedOrg.id,
        userId: operations.id,
        activityType: ActivityType.ARTIFACT_CREATED,
        entityType: "artifact",
        entityId: evidenceArtifact.id,
        summary: "Evidence placeholder added to documents center.",
      },
      {
        organizationId: launchedOrg.id,
        userId: cco.id,
        activityType: ActivityType.ANNUAL_REVIEW_UPDATED,
        entityType: "annual_review",
        entityId: annualReview.id,
        summary: "Annual review sections populated for first-year readiness.",
      },
      {
        organizationId: launchedOrg.id,
        userId: founder.id,
        activityType: ActivityType.MARKETING_REVIEW_UPDATED,
        entityType: "marketing_review",
        entityId: marketingReview.id,
        summary: "Marketing review item submitted for approval.",
      },
      {
        organizationId: launchedOrg.id,
        userId: operations.id,
        activityType: ActivityType.VENDOR_UPDATED,
        entityType: "vendor",
        entityId: vendor.id,
        summary: "Vendor oversight record updated with placeholder diligence notes.",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Login with founder@placeholder-ria.local / LaunchReady123!");
  console.log("Login with cco@placeholder-ria.local / LaunchReady123!");
  console.log("Login with advisor@placeholder-ria.local / LaunchReady123!");
}

async function runSeed() {
  let exitCode = 0;

  try {
    await main();
  } catch (error) {
    console.error(error);
    exitCode = 1;
  } finally {
    await prisma.$disconnect();
    process.exit(exitCode);
  }
}

void runSeed();
