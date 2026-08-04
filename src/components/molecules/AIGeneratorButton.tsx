"use client";

import * as React from "react";
import { Sparkles, Loader2, Info, X, RefreshCw, Check, ImageOff, Wand2, Cpu, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/atoms";

interface AIGeneratorButtonProps {
    title: string;
    description?: string;
    type: "course" | "product";
    onImageGenerated: (url: string) => void;
    onError?: (error: string) => void;
    className?: string;
}

// Generation stages with timing weights (must sum ~100)
const STAGES = [
    { id: "prompt",    label: "Crafting AI prompt…",       icon: Wand2,   progress: 10,  duration: 800  },
    { id: "generate",  label: "Generating your image…",    icon: Cpu,     progress: 55,  duration: 18000 },
    { id: "refine",    label: "Refining details…",          icon: Sparkles,progress: 75,  duration: 3000 },
    { id: "upload",    label: "Saving to cloud…",           icon: Cloud,   progress: 92,  duration: 2500 },
    { id: "done",      label: "Image ready!",               icon: Zap,     progress: 100, duration: 400  },
];

export default function AIGeneratorButton({
    title,
    description,
    type,
    onImageGenerated,
    onError,
    className = "",
}: AIGeneratorButtonProps) {
    const [modalOpen,     setModalOpen]     = React.useState(false);
    const [isGenerating,  setIsGenerating]  = React.useState(false);
    const [progress,      setProgress]      = React.useState(0);
    const [stageIndex,    setStageIndex]    = React.useState(0);
    const [generatedUrl,  setGeneratedUrl]  = React.useState<string | null>(null);
    const [errorMsg,      setErrorMsg]      = React.useState<string | null>(null);
    const [saved,         setSaved]         = React.useState(false);

    // Refs to cancel timers on unmount / re-generate
    const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };

    const resetState = () => {
        setProgress(0);
        setStageIndex(0);
        setGeneratedUrl(null);
        setErrorMsg(null);
        setSaved(false);
        setIsGenerating(false);
    };

    const openModal = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!title || title.trim().length < 3) {
            if (onError) onError(`Please add a ${type} title (min 3 chars) so AI knows what to create!`);
            return;
        }
        resetState();
        setModalOpen(true);
        startGeneration();
    };

    const closeModal = () => {
        clearTimers();
        setModalOpen(false);
        setTimeout(resetState, 300); // allow close animation
    };

    // Simulate stage-by-stage progress advancement and fire the real API call
    const startGeneration = () => {
        clearTimers();
        setIsGenerating(true);
        setProgress(0);
        setStageIndex(0);
        setGeneratedUrl(null);
        setErrorMsg(null);
        setSaved(false);

        // Advance through stages visually
        let elapsed = 0;
        STAGES.forEach((stage, idx) => {
            const t = setTimeout(() => {
                setStageIndex(idx);
                setProgress(stage.progress);
            }, elapsed);
            timersRef.current.push(t);
            elapsed += stage.duration;
        });

        // Fire actual API
        callAPI();
    };

    const callAPI = async () => {
        try {
            const res = await fetch("/api/ai/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, type }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to generate AI image");
            if (!data.url)  throw new Error("No image URL returned from AI engine");

            // Jump to 100% immediately on success
            clearTimers();
            setProgress(100);
            setStageIndex(STAGES.length - 1);
            setTimeout(() => {
                setGeneratedUrl(data.url);
                setIsGenerating(false);
            }, 400);

        } catch (err: any) {
            clearTimers();
            setIsGenerating(false);
            setErrorMsg(err.message || "An unexpected error occurred");
            setProgress(0);
        }
    };

    const handleSave = () => {
        if (!generatedUrl) return;
        setSaved(true);
        onImageGenerated(generatedUrl);
        setTimeout(closeModal, 700);
    };

    const handleRegenerate = (e: React.MouseEvent) => {
        e.preventDefault();
        startGeneration();
    };

    const CurrentStageIcon = STAGES[stageIndex]?.icon ?? Sparkles;

    return (
        <>
            {/* Trigger Button */}
            <div className={`relative group ${className}`}>
                <Button
                    onClick={openModal}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-none shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate with AI</span>
                </Button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-violet-300" />
                    Generates based on your {type} title
                </div>
            </div>

            {/* Modal Overlay */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
                    onClick={(e) => { if (e.target === e.currentTarget && !isGenerating) closeModal(); }}
                >
                    <div
                        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0d1117 100%)",
                            border: "1px solid rgba(139,92,246,0.3)",
                        }}
                    >
                        {/* Close button */}
                        {!isGenerating && (
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-base">AI Image Generator</h3>
                                    <p className="text-violet-300 text-xs mt-0.5 truncate max-w-[260px]">"{title}"</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">

                            {/* === GENERATING STATE === */}
                            {isGenerating && !generatedUrl && !errorMsg && (
                                <div className="space-y-5">
                                    {/* Animated placeholder */}
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden"
                                        style={{ background: "linear-gradient(135deg,#1e0a3c,#0d1b2a)" }}>
                                        {/* Shimmer */}
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute inset-y-0 -left-full w-1/2"
                                                style={{
                                                    background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.12),transparent)",
                                                    animation: "shimmer 2s infinite linear",
                                                }}
                                            />
                                        </div>
                                        {/* Center icon */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                                style={{ background: "rgba(139,92,246,0.2)", border: "2px solid rgba(139,92,246,0.4)" }}>
                                                <CurrentStageIcon className="w-8 h-8 text-violet-400 animate-pulse" />
                                            </div>
                                            <p className="text-violet-300 text-sm font-medium">
                                                {STAGES[stageIndex]?.label}
                                            </p>
                                        </div>
                                        {/* Particle dots */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {[0, 1, 2].map(i => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
                                                    style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-violet-300 font-medium flex items-center gap-1.5">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                {STAGES[stageIndex]?.label}
                                            </span>
                                            <span className="text-white font-bold tabular-nums">{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full overflow-hidden"
                                            style={{ background: "rgba(255,255,255,0.08)" }}>
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${progress}%`,
                                                    background: "linear-gradient(90deg,#7c3aed,#db2777,#f59e0b)",
                                                    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                                                    boxShadow: "0 0 12px rgba(139,92,246,0.6)",
                                                }}
                                            />
                                        </div>
                                        {/* Stage dots */}
                                        <div className="flex items-center justify-between px-0.5">
                                            {STAGES.map((s, i) => (
                                                <div
                                                    key={s.id}
                                                    className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                                                    style={{
                                                        background: i <= stageIndex
                                                            ? "linear-gradient(135deg,#7c3aed,#db2777)"
                                                            : "rgba(255,255,255,0.15)",
                                                        transform: i === stageIndex ? "scale(1.6)" : "scale(1)",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-center text-gray-500 text-xs">
                                        This typically takes 20–30 seconds. Please don't close this window.
                                    </p>
                                </div>
                            )}

                            {/* === ERROR STATE === */}
                            {errorMsg && !isGenerating && (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center gap-3 py-6">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500/20 border border-red-500/30">
                                            <ImageOff className="w-7 h-7 text-red-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-semibold mb-1">Generation Failed</p>
                                            <p className="text-red-300 text-sm max-w-xs">{errorMsg}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleRegenerate}
                                            className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-none"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Try Again
                                        </Button>
                                        <Button variant="outline" onClick={closeModal}
                                            className="flex-1 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* === SUCCESS STATE: Preview + Actions === */}
                            {generatedUrl && !isGenerating && !errorMsg && (
                                <div className="space-y-4">
                                    {/* Image preview */}
                                    <div className="relative rounded-xl overflow-hidden border border-violet-500/30 shadow-lg shadow-violet-500/20">
                                        <img
                                            src={generatedUrl}
                                            alt="AI Generated"
                                            className="w-full object-cover"
                                            style={{ maxHeight: "280px" }}
                                        />
                                        {/* Overlay badge */}
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                                            style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", boxShadow: "0 0 12px rgba(139,92,246,0.5)" }}>
                                            <Sparkles className="w-3 h-3" />
                                            AI Generated
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-3">
                                        {/* Save */}
                                        <button
                                            onClick={handleSave}
                                            disabled={saved}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm text-white transition-all"
                                            style={{
                                                background: saved
                                                    ? "linear-gradient(135deg,#16a34a,#15803d)"
                                                    : "linear-gradient(135deg,#7c3aed,#db2777)",
                                                boxShadow: saved ? "0 0 16px rgba(22,163,74,0.4)" : "0 0 16px rgba(139,92,246,0.4)",
                                                transform: saved ? "scale(0.98)" : "scale(1)",
                                            }}
                                        >
                                            {saved ? (
                                                <><Check className="w-4 h-4" /><span>Saved!</span></>
                                            ) : (
                                                <><Check className="w-4 h-4" /><span>Save Image</span></>
                                            )}
                                        </button>

                                        {/* Regenerate */}
                                        <button
                                            onClick={handleRegenerate}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm text-violet-300 transition-all hover:text-white"
                                            style={{
                                                background: "rgba(139,92,246,0.12)",
                                                border: "1px solid rgba(139,92,246,0.3)",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,92,246,0.25)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(139,92,246,0.12)")}
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Regenerate</span>
                                        </button>
                                    </div>

                                    <p className="text-center text-gray-600 text-xs">
                                        Click <span className="text-violet-400 font-medium">Save Image</span> to use this as your {type} image,
                                        or <span className="text-violet-400 font-medium">Regenerate</span> for a different result.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Decorative gradient orbs */}
                        <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20"
                            style={{ background: "radial-gradient(circle,#7c3aed,transparent)" }} />
                        <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-15"
                            style={{ background: "radial-gradient(circle,#db2777,transparent)" }} />
                    </div>
                </div>
            )}

            {/* Global keyframe animations */}
            <style>{`
                @keyframes shimmer {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(400%); }
                }
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); opacity:1; }
                    40%           { transform: translateY(-6px); opacity:0.6; }
                }
            `}</style>
        </>
    );
}
