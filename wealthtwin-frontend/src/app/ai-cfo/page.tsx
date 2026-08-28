"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";
import { BrainCircuit, FileSearch, LockKeyhole, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

type AiResponse = {
  answer: string;
  question: string;
  evidence: Record<string, unknown>;
  privacy: string;
  modelProvider: string;
  model: string;
  mode: string;
};

const promptIdeas = [
  "Explain the largest verified change in working capital",
  "Which authorized metrics require attention?",
  "Summarize current financial data freshness"
];

export default function AiCfoPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-lg border border-line bg-white" />}>
      <AiCfoContent />
    </Suspense>
  );
}

function AiCfoContent() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const [question, setQuestion] = useState(searchParams.get("question") ?? "");
  const [answer, setAnswer] = useState<AiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim().length < 3) return;
    setSubmitting(true);
    setError(null);
    try {
      setAnswer(await apiFetch<AiResponse>("/ai/ask", {
        method: "POST",
        body: JSON.stringify({ question: question.trim(), pageContext: "ai-cfo" })
      }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to complete AI analysis.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="AI CFO" description="Ask questions against permission-filtered, tenant-scoped metrics. Answers remain bounded by available evidence.">
        <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-canvas" href="/settings">
          <LockKeyhole className="h-4 w-4" /> AI policy
        </Link>
      </PageHeader>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="overflow-hidden">
          <div className="bg-ink px-5 py-6 text-white sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-semibold text-white/55">AUTHORIZED ANALYSIS</p><h2 className="mt-1 text-xl font-semibold text-white">Ask about your financial position</h2></div>
              <Badge className="border-white/15 bg-white/10 text-white" status="info">{session?.membership.role ?? "Role scoped"}</Badge>
            </div>
          </div>
          <CardBody className="space-y-5">
            {answer ? (
              <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-teal-700">Evidence-bound response</p><Badge status={answer.mode === "live_llm" ? "healthy" : "info"}>{answer.mode.replaceAll("_", " ")}</Badge></div>
                <p className="mt-3 text-sm leading-7 text-ink">{answer.answer}</p>
              </div>
            ) : (
              <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-line bg-canvas p-6 text-center">
                <div><BrainCircuit className="mx-auto h-7 w-7 text-teal-700" /><p className="mt-3 font-semibold text-ink">No question asked yet</p><p className="mt-2 max-w-md text-sm leading-6 text-muted">Responses will use only metrics returned by the backend for your current permissions and data scope.</p></div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">{promptIdeas.map((prompt) => <Button key={prompt} onClick={() => setQuestion(prompt)} size="sm" variant="secondary">{prompt}</Button>)}</div>
            <form className="flex min-h-12 items-center gap-3 rounded-lg border border-line bg-white px-3 focus-within:border-teal-500" onSubmit={ask}>
              <BrainCircuit className="h-5 w-5 shrink-0 text-teal-600" />
              <label className="sr-only" htmlFor="ai-question">Ask AI CFO</label>
              <input className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted" id="ai-question" onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a finance question" type="text" value={question} />
              <Button aria-label="Send question" disabled={submitting || question.trim().length < 3} icon={<Send className="h-4 w-4" />} size="icon" type="submit" variant="primary" />
            </form>
            {error ? <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600" role="alert">{error}</p> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader eyebrow="Evidence drawer" title="Authorized Context" action={<ShieldCheck className="h-5 w-5 text-blue-600" />} />
          <CardBody className="space-y-3">
            {answer && Object.keys(answer.evidence).length ? Object.entries(answer.evidence).map(([key, value]) => <div className="flex gap-3 rounded-md border border-line p-3" key={key}><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><div><p className="text-xs font-semibold uppercase text-muted">{readable(key)}</p><p className="mt-1 text-sm font-semibold text-ink">{String(value)}</p></div></div>) : <p className="text-sm leading-6 text-muted">Evidence appears here only after the backend returns an authorized metric context.</p>}
            <div className="rounded-md border border-line bg-canvas p-3"><p className="text-xs font-semibold uppercase text-muted">Privacy boundary</p><p className="mt-2 text-sm leading-6 text-muted">{answer?.privacy ?? "Tenant, role, metric, and field filters are applied before model context is created."}</p></div>
          </CardBody>
        </Card>
      </section>
    </>
  );
}

function readable(value: string) { return value.replace(/([A-Z])/g, " $1").trim(); }
