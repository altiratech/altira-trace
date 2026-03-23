import {
  MembershipRole,
  Prisma,
  WorkStatus,
  type FirmProfile,
  type Membership,
} from "@prisma/client";
import {
  buildLaunchMilestones,
  buildObligationDrafts,
  templateDefinitions,
} from "@/lib/config/obligations";
import { buildRegistrationGuide } from "@/lib/launch-guidance";

type DbClient = Prisma.TransactionClient | Prisma.DefaultPrismaClient;

function coerceStringArray(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function pickOwnerMembershipId(
  memberships: Membership[],
  role: MembershipRole,
  fallbackMembershipId?: string,
) {
  return (
    memberships.find((membership) => membership.role === role)?.id ??
    fallbackMembershipId ??
    memberships[0]?.id
  );
}

export async function ensureObligationTemplates(db: DbClient) {
  await Promise.all(
    templateDefinitions.map((template) =>
      db.obligationTemplate.upsert({
        where: { code: template.code },
        update: {
          title: template.title,
          description: template.description,
          cadenceLabel: template.cadenceLabel,
          triggerConditions: template.triggerConditions,
          evidenceRequirements: template.evidenceRequirements,
          riskLevel: template.riskLevel,
          sourceReference: template.sourceReference,
          rationale: template.rationale,
        },
        create: {
          code: template.code,
          title: template.title,
          description: template.description,
          cadenceLabel: template.cadenceLabel,
          triggerConditions: template.triggerConditions,
          evidenceRequirements: template.evidenceRequirements,
          riskLevel: template.riskLevel,
          sourceReference: template.sourceReference,
          rationale: template.rationale,
        },
      }),
    ),
  );
}

export async function refreshOrganizationWorkflows(
  db: DbClient,
  params: {
    organizationId: string;
    profile: Pick<
      FirmProfile,
      | "targetRegistrationType"
      | "aumBand"
      | "custodyProfile"
      | "principalOfficeState"
      | "serviceModel"
      | "clientProfile"
      | "teamSize"
      | "usesTestimonials"
      | "hasPrivateFunds"
      | "marketingFlags"
      | "vendorFlags"
      | "jurisdictions"
      | "keyVendors"
      | "note"
    >;
    memberships: Membership[];
  },
) {
  const { organizationId, profile, memberships } = params;
  const drafts = buildObligationDrafts({
    ...profile,
    keyVendors: coerceStringArray(profile.keyVendors as Prisma.JsonValue),
  } as Pick<
    FirmProfile,
    | "targetRegistrationType"
    | "aumBand"
    | "custodyProfile"
    | "usesTestimonials"
    | "keyVendors"
  >);

  const templates = await db.obligationTemplate.findMany();
  const templateMap = new Map(templates.map((template) => [template.code, template.id]));
  const existingMilestones = await db.launchMilestone.findMany({
    where: { organizationId },
    select: {
      id: true,
      title: true,
      status: true,
      orderIndex: true,
    },
  });
  const existingMilestonesByOrder = new Map(
    existingMilestones.map((milestone) => [milestone.orderIndex, milestone]),
  );
  const milestoneDefinitions = buildLaunchMilestones();
  const registrationGuide = buildRegistrationGuide(profile as FirmProfile);
  const packetItemCodes = registrationGuide.steps.flatMap((step) =>
    step.packetItems.map((item) => item.code),
  );

  await db.artifactLink.deleteMany({
    where: { obligation: { organizationId } },
  });
  await db.obligationInstance.deleteMany({ where: { organizationId } });
  await db.launchPacketItem.deleteMany({
    where: {
      organizationId,
      code: {
        notIn: packetItemCodes,
      },
    },
  });

  const milestoneIdByCode = new Map<string, string>();
  const milestoneDueDateByCode = new Map<string, Date | null>();

  for (const milestone of milestoneDefinitions) {
    const existingMilestone = existingMilestonesByOrder.get(milestone.orderIndex);
    const persistedMilestone = existingMilestone
      ? await db.launchMilestone.update({
          where: { id: existingMilestone.id },
          data: {
            title: milestone.title,
            description: milestone.description,
            orderIndex: milestone.orderIndex,
            dueDate: milestone.dueDate,
            whyItMatters: milestone.whyItMatters,
            blockerCodes: milestone.blockerCodes ?? [],
            evidenceChecklist: milestone.evidenceChecklist,
          },
        })
      : await db.launchMilestone.create({
          data: {
            organizationId,
            title: milestone.title,
            description: milestone.description,
            orderIndex: milestone.orderIndex,
            dueDate: milestone.dueDate,
            whyItMatters: milestone.whyItMatters,
            blockerCodes: milestone.blockerCodes ?? [],
            evidenceChecklist: milestone.evidenceChecklist,
          },
        });

    milestoneIdByCode.set(milestone.code, persistedMilestone.id);
    milestoneDueDateByCode.set(milestone.code, persistedMilestone.dueDate);
  }

  for (const step of registrationGuide.steps) {
    const milestoneId = milestoneIdByCode.get(step.code);

    if (!milestoneId) {
      continue;
    }

    for (const [index, item] of step.packetItems.entries()) {
      const dueDate = milestoneDueDateByCode.get(step.code) ?? null;

      await db.launchPacketItem.upsert({
        where: {
          organizationId_code: {
            organizationId,
            code: item.code,
          },
        },
        update: {
          milestoneId,
          title: item.title,
          detail: item.detail,
          sortOrder: index,
          dueDate,
          evidenceRequired: item.evidenceRequired,
        },
        create: {
          organizationId,
          milestoneId,
          ownerMembershipId: pickOwnerMembershipId(
            memberships,
            item.ownerRole,
            memberships[0]?.id,
          ),
          code: item.code,
          title: item.title,
          detail: item.detail,
          sortOrder: index,
          dueDate,
          status:
            item.status === "COMPLETE" ? WorkStatus.IN_PROGRESS : WorkStatus.NOT_STARTED,
          evidenceRequired: item.evidenceRequired,
        },
      });
    }
  }

  for (const draft of drafts) {
    await db.obligationInstance.create({
      data: {
        organizationId,
        templateId: templateMap.get(draft.code),
        ownerMembershipId: pickOwnerMembershipId(
          memberships,
          draft.ownerRole,
          memberships[0]?.id,
        ),
        title: draft.title,
        description: draft.description,
        dueDate: draft.dueDate,
        cadenceLabel: draft.cadenceLabel,
        riskLevel: draft.riskLevel,
        evidenceRequired: draft.evidenceRequirements,
        sourceRationale: `${draft.sourceReference} — ${draft.rationale}`,
      },
    });
  }
}
