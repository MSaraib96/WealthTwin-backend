"use client";

import { type FormEvent, useState } from "react";
import { MailPlus, ShieldCheck, UserPlus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { createInvitation } from "@/lib/api-client";
import type { InvitationResponse, MemberResponse, RoleResponse } from "@/lib/contracts";

export default function UsersPage() {
  const members = useApiQuery<MemberResponse[]>("/admin/members");
  const roles = useApiQuery<RoleResponse[]>("/admin/roles");
  const invitations = useApiQuery<InvitationResponse[]>("/admin/invitations");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  if (members.loading || roles.loading || invitations.loading) return <LoadingWorkspace label="Loading access management" />;
  const queryError = members.error ?? roles.error ?? invitations.error;
  if (queryError) return <ErrorWorkspace message={queryError.message} onRetry={() => { void members.reload(); void roles.reload(); void invitations.reload(); }} />;

  async function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const invitation = await createInvitation({
        email: String(form.get("email") ?? ""),
        role: String(form.get("role") ?? ""),
        dataScope: String(form.get("dataScope") ?? ""),
        note: String(form.get("note") ?? "") || undefined
      });
      setMessage({ text: `Invitation for ${invitation.email} was ${invitation.status.replaceAll("_", " ")}.`, error: false });
      event.currentTarget.reset();
      await invitations.reload();
    } catch (submitError) {
      setMessage({ text: submitError instanceof Error ? submitError.message : "Unable to create this invitation.", error: true });
    } finally {
      setSubmitting(false);
    }
  }

  const memberRows = (members.data ?? []).map((member) => ({
    name: `${member.firstName} ${member.lastName}`,
    email: member.email,
    role: member.role,
    scope: member.dataScope,
    status: member.status
  }));

  return (
    <>
      <PageHeader title="Users and Roles" description="Only Organization Admins can invite members. The backend assigns the selected role, tenant, and data scope to the signed invitation." status={{ label: `${memberRows.length} organization members`, tone: "info" }} />
      <section className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Card><CardHeader eyebrow="Admin-only action" title="Invite New Member" action={<UserPlus className="h-5 w-5 text-teal-700" />} /><CardBody><form className="grid gap-4" method="post" onSubmit={submitInvitation}>
          <label className="space-y-2"><span className="text-sm font-medium text-ink">Work email</span><input className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink" name="email" placeholder="name@company.com" required type="email" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-medium text-ink">Role</span><select className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink" defaultValue="" name="role" required><option disabled value="">Select role</option>{roles.data?.map((role) => <option key={role.name} value={role.name}>{role.name}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-medium text-ink">Data scope</span><input className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink" name="dataScope" placeholder="All organization data" required /></label>
          </div>
          <label className="space-y-2"><span className="text-sm font-medium text-ink">Invitation note</span><textarea className="min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink" maxLength={500} name="note" /></label>
          {message ? <p className={`rounded-md border p-3 text-sm ${message.error ? "border-red-100 bg-red-50 text-red-600" : "border-teal-100 bg-teal-50 text-teal-700"}`} role="status">{message.text}</p> : null}
          <Button disabled={submitting} icon={<MailPlus className="h-4 w-4" />} type="submit" variant="primary">{submitting ? "Sending invitation..." : "Send invitation email"}</Button>
        </form></CardBody></Card>
        <Card><CardHeader eyebrow="Backend role catalog" title="Available Roles" action={<ShieldCheck className="h-5 w-5 text-blue-600" />} /><CardBody className="space-y-3">{roles.data?.map((role) => <div className="rounded-md border border-line p-3" key={role.name}><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-ink">{role.name}</p><Badge status={role.name === "Organization Admin" ? "warning" : "info"}>{role.permissions.length} permissions</Badge></div><p className="mt-2 text-sm leading-6 text-muted">{role.description}</p></div>)}</CardBody></Card>
      </section>
      <section className="mb-5"><DataTable columns={[{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "scope", label: "Data Scope" }, { key: "status", label: "Status", render: (value) => <Badge status={value === "Active" ? "healthy" : "warning"}>{String(value)}</Badge> }]} eyebrow="Tenant membership" rows={memberRows} title="Members" /></section>
      <Card><CardHeader eyebrow="Invitation lifecycle" title="Pending Invitations" /><CardBody className="grid gap-3">{invitations.data?.length ? invitations.data.map((invitation) => <div className="flex flex-col gap-3 rounded-md border border-line p-3 sm:flex-row sm:items-center sm:justify-between" key={invitation.id}><div><p className="text-sm font-semibold text-ink">{invitation.email}</p><p className="mt-1 text-xs text-muted">{invitation.role} - {invitation.dataScope}</p></div><div className="text-left sm:text-right"><Badge status={invitation.status === "sent" ? "healthy" : "info"}>{invitation.status.replaceAll("_", " ")}</Badge><p className="mt-1 text-xs text-muted">Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div></div>) : <p className="text-sm text-muted">No pending invitations.</p>}</CardBody></Card>
    </>
  );
}
