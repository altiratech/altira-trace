"use server";

import { compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { createSession, destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export async function loginAction(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login details." };
  }

  const membership = await prisma.membership.findFirst({
    where: {
      user: {
        email: parsed.data.email.toLowerCase(),
      },
    },
    include: {
      user: true,
      organization: true,
    },
  });

  if (!membership) {
    return { error: "No user matched that email." };
  }

  const passwordMatches = await compare(
    parsed.data.password,
    membership.user.passwordHash,
  );

  if (!passwordMatches) {
    return { error: "Password did not match the seeded placeholder account." };
  }

  await createSession({
    userId: membership.user.id,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role,
    email: membership.user.email,
    name: membership.user.name,
  });

  await prisma.activityLog.create({
    data: {
      organizationId: membership.organizationId,
      userId: membership.user.id,
      activityType: ActivityType.LOGIN,
      entityType: "session",
      entityId: membership.id,
      summary: `${membership.user.name} signed into the pilot workspace.`,
    },
  });

  revalidatePath("/", "layout");

  return { success: true };
}

export async function logoutAction() {
  await destroySession();
}
