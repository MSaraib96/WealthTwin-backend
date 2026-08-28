"use client";

import Link from "next/link";
import { ArrowRight, DatabaseZap, History, LayoutGrid, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ControlCenterResponse } from "@/lib/contracts";

export default function ControlCenterPage() {
  const { data, error, loading, reload } = useApiQuery<ControlCenterResponse>("/control-center/overview");
  if (loading) return <LoadingWorkspace label="Loading control center" />;
  if (error) return <ErrorWorkspace message={error.message} onRetry={() => void reload()} />;
  if (!data) return null;
  return (
    <>
      <PageHeader title="Control Center" description="Govern data sources, financial definitions, dashboards, permissions, and auditable configuration." status={{ label: data.dataHealth, tone: data.dataState === "ready" ? "healthy" : "warning" }}>
        <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-teal-600 bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700" href="/control-center/users">Manage access <ArrowRight className="h-4 w-4" /></Link>
      </PageHeader>
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{data.overview.map((item) => <Card className="min-h-32" key={item.label}><CardBody><Badge status={item.status}>{item.label}</Badge><p className="mt-4 text-3xl font-semibold text-ink">{item.value}</p></CardBody></Card>)}</section>
      <section className="grid gap-5 xl:grid-cols-3">
        <ControlModule icon={DatabaseZap} title="Data Sources" description="Provider connections, sync health, ingestion status, and source-level freshness." href="/integrations" />
        <ControlModule icon={SlidersHorizontal} title="Metric Definitions" description={`${data.metricCount} persisted definitions. Calculations remain unavailable until approved definitions exist.`} />
        <ControlModule icon={LayoutGrid} title="Dashboard Configuration" description="Versioned layouts and widget visibility belong here once dashboard configuration endpoints are enabled." />
        <ControlModule icon={ShieldCheck} title="Access Management" description="Members, roles, feature permissions, and assigned data scopes." href="/control-center/users" />
        <Card className="xl:col-span-2"><CardHeader eyebrow="Configuration history" title="Persisted Audit Events" action={<History className="h-5 w-5 text-blue-600" />} /><CardBody className="grid gap-3 sm:grid-cols-2">{data.auditEvents.length ? data.auditEvents.map((event) => <div className="rounded-md border border-line p-3" key={event.id}><p className="text-xs font-semibold uppercase text-muted">{event.createdAt ? new Date(event.createdAt).toLocaleString() : "Timestamp unavailable"}</p><p className="mt-2 text-sm font-semibold text-ink">{event.eventType.replaceAll("_", " ")}</p></div>) : <p className="text-sm leading-6 text-muted">No persisted audit events are available for this organization.</p>}</CardBody></Card>
      </section>
    </>
  );
}

function ControlModule({ icon: Icon, title, description, href }: { icon: typeof DatabaseZap; title: string; description: string; href?: string }) { const content = <Card className="h-full transition-colors hover:border-teal-100"><CardHeader eyebrow="Organization control" title={title} action={<Icon className="h-5 w-5 text-teal-700" />} /><CardBody><p className="text-sm leading-6 text-muted">{description}</p>{href ? <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-teal-700">Open workspace <ArrowRight className="h-4 w-4" /></p> : <Badge className="mt-4" status="info">Configuration API required</Badge>}</CardBody></Card>; return href ? <Link href={href}>{content}</Link> : content; }
