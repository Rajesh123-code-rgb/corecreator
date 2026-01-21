import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

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
        "/studio/:path*",
        "/user/:path*",
        "/admin/:path*"
    ]
};
