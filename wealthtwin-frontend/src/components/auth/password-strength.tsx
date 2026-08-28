import { CheckCircle2, Circle } from "lucide-react";

const requirements = [
  { label: "At least 12 characters", test: (password: string) => password.length >= 12 },
  { label: "Uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { label: "Lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { label: "Number", test: (password: string) => /[0-9]/.test(password) },
  { label: "Special character", test: (password: string) => /[^A-Za-z0-9\s]/.test(password) }
];

export function passwordMeetsRequirements(password: string) {
  return requirements.every((requirement) => requirement.test(password));
}

export function PasswordStrength({ password }: { password: string }) {
  return (
    <div aria-live="polite" className="rounded-md border border-line bg-canvas p-3">
      <p className="text-xs font-semibold uppercase text-muted">Password strength</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {requirements.map((requirement) => {
          const passed = requirement.test(password);
          const Icon = passed ? CheckCircle2 : Circle;
          return (
            <div key={requirement.label} className="flex items-center gap-2 text-sm text-ink">
              <Icon className={passed ? "h-4 w-4 text-teal-600" : "h-4 w-4 text-muted"} aria-hidden="true" />
              {requirement.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
