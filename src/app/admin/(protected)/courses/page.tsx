"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    BookOpen,
    Loader2,
    CheckCircle,
    XCircle,
    Eye,
    MoreHorizontal,
    Users,
    DollarSign,
    Clock,
    TrendingUp,
    X
} from "lucide-react";
import { Button } from "@/components/atoms";
import { useConfirmModal } from "@/components/molecules";

interface Course {
    _id: string;
    title: string;
    description?: string;
    slug: string;
    thumbnail: string;
    instructor?: { name: string, email: string };
    instructorName: string;
    price: number;
    status: "draft" | "pending" | "published" | "rejected" | "archived";
    createdAt: string;
    totalStudents: number;
    rejectionReason?: string;
}

export default function AdminCoursesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [courses, setCourses] = React.useState<Course[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [stats, setStats] = React.useState({ total: 0, published: 0, pending: 0, students: 0 });
    const [showCreateModal, setShowCreateModal] = React.useState(false);

    // New States
    const [viewCourse, setViewCourse] = React.useState<Course | null>(null);
    const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; right: number } | null>(null);
    const confirmModal = useConfirmModal();

    // Check for ?create=true query parameter
    React.useEffect(() => {
        if (searchParams.get("create") === "true") {
            setShowCreateModal(true);
            router.replace("/admin/courses", { scroll: false });
        }
    }, [searchParams, router]);

    const fetchCourses = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                status: statusFilter,
            });
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/courses?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data.courses);
                setTotalPages(data.pagination.pages);

                const published = data.courses.filter((c: Course) => c.status === "published").length;
                const pending = data.courses.filter((c: Course) => c.status === "pending").length;
                const students = data.courses.reduce((sum: number, c: Course) => sum + (c.totalStudents || 0), 0);
                setStats({ total: data.pagination.total, published, pending, students });
            }
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search]);

    React.useEffect(() => {
        const timer = setTimeout(() => { fetchCourses(); }, 300);
        return () => clearTimeout(timer);
    }, [fetchCourses]);

    const [rejectionModal, setRejectionModal] = React.useState<{ courseId: string, isOpen: boolean }>({ courseId: "", isOpen: false });
    const [rejectionReason, setRejectionReason] = React.useState("");

    const handleAction = async (courseId: string, action: "approve" | "reject" | "delete") => {
        if (action === "reject") {
            setRejectionModal({ courseId, isOpen: true });
            return;
        }
        await processAction(courseId, action);
    };

    const processAction = async (courseId: string, action: "approve" | "reject" | "delete", reason?: string) => {
        setActionLoading(courseId);
        try {
            let res;
            if (action === "delete") {
                res = await fetch(`/api/admin/courses/${courseId}`, {
                    method: "DELETE",
                });
            } else {
                res = await fetch(`/api/admin/courses/${courseId}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action, rejectionReason: reason }),
                });
            }

            if (res.ok) {
                await fetchCourses();
                setActiveDropdown(null);
                if (action === "reject") {
                    setRejectionModal({ courseId: "", isOpen: false });
                    setRejectionReason("");
                }
            } else {
                const err = await res.json();
                alert(err.error || "Action failed");
            }
        } catch (error) {
            console.error("Action error:", error);
            alert("Failed to perform action");
        } finally {
            setActionLoading(null);
        }
    };

    const submitRejection = () => {
        if (!rejectionReason.trim()) return;
        processAction(rejectionModal.courseId, "reject", rejectionReason);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            published: "bg-green-100 text-green-700",
            pending: "bg-yellow-100 text-yellow-700",
            rejected: "bg-red-100 text-red-700",
            draft: "bg-gray-100 text-gray-700"
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
                    <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
                    <p className="text-gray-500 mt-1">Review, approve, or reject courses submitted by creators</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Courses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-green-600" />
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
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            <p className="text-sm text-gray-500">Pending Review</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
                            <p className="text-sm text-gray-500">Total Students</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Alert */}
            {stats.pending > 0 && (
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-800">
                        <strong>{stats.pending} course(s)</strong> pending review
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setStatusFilter("pending")}>
                        Review All
                    </Button>
                </div>
            )}

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search courses or instructors..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { id: "all", label: "All" },
                                { id: "pending", label: "Needs Review" },
                                { id: "published", label: "Published" },
                                { id: "draft", label: "Drafts" }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStatusFilter(s.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s.id
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : courses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No courses found
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course) => (
                                    <tr key={course._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <BookOpen className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                                                    <p className="text-xs text-gray-500">{new Date(course.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{course.instructorName}</td>
                                        <td className="px-6 py-4 font-medium">
                                            {course.price > 0 ? `₹${course.price}` : <span className="text-green-600 text-xs font-bold uppercase">Free</span>}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{course.totalStudents}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1 relative">
                                                <button
                                                    onClick={() => setViewCourse(course)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {course.status === "pending" && (
                                                    <>
                                                        <button
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                            onClick={() => confirmModal.confirm({
                                                                title: "Approve Course",
                                                                message: "Approve this course? It will be published immediately.",
                                                                confirmText: "Approve",
                                                                variant: "info",
                                                                onConfirm: () => handleAction(course._id, "approve"),
                                                            })}
                                                            disabled={actionLoading === course._id}
                                                            title="Approve"
                                                        >
                                                            {actionLoading === course._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                            onClick={() => confirmModal.confirm({
                                                                title: "Reject Course",
                                                                message: "Reject this course? You will be asked for a reason.",
                                                                confirmText: "Continue to Reject",
                                                                variant: "warning",
                                                                onConfirm: () => handleAction(course._id, "reject"),
                                                            })}
                                                            disabled={actionLoading === course._id}
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(activeDropdown === course._id ? null : course._id);
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPosition({
                                                                top: rect.bottom + 5,
                                                                right: window.innerWidth - rect.right
                                                            });
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${activeDropdown === course._id ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
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

            {/* Dropdown Overlay & Menu */}
            {activeDropdown && dropdownPosition && (() => {
                const course = courses.find(c => c._id === activeDropdown);
                if (!course) return null;
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
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                    setViewCourse(course);
                                    setActiveDropdown(null);
                                }}
                            >
                                <Eye className="w-4 h-4" /> View Details
                            </button>

                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                    window.open(`/courses/${course.slug}`, '_blank');
                                    setActiveDropdown(null);
                                }}
                            >
                                <TrendingUp className="w-4 h-4" /> View Live
                            </button>

                            <div className="my-1 border-t border-gray-50" />

                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                onClick={() => confirmModal.confirm({
                                    title: "Delete Course",
                                    message: `Delete "${course.title}"? This action cannot be undone.`,
                                    confirmText: "Delete",
                                    onConfirm: () => handleAction(course._id, "delete"),
                                })}
                                disabled={actionLoading === course._id}
                            >
                                {actionLoading === course._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                Delete Course
                            </button>
                        </div>
                    </>
                );
            })()}

            {/* View Course Modal */}
            {viewCourse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">Course Details</h2>
                            <button onClick={() => setViewCourse(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Thumbnail */}
                                <div className="w-full md:w-1/3 aspect-video bg-gray-100 rounded-xl overflow-hidden">
                                    {viewCourse.thumbnail ? (
                                        <img src={viewCourse.thumbnail} alt={viewCourse.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{viewCourse.title}</h3>
                                        <p className="text-gray-500">Instructor: {viewCourse.instructorName}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-purple-600">
                                            {viewCourse.price > 0 ? `₹${viewCourse.price}` : "Free"}
                                        </span>
                                        {getStatusBadge(viewCourse.status)}
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Instructor Email</span>
                                            <span className="font-medium">{viewCourse.instructor?.email || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Students</span>
                                            <span className="font-medium">{viewCourse.totalStudents}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Created</span>
                                            <span className="font-medium">{new Date(viewCourse.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                <div className="text-gray-600 text-sm whitespace-pre-wrap">
                                    {viewCourse.description || "No description provided."}
                                </div>
                            </div>

                            {viewCourse.rejectionReason && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <h4 className="font-medium text-red-700 mb-1">Rejection Reason</h4>
                                    <p className="text-sm text-red-600">{viewCourse.rejectionReason}</p>
                                </div>
                            )}

                        </div>
                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                            <Button variant="outline" onClick={() => setViewCourse(null)}>Close</Button>
                            <Button onClick={() => window.open(`/courses/${viewCourse.slug}`, '_blank')}>View Course</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Create New Course</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <h3 className="font-medium text-gray-900 mb-1">Course Creation</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Courses are created by Studios from their dashboard.
                                </p>
                                <p className="text-xs text-gray-400">
                                    As admin, you can manage and moderate existing courses.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Reject Course</h2>
                            <p className="text-gray-500 text-sm mt-1">Please provide a reason for rejection.</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                placeholder="E.g., Missing video content in Section 2..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setRejectionModal({ courseId: "", isOpen: false })}>
                                Cancel
                            </Button>
                            <Button
                                onClick={submitRejection}
                                disabled={!rejectionReason.trim() || actionLoading === rejectionModal.courseId}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {actionLoading === rejectionModal.courseId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Reject Course
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
