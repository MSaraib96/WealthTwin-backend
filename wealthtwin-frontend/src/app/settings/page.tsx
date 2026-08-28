"use client";

import Link from "next/link";
import { Building2, LockKeyhole, Settings, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default function SettingsPage() {
  const { session } = useAuth();
  if (!session) return null;
  const canManageMembers = session.permissions.includes("admin.members.manage");
  return (
    <>
      <PageHeader title="Settings" description="Review your organization context, account access, security posture, and backend runtime boundaries." />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Card><CardHeader eyebrow="Organization" title="Workspace Identity" action={<Building2 className="h-5 w-5 text-teal-700" />} /><CardBody className="grid gap-4 md:grid-cols-2"><SettingValue label="Company name" value={session.organization.name} /><SettingValue label="Organization ID" value={session.organization.id} /><SettingValue label="Your role" value={session.membership.role} /><SettingValue label="Your data scope" value={session.membership.dataScope} /></CardBody></Card>
        <div className="grid gap-5">
          <Card><CardHeader eyebrow="Account" title="Profile and Access" action={<UserRound className="h-5 w-5 text-teal-700" />} /><CardBody className="grid gap-3"><SettingsLink href="/settings/profile" icon={UserRound} label="Profile" /><SettingsLink href="/settings/security" icon={ShieldCheck} label="Security settings" />{canManageMembers ? <SettingsLink href="/control-center/users" icon={UsersRound} label="Manage members" /> : null}</CardBody></Card>
          <Card><CardHeader eyebrow="AI policy" title="Permission Inheritance" action={<LockKeyhole className="h-5 w-5 text-blue-600" />} /><CardBody className="space-y-3">{["AI context is created after tenant and role authorization.", "Only explicitly authorized aggregate metrics enter model context.", "Missing evidence produces an unavailable state, not an invented answer."].map((policy) => <div className="rounded-md border border-line p-3 text-sm leading-6 text-ink" key={policy}>{policy}</div>)}</CardBody></Card>
          <Card><CardHeader eyebrow="Runtime" title="Configuration Boundary" action={<Settings className="h-5 w-5 text-amber-500" />} /><CardBody><Badge status="healthy">Secrets remain backend-only</Badge><p className="mt-3 text-sm leading-6 text-muted">Organization profile editing will appear after its persisted API and audit trail are enabled. This page does not simulate saved configuration.</p></CardBody></Card>
        </div>
      </section>
    </>
  );
}

function SettingValue({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-line p-3"><p className="text-xs font-semibold uppercase text-muted">{label}</p><p className="mt-2 break-words text-sm font-semibold text-ink">{value}</p></div>; }
function SettingsLink({ href, icon: Icon, label }: { href: string; icon: typeof UserRound; label: string }) { return <Link className="flex items-center justify-between rounded-md border border-line p-3 text-sm font-semibold text-ink hover:bg-canvas" href={href}>{label}<Icon className="h-4 w-4 text-muted" /></Link>; }
