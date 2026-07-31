"use client";

import * as React from "react";
import { Sparkles, Loader2, Info } from "lucide-react";
import { Button } from "@/components/atoms";

interface AIGeneratorButtonProps {
    title: string;
    description?: string;
    type: "course" | "product";
    onImageGenerated: (url: string) => void;
    onError?: (error: string) => void;
    className?: string;
}

export default function AIGeneratorButton({ 
    title, 
    description, 
    type, 
    onImageGenerated, 
    onError,
    className = "" 
}: AIGeneratorButtonProps) {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleGenerate = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent accidental form submission
        
        if (!title || title.trim().length < 3) {
            if (onError) onError(`Please provide a ${type} title first so the AI knows what to draw!`);
            return;
        }

        try {
            setIsGenerating(true);
            
            const res = await fetch("/api/ai/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    type,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate AI image");
            }

            if (data.url) {
                onImageGenerated(data.url);
            } else {
                throw new Error("No URL returned from AI engine");
            }
        } catch (error: any) {
            console.error("AI Generation failed:", error);
            if (onError) {
                onError(error.message || "An unexpected error occurred during AI generation");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={`relative group ${className}`}>
            <Button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-none shadow-lg shadow-violet-500/25 transition-all w-full flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI is painting your masterpiece...</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate with AI</span>
                    </>
                )}
            </Button>
            
            {/* Tooltip to explain it requires title context */}
            {!isGenerating && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-violet-300" />
                    Generates based on your {type} title
                </div>
            )}
        </div>
    );
}
