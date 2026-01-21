"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms";

const enquirySchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    countryCode: z.string(),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface EnquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    workshopTitle: string;
}

export function EnquiryModal({ isOpen, onClose, workshopTitle }: EnquiryModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EnquiryFormData>({
        resolver: zodResolver(enquirySchema),
    });

    if (!isOpen) return null;

    const onSubmit = async (data: EnquiryFormData) => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        console.log("Enquiry Data:", { workshop: workshopTitle, ...data });
        alert("Thank you for your interest! We will get back to you shortly.");

        setIsSubmitting(false);
        reset();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border)]">
                <div className="flex justify-between items-center p-6 border-b border-[var(--border)]">
                    <h2 className="text-xl font-bold">I'm Interested</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-[var(--muted-foreground)] mb-6">
                        Enquire about <span className="font-semibold text-[var(--foreground)]">{workshopTitle}</span>. We will contact you with more details.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <input
                                {...register("name")}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                                placeholder="Your full name"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                {...register("email")}
                                type="email"
                                className="w-full px-4 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                                placeholder="alice@example.com"
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <div className="flex gap-2">
                                <select
                                    className="px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] text-sm"
                                    defaultValue="+91"
                                    {...register("countryCode")}
                                >
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+61">🇦🇺 +61</option>
                                    <option value="+971">🇦🇪 +971</option>
                                    <option value="+65">🇸🇬 +65</option>
                                </select>
                                <input
                                    {...register("phone")}
                                    type="tel"
                                    className="flex-1 px-4 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                                    placeholder="98765 43210"
                                />
                            </div>
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message (Optional)</label>
                            <textarea
                                {...register("message")}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] min-h-[100px]"
                                placeholder="Any specific questions?"
                            />
                            {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Enquiry"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
