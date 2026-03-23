"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

const demoUsers = [
  {
    label: "Founder Admin [Placeholder]",
    email: "founder@placeholder-ria.local",
    role: "Founder admin",
  },
  {
    label: "CCO User [Placeholder]",
    email: "cco@placeholder-ria.local",
    role: "CCO",
  },
];

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: demoUsers[0].email,
      password: "LaunchReady123!",
    },
  });

  const onSubmit = (values: LoginInput) => {
    setServerError(null);

    startTransition(async () => {
      const result = await loginAction(values);

      if (result?.error) {
        setServerError(result.error);
        return;
      }

      router.push("/app/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden bg-[var(--panel)] text-[var(--panel-ink)]">
        <CardHeader className="space-y-4 border-b border-white/8">
          <CardTitle className="text-3xl">Launch into control</CardTitle>
          <CardDescription className="max-w-xl text-[var(--panel-muted)]">
            Sign into the pilot workspace to review the first-year readiness
            dashboard, evidence center, approval queue, and exam room baseline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
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
              {isPending ? "Signing in..." : "Enter pilot workspace"}
            </Button>
          </form>

          <div className="rounded-[28px] border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--panel-muted)]">
              Shared placeholder password
            </p>
            <p className="mt-2 text-lg font-medium">LaunchReady123!</p>
            <p className="mt-2 text-sm text-[var(--panel-muted)]">
              This app only seeds clearly labeled placeholder users and workflow
              records. No production-like client or firm data is included.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {demoUsers.map((user) => (
          <button
            key={user.email}
            className="rounded-[28px] border border-[color:var(--line)] bg-[var(--surface)] p-5 text-left shadow-[0_18px_48px_rgba(11,24,32,0.06)] transition-transform hover:-translate-y-0.5"
            onClick={() => {
              form.setValue("email", user.email);
              form.setValue("password", "LaunchReady123!");
            }}
            type="button"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
              Quick fill
            </p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--ink)]">
              {user.label}
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{user.role}</p>
            <p className="mt-4 text-sm font-medium text-[var(--accent-strong)]">
              {user.email}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
