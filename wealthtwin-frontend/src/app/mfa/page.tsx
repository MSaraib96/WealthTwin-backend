"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, KeyRound, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/components/auth/auth-provider";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { apiFetch, verifyMfa } from "@/lib/api-client";
import { navigationConfig } from "@/lib/permissions";

type SetupResponse = { issuer: string; account: string; secret: string; setupUri: string };

export default function MfaPage() {
  const { session } = useAuth();
  if (session?.authState === "AUTHENTICATED" && !session.user.mfaEnabled) return <MfaSetup />;
  if (session?.authState === "AUTHENTICATED" && session.user.mfaEnabled) {
    return <AuthLayout title="Two-factor authentication is active" subtitle="Your account requires an authenticator or unused recovery code for new sessions."><div className="space-y-4"><p className="flex gap-2 rounded-md border border-teal-100 bg-teal-50 p-3 text-sm text-teal-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Strong authentication is enabled.</p><Link className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700" href="/settings/security">Back to Security Settings</Link></div></AuthLayout>;
  }
  return <MfaChallenge />;
}

function MfaChallenge() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(null);
    try {
      const form = new FormData(event.currentTarget);
      await verifyMfa(String(form.get("code") ?? ""));
      const session = await refreshSession();
      const firstRoute = [...navigationConfig.primary, ...navigationConfig.admin].find((item) => session?.permissions.includes(item.permission));
      router.replace(firstRoute?.href ?? "/settings/profile");
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to verify this code."); }
    finally { setSubmitting(false); }
  }
  return <AuthLayout title="Two-factor authentication" subtitle="Enter the current code from your authenticator app or one unused recovery code."><form className="space-y-4" method="post" onSubmit={handleSubmit}><FormField autoComplete="one-time-code" inputMode="text" label="Verification or recovery code" maxLength={32} name="code" required type="text" />{error ? <FormError message={error} /> : null}<Button className="w-full" disabled={submitting} icon={<ShieldCheck className="h-4 w-4" />} type="submit" variant="primary">{submitting ? "Verifying..." : "Verify and Continue"}</Button></form></AuthLayout>;
}

function MfaSetup() {
  const { refreshSession } = useAuth();
  const router = useRouter();
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function begin() {
    setWorking(true); setError(null);
    try { setSetup(await apiFetch<SetupResponse>("/auth/mfa/setup", { method: "POST" })); }
    catch (setupError) { setError(setupError instanceof Error ? setupError.message : "Unable to start MFA setup."); }
    finally { setWorking(false); }
  }

  async function enable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await apiFetch<{ message: string; recoveryCodes: string[] }>("/auth/mfa/enable", { method: "POST", body: JSON.stringify({ code: String(form.get("code") ?? "") }) });
      setRecoveryCodes(response.recoveryCodes);
    } catch (enableError) { setError(enableError instanceof Error ? enableError.message : "Unable to enable MFA."); }
    finally { setWorking(false); }
  }

  async function finishSetup() { await refreshSession(); router.replace("/settings/security"); }

  if (recoveryCodes.length) return <AuthLayout title="Save your recovery codes" subtitle="Each code can be used once. Store them outside WealthTwin before leaving this page."><div className="space-y-4"><div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-canvas p-4">{recoveryCodes.map((code) => <code className="text-xs font-semibold text-ink" key={code}>{code}</code>)}</div><Button className="w-full" onClick={() => void finishSetup()} variant="primary">I saved these codes</Button></div></AuthLayout>;

  return <AuthLayout title="Set up two-factor authentication" subtitle="Add WealthTwin to a TOTP-compatible authenticator, then verify the first six-digit code."><div className="space-y-4">{!setup ? <Button className="w-full" disabled={working} icon={<KeyRound className="h-4 w-4" />} onClick={() => void begin()} variant="primary">{working ? "Preparing..." : "Generate authenticator key"}</Button> : <><div className="rounded-lg border border-line bg-canvas p-4"><p className="text-xs font-semibold uppercase text-muted">Manual setup key</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-sm font-semibold text-ink">{setup.secret}</code><Button aria-label="Copy setup key" icon={<Copy className="h-4 w-4" />} onClick={() => void navigator.clipboard.writeText(setup.secret)} size="icon" variant="secondary" /></div><p className="mt-3 text-xs leading-5 text-muted">Account: {setup.account}</p></div><form className="space-y-4" method="post" onSubmit={enable}><FormField autoComplete="one-time-code" inputMode="numeric" label="Authenticator code" maxLength={6} name="code" required type="text" /><Button className="w-full" disabled={working} icon={<ShieldCheck className="h-4 w-4" />} type="submit" variant="primary">{working ? "Verifying..." : "Enable MFA"}</Button></form></>}{error ? <FormError message={error} /> : null}</div></AuthLayout>;
}

function FormError({ message }: { message: string }) { return <p className="flex gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</p>; }
