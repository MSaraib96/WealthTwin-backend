"use client";

import { HeartPulse, ListChecks } from "lucide-react";
import { FinancialHealthCard } from "@/components/shared/financial-health-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyWorkspace, ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { FinancialHealthResponse } from "@/lib/contracts";

export default function FinancialHealthPage() {
  const { data, error, loading, reload } = useApiQuery<FinancialHealthResponse>("/financial-health");
  if (loading) return <LoadingWorkspace label="Loading financial health" />;
  if (error) return <ErrorWorkspace message={error.message} onRetry={() => void reload()} />;
  if (!data) return null;

  return (
    <>
      <PageHeader title="Financial Health" description="Explainable financial health, P&L, variance, cost, and margin analysis from configured metric definitions." status={{ label: data.dataHealth, tone: data.dataState === "ready" ? "healthy" : "warning" }} />
      {!data.financialHealth && !data.profitAndLoss.length ? (
        <EmptyWorkspace icon={HeartPulse} title="Financial Health is not calculated yet" description="The score stays unavailable until revenue, cost, liquidity, and working-capital inputs have approved mappings and versioned metric definitions.">
          <div className="grid gap-3 sm:grid-cols-3">{data.requirements.map((item) => <div className="flex gap-3 rounded-md border border-line bg-canvas p-3 text-left" key={item}><ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" /><p className="text-sm leading-6 text-muted">{item}</p></div>)}</div>
        </EmptyWorkspace>
      ) : (
        <div className="space-y-5">
          {data.financialHealth ? <FinancialHealthCard health={data.financialHealth} /> : null}
          <section className="grid gap-5 lg:grid-cols-2">
            <Card><CardHeader eyebrow="Approved calculations" title="Profit and Loss" /><CardBody><p className="text-sm text-muted">{data.profitAndLoss.length} calculated line items available.</p></CardBody></Card>
            <Card><CardHeader eyebrow="Verified movement" title="Margin Drivers" /><CardBody><p className="text-sm text-muted">{data.marginDrivers.length} traceable drivers available.</p></CardBody></Card>
          </section>
        </div>
      )}
    </>
  );
}
