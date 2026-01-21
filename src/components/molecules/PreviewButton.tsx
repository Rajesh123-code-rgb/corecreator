"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/atoms";
import { Eye } from "lucide-react";
import { transformToCoursePreview, storePreviewData } from "@/lib/utils/coursePreview";

interface PreviewButtonProps {
    formData: any;
    className?: string;
}

export function PreviewButton({ formData, className = "" }: PreviewButtonProps) {
    const { data: session } = useSession();
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handlePreview = () => {
        setIsGenerating(true);

        try {
            // Transform form data to preview format
            const previewData = transformToCoursePreview(formData, session);

            // Store in sessionStorage
            storePreviewData(previewData);

            // Open preview in new tab
            const previewUrl = "/studio/courses/preview";
            window.open(previewUrl, "_blank");
        } catch (error) {
            console.error("Preview generation error:", error);
            alert("Failed to generate preview. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isDisabled = !formData.title || formData.sections.length === 0;

    return (
        <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isDisabled || isGenerating}
            isLoading={isGenerating}
            className={className}
        >
            <Eye className="w-4 h-4 mr-2" />
            Preview Course
        </Button>
    );
}
