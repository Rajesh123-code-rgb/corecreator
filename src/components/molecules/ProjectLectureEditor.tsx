"use client";

import * as React from "react";
import { Button, Input, Textarea } from "@/components/atoms";
import { X, Image as ImageIcon, Plus } from "lucide-react";

interface ProjectLectureEditorProps {
    existingContent: {
        instructions?: string;
        expectedOutcome?: string;
        referenceImages?: string[];
    };
    onContentChange: (content: {
        instructions: string;
        expectedOutcome: string;
        referenceImages: string[];
    }) => void;
}

export function ProjectLectureEditor({ existingContent, onContentChange }: ProjectLectureEditorProps) {
    const [instructions, setInstructions] = React.useState(existingContent.instructions || "");
    const [expectedOutcome, setExpectedOutcome] = React.useState(existingContent.expectedOutcome || "");
    const [referenceImages, setReferenceImages] = React.useState<string[]>(existingContent.referenceImages || []);
    const [newImageUrl, setNewImageUrl] = React.useState("");

    React.useEffect(() => {
        onContentChange({
            instructions,
            expectedOutcome,
            referenceImages
        });
    }, [instructions, expectedOutcome, referenceImages]);

    const addImage = () => {
        if (newImageUrl) {
            setReferenceImages([...referenceImages, newImageUrl]);
            setNewImageUrl("");
        }
    };

    const removeImage = (index: number) => {
        setReferenceImages(referenceImages.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6 bg-white p-4 rounded-lg border border-gray-100">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Instructions</label>
                <div className="text-xs text-gray-500 mb-2">Provide step-by-step instructions for the student project.</div>
                <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Step 1: Gather your materials..."
                    rows={6}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Outcome</label>
                <div className="text-xs text-gray-500 mb-2">Describe what the student should have achieved by the end.</div>
                <Textarea
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    placeholder="By the end of this project, you will have..."
                    rows={3}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Images</label>
                <div className="flex gap-2 mb-3">
                    <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Image URL (e.g., https://...)"
                        className="flex-1"
                    />
                    <Button onClick={addImage} type="button" variant="outline" disabled={!newImageUrl}>
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {referenceImages.map((url, index) => (
                        <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={url} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {referenceImages.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <span>No reference images added</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
