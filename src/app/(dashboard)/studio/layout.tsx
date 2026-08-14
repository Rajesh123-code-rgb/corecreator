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
    Package,
    BarChart3,
    DollarSign,
    Users,
    Settings,
    Bell,
    Star,
    MessageSquare,
    Menu,
    X,
    ChevronLeft,
    Calendar,
    Palette,
    Shield,
    Headphones,
    ShoppingCart,
    RefreshCw,
} from "lucide-react";
import NotificationBell from "@/components/molecules/NotificationBell";
import { CurrencySwitcher } from "@/components/molecules/CurrencySwitcher";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const creatorNavItems = [
    { label: "Dashboard", href: "/studio/dashboard", icon: LayoutDashboard },
    { label: "My Courses", href: "/studio/courses", icon: BookOpen },
    { label: "My Artworks", href: "/studio/products", icon: Package },
    { label: "Inventory", href: "/studio/inventory", icon: BarChart3 },
    { label: "Orders", href: "/studio/orders", icon: ShoppingCart },
    { label: "Returns", href: "/studio/returns", icon: RefreshCw },
    { label: "Workshops", href: "/studio/workshops", icon: Calendar },
    { label: "Analytics", href: "/studio/analytics", icon: BarChart3 },
    { label: "Earnings", href: "/studio/earnings", icon: DollarSign },
    { label: "Students & Buyers", href: "/studio/audience", icon: Users },
    { label: "Reviews", href: "/studio/reviews", icon: Star },
    { label: "Messages", href: "/studio/messages", icon: MessageSquare },
    { label: "Verification", href: "/studio/verification", icon: Shield },
    { label: "Support", href: "/studio/support", icon: Headphones },
    { label: "Settings", href: "/studio/settings", icon: Settings },
];

export default function CreatorDashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-[var(--muted)]"
                    aria-label="Open studio menu"
                    aria-expanded={sidebarOpen}
                >
                    <Menu className="w-6 h-6" />
                </button>
                <Image src="/logo.png" alt="Core Creator" width={150} height={80} className="h-8 w-auto" />
                <div className="relative">
                    <NotificationBell context="studio" />
                </div>
            </header>

            {sidebarOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            {/* Column layout with a scrolling nav. Previously the aside was a
                plain block with no overflow and "Back to Home" pinned with
                absolute bottom-4: the item list simply ran past the bottom of
                the screen with no way to scroll to it, and the pinned link sat
                on top of whatever it reached. Thirteen items happened to fit;
                fifteen did not. */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-dvh w-64 bg-gradient-to-b from-amber-900 to-amber-950 text-white transform transition-transform lg:translate-x-0 flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-white/10">
                    <Link href="/">
                        <Image src="/logo.png" alt="Core Creator" width={150} height={80} className="h-8 w-auto brightness-0 invert" />
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-white/10"
                        aria-label="Close studio menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-shrink-0 p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-white font-medium">
                            <Palette className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{session?.user?.name || "Creator"}</p>
                            <p className="text-xs text-white/60 truncate">Artist & Instructor</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-1">
                    {creatorNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* A normal flex child at the end of the column, not absolutely
                    positioned - so it sits below the list instead of on top of
                    it however many items there are. */}
                <div className="flex-shrink-0 p-4 border-t border-white/10">
                    <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </aside>

            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-white border-b border-[var(--border)]">
                    {/* Context label, not a heading: each page renders its own
                        h1, and two h1s per page is neither valid structure nor
                        useful to a screen reader. */}
                    <p className="text-lg font-semibold">
                        {creatorNavItems.find((item) => pathname.startsWith(item.href))?.label || "Creator Studio"}
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block">
                            <CurrencySwitcher variant="minimal" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50" />
                        </div>
                        <Link href="/studio/courses/new" className="px-4 py-2 rounded-lg gradient-gold text-[var(--neutral-900)] text-sm font-medium hover:opacity-90">
                            + New Course
                        </Link>
                        <Link href="/studio/products/new" className="px-4 py-2 rounded-lg bg-[var(--secondary-500)] hover:bg-[var(--secondary-600)] text-white text-sm font-medium">
                            + New Artwork
                        </Link>
                        <NotificationBell context="studio" />
                        <button
                            onClick={() => signOut({ callbackUrl: "/studio/login" })}
                            className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </header>
                <div className="p-4 lg:p-8">{children}</div>
            </main>
        </div >
    );
}
