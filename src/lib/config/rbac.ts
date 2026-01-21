export type AdminRole = "super" | "operations" | "content" | "seo" | "finance" | "support";

export const PERMISSIONS = {
    // Users
    MANAGE_USERS: "manage_users",
    BAN_USERS: "ban_users",
    VERIFY_USERS: "verify_users",

    // Content
    MANAGE_COURSES: "manage_courses",
    APPROVE_COURSES: "approve_courses",
    MANAGE_PRODUCTS: "manage_products",
    APPROVE_PRODUCTS: "approve_products",
    MANAGE_WORKSHOPS: "manage_workshops",
    APPROVE_WORKSHOPS: "approve_workshops",
    MANAGE_CMS: "manage_cms",

    // Business
    MANAGE_ORDERS: "manage_orders",
    REFUND_ORDERS: "refund_orders",
    MANAGE_FINANCE: "manage_finance",

    // Growth
    MANAGE_SEO: "manage_seo",
    MANAGE_MARKETING: "manage_marketing",

    // System
    VIEW_ANALYTICS: "view_analytics",
    MANAGE_SETTINGS: "manage_settings",
    VIEW_AUDIT_LOGS: "view_audit_logs",

    // New Modules
    MANAGE_CATEGORIES: "manage_categories",
    MANAGE_SUPPORT: "manage_support",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
    super: Object.values(PERMISSIONS),

    operations: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.VERIFY_USERS,
        PERMISSIONS.MANAGE_ORDERS,
        PERMISSIONS.REFUND_ORDERS,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_CATEGORIES,
        PERMISSIONS.MANAGE_SUPPORT
    ],

    content: [
        PERMISSIONS.MANAGE_COURSES,
        PERMISSIONS.APPROVE_COURSES,
        PERMISSIONS.MANAGE_PRODUCTS,
        PERMISSIONS.APPROVE_PRODUCTS,
        PERMISSIONS.MANAGE_WORKSHOPS,
        PERMISSIONS.APPROVE_WORKSHOPS,
        PERMISSIONS.MANAGE_CMS,
        PERMISSIONS.MANAGE_CATEGORIES
    ],

    seo: [
        PERMISSIONS.MANAGE_SEO,
        PERMISSIONS.MANAGE_CMS,
        PERMISSIONS.MANAGE_MARKETING,
        PERMISSIONS.VIEW_ANALYTICS
    ],

    finance: [
        PERMISSIONS.MANAGE_FINANCE,
        PERMISSIONS.MANAGE_ORDERS,
        PERMISSIONS.REFUND_ORDERS,
        PERMISSIONS.VIEW_ANALYTICS
    ],

    support: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_ORDERS,
        PERMISSIONS.MANAGE_SUPPORT
    ],
};
