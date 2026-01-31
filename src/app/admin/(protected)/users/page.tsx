"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { useToast } from "@/components/molecules";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    User as UserIcon,
    Shield,
    Palette,
    Loader2,
    Lock,
    Unlock,
    Plus,
    MoreHorizontal,
    Users,
    UserCheck,
    UserX,
    X,
    Mail,
    MessageSquare,
    LogIn
} from "lucide-react";
import { Button } from "@/components/atoms";

interface User {
    _id: string;
    name: string;
    email: string;
    role: "user" | "studio" | "admin";
    avatar?: string;
    createdAt: string;
    isActive: boolean;
}

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useToast();
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState("");
    const [roleFilter, setRoleFilter] = React.useState<string>("all");
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [stats, setStats] = React.useState({ total: 0, active: 0, banned: 0 });
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [createForm, setCreateForm] = React.useState({ name: "", email: "", password: "", role: "user" });
    const [createLoading, setCreateLoading] = React.useState(false);
    const [createError, setCreateError] = React.useState("");
    const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
    const [viewUser, setViewUser] = React.useState<User | null>(null);
    const [editUser, setEditUser] = React.useState<User | null>(null);
    const [editForm, setEditForm] = React.useState({ name: "", email: "", role: "user" });
    const [editLoading, setEditLoading] = React.useState(false);
    const [editError, setEditError] = React.useState("");

    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; right: number } | null>(null);

    // Close dropdowns on outside click or scroll - Handled by overlay now


    // Check for ?create=true query parameter
    React.useEffect(() => {
        if (searchParams.get("create") === "true") {
            setShowCreateModal(true);
            router.replace("/admin/users", { scroll: false });
        }
    }, [searchParams, router]);

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                role: roleFilter,
            });
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotalPages(data.pagination.pages);
                setStats({
                    total: data.pagination.total,
                    active: data.users.filter((u: User) => u.isActive).length,
                    banned: data.users.filter((u: User) => !u.isActive).length
                });
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [page, roleFilter, search]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleAction = async (userId: string, action: "ban" | "activate") => {
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...data.user } : u));
            } else {
                const err = await res.json();
                toast.error(err.error || "Action failed");
            }
        } catch (error) {
            console.error("Action error:", error);
            toast.error("Failed to perform action");
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin": return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Shield className="w-3 h-3" /> Admin</span>;
            case "studio": return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Palette className="w-3 h-3" /> Studio</span>;
            default: return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><UserIcon className="w-3 h-3" /> User</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage system users, studios, and administrators</p>
                </div>
                <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <UserCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                            <p className="text-sm text-gray-500">Active Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                            <UserX className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.banned}</p>
                            <p className="text-sm text-gray-500">Banned Users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {["all", "user", "studio", "admin"].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRoleFilter(r)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === r
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {user.isActive ? "Active" : "Banned"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setDropdownPosition({
                                                            top: rect.bottom + 5,
                                                            right: window.innerWidth - rect.right
                                                        });
                                                        setActiveDropdown(prev => prev === user._id ? null : user._id);
                                                    }}
                                                    className={`action-menu-trigger p-2 hover:bg-gray-100 rounded-lg transition-colors ${activeDropdown === user._id ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Fixed Position Dropdown */}
            {activeDropdown && dropdownPosition && (() => {
                const user = users.find(u => u._id === activeDropdown);
                if (!user) return null;
                return (
                    <>
                        <div
                            className="fixed inset-0 z-[9998] cursor-default"
                            onClick={() => {
                                setActiveDropdown(null);
                                setDropdownPosition(null);
                            }}
                        />
                        <div
                            className="fixed bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] border border-gray-100 py-1 z-[9999] animate-in fade-in zoom-in-95 duration-200"
                            style={{
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`,
                                width: '12rem',
                                transformOrigin: 'top right'
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="px-4 py-2 border-b border-gray-50">
                                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                    setViewUser(user);
                                    setActiveDropdown(null);
                                }}
                            >
                                <UserIcon className="w-4 h-4" /> View Details
                            </button>
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                    setEditUser(user);
                                    setEditForm({ name: user.name, email: user.email, role: user.role });
                                    setActiveDropdown(null);
                                }}
                            >
                                <Palette className="w-4 h-4" /> Edit User
                            </button>

                            <div className="my-1 border-t border-gray-50" />

                            <button
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${user.isActive ? "text-red-600" : "text-green-600"}`}
                                onClick={() => {
                                    handleAction(user._id, user.isActive ? "ban" : "activate");
                                    setActiveDropdown(null);
                                }}
                                disabled={actionLoading === user._id}
                            >
                                {actionLoading === user._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : user.isActive ? (
                                    <>
                                        <Lock className="w-4 h-4" /> Ban User
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="w-4 h-4" /> Activate User
                                    </>
                                )}
                            </button>

                            <div className="my-1 border-t border-gray-50" />

                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                    router.push(`/admin/messages?userId=${user._id}`);
                                    setActiveDropdown(null);
                                }}
                            >
                                <MessageSquare className="w-4 h-4" /> Message User
                            </button>

                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                onClick={async (e) => {
                                    setActionLoading(user._id);
                                    try {
                                        const res = await fetch(`/api/admin/users/${user._id}/impersonate`, {
                                            method: "POST",
                                        });

                                        if (res.ok) {
                                            window.location.href = "/";
                                        } else {
                                            const err = await res.json();
                                            toast.error(err.error || "Impersonation failed");
                                        }
                                    } catch (error) {
                                        console.error("Impersonation error:", error);
                                        toast.error("Failed to login as user");
                                    } finally {
                                        setActionLoading(null);
                                        setActiveDropdown(null);
                                    }
                                }}
                                disabled={actionLoading === user._id}
                            >
                                {actionLoading === user._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogIn className="w-4 h-4" />
                                )}
                                Login as User
                            </button>
                        </div>
                    </>
                );
            })()}

            {/* Create User Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-xl font-bold">Create New User</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setCreateLoading(true);
                                setCreateError("");
                                try {
                                    const res = await fetch("/api/admin/users", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(createForm),
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                        setShowCreateModal(false);
                                        setCreateForm({ name: "", email: "", password: "", role: "user" });
                                        fetchUsers();
                                    } else {
                                        setCreateError(data.error || "Failed to create user");
                                    }
                                } catch {
                                    setCreateError("Network error. Please try again.");
                                } finally {
                                    setCreateLoading(false);
                                }
                            }} className="p-6 space-y-4">
                                {createError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {createError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={createForm.role}
                                        onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="user">User</option>
                                        <option value="studio">Studio</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createLoading}>
                                        {createLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        Create User
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* View User Modal */}
            {
                viewUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-xl font-bold">User Details</h2>
                                <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-medium overflow-hidden">
                                        {viewUser.avatar ? (
                                            <img src={viewUser.avatar} alt={viewUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            viewUser.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{viewUser.name}</h3>
                                        <p className="text-gray-500">{viewUser.email}</p>
                                        <div className="mt-2">{getRoleBadge(viewUser.role)}</div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${viewUser.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {viewUser.isActive ? "Active" : "Banned"}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Joined</p>
                                            <p className="text-sm text-gray-900">{new Date(viewUser.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">User ID</p>
                                        <p className="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-100">{viewUser._id}</p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button variant="outline" onClick={() => setViewUser(null)}>Close</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit User Modal */}
            {
                editUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-xl font-bold">Edit User</h2>
                                <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setEditLoading(true);
                                setEditError("");
                                try {
                                    const res = await fetch(`/api/admin/users/${editUser._id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(editForm),
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                        setEditUser(null);
                                        fetchUsers();
                                    } else {
                                        setEditError(data.error || "Failed to update user");
                                    }
                                } catch {
                                    setEditError("Network error. Please try again.");
                                } finally {
                                    setEditLoading(false);
                                }
                            }} className="p-6 space-y-4">
                                {editError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {editError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.email}
                                        onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="user">User</option>
                                        <option value="studio">Studio</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={editLoading}>
                                        {editLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Palette className="w-4 h-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
