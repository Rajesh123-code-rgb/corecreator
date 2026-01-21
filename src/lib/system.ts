import connectDB from "@/lib/db/mongodb";
import SystemConfig from "@/lib/db/models/SystemConfig";
import { cache } from "react";

// Cache results for a short period to avoid hammering DB on every request
// In Next.js App Router, `cache` memoizes the return value for the lifetime of the request.
// For cross-request caching, we'd need a more robust solution (Redis or global variable),
// but for now, we'll fetch from DB and rely on Mongoose connection pooling.

export const getSystemConfig = cache(async (key: string) => {
    try {
        await connectDB();
        const config = await SystemConfig.findOne({ key });
        return config ? config.value : null;
    } catch (error) {
        console.error(`Failed to fetch system config for ${key}:`, error);
        return null;
    }
});

export const isMaintenanceMode = async (): Promise<boolean> => {
    const status = await getSystemConfig("maintenance_mode");
    return status === true;
};

export const isRegistrationOpen = async (): Promise<boolean> => {
    const status = await getSystemConfig("user_registration");
    // Default to true if not set
    return status !== false;
};

export const isAutoApproveStudios = async (): Promise<boolean> => {
    const status = await getSystemConfig("studio_approvals");
    // Default to false if not set
    return status === true;
};
