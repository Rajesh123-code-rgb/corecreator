"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { Heart, Check, Loader2 } from "lucide-react";

interface FollowShopButtonProps {
    sellerId: string;
    sellerName: string;
}

export default function FollowShopButton({ sellerId, sellerName }: FollowShopButtonProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollow = async () => {
        if (status === "unauthenticated") {
            // Redirect to login if not authenticated
            router.push(`/login?callbackUrl=/studio/${sellerId}`);
            return;
        }

        setIsLoading(true);

        try {
            // Toggle follow state (in a real app, this would call an API)
            // For now, we'll just toggle the UI state
            setIsFollowing(!isFollowing);

            // TODO: Implement follow API
            // const response = await fetch("/api/follow", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ sellerId }),
            // });

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error("Error following shop:", error);
            // Revert state on error
            setIsFollowing(isFollowing);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="secondary"
            className={`w-full sm:w-auto px-8 py-3 text-base font-semibold shadow-lg transition-all ${isFollowing
                ? "bg-green-600 hover:bg-green-700 shadow-green-500/30"
                : "shadow-[var(--secondary-500)]/30"
                }`}
            onClick={handleFollow}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isFollowing ? "Unfollowing..." : "Following..."}
                </>
            ) : isFollowing ? (
                <>
                    <Check className="w-5 h-5 mr-2" />
                    Following
                </>
            ) : (
                <>
                    <Heart className="w-5 h-5 mr-2" />
                    Follow Studio
                </>
            )}
        </Button>
    );
}
