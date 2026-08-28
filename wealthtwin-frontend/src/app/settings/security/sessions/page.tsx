"use client";

import { useState } from "react";
import { MonitorSmartphone, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { revokeOtherSessions, revokeSession } from "@/lib/api-client";
import type { SessionResponse } from "@/lib/contracts";

export default function ActiveSessionsPage() {
  const { data, error, loading, reload } = useApiQuery<SessionResponse[]>("/auth/sessions");
  const [working, setWorking] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  if (loading) return <LoadingWorkspace label="Loading active sessions" />;
  if (error) return <ErrorWorkspace message={error.message} onRetry={() => void reload()} />;

  async function revoke(id?: string) {
    setWorking(id ?? "others");
    setActionError(null);
    try {
      if (id) await revokeSession(id); else await revokeOtherSessions();
      await reload();
    } catch (revokeError) {
      setActionError(revokeError instanceof Error ? revokeError.message : "Unable to revoke this session.");
    } finally {
      setWorking(null);
    }
  }

  return <><PageHeader title="Active Sessions" description="Review and revoke persisted server-side sessions."><Button disabled={working !== null} icon={<Trash2 className="h-4 w-4" />} onClick={() => void revoke()} variant="danger">Sign Out Other Sessions</Button></PageHeader>{actionError ? <p className="mb-5 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">{actionError}</p> : null}<Card><CardHeader eyebrow="Account security" title="Session Management" /><CardBody className="grid gap-3">{data?.length ? data.map((session) => <div className="flex flex-col gap-4 rounded-md border border-line p-4 sm:flex-row sm:items-center sm:justify-between" key={session.id}><div className="flex gap-3"><MonitorSmartphone className="mt-1 h-5 w-5 shrink-0 text-teal-700" /><div><p className="font-semibold text-ink">{session.device}</p><p className="mt-1 text-sm text-muted">{session.location} - Last active {new Date(session.lastActiveAt).toLocaleString()}</p><div className="mt-2 flex flex-wrap gap-2">{session.current ? <Badge status="healthy">Current session</Badge> : null}{session.mfaVerified ? <Badge status="info"><ShieldCheck className="h-3 w-3" /> MFA verified</Badge> : null}</div></div></div><Button disabled={session.current || working !== null} icon={<Trash2 className="h-4 w-4" />} onClick={() => void revoke(session.id)} size="sm" variant="secondary">{working === session.id ? "Revoking..." : "Revoke"}</Button></div>) : <p className="text-sm text-muted">No active sessions were returned.</p>}</CardBody></Card></>;
}
