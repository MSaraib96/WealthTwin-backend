"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AlertCircle, LogIn } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/components/auth/auth-provider";
import { FormField } from "@/components/auth/form-field";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const session = await login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        rememberDevice: form.get("rememberDevice") === "on"
      });
      setSession(session);
      const destinations = {
        AUTHENTICATED: safeNextPath(),
        EMAIL_UNVERIFIED: "/verify-email",
        MFA_REQUIRED: "/mfa",
        ACCOUNT_DISABLED: "/account-deactivated",
        PASSWORD_RESET_REQUIRED: "/reset-password"
      } as const;
      router.replace(destinations[session.authState]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your organization workspace. Access is resolved from your server-side role and data scope."
      footer={
        <p className="text-center text-sm text-muted">
          Creating a new organization?{" "}
          <Link className="font-semibold text-teal-700" href="/register">Create account</Link>
        </p>
      }
    >
      <form className="space-y-4" method="post" onSubmit={handleSubmit}>
        <FormField autoComplete="email" label="Work email" name="email" placeholder="name@company.com" required type="email" />
        <PasswordField />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input className="h-4 w-4 rounded border-line accent-teal-600" name="rememberDevice" type="checkbox" />
            Remember this device
          </label>
          <Link className="font-medium text-teal-700" href="/forgot-password">Forgot password?</Link>
        </div>
        {error ? <FormError message={error} /> : null}
        <Button className="w-full" disabled={submitting} icon={<LogIn className="h-4 w-4" />} type="submit" variant="primary">
          {submitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthLayout>
  );
}

function safeNextPath() {
  if (typeof window === "undefined") return "/command-center";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/command-center";
}

function FormError({ message }: { message: string }) {
  return <p className="flex gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</p>;
}
