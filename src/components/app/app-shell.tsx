import {
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { WorkspaceOrientation } from "@/components/app/workspace-orientation";
import { getViewerContext } from "@/lib/data/workspace";
import { getRoleFocus } from "@/lib/permissions";
import { titleCase } from "@/lib/utils";

export async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization, user, membership } = await getViewerContext();
  const roleFocus = getRoleFocus(membership.role);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="w-full rounded-[32px] border border-[color:var(--line-strong)] bg-[var(--panel)] p-5 text-[var(--panel-ink)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[310px]">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="accent">Pilot Foundation</Badge>
              <div>
                <img
                  src="/brand/altira-wordmark-dark.png"
                  alt="Altira"
                  className="w-[114px] max-w-full h-auto"
                />
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--panel-muted)]">
                  Trace
                </p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight">
                  {organization.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--panel-muted)]">
                  First-year readiness, evidence, and approvals for a newly launched
                  examination-ready RIA.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                Active role
              </p>
              <p className="mt-2 text-lg font-medium">{titleCase(membership.role)}</p>
              <p className="mt-1 text-sm text-[var(--panel-muted)]">{user.email}</p>
            </div>

            <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                Current lane
              </p>
              <p className="mt-2 text-base font-medium">{roleFocus.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--panel-muted)]">
                {roleFocus.summary}
              </p>
            </div>

            <SidebarNav role={membership.role} />

            <WorkspaceOrientation role={membership.role} />

            <form action={logoutAction}>
              <Button
                className="w-full justify-between bg-white/8 text-white hover:bg-white/14"
                variant="ghost"
                type="submit"
              >
                Sign out
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </aside>

        <main className="flex-1 rounded-[36px] border border-[color:var(--line)] bg-[rgba(255,250,243,0.9)] p-4 shadow-[0_30px_80px_rgba(11,24,32,0.08)] backdrop-blur lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
