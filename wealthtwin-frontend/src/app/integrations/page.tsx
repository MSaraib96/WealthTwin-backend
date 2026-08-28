"use client";

import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type InputHTMLAttributes
} from "react";
import {
  Building2,
  CheckCircle2,
  DatabaseZap,
  Download,
  FileSpreadsheet,
  Landmark,
  Link2,
  RefreshCw,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorWorkspace, LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiFetch } from "@/lib/api-client";
import type {
  BankImportResponse,
  BankOverviewResponse,
  ConnectorResponse,
  SyncRunResponse
} from "@/lib/contracts";

const crmProviders = [
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Accounts and opportunities synchronized through your Salesforce OAuth application."
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Companies and deals synchronized through your HubSpot OAuth application."
  }
];

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<LoadingWorkspace label="Loading integrations" />}>
      <IntegrationsContent />
    </Suspense>
  );
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const connectors = useApiQuery<ConnectorResponse[]>("/connectors");
  const bankOverview = useApiQuery<BankOverviewResponse>("/connectors/bank/overview");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; error: boolean } | null>(null);

  if (connectors.loading || bankOverview.loading) {
    return <LoadingWorkspace label="Loading integrations" />;
  }
  if (connectors.error || bankOverview.error) {
    const message = connectors.error?.message ?? bankOverview.error?.message ?? "Unable to load integrations.";
    return (
      <ErrorWorkspace
        message={message}
        onRetry={() => void Promise.all([connectors.reload(), bankOverview.reload()])}
      />
    );
  }

  const connectedSources = connectors.data ?? [];
  const bankConnector = connectedSources.find((item) => item.provider === "bank_csv");
  const callbackMessage = searchParams.get("oauthError")
    ? { text: searchParams.get("oauthError") as string, error: true }
    : searchParams.get("connected")
      ? {
          text: `${providerName(searchParams.get("connected") as string)} connected successfully. Run the first synchronization when ready.`,
          error: false
        }
      : null;
  const visibleMessage = actionMessage ?? callbackMessage;

  async function connect(provider: string) {
    setConnecting(provider);
    setActionMessage(null);
    try {
      const response = await apiFetch<{ authorizationUrl: string }>(
        `/connectors/crm/${provider}/oauth/start`,
        { method: "POST" }
      );
      window.location.assign(response.authorizationUrl);
    } catch (connectError) {
      setActionMessage({
        text: connectError instanceof Error ? connectError.message : "Unable to start this connection.",
        error: true
      });
      setConnecting(null);
    }
  }

  async function synchronize(connector: ConnectorResponse) {
    setSyncing(connector.id);
    setActionMessage(null);
    try {
      let run = await apiFetch<SyncRunResponse>(`/connectors/${connector.id}/sync-runs`, {
        method: "POST"
      });
      for (let attempt = 0; attempt < 90 && ["queued", "running"].includes(run.status); attempt += 1) {
        await wait(2000);
        run = await apiFetch<SyncRunResponse>(`/connectors/sync-runs/${run.id}`);
      }
      if (run.status === "completed") {
        setActionMessage({ text: run.message, error: false });
        await connectors.reload();
      } else {
        setActionMessage({
          text: run.status === "failed"
            ? run.message
            : "Synchronization is still running. Refresh this page to check again.",
          error: run.status === "failed"
        });
      }
    } catch (syncError) {
      setActionMessage({
        text: syncError instanceof Error ? syncError.message : "Unable to synchronize this connector.",
        error: true
      });
    } finally {
      setSyncing(null);
    }
  }

  async function disconnect(connector: ConnectorResponse) {
    const sourceName = providerName(connector.provider);
    const detail = connector.provider === "bank_csv"
      ? " and delete its imported bank transactions"
      : " and remove its stored OAuth credentials";
    if (!window.confirm(`Disconnect ${sourceName}${detail}?`)) return;

    setDisconnecting(connector.id);
    setActionMessage(null);
    try {
      await apiFetch<void>(`/connectors/${connector.id}`, { method: "DELETE" });
      setActionMessage({ text: `${sourceName} disconnected.`, error: false });
      await Promise.all([connectors.reload(), bankOverview.reload()]);
    } catch (disconnectError) {
      setActionMessage({
        text: disconnectError instanceof Error ? disconnectError.message : "Unable to disconnect this connector.",
        error: true
      });
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleBankImported(result: BankImportResponse) {
    const imported = result.importedRows.toLocaleString();
    setActionMessage({
      text: result.alreadyImported
        ? `${result.fileName} was already imported. No duplicate transactions were created.`
        : `${imported} transactions imported into ${result.account.accountName}.`,
      error: false
    });
    await Promise.all([connectors.reload(), bankOverview.reload()]);
    setBankDialogOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect business systems and import verified account activity into your financial twin."
        status={{
          label: `${connectedSources.length} connected ${connectedSources.length === 1 ? "source" : "sources"}`,
          tone: connectedSources.length ? "healthy" : "info"
        }}
      />

      {visibleMessage ? (
        <p
          className={`mb-5 rounded-md border p-4 text-sm ${visibleMessage.error ? "border-red-100 bg-red-50 text-red-600" : "border-teal-100 bg-teal-50 text-teal-700"}`}
          role="status"
        >
          {visibleMessage.text}
        </p>
      ) : null}

      <section className="mb-5">
        <Card>
          <CardHeader
            eyebrow="Pakistan-first bank data"
            title="Bank Accounts"
            action={
              bankConnector
                ? <Badge status="healthy">Connected</Badge>
                : <Landmark className="h-5 w-5 text-teal-700" aria-hidden="true" />
            }
          />
          <CardBody>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm leading-6 text-muted">
                  Import a CSV statement exported from your bank. WealthTwin validates every row before saving
                  normalized transactions; the original file is not retained.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="rounded-md bg-canvas px-2 py-1">PKR supported</span>
                  <span className="rounded-md bg-canvas px-2 py-1">Duplicate protection</span>
                  <span className="rounded-md bg-canvas px-2 py-1">Up to 25,000 rows</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  icon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => setBankDialogOpen(true)}
                  variant="primary"
                >
                  {bankConnector ? "Import statement" : "Connect Bank"}
                </Button>
                {bankConnector ? (
                  <Button
                    disabled={disconnecting === bankConnector.id}
                    icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void disconnect(bankConnector)}
                    variant="danger"
                  >
                    {disconnecting === bankConnector.id ? "Disconnecting..." : "Disconnect"}
                  </Button>
                ) : null}
              </div>
            </div>

            {bankOverview.data?.accounts.length ? (
              <div className="mt-6 overflow-hidden rounded-md border border-line">
                {bankOverview.data.accounts.map((account, index) => (
                  <div
                    className={`grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center ${index ? "border-t border-line" : ""}`}
                    key={account.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{account.accountName}</p>
                      <p className="mt-1 truncate text-sm text-muted">
                        {account.institutionName}
                        {account.accountNumberLast4 ? ` - ending ${account.accountNumberLast4}` : ""}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs font-semibold uppercase text-muted">Statement balance</p>
                      <p className="mt-1 font-semibold tabular-nums text-ink">
                        {formatMoney(account.currentBalanceCents, account.currency)}
                      </p>
                    </div>
                    <div className="sm:min-w-28 sm:text-right">
                      <p className="text-xs font-semibold uppercase text-muted">Transactions</p>
                      <p className="mt-1 font-semibold tabular-nums text-ink">
                        {(account.transactionCount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink">No bank statement imported</p>
                <p className="mt-1 text-sm text-muted">Connect a bank by selecting its exported CSV statement.</p>
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-2">
        {crmProviders.map((provider) => {
          const connected = connectedSources.find((item) => item.provider.toLowerCase() === provider.id);
          return (
            <Card key={provider.id}>
              <CardHeader
                eyebrow="CRM connector"
                title={provider.name}
                action={connected
                  ? <Badge status={connected.status === "connected" ? "healthy" : "critical"}>{connected.status.replaceAll("_", " ")}</Badge>
                  : <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />}
              />
              <CardBody>
                <p className="text-sm leading-6 text-muted">{provider.description}</p>
                {connected ? (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <Metric label="Records" value={connected.recordsProcessed.toLocaleString()} />
                      <Metric label="Errors" value={connected.errors.toLocaleString()} />
                      <Metric label="Last sync" value={connected.lastSyncAt ? new Date(connected.lastSyncAt).toLocaleString() : "Not synced"} />
                    </div>
                    {connected.externalAccountId ? (
                      <p className="mt-3 break-all text-xs text-muted">Provider account: {connected.externalAccountId}</p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        disabled={syncing === connected.id || disconnecting === connected.id}
                        icon={<RefreshCw className={`h-4 w-4 ${syncing === connected.id ? "animate-spin" : ""}`} aria-hidden="true" />}
                        onClick={() => void synchronize(connected)}
                        variant="primary"
                      >
                        {syncing === connected.id ? "Synchronizing..." : "Sync now"}
                      </Button>
                      <Button
                        disabled={disconnecting === connected.id || syncing === connected.id}
                        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                        onClick={() => void disconnect(connected)}
                        variant="danger"
                      >
                        {disconnecting === connected.id ? "Disconnecting..." : "Disconnect"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    className="mt-5"
                    disabled={connecting === provider.id}
                    icon={<Link2 className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void connect(provider.id)}
                    variant="primary"
                  >
                    {connecting === provider.id ? "Opening provider..." : `Connect ${provider.name}`}
                  </Button>
                )}
              </CardBody>
            </Card>
          );
        })}
      </section>

      <section>
        <Card>
          <CardHeader
            eyebrow="Connected sources"
            title="Data Source Inventory"
            action={<RefreshCw className="h-5 w-5 text-teal-700" aria-hidden="true" />}
          />
          <CardBody className="space-y-3">
            {connectedSources.length ? connectedSources.map((connector) => (
              <div
                className="flex flex-col gap-3 rounded-md border border-line p-4 sm:flex-row sm:items-center sm:justify-between"
                key={connector.id}
              >
                <div>
                  <p className="font-semibold text-ink">{providerName(connector.provider)}</p>
                  <p className="mt-1 text-sm text-muted">{connector.syncMode.replaceAll("_", " ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <Badge status={connector.errors ? "critical" : "healthy"}>{connector.status.replaceAll("_", " ")}</Badge>
                </div>
              </div>
            )) : (
              <div className="grid min-h-44 place-items-center text-center">
                <div>
                  <DatabaseZap className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-ink">No connected data sources</p>
                  <p className="mt-2 text-sm text-muted">Connect a source above to begin.</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {bankDialogOpen ? (
        <BankImportDialog
          onClose={() => setBankDialogOpen(false)}
          onImported={handleBankImported}
        />
      ) : null}
    </>
  );
}

function BankImportDialog({
  onClose,
  onImported
}: {
  onClose: () => void;
  onImported: (result: BankImportResponse) => Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumberLast4, setAccountNumberLast4] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, submitting]);

  function chooseFile(selected: File | undefined) {
    setError(null);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Select a CSV file exported by your bank.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("The CSV file must be 5 MB or smaller.");
      return;
    }
    setFile(selected);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Select a bank statement CSV before importing.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("institutionName", institutionName.trim());
    formData.append("accountName", accountName.trim());
    if (accountNumberLast4) formData.append("accountNumberLast4", accountNumberLast4);
    formData.append("currency", currency);
    formData.append("file", file);

    try {
      const result = await apiFetch<BankImportResponse>("/connectors/bank/csv/import", {
        method: "POST",
        body: formData
      });
      await onImported(result);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to import this statement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      aria-labelledby="bank-import-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      role="dialog"
    >
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-md bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-teal-700">Connect Bank</p>
            <h2 className="mt-1 text-xl font-semibold text-ink" id="bank-import-title">Import bank statement</h2>
          </div>
          <Button
            aria-label="Close bank import"
            disabled={submitting}
            icon={<X className="h-5 w-5" aria-hidden="true" />}
            onClick={onClose}
            size="icon"
            variant="ghost"
          />
        </div>

        <form className="space-y-5 p-5 sm:p-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              autoComplete="organization"
              label="Bank name"
              maxLength={120}
              onChange={(event) => setInstitutionName(event.target.value)}
              placeholder="e.g. Meezan Bank"
              required
              value={institutionName}
            />
            <Field
              label="Account label"
              maxLength={120}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="e.g. Operating account"
              required
              value={accountName}
            />
            <Field
              inputMode="numeric"
              label="Last 4 digits (optional)"
              maxLength={4}
              onChange={(event) => setAccountNumberLast4(event.target.value.replace(/\D/g, "").slice(0, 4))}
              pattern="[0-9]{4}"
              placeholder="1234"
              value={accountNumberLast4}
            />
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink">Currency</span>
              <select
                className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
                onChange={(event) => setCurrency(event.target.value)}
                value={currency}
              >
                <option value="PKR">PKR - Pakistani rupee</option>
                <option value="USD">USD - US dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - Pound sterling</option>
              </select>
            </label>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">Statement file</p>
              <button
                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
                onClick={downloadTemplate}
                type="button"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                CSV template
              </button>
            </div>
            <div
              className={`grid min-h-40 cursor-pointer place-items-center rounded-md border border-dashed p-5 text-center transition-colors ${dragging ? "border-teal-500 bg-teal-50" : "border-line bg-canvas hover:border-teal-300"}`}
              onClick={() => fileInput.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") fileInput.current?.click();
              }}
              role="button"
              tabIndex={0}
            >
              <div className="min-w-0">
                {file
                  ? <FileSpreadsheet className="mx-auto h-8 w-8 text-teal-700" aria-hidden="true" />
                  : <UploadCloud className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />}
                <p className="mx-auto mt-3 max-w-full break-all text-sm font-semibold text-ink">
                  {file ? file.name : "Drop your statement here or choose a file"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "CSV only, up to 5 MB and 25,000 transaction rows"}
                </p>
              </div>
            </div>
            <input
              accept=".csv,text/csv,application/csv"
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0])}
              ref={fileInput}
              type="file"
            />
            <p className="mt-2 text-xs leading-5 text-muted">
              Required columns: Date and Description/Narration, plus either Amount or Debit/Credit. Balance and Reference are optional.
            </p>
          </div>

          {error ? (
            <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600" role="alert">{error}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <Button disabled={submitting} onClick={onClose}>Cancel</Button>
            <Button
              disabled={submitting || !file}
              icon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
              type="submit"
              variant="primary"
            >
              {submitting ? "Validating and importing..." : "Import statement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-muted" {...props} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-canvas p-3">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function providerName(provider: string) {
  if (provider === "salesforce") return "Salesforce";
  if (provider === "hubspot") return "HubSpot";
  if (provider === "bank_csv") return "Bank statements";
  return provider;
}

function formatMoney(valueInCents: number | null, currency: string) {
  if (valueInCents === null) return "Not provided";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(valueInCents / 100);
}

function downloadTemplate() {
  const blob = new Blob(["Date,Description,Reference,Debit,Credit,Balance\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "wealthtwin-bank-statement-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
