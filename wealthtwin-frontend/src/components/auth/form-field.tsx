import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function FormField({
  label,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  const id = props.id ?? props.name;

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        id={id}
        className={cn(
          "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-muted",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error ? <span className="block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
