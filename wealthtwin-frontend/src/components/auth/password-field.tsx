"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PasswordField({
  label = "Password",
  name = "password",
  placeholder = "Enter password",
  autoComplete = "current-password",
  onValueChange,
  required = true
}: {
  label?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="flex h-11 items-center rounded-md border border-line bg-white">
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted"
          name={name}
          onChange={(event) => onValueChange?.(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={visible ? "text" : "password"}
        />
        <Button
          aria-label={visible ? "Hide password" : "Show password"}
          className="mr-1"
          icon={visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          onClick={() => setVisible((current) => !current)}
          size="icon"
          variant="ghost"
        />
      </span>
    </label>
  );
}
