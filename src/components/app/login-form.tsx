"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDemoAccounts } from "@/lib/demo-accounts";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const demoAccounts = useMemo(() => getDemoAccounts(), []);
  const requestedDemoId = searchParams.get("demo");
  const requestedDemoAccount =
    demoAccounts.find((account) => account.id === requestedDemoId) ?? demoAccounts[0];
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: requestedDemoAccount.email,
      password: requestedDemoAccount.password,
    },
  });
  const selectedEmail = form.watch("email");
  const selectedAccount =
    demoAccounts.find((account) => account.email === selectedEmail) ?? requestedDemoAccount;

  useEffect(() => {
    if (!requestedDemoAccount) {
      return;
    }

    form.setValue("email", requestedDemoAccount.email);
    form.setValue("password", requestedDemoAccount.password);
  }, [form, requestedDemoAccount]);

  const onSubmit = (values: LoginInput) => {
    setServerError(null);

    startTransition(async () => {
      const result = await loginAction(values);

      if (result?.error) {
        setServerError(result.error);
        return;
      }

      router.push(result?.redirectTo ?? selectedAccount.initialHref);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[36px] border border-white/8 bg-[linear-gradient(155deg,rgba(17,37,50,0.98),rgba(28,56,74,0.95))] p-6 text-[var(--panel-ink)] shadow-[0_30px_80px_rgba(11,24,32,0.16)] lg:p-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--panel-muted)]">
              Launch into control
            </p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight lg:text-4xl">
              Enter the pilot through the role you want to pressure-test first.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[var(--panel-muted)]">
              The seeded accounts drop you into different operating views so you can feel the
              founder, CCO, operations, and supervised-person lanes without rebuilding the same
              story by hand.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/45"
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-[#f4b48d]">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/45"
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-[#f4b48d]">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            {serverError ? (
              <p className="rounded-2xl border border-[#f4b48d]/30 bg-[#f4b48d]/10 px-4 py-3 text-sm text-[#f4b48d]">
                {serverError}
              </p>
            ) : null}

            <Button className="mt-2" size="lg" type="submit" disabled={isPending}>
              {isPending ? "Signing in..." : `Enter as ${selectedAccount.roleLabel}`}
            </Button>
          </form>

          <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                Shared placeholder password
              </p>
              <p className="mt-2 text-lg font-medium">{selectedAccount.password}</p>
              <p className="mt-2 text-sm text-[var(--panel-muted)]">
                Placeholder-only seeded users. No production client, firm, or filing data lives in
                this workspace.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
                What opens first
              </p>
              <p className="mt-2 text-lg font-medium">{selectedAccount.initialLabel}</p>
              <p className="mt-2 text-sm text-[var(--panel-muted)]">
                {selectedAccount.preview}
              </p>
              <p className="mt-3 text-sm text-[var(--panel-muted)]">
                Current lane: {selectedAccount.laneTitle}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        {demoAccounts.map((account) => {
          const isSelected = account.email === selectedAccount.email;

          return (
          <button
            key={account.email}
            className={`rounded-[28px] border p-5 text-left shadow-[0_18px_48px_rgba(11,24,32,0.06)] transition-transform hover:-translate-y-0.5 ${
              isSelected
                ? "border-[color:var(--accent)] bg-[#fff6ea]"
                : "border-[color:var(--line)] bg-[var(--surface)]"
            }`}
            onClick={() => {
              form.setValue("email", account.email);
              form.setValue("password", account.password);
            }}
            type="button"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                {isSelected ? "Selected lane" : "Pilot lane"}
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                {account.roleLabel}
              </p>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-[var(--ink)]">
              {account.label}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{account.preview}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                First screen · {account.initialLabel}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                Lane · {account.laneTitle}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--accent-strong)]">
              {account.email}
            </p>
          </button>
        );
        })}
      </div>
    </div>
  );
}
