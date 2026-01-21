import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            adminRole?: string;
            permissions?: string[];
        } & DefaultSession["user"];
    }

    interface User {
        role: string;
        adminRole?: string;
        permissions?: string[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        adminRole?: string;
        permissions?: string[];
    }
}
