"use client";

import { Landmark, ReceiptText } from "lucide-react";
import { CashForecastChart } from "@/components/charts/trend-chart";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyWorkspace, ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { CashResponse } from "@/lib/contracts";

export default function CashPage() {
  const { data, error, loading, reload } = useApiQuery<CashResponse>("/cash/forecast");
  if (loading) return <LoadingWorkspace label="Loading cash workspace" />;
  if (error) return <ErrorWorkspace message={error.message} onRetry={() => void reload()} />;
  if (!data) return null;

  const hasCashModel = Boolean(data.currentCash || data.forecast.length);
  const rows = data.receivables.map((item) => ({
    invoice: item.invoice,
    customer: item.customer,
    amount: item.amount,
    overdue: item.daysOverdue === null ? "Due date unavailable" : `${item.daysOverdue} days`,
    status: item.status
  }));
  const bankRows = data.bankAccounts.map((account) => ({
    institution: account.institutionName,
    account: account.accountNumberLast4
      ? `${account.accountName} ending ${account.accountNumberLast4}`
      : account.accountName,
    balance: account.balance ?? "Not provided",
    activity: account.lastTransactionAt
      ? new Date(account.lastTransactionAt).toLocaleDateString()
      : "No dated transactions"
  }));

  return (
    <>
      <PageHeader title="Cash and Working Capital" description="Liquidity, receivables, payables, and forecasts calculated from approved tenant data." status={{ label: data.dataHealth, tone: data.dataState === "ready" ? "healthy" : "warning" }} />
      {!hasCashModel && !rows.length ? (
        <EmptyWorkspace icon={Landmark} title="Cash intelligence needs a financial source" description="Connect a bank, accounting, or approved cash-balance source. WealthTwin will not estimate liquidity or forecast values without mapped evidence.">
          <Requirements items={data.requirements} />
        </EmptyWorkspace>
      ) : (
        <div className="space-y-5">
          {hasCashModel ? (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                {[
                  ["Current cash", data.currentCash],
                  ["Available cash", data.availableCash],
                  ["Minimum projected cash", data.minimumProjectedCash]
                ].map(([label, value]) => <Card key={label}><CardBody><p className="text-sm text-muted">{label}</p><p className="mt-3 text-3xl font-semibold text-ink">{value ?? "Not available"}</p></CardBody></Card>)}
              </section>
              {data.forecast.length ? <CashForecastChart data={data.forecast} /> : null}
            </>
          ) : null}
          {rows.length ? <DataTable columns={[{ key: "invoice", label: "Invoice" }, { key: "customer", label: "Customer" }, { key: "amount", label: "Outstanding" }, { key: "overdue", label: "Aging" }, { key: "status", label: "Status", render: (value) => <Badge status="info">{String(value)}</Badge> }]} eyebrow="Imported accounts receivable" rows={rows} title="Open Receivables" /> : null}
          {bankRows.length ? <DataTable columns={[{ key: "institution", label: "Institution" }, { key: "account", label: "Account" }, { key: "balance", label: "Statement balance" }, { key: "activity", label: "Last activity" }]} eyebrow="Imported bank statements" rows={bankRows} title="Bank Accounts" /> : null}
        </div>
      )}
    </>
  );
}

function Requirements({ items }: { items: string[] }) {
  return <div className="grid gap-3 sm:grid-cols-3">{items.map((item) => <div className="flex gap-3 rounded-md border border-line bg-canvas p-3 text-left" key={item}><ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p className="text-sm leading-6 text-muted">{item}</p></div>)}</div>;
}
