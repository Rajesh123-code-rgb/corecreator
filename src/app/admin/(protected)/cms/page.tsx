"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Search,
    Loader2,
    Plus,
    FileText,
    MoreHorizontal,
    Edit,
    Eye,
    Trash2,
    BookOpen,
    PenSquare,
    Clock,
    X
} from "lucide-react";
import { Button } from "@/components/atoms";
import { useConfirmModal } from "@/components/molecules";

import RichTextEditor from "@/components/molecules/RichTextEditor";
import { ThumbnailUploader } from "@/components/molecules/ThumbnailUploader";

interface Post {
    _id: string;
    title: string;
    slug: string;
    status: "draft" | "published" | "archived";
    author: { name: string };
    createdAt: string;
}

export default function AdminCMSPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [posts, setPosts] = React.useState<Post[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [stats, setStats] = React.useState({ total: 0, published: 0, draft: 0 });
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [createForm, setCreateForm] = React.useState({ title: "", content: "", metaTitle: "", metaDescription: "", coverImage: "" });
    const [createLoading, setCreateLoading] = React.useState(false);
    const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; right: number } | null>(null);
    const confirmModal = useConfirmModal();

    // Check for ?create=true query parameter
    React.useEffect(() => {
        if (searchParams.get("create") === "true") {
            setShowCreateModal(true);
            router.replace("/admin/cms", { scroll: false });
        }
    }, [searchParams, router]);

    const fetchPosts = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            });
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/cms/posts?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
                setTotalPages(data.pagination?.pages || 1);

                const published = (data.posts || []).filter((p: Post) => p.status === "published").length;
                const draft = (data.posts || []).filter((p: Post) => p.status === "draft").length;
                setStats({ total: data.pagination?.total || 0, published, draft });
            }
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    React.useEffect(() => {
        const timer = setTimeout(() => { fetchPosts(); }, 300);
        return () => clearTimeout(timer);
    }, [fetchPosts]);



    const handleDelete = async (id: string, title: string) => {
        confirmModal.confirm({
            title: "Delete Post",
            message: `Delete "${title}"? This action cannot be undone.`,
            confirmText: "Delete",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/cms/posts/${id}`, { method: "DELETE" });
                    if (res.ok) {
                        fetchPosts();
                    } else {
                        alert("Failed to delete post");
                    }
                } catch (error) {
                    console.error("Delete error:", error);
                }
            },
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            published: "bg-green-100 text-green-700",
            draft: "bg-yellow-100 text-yellow-700",
            archived: "bg-gray-100 text-gray-700"
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
                    <p className="text-gray-500 mt-1">Manage blog posts and articles</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Post
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Posts</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                            <p className="text-sm text-gray-500">Published</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                            <p className="text-sm text-gray-500">Drafts</p>
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
                                placeholder="Search posts..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {["all", "published", "draft"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
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
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No posts found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                posts.map((post) => (
                                    <tr key={post._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                <p className="font-medium text-gray-900">{post.title}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{post.author?.name || "Unknown"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 relative">
                                                <Link href={`/admin/cms/${post._id}`} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPosition({
                                                                top: rect.bottom + 5,
                                                                right: window.innerWidth - rect.right
                                                            });
                                                            setActiveDropdown(activeDropdown === post._id ? null : post._id);
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${activeDropdown === post._id ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
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
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Fixed Position Dropdown */}
            {activeDropdown && dropdownPosition && (() => {
                const post = posts.find(p => p._id === activeDropdown);
                if (!post) return null;
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
                            <Link
                                href={`/admin/cms/${post._id}`}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                <Edit className="w-4 h-4" /> Edit Post
                            </Link>
                            {post.status === "published" && (
                                <a
                                    href={`/blog/${post.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    <Eye className="w-4 h-4" /> View Live
                                </a>
                            )}
                            <div className="my-1 border-t border-gray-50" />
                            <button
                                onClick={() => {
                                    handleDelete(post._id, post.title);
                                    setActiveDropdown(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Post
                            </button>
                        </div>
                    </>
                );
            })()}

            {/* Create Blog Post Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Create New Blog Post</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setCreateLoading(true);
                            try {
                                const slug = createForm.title
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, "-")
                                    .replace(/(^-|-$)+/g, "") + "-" + Date.now();

                                const payload = {
                                    ...createForm,
                                    slug,
                                    coverImage: createForm.coverImage || "https://via.placeholder.com/800x400"
                                };

                                const res = await fetch("/api/admin/cms/posts", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(payload),
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    setShowCreateModal(false);
                                    setCreateForm({ title: "", content: "", metaTitle: "", metaDescription: "", coverImage: "" });
                                    router.push(`/admin/cms/${data.post._id}`);
                                } else {
                                    const errorData = await res.json();
                                    alert(errorData.error || "Failed to create post");
                                }
                            } catch (error) {
                                console.error("Failed to create post:", error);
                                alert("An unexpected error occurred");
                            } finally {
                                setCreateLoading(false);
                            }
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter blog post title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                <ThumbnailUploader
                                    onUploadComplete={(data) => setCreateForm(f => ({ ...f, coverImage: data.url }))}
                                    existingImage={createForm.coverImage ? { url: createForm.coverImage, filename: "Cover Image" } : undefined}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <RichTextEditor
                                    value={createForm.content}
                                    onChange={(value) => setCreateForm(f => ({ ...f, content: value }))}
                                    placeholder="Write your blog post content..."
                                    className="h-[300px] mb-12"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100 space-y-4">
                                <h3 className="font-medium text-gray-900">SEO Settings</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                                    <input
                                        type="text"
                                        value={createForm.metaTitle}
                                        onChange={(e) => setCreateForm(f => ({ ...f, metaTitle: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="SEO Title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                    <textarea
                                        rows={3}
                                        value={createForm.metaDescription}
                                        onChange={(e) => setCreateForm(f => ({ ...f, metaDescription: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="SEO Description"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createLoading}>
                                    {createLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Create Post
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
