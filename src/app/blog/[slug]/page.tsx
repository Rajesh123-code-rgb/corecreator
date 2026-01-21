import { Header, Footer } from "@/components/organisms";
import { AuthorCard, type AuthorProfile } from "@/components/molecules/AuthorCard";
import { ArticleMetadata } from "@/components/atoms/ArticleMetadata";
import { ReferencesSection } from "@/components/organisms/ReferencesSection";
import { RelatedArticles } from "@/components/organisms/RelatedArticles";
import { ArticleEngagement } from "@/components/molecules/ArticleEngagement";
import { notFound } from "next/navigation";

// Mock data - In production, this would come from a CMS or database
const blogPosts = {
    "essential-tips-watercolor": {
        slug: "essential-tips-watercolor",
        title: "10 Essential Tips for Beginning Watercolor Artists",
        excerpt: "Start your watercolor journey on the right foot with these fundamental techniques and material recommendations.",
        featuredImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=600&fit=crop",
        category: "Art Tips",
        tags: ["watercolor", "beginner", "painting", "techniques", "materials"],

        content: `
      <p class="text-lg leading-relaxed mb-6">Watercolor painting is one of the most rewarding and accessible art forms, but it can be intimidating for beginners. The unpredictable nature of water and pigment requires a different approach than other painting mediums. After teaching watercolor for over 15 years, I've compiled the most essential tips that will help you build a strong foundation.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">1. Invest in Quality Basics</h2>
      <p class="mb-4">While you don't need to buy the most expensive materials, investing in artist-grade watercolors and proper paper will make a significant difference in your results. Student-grade materials can be frustrating and may hinder your learning process.</p>
      
      <p class="mb-6"><strong>Essential supplies:</strong></p>
      <ul class="list-disc list-inside space-y-2 mb-6">
        <li>100% cotton watercolor paper (300gsm/140lb minimum)</li>
        <li>Artist-grade watercolors in primary colors</li>
        <li>Round brushes in sizes 4, 8, and 12</li>
        <li>Two water containers (one for rinsing, one for clean water)</li>
        <li>A mixing palette with wells</li>
      </ul>

      <h2 class="text-2xl font-bold mt-8 mb-4">2. Master Water Control</h2>
      <p class="mb-4">The water-to-pigment ratio is the most critical skill in watercolor painting. Too much water creates weak, pale washes; too little makes the paint hard to work with and can damage your brushes.</p>
      
      <p class="mb-6">Practice creating value scales by diluting the same color with increasing amounts of water. This exercise will help you understand how water affects your paint and gives you more control over your work.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">3. Work from Light to Dark</h2>
      <p class="mb-4">Unlike opaque mediums, watercolor is transparent, which means you cannot add white to lighten colors. Always start with your lightest values and gradually build up to darker tones. Reserve the white of your paper for your brightest highlights.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">4. Embrace Happy Accidents</h2>
      <p class="mb-4">Watercolor has a unique quality of creating beautiful, unexpected effects. Blooms, granulation, and color bleeding can add character to your paintings. Instead of fighting against the medium's natural behavior, learn to anticipate and incorporate these effects into your work.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">5. Practice Color Mixing</h2>
      <p class="mb-6">Understanding color theory and how pigments interact is essential. Start with a limited palette of primary colors (red, yellow, blue) plus a warm and cool version of each. This teaches you to mix a wide range of colors and helps you understand color relationships better than buying pre-mixed hues.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">6. Let Layers Dry Completely</h2>
      <p class="mb-4">Patience is crucial in watercolor. Applying paint over wet layers causes colors to bleed and creates muddy results. Unless you're intentionally working wet-on-wet, wait until each layer is completely dry before adding the next.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">7. Preserve Your Whites</h2>
      <p class="mb-6">Since watercolor is transparent, you need to plan where your white areas will be before you start painting. Use masking fluid or simply paint around areas you want to keep white. This requires thinking ahead and having a clear plan for your composition.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">8. Study Value and Contrast</h2>
      <p class="mb-4">Before adding color, consider the values (lights and darks) in your composition. A painting with strong value contrast will be more dynamic and readable than one without, regardless of the colors used. Practice creating value sketches before starting your watercolor paintings.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">9. Clean Your Brushes Properly</h2>
      <p class="mb-6">Quality brushes are an investment, and proper care will make them last for years. Rinse thoroughly after each use, reshape the bristles, and store them upright or lying flat. Never leave brushes standing in water, as this damages the ferrule and bristles.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">10. Practice Consistently</h2>
      <p class="mb-4">Like any skill, watercolor painting improves with regular practice. Set aside time each week to experiment with techniques, try new subjects, and paint for fun without worrying about the final result. Keep a watercolor journal to track your progress and test new ideas.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">Conclusion</h2>
      <p class="mb-4">Watercolor painting is a journey of continuous learning and discovery. Don't be discouraged by early challenges—every artist starts as a beginner. Focus on understanding the fundamentals, be patient with yourself, and enjoy the process. The most important thing is to keep painting and experimenting.</p>

      <p class="mt-6">Ready to start your watercolor journey? Check out our comprehensive <a href="/learn/watercolor-basics" class="text-[var(--primary-600)] hover:underline">Watercolor Basics course</a> for step-by-step video lessons and hands-on projects.</p>
    `,

        author: {
            id: "sarah-mitchell",
            name: "Sarah Mitchell",
            avatar: "https://randomuser.me/api/portraits/women/32.jpg",
            title: "Senior Art Instructor & Watercolor Specialist",
            bio: "Sarah has been teaching watercolor techniques for over 15 years and has helped thousands of students discover their creative potential. Her work has been featured in Watercolor Artist Magazine and she regularly conducts workshops across the country.",
            credentials: [
                "MFA, Rhode Island School of Design",
                "15+ years teaching experience",
                "Featured in Watercolor Artist Magazine",
                "AWS Signature Member"
            ],
            socialLinks: {
                instagram: "https://instagram.com/sarahmitchellart",
                website: "https://sarahmitchellart.com",
                linkedin: "https://linkedin.com/in/sarahmitchell"
            }
        },

        publishedAt: new Date("2026-01-12"),
        updatedAt: new Date("2026-01-13"),

        sources: [
            {
                title: "Watercolor Basics - Materials Guide",
                url: "/learn/watercolor-basics",
                type: "internal" as const,
                publishedDate: "Dec 2025"
            },
            {
                title: "The Science of Watercolor Painting",
                url: "https://www.artistsnetwork.com/art-mediums/watercolor/",
                type: "external" as const,
                author: "Artist's Network",
                publishedDate: "2025"
            },
            {
                title: "American Watercolor Society - Best Practices",
                url: "https://www.americanwatercolorsociety.org/",
                type: "external" as const,
                publishedDate: "2025"
            }
        ],

        readTime: 8,
        views: 12547,
        likes: 423,
        comments: 56,
        shares: 89,

        factChecked: true,
        factCheckDate: new Date("2026-01-12")
    }
};

const relatedArticles = [
    {
        slug: "michael-chen-story",
        title: "How Michael Chen Built a Full-Time Career Selling Oil Paintings",
        excerpt: "An exclusive interview with one of our top sellers on how he grew his collector base and priced his work.",
        image: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&h=400&fit=crop",
        author: "Emma Rodriguez",
        date: "Dec 28, 2025",
        category: "Creator Stories",
        readTime: 6
    },
    {
        slug: "art-market-trends-2026",
        title: "The State of the Online Art Market in 2026",
        excerpt: "Trends, predictions, and what every digital artist needs to know about the current landscape.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
        author: "David Kim",
        date: "Dec 15, 2025",
        category: "Industry Insights",
        readTime: 10
    },
    {
        slug: "studio-tools-update",
        title: "Introducing New Studio Tools for Sellers",
        excerpt: "We've vastly improved the analytics dashboard and added new inventory management features.",
        image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?w=600&h=400&fit=crop",
        author: "Core Creator Team",
        date: "Jan 5, 2026",
        category: "Platform Updates",
        readTime: 5
    }
];

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const post = blogPosts[resolvedParams.slug as keyof typeof blogPosts];

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <article className="pt-24 pb-20">
                {/* Featured Image */}
                <div className="relative w-full h-[400px] lg:h-[500px] mb-12">
                    <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="container-app max-w-4xl">
                    {/* Article Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl lg:text-5xl font-bold mb-6">{post.title}</h1>

                        <ArticleMetadata
                            publishedAt={post.publishedAt}
                            updatedAt={post.updatedAt}
                            readTime={post.readTime}
                            category={post.category}
                            tags={post.tags}
                        />
                    </div>

                    {/* Author Card - Compact */}
                    <div className="mb-8">
                        <AuthorCard author={post.author} variant="compact" showBio={false} />
                    </div>

                    {/* Engagement Metrics */}
                    <ArticleEngagement
                        metrics={{
                            views: post.views,
                            likes: post.likes,
                            comments: post.comments,
                            shares: post.shares
                        }}
                        articleSlug={post.slug}
                    />

                    {/* Article Content */}
                    <div
                        className="prose prose-lg max-w-none mt-12 mb-12"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Sources & References */}
                    {post.sources && post.sources.length > 0 && (
                        <ReferencesSection
                            sources={post.sources}
                            factChecked={post.factChecked}
                            factCheckDate={post.factCheckDate}
                        />
                    )}

                    {/* Author Bio - Full */}
                    <div className="mt-12 pt-8 border-t border-[var(--border)]">
                        <h3 className="text-xl font-bold mb-4">About the Author</h3>
                        <AuthorCard author={post.author} variant="full" showBio={true} />
                    </div>

                    {/* Related Articles */}
                    <RelatedArticles articles={relatedArticles} />
                </div>
            </article>

            <Footer />
        </div>
    );
}
