import Link from "next/link";
import { AlertTriangle, ArrowRight, DatabaseZap, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingWorkspace({ label = "Loading workspace" }: { label?: string }) {
  return (
    <div className="grid min-h-[420px] place-items-center" role="status">
      <div className="text-center">
        <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-line border-t-teal-600" />
        <p className="mt-4 text-sm font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

export function ErrorWorkspace({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-lg border border-red-100 bg-white p-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink">Unable to load this workspace</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
        {onRetry ? (
          <Button className="mt-5" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry} variant="secondary">
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyWorkspace({
  title,
  description,
  actionHref = "/integrations",
  actionLabel = "Connect a data source",
  icon: Icon = DatabaseZap,
  children
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white px-5 py-10 shadow-soft sm:px-8 lg:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-teal-100 bg-teal-50 text-teal-700">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">{description}</p>
        <Link
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-teal-600 bg-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:border-teal-700 hover:bg-teal-700"
          href={actionHref}
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {children ? <div className="mx-auto mt-8 max-w-4xl">{children}</div> : null}
    </div>
  );
}
