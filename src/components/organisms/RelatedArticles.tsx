import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";

interface RelatedArticle {
    slug: string;
    title: string;
    excerpt: string;
    image: string;
    author: string;
    date: string;
    category: string;
    readTime: number;
}

interface RelatedArticlesProps {
    articles: RelatedArticle[];
    title?: string;
}

export const RelatedArticles = ({ articles, title = "Related Articles" }: RelatedArticlesProps) => {
    if (!articles || articles.length === 0) return null;

    return (
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
            <h2 className="text-2xl font-bold mb-8">{title}</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, index) => (
                    <Link
                        key={index}
                        href={`/blog/${article.slug}`}
                        className="group block bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary-500)] transition-all hover:shadow-lg"
                    >
                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded-md text-[var(--foreground)]">
                                {article.category}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mb-2">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {article.date}
                                </span>
                                <span>•</span>
                                <span>{article.readTime} min</span>
                            </div>

                            <h3 className="font-bold mb-2 group-hover:text-[var(--primary-600)] transition-colors line-clamp-2">
                                {article.title}
                            </h3>

                            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
                                {article.excerpt}
                            </p>

                            <div className="flex items-center text-[var(--primary-600)] font-medium text-sm">
                                Read More
                                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
