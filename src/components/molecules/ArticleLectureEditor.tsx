"use client";

import * as React from "react";
import { FileText } from "lucide-react";

interface ArticleLectureEditorProps {
    onContentChange: (content: string) => void;
    existingContent?: string;
    className?: string;
}

export function ArticleLectureEditor({
    onContentChange,
    existingContent = "",
    className = "",
}: ArticleLectureEditorProps) {
    const [content, setContent] = React.useState(existingContent);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);
        onContentChange(newContent);
    };

    return (
        <div className={className}>
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <FileText className="w-4 h-4" />
                    <span>Write your article content below (Markdown supported)</span>
                </div>
                <textarea
                    value={content}
                    onChange={handleChange}
                    placeholder="Write your article content here...

You can use basic Markdown formatting:
- **Bold text**
- *Italic text*
- # Headings
- - Bullet points
- [Links](https://example.com)"
                    className="w-full min-h-[400px] p-4 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono text-sm"
                />
                <div className="text-xs text-[var(--muted-foreground)]">
                    {content.length} characters • Basic Markdown formatting supported
                </div>
            </div>
        </div>
    );
}
