"use client";

import { MailCheck, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default function ProfilePage() {
  const { session } = useAuth();
  if (!session) return null;
  const initials = `${session.user.firstName[0] ?? ""}${session.user.lastName[0] ?? ""}`.toUpperCase();
  return (
    <>
      <PageHeader title="Profile" description="Your verified identity, organization membership, assigned role, and effective data scope." />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card><CardHeader eyebrow="Personal identity" title="Account Details" action={<UserRound className="h-5 w-5 text-teal-700" />} /><CardBody><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid h-20 w-20 place-items-center rounded-lg bg-ink text-2xl font-semibold text-white">{initials}</div><div><p className="text-xl font-semibold text-ink">{session.user.firstName} {session.user.lastName}</p><p className="mt-1 text-sm text-muted">{session.user.email}</p></div></div><div className="mt-6 grid gap-4 md:grid-cols-2"><ProfileValue label="First name" value={session.user.firstName} /><ProfileValue label="Last name" value={session.user.lastName} /><ProfileValue label="Work email" value={session.user.email} /><ProfileValue label="Account ID" value={session.user.id} /></div></CardBody></Card>
        <div className="grid gap-5">
          <Card><CardHeader eyebrow="Membership" title="Role and Scope" action={<ShieldCheck className="h-5 w-5 text-blue-600" />} /><CardBody className="space-y-3"><ProfileValue label="Organization" value={session.organization.name} /><ProfileValue label="Assigned role" value={session.membership.role} /><ProfileValue label="Data scope" value={session.membership.dataScope} /><Badge status="healthy">Role changes require administrator authorization</Badge></CardBody></Card>
          <Card><CardHeader eyebrow="Verification" title="Account Protection" action={<MailCheck className="h-5 w-5 text-teal-700" />} /><CardBody className="space-y-3"><Status label="Email" enabled={session.user.emailVerified} enabledText="Verified" disabledText="Pending" /><Status label="Two-factor authentication" enabled={session.user.mfaEnabled} enabledText="Enabled" disabledText="Not enabled" /></CardBody></Card>
        </div>
      </section>
    </>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-line p-3"><p className="text-xs font-semibold uppercase text-muted">{label}</p><p className="mt-2 break-words text-sm font-semibold text-ink">{value}</p></div>; }
function Status({ label, enabled, enabledText, disabledText }: { label: string; enabled: boolean; enabledText: string; disabledText: string }) { return <div className="flex items-center justify-between gap-3 rounded-md border border-line p-3 text-sm"><span className="text-ink">{label}</span><Badge status={enabled ? "healthy" : "warning"}>{enabled ? enabledText : disabledText}</Badge></div>; }
