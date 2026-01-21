"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    FolderOpen,
    Plus,
    Search,
    Loader2,
    Edit,
    Trash2,
    Check,
    X,
    Image as ImageIcon,
    ChevronRight,
    Box,
    GraduationCap,
    Calendar
} from "lucide-react";
import { ThumbnailUploader } from "@/components/molecules/ThumbnailUploader";

interface Category {
    _id: string;
    name: string;
    slug: string;
    type: "product" | "course" | "workshop";
    description?: string;
    image?: string;
    icon?: string;
    parent?: { _id: string; name: string };
    order: number;
    isActive: boolean;
    productCount: number;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState({ product: 0, course: 0, workshop: 0, total: 0 });
    const [typeFilter, setTypeFilter] = React.useState("all");
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({ name: "", type: "product", description: "", image: "" });
    const [submitting, setSubmitting] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [deleteConfirm, setDeleteConfirm] = React.useState<{ show: boolean; id: string; name: string }>({ show: false, id: "", name: "" });

    const fetchCategories = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: typeFilter, includeInactive: "true" });
            const res = await fetch(`/api/admin/categories?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories || []);
                setStats(data.stats || { product: 0, course: 0, workshop: 0, total: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    }, [typeFilter]);

    React.useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        setSubmitting(true);
        try {
            const url = "/api/admin/categories";
            const method = editingId ? "PUT" : "POST";
            const body = editingId
                ? { id: editingId, ...formData }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: "", type: "product", description: "", image: "" });
                fetchCategories();
            }
        } catch (error) {
            console.error("Failed to save category:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (category: Category) => {
        setFormData({
            name: category.name,
            type: category.type,
            description: category.description || "",
            image: category.image || "",
        });
        setEditingId(category._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchCategories();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete");
            }
        } catch (error) {
            console.error("Failed to delete category:", error);
        } finally {
            setDeleteConfirm({ show: false, id: "", name: "" });
        }
    };

    const handleToggleActive = async (category: Category) => {
        try {
            await fetch("/api/admin/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: category._id, isActive: !category.isActive }),
            });
            fetchCategories();
        } catch (error) {
            console.error("Failed to toggle category:", error);
        }
    };

    const handleSeedCategories = async () => {
        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/categories/seed", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                fetchCategories();
            } else {
                alert("Failed to seed categories");
            }
        } catch (error) {
            console.error("Seed error:", error);
            alert("Error seeding categories");
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "product": return Box;
            case "course": return GraduationCap;
            case "workshop": return Calendar;
            default: return FolderOpen;
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-500 mt-1">Manage product, course, and workshop categories</p>
                </div>
                <div className="flex gap-2">
                    {stats.total === 0 && (
                        <Button variant="outline" onClick={handleSeedCategories} disabled={submitting}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Seed Default Categories
                        </Button>
                    )}
                    <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: "", type: "product", description: "", image: "" }); }}>
                        <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg"><FolderOpen className="w-5 h-5 text-purple-600" /></div>
                        <div>
                            <p className="text-xl font-bold">{stats.total}</p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg"><Box className="w-5 h-5 text-blue-600" /></div>
                        <div>
                            <p className="text-xl font-bold">{stats.product}</p>
                            <p className="text-xs text-gray-500">Products</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><GraduationCap className="w-5 h-5 text-green-600" /></div>
                        <div>
                            <p className="text-xl font-bold">{stats.course}</p>
                            <p className="text-xs text-gray-500">Courses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg"><Calendar className="w-5 h-5 text-orange-600" /></div>
                        <div>
                            <p className="text-xl font-bold">{stats.workshop}</p>
                            <p className="text-xs text-gray-500">Workshops</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-semibold mb-4">{editingId ? "Edit Category" : "Add Category"}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Category name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                disabled={!!editingId}
                            >
                                <option value="product">Product</option>
                                <option value="course">Course</option>
                                <option value="workshop">Workshop</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Short description"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Category Image</label>
                            <ThumbnailUploader
                                onUploadComplete={(data) => setFormData(p => ({ ...p, image: data.url }))}
                                existingImage={formData.image ? { url: formData.image, filename: "Current Image" } : undefined}
                                className="w-full"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                        <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex gap-2">
                        {["all", "product", "course", "workshop"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === t
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" /></td></tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No categories found</td></tr>
                            ) : (
                                filteredCategories.map((category) => {
                                    const TypeIcon = getTypeIcon(category.type);
                                    return (
                                        <tr key={category._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {category.image ? (
                                                        <img src={category.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <ImageIcon className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{category.name}</p>
                                                        <p className="text-sm text-gray-500">{category.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    <TypeIcon className="w-3 h-3" />
                                                    {category.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(category)}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${category.isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-500"
                                                        }`}
                                                >
                                                    {category.isActive ? "Active" : "Inactive"}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleEdit(category)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm({ show: true, id: category._id, name: category.name })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Category</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>&quot;{deleteConfirm.name}&quot;</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirm({ show: false, id: "", name: "" })}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleDelete(deleteConfirm.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
