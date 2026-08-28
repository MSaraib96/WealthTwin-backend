"use client";

import { type FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength, passwordMeetsRequirements } from "@/components/auth/password-strength";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { changePassword } from "@/lib/api-client";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setMessage({ text: "New passwords do not match.", error: true });
      return;
    }
    if (!passwordMeetsRequirements(newPassword)) {
      setMessage({ text: "Complete every password requirement before continuing.", error: true });
      return;
    }
    setSubmitting(true);
    try {
      const response = await changePassword({
        currentPassword: String(form.get("currentPassword") ?? ""),
        newPassword
      });
      setMessage({ text: response.message, error: false });
      setNewPassword("");
      event.currentTarget.reset();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to change this password.",
        error: true
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Change Password" description="Validate your current password, replace it securely, and revoke other active sessions." />
      <Card className="max-w-2xl">
        <CardHeader eyebrow="Protected action" title="Update Password" action={<KeyRound className="h-5 w-5 text-teal-700" />} />
        <CardBody>
          <form className="space-y-4" method="post" onSubmit={submit}>
            <PasswordField autoComplete="current-password" label="Current password" name="currentPassword" />
            <PasswordField autoComplete="new-password" label="New password" name="newPassword" onValueChange={setNewPassword} />
            <PasswordField autoComplete="new-password" label="Confirm new password" name="confirmPassword" />
            <PasswordStrength password={newPassword} />
            {message ? (
              <p className={`rounded-md border p-3 text-sm ${message.error ? "border-red-100 bg-red-50 text-red-600" : "border-teal-100 bg-teal-50 text-teal-700"}`} role="status">
                {message.text}
              </p>
            ) : null}
            <Button disabled={submitting} icon={<KeyRound className="h-4 w-4" />} type="submit" variant="primary">
              {submitting ? "Updating..." : "Change Password"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
