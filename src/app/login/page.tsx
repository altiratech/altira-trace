import { redirect } from "next/navigation";
import { LoginForm } from "@/components/app/login-form";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col justify-center gap-8 px-4 py-8 lg:px-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          RIA Launch & Compliance OS
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)]">
          Pilot workspace sign-in
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
          This is a seeded local prototype with clearly labeled placeholder firms,
          users, and evidence records. The goal is to prove workflow clarity and
          recurring first-year compliance value before any live pilot.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
