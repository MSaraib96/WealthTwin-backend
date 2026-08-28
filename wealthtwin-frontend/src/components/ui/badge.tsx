import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Severity } from "@/lib/contracts";

const statusClasses: Record<Severity, string> = {
  healthy: "border-teal-100 bg-teal-50 text-teal-700",
  info: "border-blue-100 bg-blue-50 text-blue-600",
  warning: "border-amber-100 bg-amber-50 text-amber-600",
  critical: "border-red-100 bg-red-50 text-red-600"
};

export function Badge({
  children,
  status = "info",
  className
}: {
  children: ReactNode;
  status?: Severity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold",
        statusClasses[status],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: Severity }) {
  const color = {
    healthy: "bg-teal-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
    critical: "bg-red-500"
  }[status];

  return <span className={cn("h-2 w-2 rounded-full", color)} aria-hidden="true" />;
}
