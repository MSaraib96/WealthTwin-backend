from __future__ import annotations

from enum import StrEnum


class Permission(StrEnum):
    DASHBOARD_COMMAND_CENTER_VIEW = "dashboard.command_center.view"
    DASHBOARD_FINANCIAL_HEALTH_VIEW = "dashboard.financial_health.view"
    DASHBOARD_CASH_VIEW = "dashboard.cash.view"
    DASHBOARD_PERFORMANCE_VIEW = "dashboard.performance.view"
    EXPLORER_SALES_ORDERS_VIEW = "explorer.sales_orders.view"
    METRIC_REVENUE_VIEW = "metric.revenue.view"
    METRIC_CASH_VIEW = "metric.cash.view"
    FEATURE_AI_CFO_USE = "feature.ai_cfo.use"
    FEATURE_INTELLIGENCE_CENTER_VIEW = "feature.intelligence_center.view"
    FEATURE_SCENARIO_SIMULATOR_USE = "feature.scenario_simulator.use"
    INTEGRATION_MANAGE = "integration.manage"
    ADMIN_CONTROL_CENTER_VIEW = "admin.control_center.view"
    ADMIN_MEMBERS_MANAGE = "admin.members.manage"
    ADMIN_INVITATIONS_CREATE = "admin.invitations.create"
    ADMIN_ROLES_MANAGE = "admin.roles.manage"
    SETTINGS_SECURITY_VIEW = "settings.security.view"
    SETTINGS_PROFILE_MANAGE = "settings.profile.manage"
    AUTH_SESSIONS_MANAGE = "auth.sessions.manage"


ROLE_PERMISSIONS: dict[str, set[Permission]] = {
    "Organization Admin": set(Permission),
    "CFO": {
        Permission.DASHBOARD_COMMAND_CENTER_VIEW,
        Permission.DASHBOARD_FINANCIAL_HEALTH_VIEW,
        Permission.DASHBOARD_CASH_VIEW,
        Permission.DASHBOARD_PERFORMANCE_VIEW,
        Permission.EXPLORER_SALES_ORDERS_VIEW,
        Permission.METRIC_REVENUE_VIEW,
        Permission.METRIC_CASH_VIEW,
        Permission.FEATURE_AI_CFO_USE,
        Permission.FEATURE_INTELLIGENCE_CENTER_VIEW,
        Permission.FEATURE_SCENARIO_SIMULATOR_USE,
        Permission.INTEGRATION_MANAGE,
        Permission.ADMIN_CONTROL_CENTER_VIEW,
        Permission.SETTINGS_SECURITY_VIEW,
        Permission.SETTINGS_PROFILE_MANAGE,
        Permission.AUTH_SESSIONS_MANAGE,
    },
    "CEO": {
        Permission.DASHBOARD_COMMAND_CENTER_VIEW,
        Permission.DASHBOARD_FINANCIAL_HEALTH_VIEW,
        Permission.DASHBOARD_CASH_VIEW,
        Permission.DASHBOARD_PERFORMANCE_VIEW,
        Permission.METRIC_REVENUE_VIEW,
        Permission.METRIC_CASH_VIEW,
        Permission.FEATURE_AI_CFO_USE,
        Permission.FEATURE_INTELLIGENCE_CENTER_VIEW,
        Permission.FEATURE_SCENARIO_SIMULATOR_USE,
        Permission.SETTINGS_SECURITY_VIEW,
        Permission.SETTINGS_PROFILE_MANAGE,
    },
    "Finance Manager": {
        Permission.DASHBOARD_CASH_VIEW,
        Permission.EXPLORER_SALES_ORDERS_VIEW,
        Permission.METRIC_CASH_VIEW,
        Permission.SETTINGS_SECURITY_VIEW,
        Permission.SETTINGS_PROFILE_MANAGE,
    },
    "Department Manager": {
        Permission.DASHBOARD_COMMAND_CENTER_VIEW,
        Permission.DASHBOARD_PERFORMANCE_VIEW,
        Permission.METRIC_REVENUE_VIEW,
        Permission.FEATURE_INTELLIGENCE_CENTER_VIEW,
        Permission.SETTINGS_SECURITY_VIEW,
        Permission.SETTINGS_PROFILE_MANAGE,
    },
    "Sales Manager": {
        Permission.DASHBOARD_COMMAND_CENTER_VIEW,
        Permission.DASHBOARD_PERFORMANCE_VIEW,
        Permission.EXPLORER_SALES_ORDERS_VIEW,
        Permission.METRIC_REVENUE_VIEW,
        Permission.FEATURE_INTELLIGENCE_CENTER_VIEW,
        Permission.SETTINGS_SECURITY_VIEW,
        Permission.SETTINGS_PROFILE_MANAGE,
    },
    "Analyst": {
        Permission.DASHBOARD_COMMAND_CENTER_VIEW,
        Permission.DASHBOARD_FINANCIAL_HEALTH_VIEW,
        Permission.DASHBOARD_CASH_VIEW,
        Permission.DASHBOARD_PERFORMANCE_VIEW,
        Permission.EXPLORER_SALES_ORDERS_VIEW,
        Permission.METRIC_REVENUE_VIEW,
        Permission.METRIC_CASH_VIEW,
        Permission.SETTINGS_SECURITY_VIEW,
        Permission.SETTINGS_PROFILE_MANAGE,
    },
}


def resolve_permissions(role: str, custom_permissions: set[Permission] | None = None) -> set[Permission]:
    permissions = set(ROLE_PERMISSIONS.get(role, set()))
    if custom_permissions:
        permissions.update(custom_permissions)
    return permissions
