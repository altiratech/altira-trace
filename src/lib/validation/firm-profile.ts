import { AumBand, RegistrationType } from "@prisma/client";
import { z } from "zod";

export const firmProfileSchema = z.object({
  targetRegistrationType: z.nativeEnum(RegistrationType),
  principalOfficeState: z.string().length(2, "Use a two-letter state code."),
  aumBand: z.nativeEnum(AumBand),
  custodyProfile: z.string().min(3, "Select a custody profile."),
  serviceModel: z.string().min(3, "Describe the service model."),
  clientProfile: z.string().min(3, "Describe the client profile."),
  teamSize: z.coerce.number().int().min(1).max(200),
  usesTestimonials: z.boolean(),
  hasPrivateFunds: z.boolean(),
  jurisdictions: z.array(z.string()).min(1, "Add at least one jurisdiction."),
  keyVendors: z.array(z.string()),
  marketingFlags: z.array(z.string()),
  vendorFlags: z.array(z.string()),
  note: z.string().max(500).optional(),
});

export const governancePostureSchema = z.object({
  usesTestimonials: z.boolean(),
  hasPrivateFunds: z.boolean(),
  marketingFlags: z.array(z.string().min(1)).max(12),
  vendorFlags: z.array(z.string().min(1)).max(12),
  note: z.string().max(500).optional(),
});

export type FirmProfileInput = z.infer<typeof firmProfileSchema>;
export type GovernancePostureInput = z.infer<typeof governancePostureSchema>;
