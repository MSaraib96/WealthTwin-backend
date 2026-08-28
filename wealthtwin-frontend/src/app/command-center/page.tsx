"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  CircleDashed,
  DatabaseZap,
  FileCheck2,
  Gauge,
  Link2,
  LockKeyhole,
  Radar,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { TrendChart } from "@/components/charts/trend-chart";
import { AiBrief } from "@/components/shared/ai-brief";
import { FinancialHealthCard } from "@/components/shared/financial-health-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { CommandCenterResponse, Severity } from "@/lib/contracts";

export default function CommandCenterPage() {
  const { session } = useAuth();
  const { data, error, loading, reload } = useApiQuery<CommandCenterResponse>("/dashboard/command-center");

  if (loading) return <LoadingWorkspace label="Building your command center" />;
  if (error) return <ErrorWorkspace message={error.message} onRetry={() => void reload()} />;
  if (!data || !session) return null;

  const firstName = session.user.firstName;
  const statusTone: Severity = data.dataState === "ready" ? "healthy" : data.dataState === "partial" ? "warning" : "info";

  return (
    <>
      <PageHeader
        title={`Good ${dayPart()}, ${firstName}.`}
        description="Your Financial Digital Twin surfaces only traceable metrics calculated from approved, tenant-scoped data."
        status={{ label: data.dataHealth, tone: statusTone }}
      >
        <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-teal-50" href="/settings/profile">
          <LockKeyhole className="h-4 w-4 text-teal-700" /> {session.membership.role}
        </Link>
        {session.permissions.includes("feature.ai_cfo.use") ? (
          <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-teal-600 bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700" href="/ai-cfo">
            Ask AI CFO <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </PageHeader>

      {data.dataState === "empty" ? <CommandCenterSetup data={data} /> : <LiveCommandCenter data={data} />}
    </>
  );
}

function CommandCenterSetup({ data }: { data: CommandCenterResponse }) {
  const steps = [
    { label: "Connect a source", detail: "CRM, accounting, ERP, or an approved file", done: data.onboarding.sourceConnected, icon: Link2 },
    { label: "Approve mappings", detail: "Validate how source fields enter the canonical model", done: data.onboarding.recordsImported, icon: FileCheck2 },
    { label: "Configure metrics", detail: "Define calculations, visibility, and thresholds", done: data.onboarding.metricsConfigured, icon: SlidersHorizontal }
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-lg bg-ink px-5 py-7 text-white shadow-soft sm:px-7 lg:px-9 lg:py-9">
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(440px,0.9fr)] xl:items-center">
          <div className="max-w-2xl">
            <Badge className="border-white/15 bg-white/10 text-white" status="info">Workspace ready</Badge>
            <h2 className="mt-5 text-2xl font-semibold leading-tight text-white sm:text-3xl">Build the financial view from your own systems.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">No sample company, placeholder balances, or generated KPIs are shown. WealthTwin will populate this command center only after your data is connected, mapped, and approved.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-500 px-5 text-sm font-semibold text-white hover:bg-teal-600" href="/integrations">
                <DatabaseZap className="h-4 w-4" /> Connect first source
              </Link>
              <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10" href="/control-center">
                Open Control Center <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="flex min-h-24 items-center gap-4 rounded-lg border border-white/12 bg-white/[0.06] p-4" key={step.label}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white/10 text-teal-200">
                    {step.done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/50">0{index + 1}</p>
                    <p className="mt-1 font-semibold text-white">{step.label}</p>
                    <p className="mt-1 text-xs leading-5 text-white/60">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4 sm:grid-cols-3">
          <Capability icon={Gauge} title="Deterministic metrics" text="Financial values are calculated by backend metric definitions, never improvised by the interface or LLM." tone="teal" />
          <Capability icon={Radar} title="Evidence-first signals" text="Alerts stay linked to source records, calculation versions, and the data freshness behind them." tone="blue" />
          <Capability icon={BrainCircuit} title="Bounded AI reasoning" text="AI receives only the aggregates allowed by your tenant, role, field policy, and data scope." tone="plum" />
        </div>
        <Card className="h-full">
          <CardHeader eyebrow="Data integrity" title="What happens next" action={<Sparkles className="h-5 w-5 text-amber-500" />} />
          <CardBody className="space-y-4">
            {[
              "Connection credentials stay on the backend.",
              "Mappings require explicit approval before ingestion.",
              "Dashboards remain empty when source evidence is absent.",
              "Every protected request is resolved against your role."
            ].map((item) => (
              <div className="flex gap-3" key={item}>
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-teal-50 text-teal-700"><Check className="h-3 w-3" /></span>
                <p className="text-sm leading-6 text-muted">{item}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function LiveCommandCenter({ data }: { data: CommandCenterResponse }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi, index) => (
          <Card className="min-h-44 overflow-hidden" key={kpi.id}>
            <div className={`h-1 ${["bg-teal-500", "bg-blue-500", "bg-amber-500", "bg-plum-500"][index % 4]}`} />
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted">{kpi.label}</p>
                {kpi.available ? <Badge status="healthy">Live</Badge> : <Badge status="info">Awaiting data</Badge>}
              </div>
              <p className="mt-4 text-3xl font-semibold text-ink">{kpi.value ?? "Not available"}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{kpi.context}</p>
            </CardBody>
          </Card>
        ))}
      </section>

      {data.financialHealth || data.aiBrief ? (
        <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_520px]">
          {data.financialHealth ? <FinancialHealthCard health={data.financialHealth} /> : <UnavailablePanel title="Financial Health" />}
          {data.aiBrief ? <AiBrief brief={data.aiBrief} /> : <UnavailablePanel title="Executive Brief" />}
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        {data.trajectory.length ? <TrendChart data={data.trajectory} eyebrow="Imported sales orders" title="Business Trajectory" /> : <UnavailablePanel title="Business Trajectory" />}
        <Card>
          <CardHeader eyebrow="Attention required" title={`${data.attention.length} open signals`} />
          <CardBody className="space-y-3">
            {data.attention.length ? data.attention.map((alert) => (
              <div className="rounded-md border border-line p-3" key={alert.id}>
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-ink">{alert.title}</p><Badge status={alert.severity}>{alert.severity}</Badge></div>
                <p className="mt-2 text-sm leading-6 text-muted">{alert.description}</p>
              </div>
            )) : <p className="flex gap-2 text-sm leading-6 text-muted"><CircleDashed className="mt-0.5 h-4 w-4 shrink-0" />No persisted alerts are available for this tenant.</p>}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function Capability({ icon: Icon, title, text, tone }: { icon: typeof Gauge; title: string; text: string; tone: "teal" | "blue" | "plum" }) {
  const styles = { teal: "bg-teal-50 text-teal-700", blue: "bg-blue-50 text-blue-600", plum: "bg-plum-50 text-plum-600" };
  return <Card className="h-full"><CardBody><span className={`grid h-11 w-11 place-items-center rounded-md ${styles[tone]}`}><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-base font-semibold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></CardBody></Card>;
}

function UnavailablePanel({ title }: { title: string }) {
  return <Card className="h-full"><CardBody className="grid min-h-64 place-items-center text-center"><div><CircleDashed className="mx-auto h-6 w-6 text-muted" /><p className="mt-3 font-semibold text-ink">{title} is not calculated yet</p><p className="mt-2 max-w-sm text-sm leading-6 text-muted">Complete the required mappings and metric definitions to populate this section.</p></div></CardBody></Card>;
}

function dayPart() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
