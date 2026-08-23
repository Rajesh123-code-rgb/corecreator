import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

/* ---------------------------------------------------------------------------
 * Portals
 *
 * One application serves three hostnames:
 *
 *   corecreator.online          storefront and buyer account
 *   studio.corecreator.online   creator dashboard
 *   admin.corecreator.online    administration
 *
 * Sessions are deliberately NOT shared. NextAuth's cookie is host-scoped by
 * default (no `domain` attribute), so a session on the shop is invisible to
 * admin. That is the point of the split: a cross-site scripting flaw on the
 * storefront cannot be used to act as an administrator. It also means signing
 * in separately on each portal, which is the cost of that isolation.
 *
 * NextAuth v4 derives its origin per request when AUTH_TRUST_HOST is set - see
 * detectOrigin() in next-auth/utils - so one deployment can mint valid sessions
 * for all three hosts.
 * ------------------------------------------------------------------------- */

const APEX = "corecreator.online";

type Portal = "main" | "studio" | "admin";

function portalFor(req: NextRequest): Portal {
    // x-forwarded-host is what nginx passes through; host is the fallback for
    // direct requests.
    const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toLowerCase();
    if (host.startsWith("studio.")) return "studio";
    if (host.startsWith("admin.")) return "admin";
    return "main";
}

// Real dashboard pages under (dashboard)/studio/* - keep in sync with
// src/app/(dashboard)/studio/*. Anything under /studio/ that is NOT one of
// these is a public route (currently just /studio/login) and must stay
// viewable without a session.
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
    const segment = pathname.split("/")[2];
    return segment ? STUDIO_DASHBOARD_SEGMENTS.has(segment) : false;
}

/** Paths every portal needs regardless of host. */
function isSharedInfrastructure(pathname: string): boolean {
    return (
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next/") ||
        pathname === "/favicon.ico" ||
        pathname === "/robots.txt" ||
        pathname === "/llms.txt" ||
        pathname === "/sitemap.xml" ||
        pathname === "/manifest.json"
    );
}

const authMiddleware = withAuth(
    function onAuthorized(req) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-pathname", req.nextUrl.pathname);

        return NextResponse.next({
            request: { headers: requestHeaders },
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

                // Non-dashboard /studio paths stay public.
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

/** Headers that differ per portal: crawl rules and content policy. */
function applyPortalHeaders(res: NextResponse, portal: Portal): NextResponse {
    if (portal !== "main") {
        // A dashboard is not content. Belt and braces alongside robots.txt.
        res.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    // Admin needs none of the payment, video or translate origins the
    // storefront does, so it gets a tighter policy rather than the union.
    if (portal === "admin") {
        res.headers.set(
            "Content-Security-Policy-Report-Only",
            [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "font-src 'self' data:",
                "img-src 'self' data: blob: https://res.cloudinary.com https://ui-avatars.com",
                "connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com",
                "frame-src 'none'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
            ].join("; ")
        );
    }
    return res;
}

/**
 * Runs the existing auth chain and stamps the portal's headers on whatever it
 * returns - which may be a redirect to sign-in, so the headers are applied to
 * the response rather than the request.
 */
async function guarded(req: NextRequest, event: NextFetchEvent, portal: Portal) {
    const res = await authMiddleware(req as NextRequestWithAuth, event);
    return applyPortalHeaders((res ?? NextResponse.next()) as NextResponse, portal);
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
    const portal = portalFor(req);
    const { pathname } = req.nextUrl;

    // Assets, APIs and crawl files behave identically on every host.
    if (isSharedInfrastructure(pathname)) {
        return authMiddleware(req as NextRequestWithAuth, event);
    }

    if (portal === "studio") {
        // The portal root is the dashboard.
        if (pathname === "/") {
            return NextResponse.redirect(new URL("/studio/dashboard", req.url));
        }
        // withAuth sends unauthenticated users to /login; on this host that
        // should be the creator sign-in, not the buyer one.
        if (pathname === "/login") {
            const target = new URL("/studio/login", req.url);
            target.search = req.nextUrl.search;
            return NextResponse.redirect(target);
        }
        // Storefront routes do not belong here - send them to the apex rather
        // than serving two copies of the shop.
        if (!pathname.startsWith("/studio")) {
            return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${APEX}`));
        }
        return guarded(req, event, portal);
    }

    if (portal === "admin") {
        if (pathname === "/") {
            return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
        if (pathname === "/login") {
            const target = new URL("/admin/login", req.url);
            target.search = req.nextUrl.search;
            return NextResponse.redirect(target);
        }
        if (!pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL(pathname + req.nextUrl.search, `https://${APEX}`));
        }
        return guarded(req, event, portal);
    }

    // Apex. Administration is not acknowledged here at all - a redirect would
    // confirm the path exists, so it 404s like any unknown route.
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        // Rewritten to a path no route matches, so Next renders not-found.tsx
        // with a 404. The App Router has no "/404" route, and returning a bare
        // 404 here would lose the styled page.
        const notFound = req.nextUrl.clone();
        notFound.pathname = "/portal-not-found";
        return NextResponse.rewrite(notFound);
    }

    // The creator dashboard has moved. A permanent redirect keeps existing
    // bookmarks and any indexed links working through the transition.
    if (isStudioDashboardPath(pathname)) {
        return NextResponse.redirect(
            new URL(pathname + req.nextUrl.search, `https://studio.${APEX}`),
            308
        );
    }

    return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
    matcher: [
        // Everything except static assets and files with an extension. The
        // hostname routing above has to see ordinary page requests, which the
        // previous path-scoped matcher never received.
        "/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
    ],
};
