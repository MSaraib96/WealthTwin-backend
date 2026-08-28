"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AlertCircle, UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FormField } from "@/components/auth/form-field";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength, passwordMeetsRequirements } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { register } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordMeetsRequirements(password)) {
      setError("Complete every password requirement before creating your organization.");
      return;
    }
    setSubmitting(true);
    try {
      const email = String(form.get("email") ?? "");
      await register({
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        email,
        password,
        organizationName: String(form.get("organization") ?? ""),
        acceptedTerms: form.get("acceptedTerms") === "on"
      });
      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create this account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your organization"
      subtitle="The first verified account becomes the Organization Admin. Additional members join only through admin-issued invitations."
      footer={<p className="text-center text-sm text-muted">Already have an account? <Link className="font-semibold text-teal-700" href="/login">Sign in</Link></p>}
    >
      <form className="space-y-4" method="post" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField autoComplete="given-name" label="First name" name="firstName" required type="text" />
          <FormField autoComplete="family-name" label="Last name" name="lastName" required type="text" />
        </div>
        <FormField autoComplete="email" label="Work email" name="email" placeholder="name@company.com" required type="email" />
        <FormField label="Company / organization" name="organization" required type="text" />
        <PasswordField autoComplete="new-password" label="Password" name="password" onValueChange={setPassword} placeholder="Create password" />
        <PasswordField autoComplete="new-password" label="Confirm password" name="confirmPassword" placeholder="Confirm password" />
        <PasswordStrength password={password} />
        <label className="flex gap-2 text-sm leading-6 text-muted">
          <input className="mt-1 h-4 w-4 rounded border-line accent-teal-600" name="acceptedTerms" required type="checkbox" />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        {error ? <p className="flex gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p> : null}
        <Button className="w-full" disabled={submitting} icon={<UserPlus className="h-4 w-4" />} type="submit" variant="primary">
          {submitting ? "Creating organization..." : "Create Organization"}
        </Button>
      </form>
    </AuthLayout>
  );
}
