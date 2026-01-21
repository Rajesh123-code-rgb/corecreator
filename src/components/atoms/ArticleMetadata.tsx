import { Calendar, Clock, Tag } from "lucide-react";
import { format } from "date-fns";

interface ArticleMetadataProps {
    publishedAt: Date;
    updatedAt?: Date;
    readTime: number;
    category: string;
    tags?: string[];
}

export const ArticleMetadata = ({
    publishedAt,
    updatedAt,
    readTime,
    category,
    tags
}: ArticleMetadataProps) => {
    const hasBeenUpdated = updatedAt && updatedAt.getTime() !== publishedAt.getTime();

    return (
        <div className="space-y-4">
            {/* Primary Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Published {format(publishedAt, "MMM dd, yyyy")}</span>
                </div>

                {hasBeenUpdated && (
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[var(--primary-600)] font-medium">
                            Updated {format(updatedAt, "MMM dd, yyyy")}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{readTime} min read</span>
                </div>
            </div>

            {/* Category & Tags */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-100)] text-[var(--primary-700)]">
                    {category}
                </span>

                {tags && tags.length > 0 && (
                    <>
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[var(--secondary-100)] text-[var(--secondary-700)] hover:bg-[var(--secondary-200)] transition-colors cursor-pointer"
                            >
                                <Tag className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
