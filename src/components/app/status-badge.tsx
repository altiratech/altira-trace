import {
  AiReviewStatus,
  ApprovalStatus,
  DiligenceStatus,
  MarketingReviewStatus,
  RiskLevel,
  WorkStatus,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

type Value =
  | WorkStatus
  | ApprovalStatus
  | AiReviewStatus
  | MarketingReviewStatus
  | DiligenceStatus
  | RiskLevel
  | string;

export function StatusBadge({ value }: { value: Value }) {
  const normalized = String(value);

  let variant: React.ComponentProps<typeof Badge>["variant"] = "default";

  if (
    normalized.includes("COMPLETE") ||
    normalized.includes("APPROVED") ||
    normalized.includes("REVIEWED")
  ) {
    variant = "success";
  } else if (
    normalized.includes("BLOCKED") ||
    normalized.includes("CRITICAL") ||
    normalized.includes("NEEDS_CHANGES") ||
    normalized.includes("ATTENTION_REQUIRED")
  ) {
    variant = "danger";
  } else if (
    normalized.includes("IN_PROGRESS") ||
    normalized.includes("PENDING") ||
    normalized.includes("NEEDS_REVIEW") ||
    normalized.includes("HIGH") ||
    normalized.startsWith("READY")
  ) {
    variant = "warning";
  } else if (
    normalized.includes("DRAFT") ||
    normalized.includes("SUBMITTED") ||
    normalized === "OPEN" ||
    normalized === "NOT_STARTED"
  ) {
    variant = "accent";
  }

  return <Badge variant={variant}>{titleCase(normalized)}</Badge>;
}
