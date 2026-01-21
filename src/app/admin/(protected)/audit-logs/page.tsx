"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    FileText,
    Search,
    Loader2,
    Filter,
    User,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    AlertTriangle,
    Info,
    Calendar
} from "lucide-react";

interface AuditLog {
    _id: string;
    userId: { _id: string; name: string; email: string; role: string };
    action: string;
    resource: string;
    description: string;
    changes?: { field: string; oldValue: unknown; newValue: unknown }[];
    ipAddress?: string;
    severity: "info" | "warning" | "critical";
    createdAt: string;
}

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = React.useState<AuditLog[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [filters, setFilters] = React.useState({ action: "", resource: "", severity: "" });
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [availableFilters, setAvailableFilters] = React.useState({ actions: [] as string[], resources: [] as string[] });
    const [expandedLog, setExpandedLog] = React.useState<string | null>(null);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchLogs = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "50" });
            if (filters.action) params.set("action", filters.action);
            if (filters.resource) params.set("resource", filters.resource);
            if (filters.action) params.set("action", filters.action);
            if (filters.resource) params.set("resource", filters.resource);
            if (filters.severity) params.set("severity", filters.severity);
            if (debouncedSearch) params.set("search", debouncedSearch);

            const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setTotalPages(data.pagination?.pages || 1);
                setAvailableFilters(data.filters || { actions: [], resources: [] });
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    }, [page, filters, debouncedSearch]);

    React.useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "critical": return <AlertCircle className="w-4 h-4 text-red-500" />;
            case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const getSeverityBadge = (severity: string) => {
        const styles: Record<string, string> = {
            info: "bg-blue-100 text-blue-700",
            warning: "bg-yellow-100 text-yellow-700",
            critical: "bg-red-100 text-red-700",
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[severity]}`}>
                {severity}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-500 mt-1">Track all system activities and changes</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by User Name or Email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={filters.action}
                            onChange={(e) => { setFilters(p => ({ ...p, action: e.target.value })); setPage(1); }}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="">All Actions</option>
                            {availableFilters.actions.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select
                            value={filters.resource}
                            onChange={(e) => { setFilters(p => ({ ...p, resource: e.target.value })); setPage(1); }}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="">All Resources</option>
                            {availableFilters.resources.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select
                            value={filters.severity}
                            onChange={(e) => { setFilters(p => ({ ...p, severity: e.target.value })); setPage(1); }}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="">All Severities</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>
                        {(filters.action || filters.resource || filters.severity || search) && (
                            <Button variant="outline" size="sm" onClick={() => { setFilters({ action: "", resource: "", severity: "" }); setSearch(""); }}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" /></td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No audit logs found</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <React.Fragment key={log._id}>
                                        <tr
                                            className={`hover:bg-gray-50 cursor-pointer ${log.changes?.length ? "cursor-pointer" : ""}`}
                                            onClick={() => log.changes?.length && setExpandedLog(expandedLog === log._id ? null : log._id)}
                                        >
                                            <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(log.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
                                                        {log.userId?.name?.charAt(0) || "?"}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">{log.userId?.name || "System"}</span>
                                                        <span className="text-xs text-gray-500 capitalize">{log.userId?.role || "System"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{log.action}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{log.resource}</td>
                                            <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{log.description}</td>
                                            <td className="px-6 py-3">{getSeverityBadge(log.severity)}</td>
                                        </tr>
                                        {expandedLog === log._id && log.changes && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <p className="font-medium text-gray-700 mb-2">Changes:</p>
                                                        <div className="space-y-1">
                                                            {log.changes.map((change, i) => (
                                                                <div key={i} className="flex gap-4 text-xs">
                                                                    <span className="font-medium text-gray-600 w-24">{change.field}</span>
                                                                    <span className="text-red-600 line-through">{JSON.stringify(change.oldValue)}</span>
                                                                    <span>→</span>
                                                                    <span className="text-green-600">{JSON.stringify(change.newValue)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
