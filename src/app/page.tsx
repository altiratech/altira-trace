import Link from "next/link";
import { ArrowRight, ShieldAlert, Sparkles, Workflow } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";

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

  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-12 px-4 py-6 lg:px-8">
      <section className="rounded-[40px] border border-[color:var(--line)] bg-[linear-gradient(145deg,rgba(17,37,50,0.98),rgba(25,51,67,0.96))] px-6 py-8 text-[var(--panel-ink)] lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--panel-muted)]">
              Pilot Foundation
            </p>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight lg:text-6xl">
                From regulatory fog to operating clarity.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--panel-muted)] lg:text-lg">
                A launch-native compliance operating system for newly launched RIAs.
                The app turns first-year obligations, evidence, approvals, and exam
                posture into one visible control tower.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-strong)]"
                href="/login"
              >
                Open pilot workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <div className="rounded-full border border-white/10 px-5 py-3 text-sm text-[var(--panel-muted)]">
                Placeholder data only. No real client or firm records included.
              </div>
            </div>
          </div>

          <Card className="border-white/8 bg-white/5 text-[var(--panel-ink)] shadow-none">
            <CardHeader>
              <CardTitle>What the pilot proves</CardTitle>
              <CardDescription className="text-[var(--panel-muted)]">
                This implementation is designed to prove recurring operating value, not
                just a pre-launch checklist.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                  Core path
                </p>
                <p className="mt-2 text-lg font-medium">
                  Intake → obligations → evidence → review → exam posture
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                  ICP
                </p>
                <p className="mt-2 text-lg font-medium">
                  Newly launched RIAs in the first 12 months of operation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;

          return (
            <Card key={pillar.title}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-[var(--accent-strong)]">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{pillar.title}</CardTitle>
                <CardDescription>{pillar.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
