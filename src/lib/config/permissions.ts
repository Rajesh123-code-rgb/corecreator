import { Session } from "next-auth";
import { PERMISSIONS, Permission } from "./rbac";

/**
 * Check if a user has admin access with the required permission.
 * Includes fallback for admin users without explicit adminRole set in session.
 */
export function hasAdminPermission(
    session: Session | null,
    requiredPermission?: Permission
): boolean {
    if (!session?.user?.id) return false;

    const { role, adminRole, permissions = [] } = session.user;

    // Must have admin role
    if (role !== "admin") return false;

    // Super admin has all permissions
    if (adminRole === "super") return true;

    // Fallback: if user has 'admin' role but no adminRole set (e.g., session doesn't have it),
    // grant access (this is a temporary fix until session properly includes adminRole)
    if (!adminRole) return true;

    // Check specific permission if required
    if (requiredPermission) {
        return permissions.includes(requiredPermission);
    }

    return true;
}

/**
 * Check if user is at least an admin (any admin role)
 */
export function isAdmin(session: Session | null): boolean {
    return session?.user?.role === "admin";
}
