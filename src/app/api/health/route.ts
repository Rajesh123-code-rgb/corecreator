import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db/mongodb";

// A health check must never be cached, or a monitor will happily report "up"
// off a stale response while the app is down.
export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe for uptime monitoring (UptimeRobot, Better Stack,
 * a Docker HEALTHCHECK, etc).
 *
 * Returns 200 only when the app can actually reach MongoDB - checking the
 * process is running isn't useful on its own, since the site renders nothing
 * without the database. Anything else returns 503 so a monitor treats it as
 * down rather than as a successful response with bad content.
 *
 * Response is intentionally free of connection strings, versions and stack
 * traces: this endpoint is unauthenticated, so it says whether things work,
 * never how they're wired.
 */
export async function GET() {
    const startedAt = Date.now();
    let database: "ok" | "unreachable" = "unreachable";

    try {
        await connectDB();
        // readyState 1 === connected. Follow it with a real round-trip, since a
        // socket can look open while the server behind it is unresponsive.
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db?.admin().ping();
            database = "ok";
        }
    } catch {
        database = "unreachable";
    }

    const healthy = database === "ok";

    return NextResponse.json(
        {
            status: healthy ? "ok" : "degraded",
            database,
            uptimeSeconds: Math.round(process.uptime()),
            responseTimeMs: Date.now() - startedAt,
            timestamp: new Date().toISOString(),
        },
        {
            status: healthy ? 200 : 503,
            headers: { "Cache-Control": "no-store, max-age=0" },
        }
    );
}
