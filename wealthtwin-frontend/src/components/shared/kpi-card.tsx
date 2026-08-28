import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { Direction, Severity } from "@/lib/contracts";

const directionIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight
};

export function KpiCard({
  label,
  value,
  comparison,
  context,
  forecast,
  direction,
  status
}: {
  label: string;
  value: string;
  comparison: string;
  context: string;
  forecast?: string;
  direction: Direction;
  status: Severity;
}) {
  const Icon = directionIcon[direction];
  const directionColor =
    status === "critical"
      ? "text-red-600"
      : status === "warning"
        ? "text-amber-600"
        : status === "healthy"
          ? "text-teal-700"
          : "text-blue-600";

  return (
    <Card className="min-h-[188px]">
      <CardBody className="flex h-full flex-col justify-between gap-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-muted">{label}</p>
            <Icon className={cn("h-5 w-5", directionColor)} aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
          <p className={cn("mt-2 text-sm font-medium", directionColor)}>{comparison}</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm leading-5 text-muted">{context}</p>
          {forecast ? <Badge status={status}>{forecast}</Badge> : null}
        </div>
      </CardBody>
    </Card>
  );
}
