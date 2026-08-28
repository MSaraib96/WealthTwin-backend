"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: String(form.get("email") ?? "") })
      });
      setMessage(response.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to process this request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your work email. The response remains generic so account membership is not disclosed." footer={<p className="text-center text-sm text-muted">Remember your password? <Link className="font-semibold text-teal-700" href="/login">Back to Sign In</Link></p>}>
      <form className="space-y-4" method="post" onSubmit={handleSubmit}>
        <FormField autoComplete="email" label="Work email" name="email" placeholder="name@company.com" required type="email" />
        {message ? <p className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-600" role="status">{message}</p> : null}
        <Button className="w-full" disabled={submitting} icon={<Mail className="h-4 w-4" />} type="submit" variant="primary">{submitting ? "Sending..." : "Send reset link"}</Button>
      </form>
    </AuthLayout>
  );
}
