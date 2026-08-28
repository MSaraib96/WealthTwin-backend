import type {
  AuthenticatedUserResponse,
  InvitationResponse,
  MemberResponse,
  RoleResponse,
  SessionResponse
} from "@/lib/contracts";

const API_BASE = process.env.NEXT_PUBLIC_WEALTHTWIN_API_BASE ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers
    });
  } catch {
    throw new ApiError("Unable to reach the WealthTwin API. Confirm the backend is running and CORS is configured for this URL.", 0, "api_unreachable");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    const message =
      detail?.message ??
      validationMessage(detail) ??
      (typeof detail === "string" ? detail : null) ??
      `WealthTwin API request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, detail?.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function validationMessage(detail: unknown): string | null {
  if (!Array.isArray(detail)) return null;
  const messages = detail
    .map((item) => {
      if (!item || typeof item !== "object" || !("msg" in item)) return null;
      return String(item.msg).replace(/^Value error,\s*/i, "");
    })
    .filter((message): message is string => Boolean(message));
  return messages.length ? messages.join(" ") : null;
}

export function login(payload: { email: string; password: string; rememberDevice: boolean }) {
  return apiFetch<AuthenticatedUserResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function register(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
  acceptedTerms: boolean;
}) {
  return apiFetch<AuthenticatedUserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function currentUser() {
  return apiFetch<AuthenticatedUserResponse>("/auth/me");
}

export function logout() {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export function verifyMfa(code: string) {
  return apiFetch<{ message: string }>("/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ code })
  });
}

export function listSessions() {
  return apiFetch<SessionResponse[]>("/auth/sessions");
}

export function revokeSession(sessionId: string) {
  return apiFetch<{ message: string }>(`/auth/sessions/${sessionId}`, { method: "DELETE" });
}

export function revokeOtherSessions() {
  return apiFetch<{ message: string }>("/auth/sessions/revoke-all", { method: "POST" });
}

export function changePassword(payload: { currentPassword: string; newPassword: string }) {
  return apiFetch<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listMembers() {
  return apiFetch<MemberResponse[]>("/admin/members");
}

export function listRoles() {
  return apiFetch<RoleResponse[]>("/admin/roles");
}

export function listInvitations() {
  return apiFetch<InvitationResponse[]>("/admin/invitations");
}

export function createInvitation(payload: {
  email: string;
  role: string;
  dataScope: string;
  note?: string;
}) {
  return apiFetch<InvitationResponse>("/admin/invitations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
