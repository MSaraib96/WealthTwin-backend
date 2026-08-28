export type Severity = "healthy" | "info" | "warning" | "critical";
export type Direction = "up" | "down" | "flat";
export type DataState = "empty" | "partial" | "ready";

export type Permission =
  | "dashboard.command_center.view"
  | "dashboard.financial_health.view"
  | "dashboard.cash.view"
  | "dashboard.performance.view"
  | "explorer.sales_orders.view"
  | "metric.revenue.view"
  | "metric.cash.view"
  | "feature.ai_cfo.use"
  | "feature.intelligence_center.view"
  | "feature.scenario_simulator.use"
  | "integration.manage"
  | "admin.control_center.view"
  | "admin.members.manage"
  | "admin.invitations.create"
  | "admin.roles.manage"
  | "settings.security.view"
  | "settings.profile.manage"
  | "auth.sessions.manage";

export type AuthState =
  | "AUTHENTICATED"
  | "EMAIL_UNVERIFIED"
  | "MFA_REQUIRED"
  | "ACCOUNT_DISABLED"
  | "PASSWORD_RESET_REQUIRED";

export type AuthenticatedUserResponse = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
  };
  organization: { id: string; name: string };
  membership: { role: string; dataScope: string };
  permissions: Permission[];
  authState: AuthState;
  accessToken?: string | null;
  expiresAt?: string | null;
};

export type DataEnvelope = {
  tenantId: string;
  dataState: DataState;
  dataHealth: string;
  recordCount: number;
  sourceCount: number;
  metricCount: number;
  lastUpdated: string | null;
  entityCounts: Record<string, number>;
};

export type FinancialHealth = {
  score: number;
  delta: string | null;
  explanation: string;
  components: Array<{ name: string; score: number; status: Severity }>;
};

export type AiBriefData = {
  title: string;
  body: string;
  generatedAt: string;
  evidence: string[];
  actions: string[];
};

export type ChartDatum = Record<string, string | number | null>;

export type CommandCenterResponse = DataEnvelope & {
  generatedAt: string;
  workspace: {
    organization: string;
    user: string;
    role: string;
    dataScope: string;
  };
  kpis: Array<{
    id: string;
    label: string;
    value: string | null;
    context: string;
    available: boolean;
  }>;
  financialHealth: FinancialHealth | null;
  attention: IntelligenceAlert[];
  trajectory: ChartDatum[];
  cashForecast: ChartDatum[];
  aiBrief: AiBriefData | null;
  onboarding: {
    sourceConnected: boolean;
    recordsImported: boolean;
    metricsConfigured: boolean;
  };
};

export type FinancialHealthResponse = DataEnvelope & {
  financialHealth: FinancialHealth | null;
  profitAndLoss: Array<Record<string, string | number>>;
  marginDrivers: Array<{ label: string; value: number; status: Severity }>;
  deviations: Array<Record<string, string | number>>;
  requirements: string[];
};

export type CashResponse = DataEnvelope & {
  currentCash: string | null;
  availableCash: string | null;
  minimumProjectedCash: string | null;
  safetyThreshold: string | null;
  forecast: ChartDatum[];
  receivables: Array<{
    id: string;
    invoice: string;
    customer: string;
    amount: string;
    daysOverdue: number | null;
    dueDate: string | null;
    status: string;
  }>;
  bankAccounts: Array<{
    id: string;
    institutionName: string;
    accountName: string;
    accountNumberLast4: string | null;
    balance: string | null;
    currency: string;
    lastTransactionAt: string | null;
  }>;
  workingCapital: Array<Record<string, string | number>>;
  requirements: string[];
};

export type PerformanceResponse = DataEnvelope & {
  trajectory: ChartDatum[];
  forecast: null | Record<string, unknown>;
  customerConcentration: Array<{ name: string; value: number; amount: string }>;
  regionalPerformance: Array<{ region: string; revenue: number; amount: string }>;
};

export type IntelligenceAlert = {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  createdAt: string | null;
};

export type IntelligenceResponse = DataEnvelope & { alerts: IntelligenceAlert[] };

export type ExplorerResponse = DataEnvelope & {
  rows: Array<{
    id: string;
    order: string;
    customer: string;
    amount: string;
    status: string;
    orderDate: string | null;
  }>;
};

export type ControlCenterResponse = DataEnvelope & {
  overview: Array<{ label: string; value: string; status: Severity }>;
  pendingMappings: Array<Record<string, string | number>>;
  auditEvents: Array<{
    id: string;
    eventType: string;
    createdAt: string | null;
    metadata: Record<string, unknown>;
  }>;
};

export type ConnectorResponse = {
  id: string;
  provider: string;
  status: string;
  syncMode: string;
  externalAccountId: string | null;
  lastSyncAt: string | null;
  recordsProcessed: number;
  errors: number;
};

export type SyncRunResponse = {
  id: string;
  connectorId: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  recordsProcessed: number;
  message: string;
};

export type BankAccountResponse = {
  id: string;
  institutionName: string;
  accountName: string;
  accountNumberLast4: string | null;
  currency: string;
  currentBalanceCents: number | null;
  lastTransactionAt: string | null;
  transactionCount?: number | null;
};

export type BankImportResponse = {
  importId: string;
  connectorId: string;
  alreadyImported: boolean;
  fileName: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  rejectedRows: number;
  mapping: Record<string, string>;
  importedAt: string;
  account: BankAccountResponse;
};

export type BankOverviewResponse = {
  connectorId: string | null;
  accounts: BankAccountResponse[];
  recentImports: Array<{
    id: string;
    fileName: string;
    accountName: string;
    status: string;
    totalRows: number;
    importedRows: number;
    duplicateRows: number;
    createdAt: string;
  }>;
};

export type SessionResponse = {
  id: string;
  device: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
  mfaVerified: boolean;
};

export type MemberResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  dataScope: string;
  status: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
};

export type RoleResponse = {
  name: string;
  permissions: Permission[];
  description: string;
  protected: boolean;
};

export type InvitationResponse = {
  id: string;
  email: string;
  role: string;
  dataScope: string;
  invitedByUserId: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};
