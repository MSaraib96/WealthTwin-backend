import { Activity, Info } from "lucide-react";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { FinancialHealth } from "@/lib/contracts";

export function FinancialHealthCard({ health }: { health: FinancialHealth }) {
  return (
    <Card className="h-full">
      <CardHeader
        eyebrow="Signature metric"
        title="Financial Health"
        action={health.delta ? <Badge status="healthy">{health.delta}</Badge> : null}
      />
      <CardBody>
        <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
          <div className="flex items-center gap-5">
            <div
              className="grid h-36 w-36 place-items-center rounded-full border-[12px] border-teal-100 bg-white"
              aria-label={`Financial Health score ${health.score} out of 100`}
            >
              <div className="text-center">
                <p className="text-4xl font-semibold text-ink">{health.score}</p>
                <p className="text-xs font-semibold uppercase text-muted">of 100</p>
              </div>
            </div>
            <Activity className="hidden h-10 w-10 text-teal-600 sm:block" aria-hidden="true" />
          </div>
          <div className="space-y-4">
            <p className="flex gap-2 text-sm leading-6 text-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              <span>{health.explanation}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {health.components.map((item) => (
                <div key={item.name} className="rounded-md border border-line p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <StatusDot status={item.status} />
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold text-ink">{item.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-canvas">
                    <div
                      className="h-2 rounded-full bg-teal-500"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
