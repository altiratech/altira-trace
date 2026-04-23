import Link from "next/link";
import { ArrowRight, Compass, ShieldAlert, Sparkles, Workflow } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDemoAccounts } from "@/lib/demo-accounts";

const pillars = [
  {
    title: "First-year readiness",
    description:
      "Turn the first 12 months after launch into a visible, owned operating plan instead of a pile of manual reminders.",
    icon: Workflow,
  },
  {
    title: "Evidence-first design",
    description:
      "Every obligation is connected to proof, approvals, and activity history so exam prep accumulates in the background.",
    icon: ShieldAlert,
  },
  {
    title: "Reviewable AI guidance",
    description:
      "AI explains and drafts in context, but nothing is treated as final until a human reviewer signs off.",
    icon: Sparkles,
  },
];

export default async function Home() {
  const session = await getSession();
  const demoAccounts = getDemoAccounts();

  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col">
      <section className="w-full border-b border-[color:var(--line)] bg-[linear-gradient(155deg,rgba(17,37,50,0.99),rgba(25,51,67,0.97))] text-[var(--panel-ink)]">
        <div className="mx-auto grid w-full max-w-[1500px] gap-12 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--panel-muted)]">
                Pilot Foundation
              </p>
              <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--panel-muted)]">
                Placeholder data only
              </div>
            </div>
            <div className="space-y-5">
              <h1 className="max-w-5xl text-4xl font-semibold leading-tight lg:text-6xl">
                Build an RIA with the same operating clarity you want on exam day.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--panel-muted)] lg:text-lg">
                A launch-native operating system for newly formed RIAs. The pilot turns entity
                setup, filing prep, evidence, approvals, and first-year readiness into one guided
                control tower.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-strong)]"
                href="/login?demo=founder-admin"
              >
                Enter founder preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-medium text-[var(--panel-ink)] transition-colors hover:bg-white/6"
                href="#pilot-lanes"
              >
                See pilot lanes
              </Link>
            </div>
            <div className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                  Core path
                </p>
                <p className="mt-2 text-lg font-medium">
                  Intake to launch packet to review
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                  Buyer story
                </p>
                <p className="mt-2 text-lg font-medium">
                  ZenBusiness for RIAs meets compliance OS
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                  Human boundary
                </p>
                <p className="mt-2 text-lg font-medium">
                  Reviewable guidance, not silent filing automation
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-5">
            <div className="border-l border-white/10 pl-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                Signed-out orientation
              </p>
              <p className="mt-3 text-2xl font-medium">
                The first login should answer one question fast: what should this role do next?
              </p>
            </div>
            <div className="grid gap-3">
              {demoAccounts.slice(0, 3).map((account) => (
                <Link
                  key={account.id}
                  href={`/login?demo=${account.id}`}
                  className="border-t border-white/10 py-4 transition-colors hover:text-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-medium">{account.roleLabel}</p>
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                      {account.initialLabel}
                    </span>
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--panel-muted)]">
                    {account.preview}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="pilot-lanes"
        className="mx-auto w-full max-w-[1500px] px-4 py-10 lg:px-8 lg:py-14"
      >
        <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
              Pilot lanes
            </p>
            <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">
              Walk the product through the role that owns the work.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[var(--ink-soft)] lg:text-base">
              Each seeded role starts from a different operating surface so the app feels less
              like a generic admin demo and more like a real launch-to-readiness system.
            </p>
          </div>
          <div className="grid gap-3">
            {demoAccounts.map((account) => (
              <Link
                key={account.id}
                href={`/login?demo=${account.id}`}
                className="rounded-[28px] border border-[color:var(--line)] bg-[var(--surface)] p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                      {account.roleLabel}
                    </p>
                    <h3 className="text-xl font-semibold text-[var(--ink)]">{account.label}</h3>
                    <p className="max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
                      {account.preview}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                      {account.initialLabel}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                      {account.laneTitle}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 pb-14 lg:grid-cols-3 lg:px-8">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;

          return (
            <div
              key={pillar.title}
              className="rounded-[28px] border border-[color:var(--line)] bg-[var(--surface)] p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-[var(--accent-strong)]">
                  <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
