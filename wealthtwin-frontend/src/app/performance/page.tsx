"use client";

import { ChartNoAxesCombined } from "lucide-react";
import { CategoryBarChart, TrendChart } from "@/components/charts/trend-chart";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyWorkspace, ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { PerformanceResponse } from "@/lib/contracts";

export default function PerformancePage() {
  const { data, error, loading, reload } = useApiQuery<PerformanceResponse>("/performance");
  if (loading) return <LoadingWorkspace label="Loading performance workspace" />;
  if (error) return <ErrorWorkspace message={error.message} onRetry={() => void reload()} />;
  if (!data) return null;
  const hasPerformance = data.trajectory.length || data.customerConcentration.length || data.regionalPerformance.length;

  return (
    <>
      <PageHeader title="Performance and Forecast" description="Revenue trajectory, customer concentration, and regional performance derived from imported sales records." status={{ label: data.dataHealth, tone: data.dataState === "ready" ? "healthy" : "warning" }} />
      {!hasPerformance ? <EmptyWorkspace icon={ChartNoAxesCombined} title="Performance data has not been imported" description="Connect and map sales orders, customers, dates, and dimensions before this workspace renders performance or concentration analysis." /> : (
        <div className="space-y-5">
          {data.trajectory.length ? <TrendChart data={data.trajectory} eyebrow="Imported orders" title="Sales Order Trajectory" /> : null}
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
            {data.regionalPerformance.length ? <CategoryBarChart data={data.regionalPerformance} dataKey="revenue" eyebrow="Tenant dimensions" title="Order Value by Region" xKey="region" /> : <Unavailable title="Regional performance" />}
            <Card><CardHeader eyebrow="Customer concentration" title="Share of Imported Order Value" /><CardBody className="space-y-4">{data.customerConcentration.length ? data.customerConcentration.map((customer) => <div key={customer.name}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-ink">{customer.name}</span><Badge status={customer.value >= 30 ? "warning" : "info"}>{customer.value}%</Badge></div><div className="h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(customer.value, 100)}%` }} /></div></div>) : <p className="text-sm text-muted">Customer relationships are not mapped.</p>}</CardBody></Card>
          </section>
        </div>
      )}
    </>
  );
}

function Unavailable({ title }: { title: string }) { return <Card><CardBody className="grid min-h-72 place-items-center text-center"><div><p className="font-semibold text-ink">{title} unavailable</p><p className="mt-2 text-sm text-muted">Map the required dimension to populate this view.</p></div></CardBody></Card>; }
