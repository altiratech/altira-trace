"use server";

import {
  ActivityType,
  AiReviewStatus,
  AnnualReviewStatus,
  ApprovalStatus,
  ArtifactCategory,
  DiligenceStatus,
  ExamRequestStatus,
  IncidentSeverity,
  MarketingReviewStatus,
  VendorRiskTier,
  WorkStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { buildLaunchMilestones } from "@/lib/config/obligations";
import { refreshOrganizationWorkflows } from "@/lib/data/bootstrap";
import { hasCapability, type AppCapability } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  firmProfileSchema,
  governancePostureSchema,
  type FirmProfileInput,
} from "@/lib/validation/firm-profile";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
type ArtifactLinkTarget =
  | "obligation"
  | "launch_packet_item"
  | "annual_review"
  | "exam_request"
  | "vendor"
  | "marketing_review";
type ArtifactLinkFields = {
  obligationId?: string;
  launchPacketItemId?: string;
  annualReviewId?: string;
  examRequestId?: string;
  vendorId?: string;
  marketingReviewId?: string;
};
type ArtifactLinkContext = {
  createFields: ArtifactLinkFields;
  entityId: string;
  entityType: string;
  revalidationPath: string;
  summaryTarget: string;
};
type ApprovalQueueEntity =
  | "obligation"
  | "launch_packet_item"
  | "annual_review"
  | "exam_request"
  | "marketing_review"
  | "vendor";

function parseDelimitedList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function revalidateWorkspacePaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

async function requireActionContext(capability?: AppCapability) {
  const session = await getSession();

  if (!session) {
    throw new Error("No active session.");
  }

  if (capability && !hasCapability(session.role, capability)) {
    redirect("/app/dashboard");
  }

  return session;
}

async function getScopedMembership(organizationId: string, membershipId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      organizationId,
    },
    include: {
      user: true,
    },
  });

  if (!membership) {
    throw new Error("Membership not found in the current organization.");
  }

  return membership;
}

async function getScopedObligation(organizationId: string, obligationId: string) {
  const obligation = await prisma.obligationInstance.findFirst({
    where: {
      id: obligationId,
      organizationId,
    },
  });

  if (!obligation) {
    throw new Error("Obligation not found in the current organization.");
  }

  return obligation;
}

async function getScopedLaunchPacketItem(
  organizationId: string,
  packetItemId: string,
) {
  const packetItem = await prisma.launchPacketItem.findFirst({
    where: {
      id: packetItemId,
      organizationId,
    },
    include: {
      artifactLinks: true,
      milestone: true,
      ownerMembership: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!packetItem) {
    throw new Error("Launch packet item not found in the current organization.");
  }

  return packetItem;
}

async function getScopedArtifact(organizationId: string, artifactId: string) {
  const artifact = await prisma.artifact.findFirst({
    where: {
      id: artifactId,
      organizationId,
    },
  });

  if (!artifact) {
    throw new Error("Artifact not found in the current organization.");
  }

  return artifact;
}

async function getScopedAnnualReview(organizationId: string, reviewId: string) {
  const review = await prisma.annualReview.findFirst({
    where: {
      id: reviewId,
      organizationId,
    },
  });

  if (!review) {
    throw new Error("Annual review not found in the current organization.");
  }

  return review;
}

async function getScopedLaunchMilestone(organizationId: string, milestoneId: string) {
  const milestone = await prisma.launchMilestone.findFirst({
    where: {
      id: milestoneId,
      organizationId,
    },
  });

  if (!milestone) {
    throw new Error("Launch milestone not found in the current organization.");
  }

  return milestone;
}

async function getScopedExamRequest(organizationId: string, requestId: string) {
  const request = await prisma.examRequest.findFirst({
    where: {
      id: requestId,
      organizationId,
    },
  });

  if (!request) {
    throw new Error("Exam request not found in the current organization.");
  }

  return request;
}

async function getScopedMarketingReview(organizationId: string, reviewId: string) {
  const review = await prisma.marketingReview.findFirst({
    where: {
      id: reviewId,
      organizationId,
    },
  });

  if (!review) {
    throw new Error("Marketing review not found in the current organization.");
  }

  return review;
}

async function getScopedVendor(organizationId: string, vendorId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: {
      id: vendorId,
      organizationId,
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found in the current organization.");
  }

  return vendor;
}

async function getScopedApproval(organizationId: string, approvalId: string) {
  const approval = await prisma.approval.findFirst({
    where: {
      id: approvalId,
      organizationId,
    },
  });

  if (!approval) {
    throw new Error("Approval not found in the current organization.");
  }

  return approval;
}

async function getScopedGuidance(organizationId: string, guidanceId: string) {
  const guidance = await prisma.aiGuidance.findFirst({
    where: {
      id: guidanceId,
      organizationId,
    },
  });

  if (!guidance) {
    throw new Error("AI guidance not found in the current organization.");
  }

  return guidance;
}

function assertScopedContributor(obligationOwnerMembershipId: string | null, session: Session) {
  if (
    session.role === "SUPERVISED_PERSON" &&
    obligationOwnerMembershipId !== session.membershipId
  ) {
    redirect("/app/obligations");
  }
}

function parseSubmittedTarget(formData: FormData): {
  targetId: string;
  targetType: ArtifactLinkTarget;
} | null {
  const targetKey = String(formData.get("targetKey") ?? "").trim();

  if (targetKey) {
    const [targetType, targetId] = targetKey.split(":");

    if (!targetType || !targetId) {
      throw new Error("Workflow link target is malformed.");
    }

    return {
      targetType: targetType as ArtifactLinkTarget,
      targetId,
    };
  }

  const targetType = String(formData.get("targetType") ?? "").trim();
  const targetId = String(formData.get("targetId") ?? "").trim();

  if (targetType && targetId) {
    return {
      targetType: targetType as ArtifactLinkTarget,
      targetId,
    };
  }

  const obligationId = String(formData.get("obligationId") ?? "").trim();

  if (obligationId) {
    return {
      targetType: "obligation",
      targetId: obligationId,
    };
  }

  return null;
}

async function resolveArtifactLinkContext(
  session: Session,
  targetType: ArtifactLinkTarget,
  targetId: string,
): Promise<ArtifactLinkContext> {
  switch (targetType) {
    case "obligation": {
      const obligation = await getScopedObligation(session.organizationId, targetId);

      assertScopedContributor(obligation.ownerMembershipId, session);

      return {
        createFields: {
          obligationId: targetId,
        },
        entityType: "obligation",
        entityId: obligation.id,
        summaryTarget: obligation.title,
        revalidationPath: `/app/obligations/${obligation.id}`,
      };
    }
    case "launch_packet_item": {
      if (!hasCapability(session.role, "link_artifacts")) {
        redirect("/app/documents");
      }

      const packetItem = await getScopedLaunchPacketItem(
        session.organizationId,
        targetId,
      );

      return {
        createFields: {
          launchPacketItemId: targetId,
        },
        entityType: "launch_packet_item",
        entityId: packetItem.id,
        summaryTarget: packetItem.title,
        revalidationPath: "/app/launch",
      };
    }
    case "annual_review": {
      if (!hasCapability(session.role, "link_artifacts")) {
        redirect("/app/documents");
      }

      await getScopedAnnualReview(session.organizationId, targetId);

      return {
        createFields: {
          annualReviewId: targetId,
        },
        entityType: "annual_review",
        entityId: targetId,
        summaryTarget: "annual review",
        revalidationPath: "/app/annual-review",
      };
    }
    case "exam_request": {
      if (!hasCapability(session.role, "link_artifacts")) {
        redirect("/app/documents");
      }

      const request = await getScopedExamRequest(session.organizationId, targetId);

      return {
        createFields: {
          examRequestId: targetId,
        },
        entityType: "exam_request",
        entityId: request.id,
        summaryTarget: request.title,
        revalidationPath: "/app/exam-room",
      };
    }
    case "vendor": {
      if (!hasCapability(session.role, "link_artifacts")) {
        redirect("/app/documents");
      }

      const vendor = await getScopedVendor(session.organizationId, targetId);

      return {
        createFields: {
          vendorId: targetId,
        },
        entityType: "vendor",
        entityId: vendor.id,
        summaryTarget: vendor.name,
        revalidationPath: "/app/vendors",
      };
    }
    case "marketing_review": {
      if (!hasCapability(session.role, "link_artifacts")) {
        redirect("/app/documents");
      }

      const review = await getScopedMarketingReview(session.organizationId, targetId);

      return {
        createFields: {
          marketingReviewId: targetId,
        },
        entityType: "marketing_review",
        entityId: review.id,
        summaryTarget: review.title,
        revalidationPath: "/app/marketing-review",
      };
    }
    default:
      throw new Error("Unsupported artifact target.");
  }
}

async function createArtifactLinkForTarget(
  session: Session,
  artifactId: string,
  targetType: ArtifactLinkTarget,
  targetId: string,
  label: string,
) {
  const context = await resolveArtifactLinkContext(session, targetType, targetId);
  const existingLink = await prisma.artifactLink.findFirst({
    where: {
      artifactId,
      ...context.createFields,
    },
  });

  if (existingLink) {
    return {
      created: false,
      ...context,
    };
  }

  await prisma.artifactLink.create({
    data: {
      artifactId,
      ...context.createFields,
      label: label || undefined,
    },
  });

  return {
    created: true,
    ...context,
  };
}

async function syncApprovalQueueState(
  session: Session,
  input: {
    entityId: string;
    entityType: ApprovalQueueEntity;
    shouldQueue: boolean;
    pendingComment: string;
    resetComment: string;
  },
) {
  if (input.shouldQueue) {
    const existingPending = await prisma.approval.findFirst({
      where: {
        organizationId: session.organizationId,
        entityType: input.entityType,
        entityId: input.entityId,
        status: ApprovalStatus.PENDING,
      },
    });

    if (existingPending) {
      return { created: false };
    }

    await prisma.approval.create({
      data: {
        organizationId: session.organizationId,
        entityType: input.entityType,
        entityId: input.entityId,
        status: ApprovalStatus.PENDING,
        comments: input.pendingComment,
      },
    });

    return { created: true };
  }

  const resetResult = await prisma.approval.updateMany({
    where: {
      organizationId: session.organizationId,
      entityType: input.entityType,
      entityId: input.entityId,
      status: ApprovalStatus.PENDING,
    },
    data: {
      status: ApprovalStatus.CHANGES_REQUESTED,
      approvedAt: null,
      comments: input.resetComment,
    },
  });

  return {
    created: false,
    resetPending: resetResult.count > 0,
  };
}

export async function upsertFirmProfileAction(input: FirmProfileInput) {
  const session = await requireActionContext("edit_firm_profile");
  const parsed = firmProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Profile update failed." };
  }

  const memberships = await prisma.membership.findMany({
    where: { organizationId: session.organizationId },
  });

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: {
      registrationType: parsed.data.targetRegistrationType,
      principalOfficeState: parsed.data.principalOfficeState,
      aumBand: parsed.data.aumBand,
      serviceModel: parsed.data.serviceModel,
    },
  });

  const profile = await prisma.firmProfile.upsert({
    where: { organizationId: session.organizationId },
    update: {
      targetRegistrationType: parsed.data.targetRegistrationType,
      principalOfficeState: parsed.data.principalOfficeState,
      aumBand: parsed.data.aumBand,
      custodyProfile: parsed.data.custodyProfile,
      serviceModel: parsed.data.serviceModel,
      clientProfile: parsed.data.clientProfile,
      teamSize: parsed.data.teamSize,
      usesTestimonials: parsed.data.usesTestimonials,
      hasPrivateFunds: parsed.data.hasPrivateFunds,
      jurisdictions: parsed.data.jurisdictions,
      keyVendors: parsed.data.keyVendors,
      marketingFlags: parsed.data.marketingFlags,
      vendorFlags: parsed.data.vendorFlags,
      note: parsed.data.note,
    },
    create: {
      organizationId: session.organizationId,
      targetRegistrationType: parsed.data.targetRegistrationType,
      principalOfficeState: parsed.data.principalOfficeState,
      aumBand: parsed.data.aumBand,
      custodyProfile: parsed.data.custodyProfile,
      serviceModel: parsed.data.serviceModel,
      clientProfile: parsed.data.clientProfile,
      teamSize: parsed.data.teamSize,
      usesTestimonials: parsed.data.usesTestimonials,
      hasPrivateFunds: parsed.data.hasPrivateFunds,
      jurisdictions: parsed.data.jurisdictions,
      keyVendors: parsed.data.keyVendors,
      marketingFlags: parsed.data.marketingFlags,
      vendorFlags: parsed.data.vendorFlags,
      note: parsed.data.note,
    },
  });

  await refreshOrganizationWorkflows(prisma, {
    organizationId: session.organizationId,
    profile,
    memberships,
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.PROFILE_UPDATED,
      entityType: "firm_profile",
      entityId: profile.id,
      summary: "Firm profile updated and obligation set regenerated.",
    },
  });

  revalidateWorkspacePaths([
    "/app/dashboard",
    "/app/launch",
    "/app/launch/intake",
    "/app/obligations",
    "/app/settings",
  ]);

  return { success: true };
}

export async function updateGovernancePostureAction(formData: FormData) {
  const session = await requireActionContext("edit_firm_profile");
  const existingProfile = await prisma.firmProfile.findUnique({
    where: { organizationId: session.organizationId },
  });

  if (!existingProfile) {
    redirect("/app/launch/intake");
  }

  const parsed = governancePostureSchema.safeParse({
    usesTestimonials: formData.get("usesTestimonials") === "on",
    hasPrivateFunds: formData.get("hasPrivateFunds") === "on",
    marketingFlags: parseDelimitedList(formData.get("marketingFlags")),
    vendorFlags: parseDelimitedList(formData.get("vendorFlags")),
    note: String(formData.get("note") ?? "").trim(),
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Governance posture update failed.",
    );
  }

  const memberships = await prisma.membership.findMany({
    where: { organizationId: session.organizationId },
  });

  const profile = await prisma.firmProfile.update({
    where: { organizationId: session.organizationId },
    data: {
      usesTestimonials: parsed.data.usesTestimonials,
      hasPrivateFunds: parsed.data.hasPrivateFunds,
      marketingFlags: parsed.data.marketingFlags,
      vendorFlags: parsed.data.vendorFlags,
      note: parsed.data.note || null,
    },
  });

  await refreshOrganizationWorkflows(prisma, {
    organizationId: session.organizationId,
    profile,
    memberships,
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.PROFILE_UPDATED,
      entityType: "firm_profile",
      entityId: profile.id,
      summary: "Governance posture updated and workflow guidance refreshed.",
    },
  });

  revalidateWorkspacePaths([
    "/app/dashboard",
    "/app/launch",
    "/app/launch/intake",
    "/app/marketing-review",
    "/app/vendors",
    "/app/obligations",
    "/app/settings",
  ]);
}

export async function updateLaunchMilestoneAction(formData: FormData) {
  const session = await requireActionContext("manage_launch_workspace");
  const milestoneId = String(formData.get("milestoneId") ?? "").trim();
  const status = String(formData.get("status") ?? WorkStatus.IN_PROGRESS) as WorkStatus;

  if (!milestoneId) {
    throw new Error("Launch milestone is required.");
  }

  const milestone = await getScopedLaunchMilestone(session.organizationId, milestoneId);
  const blockerCodes = Array.isArray(milestone.blockerCodes)
    ? (milestone.blockerCodes as string[])
    : [];

  if (blockerCodes.length > 0) {
    const definitions = buildLaunchMilestones();
    const definitionByOrder = new Map(
      definitions.map((definition) => [definition.orderIndex, definition]),
    );
    const milestones = await prisma.launchMilestone.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        title: true,
        orderIndex: true,
        status: true,
      },
    });
    const codeToMilestone = new Map(
      milestones.map((item) => {
        const definition = definitionByOrder.get(item.orderIndex);

        return [definition?.code ?? `step_${item.orderIndex}`, item];
      }),
    );
    const unresolvedBlockers = blockerCodes.filter((code) => {
      const blockedBy = codeToMilestone.get(code);

      return blockedBy && blockedBy.status !== WorkStatus.COMPLETE;
    });

    if (
      unresolvedBlockers.length > 0 &&
      (status === WorkStatus.NEEDS_REVIEW || status === WorkStatus.COMPLETE)
    ) {
      throw new Error(
        "Resolve the prior blocked launch steps before marking this step ready for review or complete.",
      );
    }
  }

  await prisma.launchMilestone.update({
    where: { id: milestoneId },
    data: { status },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.OBLIGATION_UPDATED,
      entityType: "launch_milestone",
      entityId: milestoneId,
      summary: `${milestone.title} moved to ${status.toLowerCase().replace(/_/g, " ")}.`,
    },
  });

  revalidateWorkspacePaths(["/app/launch", "/app/dashboard"]);
}

export async function updateLaunchPacketItemAction(formData: FormData) {
  const session = await requireActionContext("manage_launch_workspace");
  const packetItemId = String(formData.get("packetItemId") ?? "").trim();
  const ownerMembershipId = String(formData.get("ownerMembershipId") ?? "").trim();
  const status = String(formData.get("status") ?? WorkStatus.IN_PROGRESS) as WorkStatus;
  const dueDateValue = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!packetItemId) {
    throw new Error("Launch packet item is required.");
  }

  const packetItem = await getScopedLaunchPacketItem(session.organizationId, packetItemId);
  const ownerMembership = ownerMembershipId
    ? await getScopedMembership(session.organizationId, ownerMembershipId)
    : null;
  const requiresReview = status === WorkStatus.NEEDS_REVIEW || status === WorkStatus.COMPLETE;

  if (requiresReview && !ownerMembership) {
    throw new Error(
      "Assign an owner before moving this launch packet item into review or completion.",
    );
  }

  if (requiresReview && packetItem.artifactLinks.length === 0) {
    throw new Error(
      "Attach at least one artifact before moving this launch packet item into review or completion.",
    );
  }

  const dueDate = dueDateValue
    ? new Date(`${dueDateValue}T12:00:00.000Z`)
    : null;

  if (dueDate && Number.isNaN(dueDate.getTime())) {
    throw new Error("Provide a valid due date for the launch packet item.");
  }

  const approvalState = await syncApprovalQueueState(session, {
    entityId: packetItemId,
    entityType: "launch_packet_item",
    shouldQueue: requiresReview,
    pendingComment: "Launch packet item is ready for approval.",
    resetComment: "Launch packet item returned to working status before approval was finalized.",
  });

  await prisma.launchPacketItem.update({
    where: { id: packetItemId },
    data: {
      ownerMembershipId: ownerMembership?.id ?? null,
      status,
      reviewStatus: requiresReview ? "PENDING_APPROVAL" : "DRAFT",
      dueDate,
      notes: notes || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.OBLIGATION_UPDATED,
      entityType: "launch_packet_item",
      entityId: packetItemId,
      summary: requiresReview
        ? approvalState.created
          ? `${packetItem.title} submitted for approval.`
          : `${packetItem.title} remains in the approval queue.`
        : ownerMembership
          ? `${packetItem.title} assigned to ${ownerMembership.user.name} and moved to ${status.toLowerCase().replace(/_/g, " ")}.`
          : `${packetItem.title} moved to ${status.toLowerCase().replace(/_/g, " ")}.`,
    },
  });

  revalidateWorkspacePaths(["/app/launch", "/app/dashboard", "/app/documents"]);
}

export async function createArtifactAction(formData: FormData) {
  const session = await requireActionContext("upload_artifacts");
  const title = String(formData.get("title") ?? "").trim();
  const fileName = String(formData.get("fileName") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const submittedTarget = parseSubmittedTarget(formData);
  const rawCategory = String(formData.get("category") ?? ArtifactCategory.EVIDENCE);
  const category = rawCategory as ArtifactCategory;

  if (!title || !fileName) {
    throw new Error("Artifact title and filename are required.");
  }

  const artifact = await prisma.artifact.create({
    data: {
      organizationId: session.organizationId,
      uploadedByUserId: session.userId,
      title,
      fileName,
      category,
      versionLabel: "v1-placeholder",
      storageStatus: "metadata_only",
      note: note || null,
      placeholder: true,
    },
  });

  const linkResult = submittedTarget
    ? await createArtifactLinkForTarget(
        session,
        artifact.id,
        submittedTarget.targetType,
        submittedTarget.targetId,
        "Linked from documents center",
      )
    : null;

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.ARTIFACT_CREATED,
      entityType: "artifact",
      entityId: artifact.id,
      summary: `${title} added to the evidence center.`,
      metadata: linkResult
        ? {
            targetType: linkResult.entityType,
            targetId: linkResult.entityId,
          }
        : undefined,
    },
  });

  if (linkResult?.created) {
    await prisma.activityLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        activityType: ActivityType.ARTIFACT_LINKED,
        entityType: linkResult.entityType,
        entityId: linkResult.entityId,
        summary: `${title} linked to ${linkResult.summaryTarget}.`,
      },
    });
  }

  revalidateWorkspacePaths([
    "/app/documents",
    "/app/dashboard",
    "/app/obligations",
    ...(linkResult ? [linkResult.revalidationPath] : []),
  ]);
}

export async function linkArtifactAction(formData: FormData) {
  const session = await requireActionContext("link_artifacts");
  const artifactId = String(formData.get("artifactId") ?? "").trim();
  const submittedTarget = parseSubmittedTarget(formData);
  const label = String(formData.get("label") ?? "").trim();

  if (!artifactId || !submittedTarget) {
    throw new Error("Artifact and target are required.");
  }

  const artifact = await getScopedArtifact(session.organizationId, artifactId);
  const linkResult = await createArtifactLinkForTarget(
    session,
    artifactId,
    submittedTarget.targetType,
    submittedTarget.targetId,
    label,
  );

  if (!linkResult.created) {
    revalidateWorkspacePaths([linkResult.revalidationPath, "/app/documents"]);
    return;
  }

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.ARTIFACT_LINKED,
      entityType: linkResult.entityType,
      entityId: linkResult.entityId,
      summary: `${artifact.title} linked to ${linkResult.summaryTarget}.`,
    },
  });

  revalidateWorkspacePaths([
    "/app/dashboard",
    "/app/documents",
    linkResult.revalidationPath,
  ]);
}

export async function updateObligationStatusAction(formData: FormData) {
  const session = await requireActionContext("update_obligation_status");
  const obligationId = String(formData.get("obligationId") ?? "");
  const status = String(formData.get("status") ?? WorkStatus.IN_PROGRESS) as WorkStatus;
  const obligation = await getScopedObligation(session.organizationId, obligationId);

  assertScopedContributor(obligation.ownerMembershipId, session);
  const approvalState = await syncApprovalQueueState(session, {
    entityId: obligationId,
    entityType: "obligation",
    shouldQueue: status === WorkStatus.COMPLETE,
    pendingComment: "Awaiting reviewer decision after completion.",
    resetComment: "Returned to working status before approval was finalized.",
  });

  await prisma.obligationInstance.update({
    where: { id: obligationId },
    data: {
      status,
      reviewStatus: status === WorkStatus.COMPLETE ? "PENDING_APPROVAL" : "DRAFT",
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.OBLIGATION_UPDATED,
      entityType: "obligation",
      entityId: obligationId,
      summary:
        status === WorkStatus.COMPLETE
          ? approvalState.created
            ? "Obligation marked complete and submitted for approval."
            : "Obligation marked complete and remains in the approval queue."
          : `Obligation status moved to ${status.toLowerCase().replace(/_/g, " ")}.`,
    },
  });

  revalidateWorkspacePaths([
    "/app/dashboard",
    "/app/launch",
    "/app/obligations",
    `/app/obligations/${obligationId}`,
  ]);
}

export async function assignObligationOwnerAction(formData: FormData) {
  const session = await requireActionContext("assign_obligation_owner");
  const obligationId = String(formData.get("obligationId") ?? "").trim();
  const ownerMembershipId = String(formData.get("ownerMembershipId") ?? "").trim();

  if (!obligationId) {
    throw new Error("Obligation is required.");
  }

  await getScopedObligation(session.organizationId, obligationId);

  const ownerMembership = ownerMembershipId
    ? await getScopedMembership(session.organizationId, ownerMembershipId)
    : null;

  await prisma.obligationInstance.update({
    where: { id: obligationId },
    data: {
      ownerMembershipId: ownerMembership?.id ?? null,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.OBLIGATION_UPDATED,
      entityType: "obligation",
      entityId: obligationId,
      summary: ownerMembership
        ? `Obligation owner changed to ${ownerMembership.user.name}.`
        : "Obligation owner cleared.",
    },
  });

  revalidateWorkspacePaths([
    "/app/dashboard",
    "/app/obligations",
    `/app/obligations/${obligationId}`,
  ]);
}

export async function reviewApprovalAction(formData: FormData) {
  const session = await requireActionContext("review_approvals");
  const approvalId = String(formData.get("approvalId") ?? "").trim();
  const status = String(formData.get("status") ?? ApprovalStatus.APPROVED) as ApprovalStatus;
  const comments = String(formData.get("comments") ?? "").trim();
  const approval = await getScopedApproval(session.organizationId, approvalId);
  const nextComments = comments || approval.comments;

  await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status,
      reviewerId: session.userId,
      approvedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
      comments: nextComments,
    },
  });

  if (approval.entityType === "obligation") {
    await prisma.obligationInstance.update({
      where: { id: approval.entityId },
      data: {
        reviewStatus:
          status === ApprovalStatus.APPROVED ? "APPROVED" : "REJECTED",
        status:
          status === ApprovalStatus.APPROVED
            ? WorkStatus.COMPLETE
            : WorkStatus.IN_PROGRESS,
      },
    });
  }

  if (approval.entityType === "launch_packet_item") {
    await prisma.launchPacketItem.update({
      where: { id: approval.entityId },
      data: {
        reviewStatus:
          status === ApprovalStatus.APPROVED ? "APPROVED" : "REJECTED",
        status:
          status === ApprovalStatus.APPROVED
            ? WorkStatus.COMPLETE
            : WorkStatus.IN_PROGRESS,
      },
    });
  }

  if (approval.entityType === "annual_review") {
    await prisma.annualReview.update({
      where: { id: approval.entityId },
      data: {
        status:
          status === ApprovalStatus.APPROVED
            ? AnnualReviewStatus.COMPLETE
            : AnnualReviewStatus.IN_PROGRESS,
      },
    });
  }

  if (approval.entityType === "marketing_review") {
    await prisma.marketingReview.update({
      where: { id: approval.entityId },
      data: {
        status:
          status === ApprovalStatus.APPROVED
            ? MarketingReviewStatus.APPROVED
            : MarketingReviewStatus.NEEDS_CHANGES,
        reviewerComment: nextComments || undefined,
      },
    });
  }

  if (approval.entityType === "exam_request") {
    await prisma.examRequest.update({
      where: { id: approval.entityId },
      data: {
        status:
          status === ApprovalStatus.APPROVED
            ? ExamRequestStatus.COMPLETE
            : ExamRequestStatus.IN_PROGRESS,
      },
    });
  }

  if (approval.entityType === "vendor") {
    await prisma.vendor.update({
      where: { id: approval.entityId },
      data: {
        diligenceStatus:
          status === ApprovalStatus.APPROVED
            ? DiligenceStatus.COMPLETE
            : DiligenceStatus.ATTENTION_REQUIRED,
        lastReviewedAt: new Date(),
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.APPROVAL_ADDED,
      entityType: "approval",
      entityId: approvalId,
      summary: `Approval status changed to ${status.toLowerCase().replace(/_/g, " ")}.`,
    },
  });

  revalidateWorkspacePaths([
    "/app/dashboard",
    "/app/obligations",
    ...(approval.entityType === "obligation"
      ? [`/app/obligations/${approval.entityId}`]
      : approval.entityType === "launch_packet_item"
        ? ["/app/launch"]
      : approval.entityType === "annual_review"
        ? ["/app/annual-review"]
        : approval.entityType === "exam_request"
          ? ["/app/exam-room"]
        : approval.entityType === "marketing_review"
          ? ["/app/marketing-review"]
          : approval.entityType === "vendor"
            ? ["/app/vendors"]
          : []),
  ]);
}

export async function updateAnnualReviewAction(formData: FormData) {
  const session = await requireActionContext("manage_annual_review");
  const reviewId = String(formData.get("reviewId") ?? "").trim();
  const status = String(
    formData.get("status") ?? AnnualReviewStatus.IN_PROGRESS,
  ) as AnnualReviewStatus;
  const summary = String(formData.get("summary") ?? "").trim();
  const review = await getScopedAnnualReview(session.organizationId, reviewId);
  const approvalState = await syncApprovalQueueState(session, {
    entityId: reviewId,
    entityType: "annual_review",
    shouldQueue: status === AnnualReviewStatus.READY_FOR_SIGNOFF,
    pendingComment: "Annual review is ready for signoff.",
    resetComment: "Annual review returned to working status before signoff was finalized.",
  });

  await prisma.annualReview.update({
    where: { id: reviewId },
    data: {
      status,
      summary: summary || review.summary,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.ANNUAL_REVIEW_UPDATED,
      entityType: "annual_review",
      entityId: reviewId,
      summary:
        status === AnnualReviewStatus.READY_FOR_SIGNOFF
          ? approvalState.created
            ? "Annual review updated and submitted for signoff."
            : "Annual review remains in the signoff queue."
          : `Annual review moved to ${status.toLowerCase().replace(/_/g, " ")}.`,
    },
  });

  revalidateWorkspacePaths(["/app/annual-review", "/app/dashboard"]);
}

export async function updateExamRequestAction(formData: FormData) {
  const session = await requireActionContext("manage_exam_room");
  const requestId = String(formData.get("requestId") ?? "").trim();
  const status = String(
    formData.get("status") ?? ExamRequestStatus.IN_PROGRESS,
  ) as ExamRequestStatus;
  const summary = String(formData.get("summary") ?? "").trim();
  const request = await getScopedExamRequest(session.organizationId, requestId);
  const approvalState = await syncApprovalQueueState(session, {
    entityId: requestId,
    entityType: "exam_request",
    shouldQueue: status === ExamRequestStatus.READY_TO_SEND,
    pendingComment: "Exam response packet is ready for reviewer signoff.",
    resetComment: "Exam response packet returned to working status before approval was finalized.",
  });

  await prisma.examRequest.update({
    where: { id: requestId },
    data: {
      status,
      summary: summary || request.summary,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.EXAM_REQUEST_UPDATED,
      entityType: "exam_request",
      entityId: requestId,
      summary:
        status === ExamRequestStatus.READY_TO_SEND
          ? approvalState.created
            ? "Exam request updated and submitted for signoff."
            : "Exam request remains in the signoff queue."
          : `Exam request moved to ${status.toLowerCase().replace(/_/g, " ")}.`,
    },
  });

  revalidateWorkspacePaths(["/app/exam-room", "/app/dashboard"]);
}

export async function updateMarketingReviewAction(formData: FormData) {
  const session = await requireActionContext("manage_marketing_review");
  const reviewId = String(formData.get("reviewId") ?? "").trim();
  const status = String(
    formData.get("status") ?? MarketingReviewStatus.IN_REVIEW,
  ) as MarketingReviewStatus;
  const reviewerComment = String(formData.get("reviewerComment") ?? "").trim();
  const review = await getScopedMarketingReview(session.organizationId, reviewId);
  const approvalState = await syncApprovalQueueState(session, {
    entityId: reviewId,
    entityType: "marketing_review",
    shouldQueue: status === MarketingReviewStatus.IN_REVIEW,
    pendingComment: "Marketing material is ready for reviewer approval.",
    resetComment: "Marketing material returned to working status before approval was finalized.",
  });

  await prisma.marketingReview.update({
    where: { id: reviewId },
    data: {
      status,
      reviewerComment: reviewerComment || review.reviewerComment,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.MARKETING_REVIEW_UPDATED,
      entityType: "marketing_review",
      entityId: reviewId,
      summary:
        status === MarketingReviewStatus.IN_REVIEW
          ? approvalState.created
            ? "Marketing review moved into reviewer approval."
            : "Marketing review remains in the reviewer queue."
          : `Marketing review moved to ${status.toLowerCase().replace(/_/g, " ")}.`,
    },
  });

  revalidateWorkspacePaths(["/app/marketing-review", "/app/dashboard"]);
}

export async function updateVendorAction(formData: FormData) {
  const session = await requireActionContext("manage_vendors");
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  const diligenceStatus = String(
    formData.get("diligenceStatus") ?? DiligenceStatus.IN_PROGRESS,
  ) as DiligenceStatus;
  const riskTier = String(
    formData.get("riskTier") ?? VendorRiskTier.MEDIUM,
  ) as VendorRiskTier;
  const summary = String(formData.get("summary") ?? "").trim();
  const vendor = await getScopedVendor(session.organizationId, vendorId);
  const approvalState = await syncApprovalQueueState(session, {
    entityId: vendorId,
    entityType: "vendor",
    shouldQueue: diligenceStatus === DiligenceStatus.COMPLETE,
    pendingComment: "Vendor diligence is ready for final reviewer signoff.",
    resetComment: "Vendor diligence returned to working status before approval was finalized.",
  });

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      diligenceStatus,
      riskTier,
      summary: summary || vendor.summary,
      lastReviewedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.VENDOR_UPDATED,
      entityType: "vendor",
      entityId: vendorId,
      summary:
        diligenceStatus === DiligenceStatus.COMPLETE
          ? approvalState.created
            ? "Vendor diligence updated and submitted for signoff."
            : "Vendor diligence remains in the signoff queue."
          : `Vendor oversight moved to ${diligenceStatus.toLowerCase().replace(/_/g, " ")}.`,
    },
  });

  revalidateWorkspacePaths(["/app/vendors", "/app/dashboard"]);
}

export async function createIncidentAction(formData: FormData) {
  const session = await requireActionContext("manage_vendors");
  const title = String(formData.get("title") ?? "").trim();
  const severity = String(
    formData.get("severity") ?? IncidentSeverity.MEDIUM,
  ) as IncidentSeverity;
  const summary = String(formData.get("summary") ?? "").trim();

  if (!title || !summary) {
    throw new Error("Incident title and summary are required.");
  }

  const incident = await prisma.incidentLog.create({
    data: {
      organizationId: session.organizationId,
      title,
      severity,
      summary,
      occurredAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.VENDOR_UPDATED,
      entityType: "incident",
      entityId: incident.id,
      summary: `${title} logged in incident readiness.`,
    },
  });

  revalidateWorkspacePaths(["/app/vendors", "/app/dashboard"]);
}

export async function reviewAiGuidanceAction(formData: FormData) {
  const session = await requireActionContext("review_ai_guidance");
  const guidanceId = String(formData.get("guidanceId") ?? "");
  const reviewStatus = String(
    formData.get("reviewStatus") ?? AiReviewStatus.REVIEWED,
  ) as AiReviewStatus;

  await getScopedGuidance(session.organizationId, guidanceId);

  await prisma.aiGuidance.update({
    where: { id: guidanceId },
    data: {
      reviewStatus,
      reviewedById: session.userId,
      reviewedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      activityType: ActivityType.AI_GUIDANCE_REVIEWED,
      entityType: "ai_guidance",
      entityId: guidanceId,
      summary: `AI guidance marked ${reviewStatus.toLowerCase()}.`,
    },
  });

  revalidateWorkspacePaths(["/app/obligations"]);
}
