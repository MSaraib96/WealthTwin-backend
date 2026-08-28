import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  CircleGauge,
  DatabaseZap,
  FileCheck2,
  Fingerprint,
  Gauge,
  Layers3,
  LockKeyhole,
  Radar,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";

const decisionLoop = [
  { label: "Observe", text: "Unify approved operational and financial records.", icon: DatabaseZap },
  { label: "Explain", text: "Trace material changes to verified drivers and evidence.", icon: Radar },
  { label: "Forecast", text: "See trajectory, confidence, assumptions, and thresholds.", icon: BarChart3 },
  { label: "Decide", text: "Compare management choices before committing action.", icon: SlidersHorizontal }
];

const foundations = [
  { title: "Deterministic finance", text: "Metrics, forecasts, and scenarios are calculated by controlled backend engines. AI explains; it does not invent the numbers.", icon: CircleGauge, tone: "teal" },
  { title: "Permission-bound AI", text: "Model context inherits tenant, role, feature, metric, field, and data-scope restrictions from the requesting user.", icon: BrainCircuit, tone: "blue" },
  { title: "Evidence at every turn", text: "Signals stay connected to source freshness, approved mappings, calculation versions, and the records behind each conclusion.", icon: FileCheck2, tone: "amber" }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-ink">
      <section className="relative min-h-[88svh] overflow-hidden bg-ink text-white">
        <Image alt="Executive meeting room with a financial command center" className="object-cover object-[62%_center]" fill priority sizes="100vw" src="/images/wealthtwin-hero.png" />
        <div className="absolute inset-0 bg-ink/64" />
        <div className="absolute inset-y-0 left-0 hidden w-[66%] bg-ink/78 lg:block" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/" aria-label="WealthTwin home">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/10 text-white"><Gauge className="h-5 w-5" /></span>
            <span><span className="block text-lg font-semibold leading-5">WealthTwin</span><span className="block text-xs leading-5 text-white/60">Financial Digital Twin</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/72 md:flex" aria-label="Primary landing navigation">
            <a className="transition-colors hover:text-white" href="#platform">Platform</a>
            <a className="transition-colors hover:text-white" href="#method">How it works</a>
            <a className="transition-colors hover:text-white" href="#security">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="hidden h-10 items-center justify-center px-3 text-sm font-semibold text-white/80 hover:text-white sm:inline-flex" href="/register">Create organization</Link>
            <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-teal-50" href="/login">Sign In <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(88svh-80px)] max-w-7xl items-center px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-200"><Sparkles className="h-4 w-4" /> Financial decision intelligence</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">WealthTwin</h1>
            <p className="mt-5 max-w-2xl text-xl font-medium leading-8 text-white sm:text-2xl">Your business, understood as a living financial system.</p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">Connect fragmented business data, build an explainable Financial Digital Twin, and move from what happened to what management should evaluate next.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-teal-500 bg-teal-500 px-6 text-sm font-semibold text-white transition-colors hover:border-teal-600 hover:bg-teal-600" href="/login">Access WealthTwin <ArrowRight className="h-4 w-4" /></Link>
              <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10" href="/register">Create your organization</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/72">
              {["Backend-calculated metrics", "Tenant-isolated access", "Evidence-bound AI"].map((item) => <span className="flex items-center gap-2" key={item}><Check className="h-4 w-4 text-teal-300" />{item}</span>)}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-ink/68 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
            {["Financial Health", "13-week cash", "AI CFO", "Decision simulation"].map((item) => <div className="border-l border-white/10 px-3 py-3 text-center text-xs font-semibold text-white/65 first:border-l-0 sm:py-4" key={item}>{item}</div>)}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas" id="platform">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div><p className="text-xs font-semibold uppercase text-teal-700">One decision layer</p><h2 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">Signal, explanation, forecast, and action in one executive workspace.</h2></div>
            <p className="max-w-2xl text-base leading-8 text-muted lg:justify-self-end">WealthTwin normalizes approved source data into a canonical financial model. Every dashboard, alert, scenario, and AI response uses that governed source of truth.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">{foundations.map((item) => { const Icon = item.icon; const colors = { teal: "bg-teal-50 text-teal-700", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600" }[item.tone]; return <article className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6" key={item.title}><span className={`grid h-11 w-11 place-items-center rounded-md ${colors}`}><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-semibold text-ink">{item.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{item.text}</p></article>; })}</div>
        </div>
      </section>

      <section className="bg-white" id="method">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl"><p className="text-xs font-semibold uppercase text-blue-600">Continuous decision loop</p><h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">From source systems to an executive decision.</h2><p className="mt-4 text-base leading-8 text-muted">The interface stays quiet until evidence exists. Each stage exposes its status, assumptions, and approval boundary.</p></div>
          <div className="mt-10 grid gap-0 border-y border-line lg:grid-cols-4">{decisionLoop.map((item, index) => { const Icon = item.icon; return <article className="relative border-b border-line py-6 last:border-b-0 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0" key={item.label}><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white"><Icon className="h-5 w-5" /></span><span className="text-xs font-semibold text-muted">0{index + 1}</span></div><h3 className="mt-5 text-lg font-semibold text-ink">{item.label}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.text}</p></article>; })}</div>
        </div>
      </section>

      <section className="border-y border-line bg-blue-50" id="security">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-20">
          <div><span className="grid h-12 w-12 place-items-center rounded-lg bg-blue-600 text-white"><Fingerprint className="h-6 w-6" /></span><p className="mt-6 text-xs font-semibold uppercase text-blue-600">Security by architecture</p><h2 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">AI never receives more access than the user asking.</h2><p className="mt-4 max-w-xl text-base leading-8 text-muted">Authentication establishes identity. Backend authorization resolves tenant, role, feature, field, and data scope before any financial data or model context leaves the service layer.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SecurityPoint icon={LockKeyhole} title="Backend-owned sessions" text="HttpOnly session cookies and server-side revocation." />
            <SecurityPoint icon={ShieldCheck} title="Role-based access" text="Navigation and APIs resolve from effective permissions." />
            <SecurityPoint icon={Layers3} title="Tenant boundaries" text="Every persisted business record belongs to one organization." />
            <SecurityPoint icon={BrainCircuit} title="Filtered AI context" text="Only authorized aggregates are sent to configured models." />
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div><p className="text-xs font-semibold uppercase text-teal-200">Build your Financial Digital Twin</p><h2 className="mt-3 text-3xl font-semibold text-white">Start with your organization and your own data.</h2></div>
          <div className="flex flex-col gap-3 sm:flex-row"><Link className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10" href="/login">Sign In</Link><Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-500 px-5 text-sm font-semibold text-white hover:bg-teal-600" href="/register">Create Organization <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <footer className="border-t border-line bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div className="flex items-center gap-2 font-semibold text-ink"><Gauge className="h-4 w-4 text-teal-700" />WealthTwin</div><p>Financial intelligence with evidence, permissions, and control.</p></div></footer>
    </main>
  );
}

function SecurityPoint({ icon: Icon, title, text }: { icon: typeof LockKeyhole; title: string; text: string }) { return <article className="rounded-lg border border-blue-100 bg-white p-5"><Icon className="h-5 w-5 text-blue-600" /><h3 className="mt-4 font-semibold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></article>; }
