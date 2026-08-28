"use client";

import { Bell, FileSearch } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyWorkspace, ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { IntelligenceResponse } from "@/lib/contracts";

export default function IntelligencePage() {
  const { data, error, loading, reload } = useApiQuery<IntelligenceResponse>("/intelligence");
  if (loading) return <LoadingWorkspace label="Loading intelligence signals" />;
  if (error) return <ErrorWorkspace message={error.message} onRetry={() => void reload()} />;
  if (!data) return null;
  return <><PageHeader title="Intelligence Center" description="Persisted risks and opportunities with source evidence, severity, and lifecycle state." status={{ label: data.dataHealth, tone: data.dataState === "ready" ? "healthy" : "info" }} />{!data.alerts.length ? <EmptyWorkspace icon={Bell} title="No intelligence signals are available" description="Signals appear only after approved metrics, thresholds, and detection rules evaluate imported tenant data." /> : <section className="grid gap-4 lg:grid-cols-3">{data.alerts.map((alert) => <Card key={alert.id}><CardHeader eyebrow={alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Open signal"} title={alert.title} action={<Badge status={alert.severity}>{alert.severity}</Badge>} /><CardBody><p className="text-sm leading-6 text-ink">{alert.description}</p><div className="mt-4 flex gap-2 rounded-md border border-line bg-canvas p-3"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p className="text-xs leading-5 text-muted">{Object.keys(alert.evidence).length ? `${Object.keys(alert.evidence).length} evidence fields attached` : "No evidence payload attached"}</p></div></CardBody></Card>)}</section>}</>;
}
