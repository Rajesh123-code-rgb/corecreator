"use client";

import Image from "next/image";
import Link from "next/link";
import { Twitter, Linkedin, Instagram, Globe } from "lucide-react";

export interface AuthorProfile {
    id: string;
    name: string;
    avatar: string;
    title: string;
    bio: string;
    credentials: string[];
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        instagram?: string;
        website?: string;
    };
}

interface AuthorCardProps {
    author: AuthorProfile;
    variant?: "compact" | "full";
    showBio?: boolean;
}

export const AuthorCard = ({ author, variant = "full", showBio = true }: AuthorCardProps) => {
    const isCompact = variant === "compact";

    return (
        <div className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 ${isCompact ? "" : "lg:p-8"}`}>
            <div className="flex items-start gap-4">
                <Link href={`/blog/authors/${author.id}`} className="flex-shrink-0">
                    <img
                        src={author.avatar}
                        alt={author.name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-[var(--primary-200)] hover:ring-[var(--primary-400)] transition-all"
                    />
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <Link
                                href={`/blog/authors/${author.id}`}
                                className="font-bold text-lg hover:text-[var(--primary-600)] transition-colors"
                            >
                                {author.name}
                            </Link>
                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{author.title}</p>
                        </div>

                        {author.socialLinks && (
                            <div className="flex items-center gap-2">
                                {author.socialLinks.twitter && (
                                    <a
                                        href={author.socialLinks.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--muted-foreground)] hover:text-[var(--primary-600)] transition-colors"
                                        aria-label="Twitter"
                                    >
                                        <Twitter className="w-4 h-4" />
                                    </a>
                                )}
                                {author.socialLinks.linkedin && (
                                    <a
                                        href={author.socialLinks.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--muted-foreground)] hover:text-[var(--primary-600)] transition-colors"
                                        aria-label="LinkedIn"
                                    >
                                        <Linkedin className="w-4 h-4" />
                                    </a>
                                )}
                                {author.socialLinks.instagram && (
                                    <a
                                        href={author.socialLinks.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--muted-foreground)] hover:text-[var(--primary-600)] transition-colors"
                                        aria-label="Instagram"
                                    >
                                        <Instagram className="w-4 h-4" />
                                    </a>
                                )}
                                {author.socialLinks.website && (
                                    <a
                                        href={author.socialLinks.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--muted-foreground)] hover:text-[var(--primary-600)] transition-colors"
                                        aria-label="Website"
                                    >
                                        <Globe className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {showBio && !isCompact && (
                        <>
                            <p className="text-sm text-[var(--foreground)] mt-3 leading-relaxed">
                                {author.bio}
                            </p>

                            {author.credentials && author.credentials.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {author.credentials.map((credential, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--secondary-100)] text-[var(--secondary-700)]"
                                        >
                                            {credential}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
