"use client";

import Link from "next/link";
import { KeyRound, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { SessionResponse } from "@/lib/contracts";

export default function SecuritySettingsPage() {
  const { session } = useAuth();
  const sessions = useApiQuery<SessionResponse[]>("/auth/sessions");
  if (sessions.loading) return <LoadingWorkspace label="Loading security settings" />;
  if (sessions.error) return <ErrorWorkspace message={sessions.error.message} onRetry={() => void sessions.reload()} />;
  if (!session) return null;
  const items = [
    { title: "Two-Factor Authentication", href: "/mfa", icon: ShieldCheck, status: session.user.mfaEnabled ? "Enabled" : "Set up", description: "Use a time-based authenticator and single-use recovery codes." },
    { title: "Active Sessions", href: "/settings/security/sessions", icon: MonitorSmartphone, status: `${sessions.data?.length ?? 0} active`, description: "Review and revoke server-side sessions." },
    { title: "Change Password", href: "/settings/security/change-password", icon: KeyRound, status: "Protected action", description: "Validate the current password and revoke other sessions." }
  ];
  return <><PageHeader title="Security Settings" description="Manage strong authentication, sessions, and credentials through protected backend operations." /><section className="grid gap-5 lg:grid-cols-3">{items.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.title}><Card className="h-full transition-colors hover:border-teal-100"><CardHeader eyebrow="Account security" title={item.title} action={<Icon className="h-5 w-5 text-teal-700" />} /><CardBody><Badge status="info">{item.status}</Badge><p className="mt-3 text-sm leading-6 text-muted">{item.description}</p></CardBody></Card></Link>; })}</section></>;
}
