"use client";

import { useState } from "react";
import { Calculator, CircleDashed, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

type ScenarioResponse = {
  scenario: string;
  assumptions: Record<string, number | string | boolean>;
  status: string;
  result: Record<string, unknown> | null;
  dataState: string;
  message: string;
};

export function ScenarioSimulator() {
  const [scenarioName, setScenarioName] = useState("Management scenario");
  const [collectionTiming, setCollectionTiming] = useState(0);
  const [hiringCount, setHiringCount] = useState(0);
  const [costMovement, setCostMovement] = useState(0);
  const [response, setResponse] = useState<ScenarioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function runScenario() {
    setRunning(true);
    setError(null);
    try {
      setResponse(await apiFetch<ScenarioResponse>("/scenarios/compare", {
        method: "POST",
        body: JSON.stringify({
          scenarioName,
          assumptions: { collectionPullInDays: collectionTiming, newHires: hiringCount, supplierCostMovementPercent: costMovement }
        })
      }));
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to calculate this scenario.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader eyebrow="Decision simulator" title="Assumptions" action={<Badge status="info">Backend calculated</Badge>} />
        <CardBody className="space-y-6">
          <label className="space-y-2"><span className="text-sm font-medium text-ink">Scenario name</span><input className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink" maxLength={120} onChange={(event) => setScenarioName(event.target.value)} value={scenarioName} /></label>
          <div className="grid gap-5 lg:grid-cols-3">
            <Range label="Collection pull-in" max={30} suffix=" days" value={collectionTiming} onChange={setCollectionTiming} />
            <Range label="New hires" max={50} value={hiringCount} onChange={setHiringCount} />
            <Range label="Cost movement" max={25} min={-25} suffix="%" value={costMovement} onChange={setCostMovement} />
          </div>
          <div className="rounded-lg border border-line bg-canvas p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><SlidersHorizontal className="h-4 w-4 text-teal-600" />Visible assumptions</p>
            <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3"><span>Collections: {collectionTiming} days</span><span>Hiring: {hiringCount} people</span><span>Cost: {costMovement}%</span></div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader eyebrow="Scenario result" title={response?.scenario ?? "Awaiting calculation"} action={<Calculator className="h-5 w-5 text-teal-600" />} />
        <CardBody className="flex min-h-80 flex-col">
          {response?.result ? <div className="space-y-3">{Object.entries(response.result).map(([key, value]) => <div className="flex items-center justify-between rounded-md border border-line px-3 py-3" key={key}><span className="text-sm text-muted">{key}</span><span className="text-sm font-semibold text-ink">{String(value)}</span></div>)}</div> : <div className="grid flex-1 place-items-center text-center"><div><CircleDashed className="mx-auto h-7 w-7 text-muted" /><p className="mt-3 font-semibold text-ink">No calculated result</p><p className="mt-2 text-sm leading-6 text-muted">{response?.message ?? "Run the scenario to validate that required financial inputs are available."}</p></div></div>}
          {error ? <p className="mb-3 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
          <Button className="mt-5 w-full" disabled={running || scenarioName.trim().length < 3} icon={<Calculator className="h-4 w-4" />} onClick={() => void runScenario()} variant="primary">{running ? "Calculating..." : "Run backend simulation"}</Button>
        </CardBody>
      </Card>
    </div>
  );
}

function Range({ label, value, onChange, min = 0, max, suffix = "" }: { label: string; value: number; onChange: (value: number) => void; min?: number; max: number; suffix?: string }) {
  return <label className="space-y-2"><span className="flex items-center justify-between gap-3 text-sm font-medium text-ink"><span>{label}</span><span>{value}{suffix}</span></span><input aria-label={label} className="w-full accent-teal-600" max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} type="range" value={value} /></label>;
}
