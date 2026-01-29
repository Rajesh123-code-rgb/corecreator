"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    BookOpen,
    Calendar,
    BarChart3,
    Settings,
    Shield,
    Menu,
    X,
    Bell,
    Search,
    ChevronDown,
    LogOut,
    Mail,
    Tag,
    DollarSign,
    Package,
    FileText,
    Wallet,
    Globe,
    FolderOpen,
    LifeBuoy,
    MessageSquare,
    RefreshCw,
} from "lucide-react";
import NotificationBell from "@/components/molecules/NotificationBell";
import { CurrencySwitcher } from "@/components/molecules/CurrencySwitcher";

import { PERMISSIONS } from "@/lib/config/rbac";

const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: null }, // Visible to all admins
    { name: "Users", href: "/admin/users", icon: Users, permission: PERMISSIONS.MANAGE_USERS },
    { name: "KYC", href: "/admin/users/verification", icon: Shield, permission: PERMISSIONS.MANAGE_USERS },
    { name: "Orders", href: "/admin/orders", icon: Package, permission: PERMISSIONS.MANAGE_ORDERS },
    { name: "Returns", href: "/admin/returns", icon: RefreshCw, permission: PERMISSIONS.MANAGE_ORDERS },
    { name: "Products", href: "/admin/products", icon: ShoppingBag, permission: PERMISSIONS.MANAGE_PRODUCTS },
    { name: "Courses", href: "/admin/courses", icon: BookOpen, permission: PERMISSIONS.MANAGE_COURSES },
    { name: "Workshops", href: "/admin/workshops", icon: Calendar, permission: PERMISSIONS.MANAGE_COURSES },
    { name: "Categories", href: "/admin/categories", icon: FolderOpen, permission: PERMISSIONS.MANAGE_CATEGORIES },
    { name: "Enquiries", href: "/admin/enquiries", icon: MessageSquare, permission: PERMISSIONS.MANAGE_SUPPORT },
    { name: "Support", href: "/admin/support", icon: LifeBuoy, permission: PERMISSIONS.MANAGE_SUPPORT },
    { name: "Finance", href: "/admin/finance", icon: DollarSign, permission: PERMISSIONS.MANAGE_FINANCE },
    { name: "Payouts", href: "/admin/payouts", icon: Wallet, permission: PERMISSIONS.MANAGE_FINANCE },
    { name: "CMS", href: "/admin/cms", icon: FileText, permission: PERMISSIONS.MANAGE_CMS },
    { name: "SEO", href: "/admin/seo", icon: Globe, permission: PERMISSIONS.MANAGE_SETTINGS },
    { name: "Promo Codes", href: "/admin/promo-codes", icon: Tag, permission: PERMISSIONS.MANAGE_MARKETING },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: PERMISSIONS.VIEW_ANALYTICS },
    { name: "Activity Logs", href: "/admin/audit-logs", icon: FileText, permission: PERMISSIONS.MANAGE_SETTINGS },
    { name: "Settings", href: "/admin/settings", icon: Settings, permission: PERMISSIONS.MANAGE_SETTINGS },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    // Get user permissions from session
    const userPermissions = session?.user?.permissions || [];
    const userAdminRole = session?.user?.adminRole;
    const userRole = session?.user?.role;

    const filteredNavigation = navigation.filter(item => {
        if (!item.permission) return true;
        // Allow if user is super admin (implicit or via permissions)
        if (userAdminRole === "super") return true;
        // Fallback: if user has 'admin' role but no adminRole set, show all (for super admin without explicit adminRole)
        if (userRole === "admin" && !userAdminRole) return true;
        return userPermissions.includes(item.permission);
    });

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform lg:translate-x-0 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 flex-shrink-0">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <Shield className="w-8 h-8 text-purple-500" />
                        <span className="font-bold text-lg">Admin Panel</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 hover:bg-gray-800 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800 flex-shrink-0 bg-gray-900">
                    <div className="flex items-center gap-3 justify-between group">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold uppercase text-sm">
                                {userAdminRole?.[0] || session?.user?.name?.charAt(0) || "A"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{session?.user?.name || "Admin"}</p>
                                <p className="text-xs text-gray-400 truncate capitalize">{userAdminRole || "Staff Access"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search..."
                                className="w-64 pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:block">
                            <CurrencySwitcher variant="minimal" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50" />
                        </div>
                        <NotificationBell context="admin" />
                        <Link
                            href="/"
                            className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block"
                        >
                            View Site →
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
