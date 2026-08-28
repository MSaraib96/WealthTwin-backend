"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  ChevronDown,
  CircleUserRound,
  Gauge,
  LogOut,
  Menu,
  Search,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingWorkspace } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AuthenticatedUserResponse, Permission } from "@/lib/contracts";
import { hasPermission, navigationConfig, requiredPermission } from "@/lib/permissions";

const publicRoutePrefixes = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/mfa",
  "/invite",
  "/auth",
  "/session-expired",
  "/unauthorized",
  "/account-deactivated"
];

function isPublicRoute(pathname: string) {
  return pathname === "/" || publicRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, status, error, refreshSession } = useAuth();
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (publicRoute || status === "loading" || status === "error") return;
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!session) return;
    const authRoutes: Partial<Record<AuthenticatedUserResponse["authState"], string>> = {
      EMAIL_UNVERIFIED: "/verify-email",
      MFA_REQUIRED: "/mfa",
      ACCOUNT_DISABLED: "/account-deactivated",
      PASSWORD_RESET_REQUIRED: "/reset-password"
    };
    const destination = authRoutes[session.authState];
    if (destination) router.replace(destination);
  }, [pathname, publicRoute, router, session, status]);

  if (publicRoute) return children;

  if (status === "loading" || status === "unauthenticated" || (session && session.authState !== "AUTHENTICATED")) {
    return <LoadingWorkspace label={status === "loading" ? "Validating your secure session" : "Redirecting securely"} />;
  }

  if (status === "error") {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas p-5">
        <div className="w-full max-w-lg rounded-lg border border-line bg-white p-7 text-center shadow-soft">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-amber-50 text-amber-600">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-ink">Secure session service unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{error}</p>
          <Button className="mt-5" onClick={() => void refreshSession()} variant="primary">
            Retry connection
          </Button>
        </div>
      </main>
    );
  }

  if (!session) return null;

  const permission = requiredPermission(pathname);
  const allowed = !permission || hasPermission(session, permission);

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-white lg:block">
        <SidebarContent session={session} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/35"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="relative h-full w-[min(88vw,320px)] border-r border-line bg-white shadow-soft">
            <SidebarContent session={session} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <TopBar session={session} onOpenMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8">
          {allowed ? children : <AccessDenied permission={permission} />}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ session, onNavigate }: { session: AuthenticatedUserResponse; onNavigate?: () => void }) {
  const visiblePrimary = navigationConfig.primary.filter((item) => hasPermission(session, item.permission));
  const visibleAdmin = navigationConfig.admin.filter((item) => hasPermission(session, item.permission));
  const homeHref = visiblePrimary[0]?.href ?? visibleAdmin[0]?.href ?? "/settings/profile";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-5">
        <Link className="flex items-center gap-3" href={homeHref} onClick={onNavigate}>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-lg font-semibold text-ink">WealthTwin</span>
            <span className="block text-xs text-muted">Financial Digital Twin</span>
          </span>
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        <NavGroup items={visiblePrimary} onNavigate={onNavigate} />
        {visibleAdmin.length ? (
          <>
            <div className="my-4 border-t border-line" />
            <p className="px-3 pb-2 text-xs font-semibold uppercase text-muted">Organization</p>
            <NavGroup items={visibleAdmin} onNavigate={onNavigate} />
          </>
        ) : null}
      </nav>

      <div className="border-t border-line p-4">
        <div className="rounded-lg border border-line bg-canvas p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase text-muted">Access scope</span>
            <Badge status="healthy">{session.membership.role}</Badge>
          </div>
          <p className="truncate text-sm font-medium text-ink">{session.organization.name}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{session.membership.dataScope}</p>
        </div>
      </div>
    </div>
  );
}

function NavGroup({
  items,
  onNavigate
}: {
  items: ReadonlyArray<{ href: string; label: string; icon: LucideIcon; permission: Permission }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active ? "bg-teal-50 text-teal-700" : "text-muted hover:bg-canvas hover:text-ink"
            )}
            href={item.href}
            onClick={onNavigate}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function TopBar({ session, onOpenMenu }: { session: AuthenticatedUserResponse; onOpenMenu: () => void }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const router = useRouter();
  const { signOut } = useAuth();
  const initials = `${session.user.firstName[0] ?? ""}${session.user.lastName[0] ?? ""}`.toUpperCase();
  const canSeeNotifications = hasPermission(session, "feature.intelligence_center.view");

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  function askAiCfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuestion = question.trim();
    if (normalizedQuestion.length < 3) return;
    router.push(`/ai-cfo?question=${encodeURIComponent(normalizedQuestion)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-[1720px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button aria-label="Open navigation" className="lg:hidden" icon={<Menu className="h-5 w-5" />} onClick={onOpenMenu} size="icon" variant="ghost" />

        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <Building2 className="h-4 w-4 text-teal-600" aria-hidden="true" />
          <span className="max-w-52 truncate text-sm font-medium text-ink">{session.organization.name}</span>
        </div>

        {hasPermission(session, "feature.ai_cfo.use") ? (
          <form className="relative min-w-0 flex-1 lg:ml-4" onSubmit={askAiCfo}>
            <label className="sr-only" htmlFor="topbar-ai-question">Ask WealthTwin</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="h-10 w-full rounded-md border border-line bg-canvas pl-9 pr-11 text-sm text-ink placeholder:text-muted"
              id="topbar-ai-question"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about authorized financial data"
              type="search"
              value={question}
            />
            <button
              aria-label="Open question in AI CFO"
              className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-white hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={question.trim().length < 3}
              type="submit"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : <div className="flex-1" />}

        {canSeeNotifications ? (
          <Link aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink" href="/intelligence">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : null}

        <div className="relative">
          <button
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            className="flex h-10 items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-canvas"
            onClick={() => setUserMenuOpen((open) => !open)}
            type="button"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-xs font-semibold text-white">{initials || <CircleUserRound className="h-4 w-4" />}</span>
            <span className="hidden max-w-32 truncate text-sm font-medium text-ink xl:block">{session.user.firstName}</span>
            <ChevronDown className="hidden h-4 w-4 text-muted sm:block" aria-hidden="true" />
          </button>
          {userMenuOpen ? (
            <div className="absolute right-0 top-12 w-64 rounded-lg border border-line bg-white p-2 shadow-soft" role="menu">
              <div className="border-b border-line px-3 pb-3 pt-2">
                <p className="truncate text-sm font-semibold text-ink">{session.user.firstName} {session.user.lastName}</p>
                <p className="truncate text-xs text-muted">{session.user.email}</p>
              </div>
              <Link className="mt-2 flex min-h-10 items-center gap-2 rounded-md px-3 text-sm text-ink hover:bg-canvas" href="/settings/profile" onClick={() => setUserMenuOpen(false)} role="menuitem">
                <CircleUserRound className="h-4 w-4 text-muted" /> Profile
              </Link>
              <Link className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm text-ink hover:bg-canvas" href="/settings/security" onClick={() => setUserMenuOpen(false)} role="menuitem">
                <ShieldCheck className="h-4 w-4 text-muted" /> Security
              </Link>
              <button className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm text-red-600 hover:bg-red-50" onClick={() => void handleSignOut()} role="menuitem" type="button">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function AccessDenied({ permission }: { permission: Permission | null }) {
  return (
    <div className="grid min-h-[520px] place-items-center">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-amber-50 text-amber-600">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Access restricted</h1>
        <p className="mt-3 text-sm leading-7 text-muted">Your current role does not include the permission required for this workspace. Access remains blocked in both the interface and the backend API.</p>
        {permission ? <code className="mt-4 inline-block rounded-md bg-white px-3 py-2 text-xs text-muted">{permission}</code> : null}
      </div>
    </div>
  );
}
