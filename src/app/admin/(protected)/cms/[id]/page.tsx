"use client";

import * as React from "react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";

import { useConfirmModal, useToast } from "@/components/molecules";
import { Loader2, ArrowLeft, Save, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import RichTextEditor from "@/components/molecules/RichTextEditor";
import { ThumbnailUploader } from "@/components/molecules/ThumbnailUploader";

// Define params type using Promise for Next.js 15 compatibility
interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditPostPage(props: PageProps) {
    // Unwrap params using React.use() or await in useEffect (since this is client component)
    // Actually, for client components, we receive params as a promise but can unwrap it.
    // However, the easiest way in Client Comp is to use `React.use(props.params)` but that's experimental.
    // Let's us useEffect to unwrap it if we need, or just await it if we can.
    // But standard practice for Client Comp in Next 15 is slightly evolving.
    // Let's store id in state.

    const [postId, setPostId] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const confirmModal = useConfirmModal();
    const toast = useToast();

    const [post, setPost] = React.useState({
        title: "",
        slug: "",
        content: "",
        status: "draft",
        excerpt: "",
        coverImage: "",
        coverImageAltText: "",
        metaTitle: "",
        metaDescription: ""
    });

    const router = useRouter();

    React.useEffect(() => {
        // Unwrap params
        props.params.then(unwrapped => {
            setPostId(unwrapped.id);
            fetchPost(unwrapped.id);
        });
    }, [props.params]);

    const fetchPost = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/cms/posts/${id}`);
            if (res.ok) {
                const data = await res.json();
                setPost({
                    title: data.post.title,
                    slug: data.post.slug,
                    content: data.post.content,
                    status: data.post.status,
                    excerpt: data.post.excerpt || "",
                    coverImage: data.post.coverImage || "",
                    coverImageAltText: data.post.coverImageAltText || "",
                    metaTitle: data.post.metaTitle || "",
                    metaDescription: data.post.metaDescription || "",
                });
            } else {
                toast.error("Failed to fetch post");
                router.push("/admin/cms");
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!postId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/cms/posts/${postId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(post),
            });

            if (res.ok) {
                toast.success("Post saved successfully!");
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!postId) return;
        try {
            const res = await fetch(`/api/admin/cms/posts/${postId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                router.push("/admin/cms");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete post");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/cms">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Post</h1>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {post.status.toUpperCase()}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => confirmModal.confirm({
                            title: "Delete Post",
                            message: "Are you sure you want to delete this post? This action cannot be undone.",
                            confirmText: "Delete",
                            onConfirm: handleDelete,
                        })}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <Card className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={post.title}
                                onChange={(e) => setPost({ ...post, title: e.target.value })}
                                placeholder="Enter post title"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content</label>
                            <RichTextEditor
                                value={post.content}
                                onChange={(value) => setPost({ ...post, content: value })}
                                placeholder="Write your content here..."
                                className="min-h-[400px]"
                            />
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">SEO Settings</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Meta Title</label>
                            <Input
                                value={post.metaTitle || ""}
                                onChange={(e) => setPost({ ...post, metaTitle: e.target.value })}
                                placeholder="SEO Title (defaults to title if empty)"
                            />
                            <p className="text-xs text-gray-500">Recommended length: 50-60 characters</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Meta Description</label>
                            <textarea
                                className="w-full h-24 p-2 rounded-md border border-gray-200 text-sm"
                                value={post.metaDescription || ""}
                                onChange={(e) => setPost({ ...post, metaDescription: e.target.value })}
                                placeholder="SEO Description"
                            />
                            <p className="text-xs text-gray-500">Recommended length: 150-160 characters</p>
                        </div>
                    </Card>
                </div>

                <div className="col-span-1 space-y-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">Publishing</h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <select
                                className="w-full p-2 rounded-md border border-gray-200"
                                value={post.status}
                                onChange={(e) => setPost({ ...post, status: e.target.value })}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Slug</label>
                            <Input
                                value={post.slug}
                                onChange={(e) => setPost({ ...post, slug: e.target.value })}
                            />
                        </div>

                        {post.status === "published" && (
                            <div className="pt-2">
                                <a
                                    href={`/blog/${post.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-purple-600 hover:underline text-sm flex items-center gap-1"
                                >
                                    <Eye className="w-3 h-3" /> View Live
                                </a>
                            </div>
                        )}
                    </Card>

                    <Card className="p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">Meta</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Excerpt</label>
                            <textarea
                                className="w-full h-24 p-2 rounded-md border border-gray-200 text-sm"
                                value={post.excerpt}
                                onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cover Image</label>
                            <ThumbnailUploader
                                onUploadComplete={(data) => setPost({ ...post, coverImage: data.url })}
                                existingImage={post.coverImage ? { url: post.coverImage, filename: "Cover Image" } : undefined}
                            />

                            <div className="pt-2">
                                <label className="text-sm font-medium">Alt Text</label>
                                <Input
                                    value={post.coverImageAltText || ""}
                                    onChange={(e) => setPost({ ...post, coverImageAltText: e.target.value })}
                                    placeholder="Describe image for SEO"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
