"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms";
import { SearchBar } from "@/components/molecules";
import { useCart } from "@/context";
import {
    Menu,
    X,
    Search,
    ShoppingCart,
    Heart,
    Palette,
    GraduationCap,
    Store,
    Calendar,
    User,
    LogOut,
    Settings,
    BookOpen,
    LayoutDashboard,
    ChevronDown,
    Sun,
    Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

const navigation = [
    {
        name: "Marketplace",
        href: "/marketplace",
        icon: Store,
        description: "Browse artworks & crafts",
    },
    {
        name: "Learn",
        href: "/learn",
        icon: GraduationCap,
        description: "Courses & tutorials",
    },
    {
        name: "Workshops",
        href: "/workshops",
        icon: Calendar,
        description: "Live & offline events",
    },
];

export function Header() {
    const { data: session, status } = useSession();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { itemCount } = useCart();
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close user menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => setIsUserMenuOpen(false);
        if (isUserMenuOpen) {
            document.addEventListener("click", handleClickOutside);
            return () => document.removeEventListener("click", handleClickOutside);
        }
    }, [isUserMenuOpen]);

    const handleSignOut = () => {
        signOut({ callbackUrl: "/" });
    };

    const userMenuItems = [
        { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
        { label: "My Courses", href: "/user/courses", icon: BookOpen },
        { label: "Settings", href: "/user/profile", icon: Settings },
    ];

    const headerIconColor = isScrolled ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]";

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]"
            )}
        >
            <div className="container-app">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo - Single Image */}
                    <Link href="/" className="flex items-center group">
                        <Image
                            src="/logo.png"
                            alt="Core Creator"
                            width={160}
                            height={40}
                            className="h-10 w-auto group-hover:scale-105 transition-transform"
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group relative px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--muted)]",
                                    isScrolled ? "text-[var(--foreground)]" : "text-[var(--foreground)]"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <item.icon className={cn(
                                        "w-4 h-4 transition-colors group-hover:text-[var(--secondary-500)]",
                                        headerIconColor
                                    )} />
                                    {item.name}
                                </span>
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-2">
                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                                className="p-2.5 rounded-lg hover:bg-[var(--muted)] transition-colors relative"
                                aria-label="Toggle Theme"
                            >
                                <Sun className={cn("w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0", headerIconColor)} />
                                <Moon className={cn("absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", headerIconColor)} />
                            </button>
                        )}

                        {/* Search */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                            aria-label="Search"
                        >
                            <Search className={cn("w-5 h-5", headerIconColor)} />
                        </button>



                        {/* Cart */}
                        <Link
                            href="/cart"
                            className="p-2.5 rounded-lg hover:bg-[var(--muted)] transition-colors relative"
                        >
                            <ShoppingCart className={cn("w-5 h-5", headerIconColor)} />
                            {itemCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--secondary-500)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {itemCount > 9 ? "9+" : itemCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth Section */}
                        {status === "loading" ? (
                            <div className="w-24 h-9 bg-[var(--muted)] rounded-lg animate-pulse" />
                        ) : session ? (
                            /* User Menu */
                            <div className="relative ml-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsUserMenuOpen(!isUserMenuOpen);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                                >
                                    {session.user?.image ? (
                                        <Image
                                            src={session.user.image}
                                            alt={session.user.name || "User"}
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[var(--secondary-500)] flex items-center justify-center text-white text-sm font-medium">
                                            {session.user?.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                    )}
                                    <span className={cn("text-sm font-medium max-w-[100px] truncate", isScrolled ? "text-[var(--foreground)]" : "text-[var(--foreground)]")}>
                                        {session.user?.name?.split(" ")[0]}
                                    </span>
                                    <ChevronDown className={cn("w-4 h-4", headerIconColor)} />
                                </button>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] py-2 animate-scale-in">
                                        <div className="px-4 py-2 border-b border-[var(--border)]">
                                            <p className="font-medium text-sm text-[var(--foreground)]">{session.user?.name}</p>
                                            <p className="text-xs text-[var(--muted-foreground)]">
                                                {session.user?.email}
                                            </p>
                                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-[var(--secondary-100)] text-[var(--secondary-700)] rounded-full capitalize">
                                                {session.user?.role || "learner"}
                                            </span>
                                        </div>
                                        {userMenuItems.map((item) => (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <item.icon className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                {item.label}
                                            </Link>
                                        ))}
                                        <div className="border-t border-[var(--border)] mt-2 pt-2">
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Auth Buttons */
                            <div className="flex items-center gap-2 ml-2">
                                <Button variant="ghost" size="sm" asChild className={!isScrolled ? "text-[var(--foreground)] hover:bg-[var(--muted)]" : ""}>
                                    <Link href="/login">Log in</Link>
                                </Button>
                                <Button variant="secondary" size="sm" asChild>
                                    <Link href="/register">Get Started</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className={cn("w-6 h-6", headerIconColor)} />
                        ) : (
                            <Menu className={cn("w-6 h-6", headerIconColor)} />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-[var(--background)] border-t border-[var(--border)] animate-fade-in-down">
                    <div className="container-app py-4 space-y-2">
                        {/* Mobile Theme Toggle & Search */}
                        <div className="flex items-center gap-2 mb-4 px-4 bg-[var(--muted)] rounded-lg p-2">
                            <Search className="w-5 h-5 text-[var(--muted-foreground)]" />
                            <input
                                type="search"
                                placeholder="Search..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                            />
                            <button
                                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                                className="p-2 rounded-md hover:bg-white/10 transition-colors ml-2"
                                aria-label="Toggle Theme"
                            >
                                {mounted && (resolvedTheme === "dark" ? <Sun className="w-5 h-5 text-[var(--foreground)]" /> : <Moon className="w-5 h-5 text-[var(--foreground)]" />)}
                            </button>
                        </div>

                        {/* Navigation Links */}
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--muted)] transition-colors"
                            >
                                <item.icon className="w-5 h-5 text-[var(--secondary-500)]" />
                                <div>
                                    <span className="font-medium">{item.name}</span>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                        {item.description}
                                    </p>
                                </div>
                            </Link>
                        ))}

                        {/* Mobile Auth Actions */}
                        {session ? (
                            <div className="pt-4 border-t border-[var(--border)] space-y-2">
                                <Link
                                    href="/user/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--muted)] transition-colors"
                                >
                                    <LayoutDashboard className="w-5 h-5 text-[var(--muted-foreground)]" />
                                    <span>Dashboard</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 w-full transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <div className="pt-4 border-t border-[var(--border)] flex gap-2">
                                <Button variant="outline" className="flex-1" asChild>
                                    <Link href="/login">Log in</Link>
                                </Button>
                                <Button variant="secondary" className="flex-1" asChild>
                                    <Link href="/register">Get Started</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search Modal */}
            {isSearchOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 animate-fade-in"
                    onClick={() => setIsSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl mx-4 bg-[var(--card)] rounded-2xl shadow-2xl p-4 animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SearchBar
                            placeholder="Search artworks, courses, artists..."
                            className="w-full"
                        />
                        <div className="mt-4 text-sm text-[var(--muted-foreground)]">
                            <p>Popular: Watercolor, Portrait, Oil Painting, Sculpture</p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
