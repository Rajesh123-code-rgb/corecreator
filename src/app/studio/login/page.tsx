"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";
import { Palette } from "lucide-react";
import Image from "next/image";

export default function StudioLoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession(); // Add usage of session
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        if (status === "authenticated") {
            router.replace("/studio/dashboard");
        }
    }, [status, router]);

    const [formData, setFormData] = React.useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/studio/dashboard");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6">
                        <Image src="/logo.png" alt="Core Creator" width={180} height={45} className="h-12 w-auto" />
                    </Link>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center">
                            <Palette className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Studio Login</h1>
                    <p className="text-gray-600 mt-2">Access your creator dashboard</p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <Input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="creator@example.com"
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <Input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                className="w-full"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full gradient-gold text-white"
                        >
                            {isLoading ? "Signing in..." : "Sign in to Studio"}
                        </Button>

                        <div className="text-center text-sm text-gray-600">
                            Don't have a studio account?{" "}
                            <Link href="/studio/register" className="text-amber-600 hover:text-amber-700 font-medium">
                                Register here
                            </Link>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                                ← Back to regular login
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
