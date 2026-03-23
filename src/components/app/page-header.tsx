import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[32px] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,250,243,0.98),rgba(238,232,220,0.92))] px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <Badge variant="accent">{eyebrow}</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
