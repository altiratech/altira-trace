"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AumBand, RegistrationType, type FirmProfile } from "@prisma/client";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { upsertFirmProfileAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  firmProfileSchema,
  type FirmProfileInput,
} from "@/lib/validation/firm-profile";

function parseList(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.join(", ");
}

export function FirmProfileForm({
  profile,
}: {
  profile: FirmProfile | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<FirmProfileInput>({
    resolver: zodResolver(firmProfileSchema) as never,
    defaultValues: {
      targetRegistrationType:
        profile?.targetRegistrationType ?? RegistrationType.STATE,
      principalOfficeState: profile?.principalOfficeState ?? "NY",
      aumBand: profile?.aumBand ?? AumBand.UNDER_25M,
      custodyProfile: profile?.custodyProfile ?? "No custody",
      serviceModel:
        profile?.serviceModel ?? "Fee-only planning and portfolio oversight",
      clientProfile:
        profile?.clientProfile ??
        "Founders, executives, and multi-generational households",
      teamSize: profile?.teamSize ?? 4,
      usesTestimonials: profile?.usesTestimonials ?? true,
      hasPrivateFunds: profile?.hasPrivateFunds ?? false,
      jurisdictions: Array.isArray(profile?.jurisdictions)
        ? (profile?.jurisdictions as string[])
        : ["NY", "NJ", "CT"],
      keyVendors: Array.isArray(profile?.keyVendors)
        ? (profile?.keyVendors as string[])
        : ["Custodian platform [Placeholder]", "CRM vendor [Placeholder]"],
      marketingFlags: Array.isArray(profile?.marketingFlags)
        ? (profile?.marketingFlags as string[])
        : ["Testimonials in use", "Social distribution workflow"],
      vendorFlags: Array.isArray(profile?.vendorFlags)
        ? (profile?.vendorFlags as string[])
        : ["Service-provider diligence pending"],
      note:
        profile?.note ??
        "Placeholder pilot data only. Replace with real firm inputs before any true pilot work.",
    },
  });

  const onSubmit: SubmitHandler<FirmProfileInput> = (values) => {
    setServerError(null);

    startTransition(async () => {
      const result = await upsertFirmProfileAction(values);

      if (result?.error) {
        setServerError(result.error);
        return;
      }

      router.push("/app/launch");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firm profile intake</CardTitle>
        <CardDescription>
          These inputs drive registration guidance, launch milestones, obligation
          generation, ownership, and dashboard risk visibility.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Registration path
              <select
                className="h-11 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 text-sm"
                {...form.register("targetRegistrationType")}
              >
                {Object.values(RegistrationType).map((value) => (
                  <option key={value} value={value}>
                    {value.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              Principal office state
              <Input maxLength={2} {...form.register("principalOfficeState")} />
            </label>

            <label className="grid gap-2 text-sm">
              AUM band
              <select
                className="h-11 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 text-sm"
                {...form.register("aumBand")}
              >
                {Object.values(AumBand).map((value) => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              Custody profile
              <Input {...form.register("custodyProfile")} />
            </label>

            <label className="grid gap-2 text-sm lg:col-span-2">
              Service model
              <Input {...form.register("serviceModel")} />
            </label>

            <label className="grid gap-2 text-sm lg:col-span-2">
              Client profile
              <Input {...form.register("clientProfile")} />
            </label>

            <label className="grid gap-2 text-sm">
              Team size
              <Input type="number" min={1} {...form.register("teamSize")} />
            </label>

            <label className="grid gap-2 text-sm">
              Jurisdictions
              <Input
                defaultValue={parseList(form.getValues("jurisdictions"))}
                onChange={(event) =>
                  form.setValue(
                    "jurisdictions",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>

            <label className="grid gap-2 text-sm lg:col-span-2">
              Key vendors
              <Input
                defaultValue={parseList(form.getValues("keyVendors"))}
                onChange={(event) =>
                  form.setValue(
                    "keyVendors",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>

            <label className="grid gap-2 text-sm">
              Marketing flags
              <Input
                defaultValue={parseList(form.getValues("marketingFlags"))}
                onChange={(event) =>
                  form.setValue(
                    "marketingFlags",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>

            <label className="grid gap-2 text-sm">
              Vendor flags
              <Input
                defaultValue={parseList(form.getValues("vendorFlags"))}
                onChange={(event) =>
                  form.setValue(
                    "vendorFlags",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm">
              <input type="checkbox" {...form.register("usesTestimonials")} />
              Uses testimonials or endorsements
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm">
              <input type="checkbox" {...form.register("hasPrivateFunds")} />
              Has private fund complexity
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            Notes and boundary reminders
            <Textarea {...form.register("note")} />
          </label>

          {serverError ? (
            <p className="rounded-2xl border border-[#d59d76]/40 bg-[#fff1e2] px-4 py-3 text-sm text-[#a5531f]">
              {serverError}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button size="lg" type="submit" disabled={isPending}>
              {isPending ? "Regenerating workflow..." : "Save profile and regenerate"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
