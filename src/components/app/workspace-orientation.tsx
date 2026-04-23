"use client";

import type { MembershipRole } from "@prisma/client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getRoleFocus } from "@/lib/permissions";

const routeMeta = [
  {
    href: "/app/dashboard",
    label: "Dashboard",
    purpose: "cross-functional launch pressure, approvals, and evidence posture",
  },
  {
    href: "/app/launch/intake",
    label: "Launch Intake",
    purpose: "structural launch facts and filing assumptions",
  },
  {
    href: "/app/launch",
    label: "Launch Workspace",
    purpose: "packet ownership, due dates, and launch readiness routing",
  },
  {
    href: "/app/obligations",
    label: "Obligations",
    purpose: "assigned recurring work and compliance execution",
  },
  {
    href: "/app/documents",
    label: "Documents",
    purpose: "evidence linking and artifact coverage",
  },
  {
    href: "/app/annual-review",
    label: "Annual Review",
    purpose: "review-cycle posture and signoff",
  },
  {
    href: "/app/exam-room",
    label: "Exam Room",
    purpose: "request-ready exam response workflow",
  },
  {
    href: "/app/marketing-review",
    label: "Marketing Review",
    purpose: "governed marketing approvals and retention posture",
  },
  {
    href: "/app/vendors",
    label: "Vendor Oversight",
    purpose: "service-provider diligence and incident readiness",
  },
  {
    href: "/app/team",
    label: "Team",
    purpose: "role ownership, launch assignments, and open blockers",
  },
  {
    href: "/app/settings",
    label: "Settings",
    purpose: "governance posture and launch assumptions",
  },
];

const roleLandingReasons: Record<MembershipRole, string> = {
  FOUNDER_ADMIN:
    "Founders land in the control tower first because the first job is keeping the launch story coherent across workstreams, not managing one workflow in isolation.",
  CCO:
    "CCOs land in annual review first because this role starts from reviewer posture, evidence quality, and what is actually signoff-ready.",
  OPERATIONS:
    "Operations lands in documents first because this role keeps execution moving by linking proof, clearing evidence gaps, and supporting downstream review.",
  SUPERVISED_PERSON:
    "Supervised-person users land in obligations first because the narrowest trustworthy view is assigned work, not the full admin control tower.",
  EXTERNAL_CONSULTANT:
    "External consultants land in documents first because the advisory contribution is usually evidence and scoped inputs rather than internal approval ownership.",
};

const roleNextMove: Record<
  MembershipRole,
  { href: string; label: string; detail: string }
> = {
  FOUNDER_ADMIN: {
    href: "/app/launch",
    label: "Open launch workspace",
    detail: "Move from control-tower context into packet ownership, blockers, and launch approvals.",
  },
  CCO: {
    href: "/app/exam-room",
    label: "Open exam room",
    detail: "After reviewer posture is clear, pressure-test exam-ready response packets and linked support.",
  },
  OPERATIONS: {
    href: "/app/launch",
    label: "Open launch workspace",
    detail: "After evidence flow is visible, push owners, due dates, and open launch work forward.",
  },
  SUPERVISED_PERSON: {
    href: "/app/documents",
    label: "Open documents",
    detail: "Once assigned work is clear, the next useful move is attaching proof to what was completed.",
  },
  EXTERNAL_CONSULTANT: {
    href: "/app/settings",
    label: "Open settings",
    detail: "Use the governance surface to confirm the assumptions and boundaries your advisory inputs should respect.",
  },
};

function getActiveRoute(pathname: string) {
  return (
    routeMeta.find((route) => pathname === route.href) ??
    routeMeta.find((route) => route.href !== "/app/dashboard" && pathname.startsWith(route.href)) ??
    routeMeta[0]
  );
}

export function WorkspaceOrientation({ role }: { role: MembershipRole }) {
  const pathname = usePathname();
  const roleFocus = getRoleFocus(role);
  const activeRoute = getActiveRoute(pathname);
  const nextMove = roleNextMove[role];
  const isDefaultLanding = activeRoute.href === roleFocus.primaryHref;

  return (
    <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
        Entry orientation
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-medium text-white">{activeRoute.label}</p>
          <p className="mt-1 text-sm text-[var(--panel-muted)]">
            {isDefaultLanding ? "Default first view for this role" : "Current workspace surface"}
          </p>
        </div>
        {!isDefaultLanding ? (
          <Link
            href={roleFocus.primaryHref}
            className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:text-[#f2d3a0]"
          >
            {roleFocus.primaryLabel}
          </Link>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--panel-muted)]">
        {isDefaultLanding
          ? roleLandingReasons[role]
          : `Your default landing is ${roleFocus.primaryLabel.toLowerCase()}. ${activeRoute.label} is the deeper workspace for ${activeRoute.purpose}.`}
      </p>
      <Link
        href={isDefaultLanding ? nextMove.href : roleFocus.primaryHref}
        className="mt-4 flex items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10"
      >
        <div>
          <p className="font-medium">
            {isDefaultLanding ? `Next suggested move: ${nextMove.label}` : roleFocus.primaryLabel}
          </p>
          <p className="mt-1 text-[var(--panel-muted)]">
            {isDefaultLanding
              ? nextMove.detail
              : "Return to the role’s default home if you want the first-lane operating view again."}
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0" />
      </Link>
    </div>
  );
}
