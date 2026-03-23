import {
  ActivityType,
  WorkStatus,
  type ActivityLog,
  type Approval,
  type MembershipRole,
  type Prisma,
} from "@prisma/client";
import { cache } from "react";
import { format } from "date-fns";
import { requireSession } from "@/lib/auth/session";
import { buildLaunchMilestones } from "@/lib/config/obligations";
import { prisma } from "@/lib/prisma";

type HydratedApproval = Approval & {
  entityLabel: string;
  entityHref: string;
  contextLine?: string;
  entityStatus?: string;
  entityReviewStatus?: string;
};

type HydratedActivityLog = ActivityLog & {
  entityLabel: string;
  entityHref: string;
  contextLine?: string;
  entityStatus?: string;
  entityReviewStatus?: string;
};

function buildLaunchContextLine(details: {
  dueDate?: Date | null;
  ownerName?: string | null;
  evidenceCount?: number;
}) {
  const parts = [
    details.dueDate ? `Due ${format(details.dueDate, "MMM d")}` : null,
    details.ownerName ? `Owner ${details.ownerName}` : "Owner unassigned",
    typeof details.evidenceCount === "number" ? `Evidence ${details.evidenceCount}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.join(" · ");
}

export const getViewerContext = cache(async () => {
  const session = await requireSession();
  const membership = await prisma.membership.findUnique({
    where: { id: session.membershipId },
    include: {
      organization: true,
      user: true,
    },
  });

  if (!membership) {
    throw new Error("Active membership not found.");
  }

  const firmProfile = await prisma.firmProfile.findUnique({
    where: { organizationId: membership.organizationId },
  });

  return {
    session,
    membership,
    organization: membership.organization,
    user: membership.user,
    firmProfile,
  };
});

export async function getDashboardSnapshot(organizationId: string) {
  const [
    obligations,
    milestones,
    launchPacketItems,
    approvals,
    approvalCount,
    artifacts,
    annualReview,
    activityLogs,
  ] =
    await Promise.all([
      prisma.obligationInstance.findMany({
        where: { organizationId },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
      prisma.launchMilestone.findMany({
        where: { organizationId },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.launchPacketItem.findMany({
        where: { organizationId },
        include: {
          milestone: true,
          ownerMembership: {
            include: {
              user: true,
            },
          },
          artifactLinks: true,
        },
        orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.approval.findMany({
        where: { organizationId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.approval.count({
        where: { organizationId, status: "PENDING" },
      }),
      prisma.artifact.findMany({
        where: { organizationId },
        include: { links: true },
      }),
      prisma.annualReview.findFirst({
        where: { organizationId },
        orderBy: { periodEnd: "desc" },
      }),
      prisma.activityLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);
  const [hydratedApprovals, hydratedActivityLogs] = await Promise.all([
    hydrateApprovals(organizationId, approvals),
    hydrateActivityLogs(organizationId, activityLogs),
  ]);

  const overdue = obligations.filter(
    (item) => item.status !== WorkStatus.COMPLETE && item.dueDate < new Date(),
  ).length;
  const upcoming = obligations.filter((item) => item.status !== WorkStatus.COMPLETE).length;
  const launchProgress =
    milestones.length === 0
      ? 0
      : Math.round(
          (milestones.filter((item) => item.status === WorkStatus.COMPLETE).length /
            milestones.length) *
            100,
        );
  const missingEvidence = obligations.filter(
    (obligation) =>
      !artifacts.some((artifact) =>
        artifact.links.some((link) => link.obligationId === obligation.id),
      ),
  ).length +
    launchPacketItems.filter(
      (item) =>
        !artifacts.some((artifact) =>
          artifact.links.some((link) => link.launchPacketItemId === item.id),
        ),
    ).length;
  const openLaunchPacketItems = launchPacketItems.filter(
    (item) => item.status !== WorkStatus.COMPLETE,
  );
  const launchPacketOverdue = openLaunchPacketItems.filter(
    (item) => item.dueDate && item.dueDate < new Date(),
  ).length;
  const launchPacketAwaitingApproval = openLaunchPacketItems.filter(
    (item) => item.reviewStatus === "PENDING_APPROVAL",
  ).length;
  const launchPacketMissingEvidence = openLaunchPacketItems.filter(
    (item) => item.artifactLinks.length === 0,
  ).length;
  const launchPacketFocus = [...openLaunchPacketItems]
    .sort((left, right) => {
      const leftScore =
        (left.reviewStatus === "PENDING_APPROVAL" ? 4 : 0) +
        (left.artifactLinks.length === 0 ? 3 : 0) +
        (left.status === WorkStatus.BLOCKED ? 2 : 0) +
        (left.dueDate && left.dueDate < new Date() ? 2 : 0);
      const rightScore =
        (right.reviewStatus === "PENDING_APPROVAL" ? 4 : 0) +
        (right.artifactLinks.length === 0 ? 3 : 0) +
        (right.status === WorkStatus.BLOCKED ? 2 : 0) +
        (right.dueDate && right.dueDate < new Date() ? 2 : 0);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (left.dueDate && right.dueDate) {
        return left.dueDate.getTime() - right.dueDate.getTime();
      }

      if (left.dueDate) {
        return -1;
      }

      if (right.dueDate) {
        return 1;
      }

      return left.sortOrder - right.sortOrder;
    })
    .slice(0, 3);

  return {
    obligations,
    approvals: hydratedApprovals,
    activityLogs: hydratedActivityLogs,
    annualReview,
    launchPacketFocus,
    metrics: {
      overdue,
      upcoming,
      launchProgress,
      missingEvidence,
      awaitingApproval: approvalCount,
      launchPacketOverdue,
      launchPacketAwaitingApproval,
      launchPacketMissingEvidence,
    },
  };
}

export async function getLaunchWorkspace(organizationId: string) {
  const [milestones, obligations, packetItems, approvals, memberships] = await Promise.all([
    prisma.launchMilestone.findMany({
      where: { organizationId },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.obligationInstance.findMany({
      where: { organizationId },
      orderBy: { dueDate: "asc" },
    }),
    prisma.launchPacketItem.findMany({
      where: { organizationId },
      include: {
        ownerMembership: {
          include: {
            user: true,
          },
        },
        artifactLinks: {
          include: {
            artifact: true,
          },
        },
      },
      orderBy: [{ milestoneId: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.approval.findMany({
      where: {
        organizationId,
        entityType: "launch_packet_item",
      },
      include: {
        reviewer: true,
      },
      orderBy: [{ createdAt: "desc" }, { approvedAt: "desc" }],
    }),
    prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: true,
      },
      orderBy: { role: "asc" },
    }),
  ]);

  const milestoneDefinitions = buildLaunchMilestones();
  const definitionByOrder = new Map(
    milestoneDefinitions.map((definition) => [definition.orderIndex, definition]),
  );
  type LaunchBlocker = {
    code: string;
    title: string;
    status: WorkStatus;
  };
  const codeToMilestone = new Map(
    milestones.map((milestone) => {
      const definition = definitionByOrder.get(milestone.orderIndex);

      return [definition?.code ?? `step_${milestone.orderIndex}`, milestone];
    }),
  );
  const approvalsByPacketItemId = new Map<
    string,
    typeof approvals
  >();

  for (const approval of approvals) {
    const existing = approvalsByPacketItemId.get(approval.entityId) ?? [];

    approvalsByPacketItemId.set(approval.entityId, [...existing, approval]);
  }

  const packetItemsByMilestoneId = new Map<
    string,
    Array<
      (typeof packetItems)[number] & {
        approvals: typeof approvals;
      }
    >
  >();

  for (const item of packetItems) {
    const existing = packetItemsByMilestoneId.get(item.milestoneId) ?? [];

    packetItemsByMilestoneId.set(item.milestoneId, [
      ...existing,
      {
        ...item,
        approvals: approvalsByPacketItemId.get(item.id) ?? [],
      },
    ]);
  }

  const enrichedMilestones = milestones.map((milestone) => {
    const definition = definitionByOrder.get(milestone.orderIndex);
    const blockerCodes = Array.isArray(milestone.blockerCodes)
      ? (milestone.blockerCodes as string[])
      : [];
    const blockers: LaunchBlocker[] = blockerCodes
      .map((code) => {
        const blockedBy = codeToMilestone.get(code);

        return blockedBy
          ? {
              code,
              title: blockedBy.title,
              status: blockedBy.status,
            }
          : null;
      })
      .filter((blockedBy): blockedBy is LaunchBlocker => Boolean(blockedBy));

    return {
      ...milestone,
      code: definition?.code ?? `step_${milestone.orderIndex}`,
      packetItems: packetItemsByMilestoneId.get(milestone.id) ?? [],
      blockers,
      isBlockedByDependency: blockers.some(
        (blockedBy) => blockedBy.status !== WorkStatus.COMPLETE,
      ),
    };
  });

  return { milestones: enrichedMilestones, obligations, memberships };
}

export async function getObligationsList(
  organizationId: string,
  filters?: {
    status?: WorkStatus;
    ownerRole?: MembershipRole;
    ownerMembershipId?: string;
  },
) {
  const where: Prisma.ObligationInstanceWhereInput = {
    organizationId,
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.ownerRole) {
    where.ownerMembership = {
      role: filters.ownerRole,
    };
  }

  if (filters?.ownerMembershipId) {
    where.ownerMembershipId = filters.ownerMembershipId;
  }

  return prisma.obligationInstance.findMany({
    where,
    include: {
      ownerMembership: {
        include: {
          user: true,
        },
      },
      artifactLinks: {
        include: {
          artifact: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function getObligationDetail(organizationId: string, obligationId: string) {
  return prisma.obligationInstance.findFirst({
    where: {
      id: obligationId,
      organizationId,
    },
    include: {
      ownerMembership: {
        include: {
          user: true,
        },
      },
      template: true,
      artifactLinks: {
        include: {
          artifact: true,
        },
      },
    },
  });
}

export async function getDocumentsSnapshot(organizationId: string) {
  const [artifacts, obligations, activityLogs] = await Promise.all([
    prisma.artifact.findMany({
      where: { organizationId },
      include: {
        links: {
          include: {
            launchPacketItem: {
              include: {
                milestone: true,
                ownerMembership: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            obligation: true,
            annualReview: true,
            examRequest: true,
            vendor: true,
            marketingReview: true,
          },
        },
        uploadedBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.obligationInstance.findMany({
      where: { organizationId },
      orderBy: { dueDate: "asc" },
    }),
    prisma.activityLog.findMany({
      where: {
        organizationId,
        activityType: {
          in: [ActivityType.ARTIFACT_CREATED, ActivityType.ARTIFACT_LINKED],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return { artifacts, obligations, activityLogs };
}

export async function getArtifactCatalog(organizationId: string) {
  return prisma.artifact.findMany({
    where: { organizationId },
    orderBy: [{ title: "asc" }, { createdAt: "desc" }],
  });
}

export async function getWorkflowLinkTargets(organizationId: string) {
  const [
    obligations,
    launchPacketItems,
    annualReviews,
    examRequests,
    marketingReviews,
    vendors,
  ] =
    await Promise.all([
      prisma.obligationInstance.findMany({
        where: { organizationId },
        orderBy: { dueDate: "asc" },
      }),
      prisma.launchPacketItem.findMany({
        where: { organizationId },
        include: {
          milestone: true,
          ownerMembership: {
            include: {
              user: true,
            },
          },
          artifactLinks: true,
        },
        orderBy: [{ dueDate: "asc" }, { milestoneId: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.annualReview.findMany({
        where: { organizationId },
        orderBy: { periodEnd: "desc" },
      }),
      prisma.examRequest.findMany({
        where: { organizationId },
        orderBy: { dueAt: "asc" },
      }),
      prisma.marketingReview.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendor.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
      }),
    ]);

  return {
    obligations,
    launchPacketItems,
    annualReviews,
    examRequests,
    marketingReviews,
    vendors,
  };
}

export async function getApprovalsForEntity(
  organizationId: string,
  entityType: string,
  entityId: string,
) {
  return prisma.approval.findMany({
    where: {
      organizationId,
      entityType,
      entityId,
    },
    include: {
      reviewer: true,
    },
    orderBy: [{ createdAt: "desc" }, { approvedAt: "desc" }],
  });
}

async function hydrateApprovals(
  organizationId: string,
  approvals: Approval[],
): Promise<HydratedApproval[]> {
  const obligationIds = approvals
    .filter((approval) => approval.entityType === "obligation")
    .map((approval) => approval.entityId);
  const annualReviewIds = approvals
    .filter((approval) => approval.entityType === "annual_review")
    .map((approval) => approval.entityId);
  const examRequestIds = approvals
    .filter((approval) => approval.entityType === "exam_request")
    .map((approval) => approval.entityId);
  const marketingReviewIds = approvals
    .filter((approval) => approval.entityType === "marketing_review")
    .map((approval) => approval.entityId);
  const vendorIds = approvals
    .filter((approval) => approval.entityType === "vendor")
    .map((approval) => approval.entityId);
  const launchPacketItemIds = approvals
    .filter((approval) => approval.entityType === "launch_packet_item")
    .map((approval) => approval.entityId);

  const [
    obligationMap,
    annualReviewMap,
    examRequestMap,
    marketingReviewMap,
    vendorMap,
    launchPacketItemMap,
  ] =
    await Promise.all([
    obligationIds.length
      ? prisma.obligationInstance
          .findMany({
            where: {
              organizationId,
              id: { in: obligationIds },
            },
            select: {
              id: true,
              title: true,
            },
          })
          .then((items) => new Map(items.map((item) => [item.id, item])))
      : Promise.resolve(new Map<string, { id: string; title: string }>()),
    annualReviewIds.length
      ? prisma.annualReview
          .findMany({
            where: {
              organizationId,
              id: { in: annualReviewIds },
            },
            select: {
              id: true,
              periodEnd: true,
            },
          })
          .then((items) => new Map(items.map((item) => [item.id, item])))
      : Promise.resolve(new Map<string, { id: string; periodEnd: Date }>()),
    examRequestIds.length
      ? prisma.examRequest
          .findMany({
            where: {
              organizationId,
              id: { in: examRequestIds },
            },
            select: {
              id: true,
              title: true,
            },
          })
          .then((items) => new Map(items.map((item) => [item.id, item])))
      : Promise.resolve(new Map<string, { id: string; title: string }>()),
    marketingReviewIds.length
      ? prisma.marketingReview
          .findMany({
            where: {
              organizationId,
              id: { in: marketingReviewIds },
            },
            select: {
              id: true,
              title: true,
            },
          })
          .then((items) => new Map(items.map((item) => [item.id, item])))
      : Promise.resolve(new Map<string, { id: string; title: string }>()),
    vendorIds.length
      ? prisma.vendor
          .findMany({
            where: {
              organizationId,
              id: { in: vendorIds },
            },
            select: {
              id: true,
              name: true,
            },
          })
          .then((items) => new Map(items.map((item) => [item.id, item])))
      : Promise.resolve(new Map<string, { id: string; name: string }>()),
    launchPacketItemIds.length
      ? prisma.launchPacketItem
          .findMany({
            where: {
              organizationId,
              id: { in: launchPacketItemIds },
            },
            select: {
              id: true,
              title: true,
              status: true,
              reviewStatus: true,
              dueDate: true,
              artifactLinks: {
                select: {
                  id: true,
                },
              },
              ownerMembership: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              milestone: {
                select: {
                  title: true,
                },
              },
            },
          })
          .then((items) => new Map(items.map((item) => [item.id, item])))
      : Promise.resolve(
          new Map<
            string,
            {
              id: string;
              title: string;
              status: string;
              reviewStatus: string;
              dueDate: Date | null;
              artifactLinks: Array<{ id: string }>;
              ownerMembership: { user: { name: string } } | null;
              milestone: { title: string };
            }
          >(),
        ),
    ]);

  return approvals.map((approval) => {
    if (approval.entityType === "obligation") {
      const entity = obligationMap.get(approval.entityId);

      return {
        ...approval,
        entityLabel: entity?.title ?? "Obligation approval",
        entityHref: `/app/obligations/${approval.entityId}`,
      };
    }

    if (approval.entityType === "annual_review") {
      const entity = annualReviewMap.get(approval.entityId);

      return {
        ...approval,
        entityLabel: entity
          ? `${format(entity.periodEnd, "yyyy")} annual review`
          : "Annual review signoff",
        entityHref: "/app/annual-review",
      };
    }

    if (approval.entityType === "exam_request") {
      const entity = examRequestMap.get(approval.entityId);

      return {
        ...approval,
        entityLabel: entity?.title ?? "Exam request signoff",
        entityHref: "/app/exam-room",
      };
    }

    if (approval.entityType === "marketing_review") {
      const entity = marketingReviewMap.get(approval.entityId);

      return {
        ...approval,
        entityLabel: entity?.title ?? "Marketing review",
        entityHref: "/app/marketing-review",
      };
    }

    if (approval.entityType === "vendor") {
      const entity = vendorMap.get(approval.entityId);

      return {
        ...approval,
        entityLabel: entity?.name ?? "Vendor diligence signoff",
        entityHref: "/app/vendors",
      };
    }

    if (approval.entityType === "launch_packet_item") {
      const entity = launchPacketItemMap.get(approval.entityId);

      return {
        ...approval,
        entityLabel: entity
          ? `${entity.milestone.title} · ${entity.title}`
          : "Launch packet item",
        entityHref: "/app/launch",
        contextLine: entity
          ? buildLaunchContextLine({
              dueDate: entity.dueDate,
              ownerName: entity.ownerMembership?.user.name ?? null,
              evidenceCount: entity.artifactLinks.length,
            })
          : undefined,
        entityStatus: entity?.status,
        entityReviewStatus: entity?.reviewStatus,
      };
    }

    return {
      ...approval,
      entityLabel: approval.entityType.replace(/_/g, " "),
      entityHref: "/app/dashboard",
    };
  });
}

async function hydrateActivityLogs(
  organizationId: string,
  activityLogs: ActivityLog[],
): Promise<HydratedActivityLog[]> {
  const launchPacketItemIds = activityLogs
    .filter((log) => log.entityType === "launch_packet_item")
    .map((log) => log.entityId);
  const obligationIds = activityLogs
    .filter((log) => log.entityType === "obligation")
    .map((log) => log.entityId);

  const [launchPacketItemMap, obligationMap] = await Promise.all([
    launchPacketItemIds.length
      ? prisma.launchPacketItem
          .findMany({
            where: {
              organizationId,
              id: { in: launchPacketItemIds },
            },
            select: {
              id: true,
              title: true,
              status: true,
              reviewStatus: true,
              dueDate: true,
              artifactLinks: {
                select: {
                  id: true,
                },
              },
              ownerMembership: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              milestone: {
                select: {
                  title: true,
                },
              },
            },
          })
          .then((items) => new Map(items.map((item) => [item.id, item])))
      : Promise.resolve(new Map<string, never>()),
    obligationIds.length
      ? prisma.obligationInstance
          .findMany({
            where: {
              organizationId,
              id: { in: obligationIds },
            },
            select: {
              id: true,
              title: true,
            },
          })
          .then((items) => new Map(items.map((item) => [item.id, item])))
      : Promise.resolve(new Map<string, never>()),
  ]);

  return activityLogs.map((log) => {
    if (log.entityType === "launch_packet_item") {
      const entity = launchPacketItemMap.get(log.entityId);

      return {
        ...log,
        entityLabel: entity
          ? `${entity.milestone.title} · ${entity.title}`
          : "Launch packet item",
        entityHref: "/app/launch",
        contextLine: entity
          ? buildLaunchContextLine({
              dueDate: entity.dueDate,
              ownerName: entity.ownerMembership?.user.name ?? null,
              evidenceCount: entity.artifactLinks.length,
            })
          : undefined,
        entityStatus: entity?.status,
        entityReviewStatus: entity?.reviewStatus,
      };
    }

    if (log.entityType === "obligation") {
      const entity = obligationMap.get(log.entityId);

      return {
        ...log,
        entityLabel: entity?.title ?? "Obligation",
        entityHref: entity ? `/app/obligations/${entity.id}` : "/app/obligations",
      };
    }

    return {
      ...log,
      entityLabel: log.entityType.replace(/_/g, " "),
      entityHref:
        log.entityType === "annual_review"
          ? "/app/annual-review"
          : log.entityType === "exam_request"
            ? "/app/exam-room"
            : log.entityType === "marketing_review"
              ? "/app/marketing-review"
              : log.entityType === "vendor"
                ? "/app/vendors"
                : "/app/dashboard",
    };
  });
}

export async function getAnnualReviewSnapshot(organizationId: string) {
  return prisma.annualReview.findFirst({
    where: { organizationId },
    include: {
      artifactLinks: {
        include: {
          artifact: true,
        },
      },
    },
    orderBy: { periodEnd: "desc" },
  });
}

export async function getExamRoomSnapshot(organizationId: string) {
  return prisma.examRequest.findMany({
    where: { organizationId },
    include: {
      artifactLinks: {
        include: {
          artifact: true,
        },
      },
    },
    orderBy: { dueAt: "asc" },
  });
}

export async function getMarketingSnapshot(organizationId: string) {
  return prisma.marketingReview.findMany({
    where: { organizationId },
    include: {
      submitter: true,
      artifactLinks: {
        include: {
          artifact: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVendorSnapshot(organizationId: string) {
  const [vendors, incidents] = await Promise.all([
    prisma.vendor.findMany({
      where: { organizationId },
      include: {
        artifactLinks: {
          include: {
            artifact: true,
          },
        },
      },
      orderBy: [{ riskTier: "desc" }, { name: "asc" }],
    }),
    prisma.incidentLog.findMany({
      where: { organizationId },
      orderBy: { occurredAt: "desc" },
    }),
  ]);

  return { vendors, incidents };
}

export async function getTeamSnapshot(organizationId: string) {
  const [memberships, obligations, milestones, launchPacketItems] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: true,
      },
      orderBy: { role: "asc" },
    }),
    prisma.obligationInstance.findMany({
      where: { organizationId },
      orderBy: { dueDate: "asc" },
    }),
    prisma.launchMilestone.findMany({
      where: { organizationId },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.launchPacketItem.findMany({
      where: { organizationId },
      include: {
        milestone: true,
        artifactLinks: true,
      },
      orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const milestoneDefinitions = buildLaunchMilestones();
  const definitionByOrder = new Map(
    milestoneDefinitions.map((definition) => [definition.orderIndex, definition]),
  );
  const codeToMilestone = new Map(
    milestones.map((milestone) => {
      const definition = definitionByOrder.get(milestone.orderIndex);

      return [definition?.code ?? `step_${milestone.orderIndex}`, milestone];
    }),
  );
  const milestoneBlockedByDependency = new Map(
    milestones.map((milestone) => {
      const blockerCodes = Array.isArray(milestone.blockerCodes)
        ? (milestone.blockerCodes as string[])
        : [];
      const isBlockedByDependency = blockerCodes.some((code) => {
        const blockedBy = codeToMilestone.get(code);

        return blockedBy ? blockedBy.status !== WorkStatus.COMPLETE : false;
      });

      return [milestone.id, isBlockedByDependency];
    }),
  );

  return memberships.map((membership) => {
    const ownedObligations = obligations.filter(
      (obligation) =>
        obligation.ownerMembershipId === membership.id &&
        obligation.status !== WorkStatus.COMPLETE,
    );
    const ownedLaunchPacketItems = launchPacketItems.filter(
      (item) =>
        item.ownerMembershipId === membership.id &&
        item.status !== WorkStatus.COMPLETE,
    );
    const launchBlockedCount = ownedLaunchPacketItems.filter(
      (item) =>
        item.status === WorkStatus.BLOCKED ||
        milestoneBlockedByDependency.get(item.milestoneId),
    ).length;
    const launchAwaitingReviewCount = ownedLaunchPacketItems.filter(
      (item) => item.reviewStatus === "PENDING_APPROVAL",
    ).length;
    const launchMissingEvidenceCount = ownedLaunchPacketItems.filter(
      (item) => item.artifactLinks.length === 0,
    ).length;

    return {
      ...membership,
      ownedObligations,
      ownedLaunchPacketItems,
      ownershipSummary: {
        obligationCount: ownedObligations.length,
        launchPacketCount: ownedLaunchPacketItems.length,
        launchBlockedCount,
        launchAwaitingReviewCount,
        launchMissingEvidenceCount,
      },
    };
  });
}

export async function getAiGuidanceForContext(
  organizationId: string,
  contextType: string,
  contextId: string,
) {
  return prisma.aiGuidance.findMany({
    where: {
      organizationId,
      contextType,
      contextId,
    },
    orderBy: { createdAt: "desc" },
  });
}
