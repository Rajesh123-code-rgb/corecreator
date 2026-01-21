import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";

interface Source {
    title: string;
    url: string;
    type: "internal" | "external";
    publishedDate?: string;
    author?: string;
}

interface ReferencesSectionProps {
    sources: Source[];
    factChecked?: boolean;
    factCheckDate?: Date;
}

export const ReferencesSection = ({ sources, factChecked, factCheckDate }: ReferencesSectionProps) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[var(--primary-600)]" />
                    Sources & References
                </h2>

                {factChecked && factCheckDate && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        ✓ Fact-checked {factCheckDate.toLocaleDateString()}
                    </div>
                )}
            </div>

            <ol className="space-y-3">
                {sources.map((source, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--secondary-100)] text-[var(--secondary-700)] flex items-center justify-center text-xs font-bold">
                            {index + 1}
                        </span>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] font-medium uppercase">
                                    {source.type}
                                </span>

                                {source.type === "internal" ? (
                                    <Link
                                        href={source.url}
                                        className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium hover:underline"
                                    >
                                        {source.title}
                                    </Link>
                                ) : (
                                    <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium hover:underline inline-flex items-center gap-1"
                                    >
                                        {source.title}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            {(source.author || source.publishedDate) && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                    {source.author && <span>{source.author}</span>}
                                    {source.author && source.publishedDate && <span> • </span>}
                                    {source.publishedDate && <span>{source.publishedDate}</span>}
                                </p>
                            )}
                        </div>
                    </li>
                ))}
            </ol>

            <p className="text-xs text-[var(--muted-foreground)] mt-6 italic">
                All sources have been reviewed for accuracy and credibility as of the publication date.
            </p>
        </div>
    );
};
