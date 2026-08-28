import {
  Bot,
  BrainCircuit,
  Building2,
  ChartNoAxesCombined,
  CircleGauge,
  HeartPulse,
  Landmark,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import type { AuthenticatedUserResponse, Permission } from "@/lib/contracts";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
};

export const navigationConfig: { primary: NavigationItem[]; admin: NavigationItem[] } = {
  primary: [
    { href: "/command-center", label: "Command Center", icon: CircleGauge, permission: "dashboard.command_center.view" },
    { href: "/financial-health", label: "Financial Health", icon: HeartPulse, permission: "dashboard.financial_health.view" },
    { href: "/cash", label: "Cash & Working Capital", icon: Landmark, permission: "dashboard.cash.view" },
    { href: "/performance", label: "Performance & Forecast", icon: ChartNoAxesCombined, permission: "dashboard.performance.view" },
    { href: "/explorer", label: "Financial Explorer", icon: Search, permission: "explorer.sales_orders.view" },
    { href: "/ai-cfo", label: "AI CFO", icon: Bot, permission: "feature.ai_cfo.use" },
    { href: "/intelligence", label: "Intelligence Center", icon: BrainCircuit, permission: "feature.intelligence_center.view" },
    { href: "/scenarios", label: "Decision Simulator", icon: SlidersHorizontal, permission: "feature.scenario_simulator.use" }
  ],
  admin: [
    { href: "/integrations", label: "Integrations", icon: Building2, permission: "integration.manage" },
    { href: "/control-center", label: "Control Center", icon: ShieldCheck, permission: "admin.control_center.view" },
    { href: "/control-center/users", label: "Users & Roles", icon: UsersRound, permission: "admin.members.manage" },
    { href: "/settings", label: "Settings", icon: Settings, permission: "settings.profile.manage" }
  ]
};

const routePermissions: Array<[string, Permission]> = [
  ["/control-center/users", "admin.members.manage"],
  ["/settings/security", "settings.security.view"],
  ["/settings/profile", "settings.profile.manage"],
  ["/command-center", "dashboard.command_center.view"],
  ["/financial-health", "dashboard.financial_health.view"],
  ["/cash", "dashboard.cash.view"],
  ["/performance", "dashboard.performance.view"],
  ["/explorer", "explorer.sales_orders.view"],
  ["/ai-cfo", "feature.ai_cfo.use"],
  ["/intelligence", "feature.intelligence_center.view"],
  ["/scenarios", "feature.scenario_simulator.use"],
  ["/integrations", "integration.manage"],
  ["/control-center", "admin.control_center.view"],
  ["/settings", "settings.profile.manage"]
];

export function requiredPermission(pathname: string): Permission | null {
  return routePermissions.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? null;
}

export function hasPermission(session: AuthenticatedUserResponse | null, permission: Permission): boolean {
  return Boolean(session?.permissions.includes(permission));
}
