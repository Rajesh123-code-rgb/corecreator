import { Header, Footer } from "@/components/organisms";
import { AuthorCard } from "@/components/molecules/AuthorCard";
import { ArticleMetadata } from "@/components/atoms/ArticleMetadata";
import { ReferencesSection } from "@/components/organisms/ReferencesSection";
import { RelatedArticles } from "@/components/organisms/RelatedArticles";
import { ArticleEngagement } from "@/components/molecules/ArticleEngagement";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db/mongodb";
import Post from "@/lib/db/models/Post";
import { Metadata } from "next";

// Force dynamic rendering since we are fetching data from DB
export const dynamic = "force-dynamic";

async function getPost(slug: string) {
    await dbConnect();
    const post = await Post.findOne({ slug, status: "published" })
        .populate("author", "name image email")
        .lean();
    return post;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const post = await getPost(resolvedParams.slug);

    if (!post) {
        return {
            title: "Article Not Found",
        };
    }

    return {
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.excerpt,
        openGraph: {
            images: [post.coverImage],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const postData = await getPost(resolvedParams.slug);

    if (!postData) {
        notFound();
    }

    // Transform DB data to UI format
    // Note: Mongoose populate returns object at runtime but TS sees ObjectId. Casting to any.
    const authorData = postData.author as any;

    const author = {
        id: authorData?._id?.toString() || "core-team",
        name: authorData?.name || "Core Creator Team",
        avatar: authorData?.image || "https://ui-avatars.com/api/?name=Core+Creator",
        title: "Content Creator", // Default title as we don't have this in User model yet
        bio: "Contributing author at Core Creator.", // Default bio
        credentials: [], // Setup if User model has this
        socialLinks: {}
    };

    // Calculate read time (approx 200 words per minute)
    const wordCount = postData.content ? postData.content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
    const readTime = Math.ceil(wordCount / 200) || 5;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <article className="pt-24 pb-20">
                {/* Featured Image */}
                <div className="relative w-full h-[400px] lg:h-[500px] mb-12">
                    <img
                        src={postData.coverImage}
                        alt={postData.coverImageAltText || postData.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="container-app max-w-4xl">
                    {/* Article Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl lg:text-5xl font-bold mb-6">{postData.title}</h1>

                        <ArticleMetadata
                            publishedAt={postData.publishedAt || postData.createdAt}
                            updatedAt={postData.updatedAt}
                            readTime={readTime}
                            category={postData.tags?.[0] || "General"}
                            tags={postData.tags || []}
                        />
                    </div>

                    {/* Author Card - Compact */}
                    <div className="mb-8">
                        <AuthorCard author={author} variant="compact" showBio={false} />
                    </div>

                    {/* Engagement Metrics - Using DB ID for uniqueness */}
                    <ArticleEngagement
                        metrics={{
                            views: 0, // Implement view counting later
                            likes: 0, // Implement likes later
                            comments: 0,
                            shares: 0
                        }}
                        articleSlug={postData.slug}
                    />

                    {/* Article Content */}
                    <div
                        className="prose prose-lg max-w-none mt-12 mb-12 dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: postData.content }}
                    />

                    {/* Author Bio - Full */}
                    <div className="mt-12 pt-8 border-t border-[var(--border)]">
                        <h3 className="text-xl font-bold mb-4">About the Author</h3>
                        <AuthorCard author={author} variant="full" showBio={true} />
                    </div>
                </div>
            </article>

            <Footer />
        </div>
    );
}
