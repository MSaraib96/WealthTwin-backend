import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-line bg-surface shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  eyebrow,
  title,
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className
      )}
    >
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase text-muted">{eyebrow}</p>
        ) : null}
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}
