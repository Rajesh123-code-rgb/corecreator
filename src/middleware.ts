import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Real dashboard pages under (dashboard)/studio/* - keep in sync with
// src/app/(dashboard)/studio/*. Anything under /studio/ that is NOT one of
// these is a dynamic route (currently just the public /studio/[id] seller
// profile page) and must stay publicly viewable, not gated behind auth.
const STUDIO_DASHBOARD_SEGMENTS = new Set([
    "dashboard",
    "analytics",
    "audience",
    "courses",
    "earnings",
    "inventory",
    "messages",
    "notifications",
    "orders",
    "products",
    "returns",
    "reviews",
    "settings",
    "support",
    "verification",
    "workshops",
]);

function isStudioDashboardPath(pathname: string): boolean {
    const segment = pathname.split("/")[2]; // "" | "login" | "register" | "<id>" | "dashboard" | ...
    return segment ? STUDIO_DASHBOARD_SEGMENTS.has(segment) : false;
}

export default withAuth(
    function middleware(req) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-pathname", req.nextUrl.pathname);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    },
    {
        pages: {
            signIn: "/login",
        },
        callbacks: {
            authorized: ({ req, token }) => {
                const pathname = req.nextUrl.pathname;

                // Always allow maintenance page
                if (pathname === "/maintenance") {
                    return true;
                }

                // Allow access to login/register pages without auth
                if (pathname.match(/\/(studio|user|admin)\/login/) ||
                    pathname.match(/\/(studio|user)\/register/)) {
                    return true;
                }

                // Public seller profile pages (/studio/[id]) are not a dashboard
                // route - anyone should be able to view a creator's public shop.
                if (pathname.startsWith("/studio/") && !isStudioDashboardPath(pathname)) {
                    return true;
                }

                // Require auth for other protected routes
                if (!token) return false;

                // Role-based protection
                if (pathname.startsWith("/admin")) {
                    return token.role === "admin";
                }

                if (pathname.startsWith("/studio")) {
                    return token.role === "studio" || token.role === "admin";
                }

                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        "/maintenance",
        "/learn/:slug/player",
        "/studio/:path*",
        "/user/:path*",
        "/admin/:path*"
    ]
};
