import { redirect } from "next/navigation";
import { LoginForm } from "@/components/app/login-form";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col justify-center gap-8 px-4 py-6 lg:px-8 lg:py-10">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          RIA Launch & Compliance OS
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--ink)] lg:text-5xl">
          Sign into the pilot through the lane you want to test.
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--ink-soft)] lg:text-base">
          This seeded workspace is built to make the founder, CCO, operations, and
          supervised-person views feel intentionally different on first login, while
          staying inside clearly labeled placeholder data.
        </p>
      </section>
      <LoginForm />
    </main>
  );
}
