"use client";

import type { MembershipRole } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FileText,
  Flag,
  Gauge,
  LayoutDashboard,
  SearchCheck,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";
import { canAccessRoute, type AppRouteId } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const navItems = [
  {
    routeId: "dashboard" as AppRouteId,
    href: "/app/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  { routeId: "launch" as AppRouteId, href: "/app/launch", label: "Launch", icon: Flag },
  {
    routeId: "obligations" as AppRouteId,
    href: "/app/obligations",
    label: "Obligations",
    icon: Gauge,
  },
  {
    routeId: "documents" as AppRouteId,
    href: "/app/documents",
    label: "Documents",
    icon: FileText,
  },
  {
    routeId: "annual-review" as AppRouteId,
    href: "/app/annual-review",
    label: "Annual Review",
    icon: SearchCheck,
  },
  {
    routeId: "exam-room" as AppRouteId,
    href: "/app/exam-room",
    label: "Exam Room",
    icon: ShieldAlert,
  },
  {
    routeId: "marketing-review" as AppRouteId,
    href: "/app/marketing-review",
    label: "Marketing Review",
    icon: Bot,
  },
  {
    routeId: "vendors" as AppRouteId,
    href: "/app/vendors",
    label: "Vendors",
    icon: ShieldAlert,
  },
  { routeId: "team" as AppRouteId, href: "/app/team", label: "Team", icon: Users },
  {
    routeId: "settings" as AppRouteId,
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function SidebarNav({ role }: { role: MembershipRole }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => canAccessRoute(role, item.routeId));

  return (
    <nav className="grid gap-2">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/app/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
              active
                ? "bg-[rgba(255,255,255,0.12)] text-white"
                : "text-[var(--panel-muted)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
