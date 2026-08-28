import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/contracts";

export function PageHeader({
  title,
  description,
  status,
  children
}: {
  title: string;
  description: string;
  status?: { label: string; tone?: Severity };
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {status ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge status={status.tone ?? "info"}>{status.label}</Badge>
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </header>
  );
}
