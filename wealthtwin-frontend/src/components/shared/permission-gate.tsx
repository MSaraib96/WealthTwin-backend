"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import type { Permission } from "@/lib/contracts";
import { hasPermission } from "@/lib/permissions";

export function PermissionGate({
  permission,
  children,
  fallback = null
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { session } = useAuth();
  return hasPermission(session, permission) ? children : fallback;
}
