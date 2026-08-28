import { AlertTriangle, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { Severity } from "@/lib/contracts";

const iconColor: Record<Severity, string> = {
  healthy: "text-teal-600",
  info: "text-blue-600",
  warning: "text-amber-600",
  critical: "text-red-600"
};

export function AttentionCard({
  severity,
  title,
  impact,
  explanation,
  nextStep,
  action
}: {
  severity: Severity;
  title: string;
  impact: string;
  explanation: string;
  nextStep: string;
  action: string;
}) {
  return (
    <Card className="h-full">
      <CardBody className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${iconColor[severity]}`} aria-hidden="true" />
            <h3 className="text-base font-semibold text-ink">{title}</h3>
          </div>
          <Badge status={severity}>{severity}</Badge>
        </div>
        <p className="text-sm font-medium leading-6 text-ink">{impact}</p>
        <p className="text-sm leading-6 text-muted">{explanation}</p>
        <div className="mt-auto rounded-md bg-canvas p-3">
          <p className="text-xs font-semibold uppercase text-muted">Recommended next step</p>
          <p className="mt-1 text-sm text-ink">{nextStep}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" icon={<Search className="h-4 w-4" />}>
            Investigate
          </Button>
          <Button size="sm" icon={<SlidersHorizontal className="h-4 w-4" />}>
            {action}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
