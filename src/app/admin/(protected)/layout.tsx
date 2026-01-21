import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
    return <AdminSidebar>{children}</AdminSidebar>;
}
