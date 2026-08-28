"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength, passwordMeetsRequirements } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setMessage("Passwords do not match.");
      return;
    }
    if (!passwordMeetsRequirements(password)) {
      setMessage("Complete every password requirement before resetting your password.");
      return;
    }
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMessage("This reset link is incomplete.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password })
      });
      setMessage(response.message);
      setComplete(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reset this password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Reset links are short-lived and single use. Completing this action revokes existing sessions.">
      {complete ? (
        <div className="space-y-4">
          <p className="rounded-md border border-teal-100 bg-teal-50 p-3 text-sm text-teal-700">{message}</p>
          <Link className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700" href="/login">Sign in with new password</Link>
        </div>
      ) : (
        <form className="space-y-4" method="post" onSubmit={handleSubmit}>
          <PasswordField autoComplete="new-password" label="New password" name="newPassword" onValueChange={setPassword} placeholder="New password" />
          <PasswordField autoComplete="new-password" label="Confirm password" name="confirmPassword" placeholder="Confirm password" />
          <PasswordStrength password={password} />
          {message ? <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600" role="alert">{message}</p> : null}
          <Button className="w-full" disabled={submitting} icon={<KeyRound className="h-4 w-4" />} type="submit" variant="primary">{submitting ? "Resetting..." : "Reset password"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
