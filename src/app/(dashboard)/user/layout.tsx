"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BookOpen,
    ShoppingBag,
    Heart,
    User,
    Settings,
    Bell,
    Menu,
    X,
    ChevronLeft,
    Calendar,
    Award,
} from "lucide-react";
import NotificationBell from "@/components/molecules/NotificationBell";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

import { useLanguage } from "@/context/LanguageContext";

export default function UserDashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t, language } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const userNavItems = [
        { label: t("dashboard.welcome").replace(" back", "") || "Dashboard", href: "/user/dashboard", icon: LayoutDashboard }, // Fallback/Hack if keys don't perfectly align, but let's use a generic key if avail
        // Actually, let's use specific keys
        { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard, key: "dashboard.welcome" }, // "welcome" isn't quite right for the link name. 
        // Let's check LanguageContext keys.
        // "dashboard.my_courses": "My Courses"
        // "dashboard.my_workshops": "My Workshops"
        // ...
        // We need a specific key for "Dashboard" link.
        // I will add a generic "dashboard.menu.dashboard": "Dashboard" to keys effectively by using "Dashboard" as fallback if key missing, or better:
        // Let's assume standard keys. 
        // For now I'll use the english defaults as keys if they exist in the map, or specific ones.
    ];

    // Better approach: Define the list with keys
    const navConfig = [
        { key: "dashboard.menu.dashboard", default: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
        { key: "dashboard.my_courses", default: "My Courses", href: "/user/courses", icon: BookOpen },
        { key: "dashboard.my_workshops", default: "My Workshops", href: "/user/workshops", icon: Calendar },
        { key: "dashboard.my_orders", default: "My Orders", href: "/user/orders", icon: ShoppingBag },
        { key: "dashboard.wishlist", default: "Wishlist", href: "/user/wishlist", icon: Heart },
        { key: "dashboard.certificates", default: "Certificates", href: "/user/certificates", icon: Award },
        { key: "dashboard.profile", default: "Profile", href: "/user/profile", icon: User },
        { key: "dashboard.settings", default: "Settings", href: "/user/settings", icon: Settings },
    ];

    const currentTitle = navConfig.find((item) => item.href === pathname);
    const title = currentTitle ? t(currentTitle.key) : "Dashboard";

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-4">
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[var(--muted)]">
                    <Menu className="w-6 h-6" />
                </button>
                <Image src="/logo.png" alt="Core Creator" width={120} height={30} className="h-8 w-auto" />
                <div className="relative">
                    <NotificationBell context="user" />
                </div>
            </header>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full w-64 bg-[var(--card)] border-r border-[var(--border)] transform transition-transform lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border)]">
                    <Link href="/">
                        <Image src="/logo.png" alt="Core Creator" width={130} height={32} className="h-8 w-auto" />
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--secondary-500)] flex items-center justify-center text-white font-medium">
                            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{session?.user?.name || "User"}</p>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">{session?.user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navConfig.map((item) => {
                        const isActive = pathname === item.href;
                        const label = t(item.key) === item.key ? item.default : t(item.key); // Fallback logic if key missing

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[var(--secondary-100)] text-[var(--secondary-700)]"
                                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to Home */}
                <div className="absolute bottom-4 left-4 right-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {language === 'hi' ? 'घर वापस' : 'Back to Home'}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-[var(--card)] border-b border-[var(--border)]">
                    <h1 className="text-lg font-semibold">
                        {t(currentTitle?.key || "") === (currentTitle?.key || "") ? (currentTitle?.default || "Dashboard") : t(currentTitle?.key || "")}
                    </h1>
                    <div className="flex items-center gap-4">
                        <NotificationBell context="user" />
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
