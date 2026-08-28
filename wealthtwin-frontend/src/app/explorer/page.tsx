"use client";

import { Database, Search } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyWorkspace, ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ExplorerResponse } from "@/lib/contracts";

export default function ExplorerPage() {
  const { data, error, loading, reload } = useApiQuery<ExplorerResponse>("/explorer/sales-orders");
  if (loading) return <LoadingWorkspace label="Loading authorized records" />;
  if (error) return <ErrorWorkspace message={error.message} onRetry={() => void reload()} />;
  if (!data) return null;
  const rows = data.rows.map((row) => ({ order: row.order, customer: row.customer, amount: row.amount, status: row.status, date: row.orderDate ? new Date(row.orderDate).toLocaleDateString() : "Unavailable" }));

  return (
    <>
      <PageHeader title="Financial Explorer" description="Tenant-scoped records returned only after backend role and data-scope authorization." status={{ label: data.dataHealth, tone: data.dataState === "ready" ? "healthy" : "info" }} />
      {!rows.length ? <EmptyWorkspace icon={Database} title="No authorized sales orders" description="No imported sales-order records are available within your current tenant and data scope." /> : <div className="space-y-5"><label className="relative block"><span className="sr-only">Search records</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="h-11 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm text-ink" placeholder="Filter loaded records" type="search" /></label><DataTable columns={[{ key: "order", label: "Sales Order" }, { key: "customer", label: "Customer" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status", render: (value) => <Badge status="info">{String(value)}</Badge> }, { key: "date", label: "Order Date" }]} eyebrow="Permission-aware records" rows={rows} title="Sales Orders" /></div>}
    </>
  );
}
