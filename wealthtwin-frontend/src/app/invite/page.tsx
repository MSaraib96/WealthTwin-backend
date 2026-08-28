"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { UserCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FormField } from "@/components/auth/form-field";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength, passwordMeetsRequirements } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { AuthenticatedUserResponse } from "@/lib/contracts";

export default function InvitePage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMessage("This invitation link is incomplete.");
      return;
    }
    if (!passwordMeetsRequirements(password)) {
      setMessage("Complete every password requirement before accepting this invitation.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch<AuthenticatedUserResponse>("/auth/invitations/accept", {
        method: "POST",
        body: JSON.stringify({
          token,
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          password
        })
      });
      setComplete(true);
      setMessage("Your organization membership is active. Sign in to continue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to accept this invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Join your organization" subtitle="Your role, organization, and data scope come from the signed invitation and cannot be selected in the browser.">
      {complete ? (
        <div className="space-y-4">
          <p className="rounded-md border border-teal-100 bg-teal-50 p-3 text-sm text-teal-700">{message}</p>
          <Link className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700" href="/login">Continue to Sign In</Link>
        </div>
      ) : (
        <form className="space-y-4" method="post" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField autoComplete="given-name" label="First name" name="firstName" required type="text" />
            <FormField autoComplete="family-name" label="Last name" name="lastName" required type="text" />
          </div>
          <PasswordField autoComplete="new-password" label="Create password" name="password" onValueChange={setPassword} placeholder="Create password" />
          <PasswordStrength password={password} />
          {message ? <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600" role="alert">{message}</p> : null}
          <Button className="w-full" disabled={submitting} icon={<UserCheck className="h-4 w-4" />} type="submit" variant="primary">{submitting ? "Activating membership..." : "Accept Invitation"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
