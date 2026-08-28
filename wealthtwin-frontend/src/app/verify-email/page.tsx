"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Mail, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type VerificationStatus = "waiting" | "verifying" | "verified" | "failed";

export default function VerifyEmailPage() {
  const started = useRef(false);
  const [status, setStatus] = useState<VerificationStatus>("waiting");
  const [message, setMessage] = useState("Use the verification link sent to your work email.");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    apiFetch<{ message: string }>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) })
      .then((response) => {
        setStatus("verified");
        setMessage(response.message);
      })
      .catch((error) => {
        setStatus("failed");
        setMessage(error instanceof Error ? error.message : "Verification failed.");
      });
  }, []);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await apiFetch<{ message: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: String(form.get("email") ?? "") })
      });
      setMessage(response.message);
      setStatus("waiting");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to request another email.");
      setStatus("failed");
    } finally {
      setResending(false);
    }
  }

  const Icon = status === "failed" ? XCircle : status === "verified" ? CheckCircle2 : Mail;
  const tone = status === "failed" ? "border-red-100 bg-red-50 text-red-600" : "border-teal-100 bg-teal-50 text-teal-700";

  return (
    <AuthLayout title={status === "verified" ? "Email verified" : "Verify your work email"} subtitle="Protected financial data remains unavailable until ownership of the email address is confirmed.">
      <div className="space-y-4">
        <div className={`rounded-lg border p-4 ${tone}`}>
          <p className="flex gap-2 text-sm leading-6"><Icon className="mt-0.5 h-4 w-4 shrink-0" />{status === "verifying" ? "Verifying your link..." : message}</p>
        </div>
        {status !== "verified" ? (
          <form className="space-y-3" method="post" onSubmit={resend}>
            <FormField autoComplete="email" label="Work email" name="email" placeholder="name@company.com" required type="email" />
            <Button className="w-full" disabled={resending} icon={<Mail className="h-4 w-4" />} type="submit" variant="secondary">
              {resending ? "Requesting..." : "Resend verification email"}
            </Button>
          </form>
        ) : null}
        <Link className="inline-flex h-10 w-full items-center justify-center rounded-md border border-teal-600 bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-700" href="/login">Continue to Sign In</Link>
      </div>
    </AuthLayout>
  );
}
