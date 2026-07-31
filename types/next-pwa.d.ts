declare module "next-pwa" {
    import type { NextConfig } from "next";

    interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        scope?: string;
        sw?: string;
        skipWaiting?: boolean;
        runtimeCaching?: any[];
        publicExcludes?: string[];
        buildExcludes?: any[];
        fallbacks?: {
            document?: string;
            image?: string;
            audio?: string;
            video?: string;
            font?: string;
        };
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        customWorkerDir?: string;
    }

    function withPWAInit(pluginOptions?: PWAConfig): (nextConfig?: NextConfig) => NextConfig;

    export default withPWAInit;
}
