"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Input } from "@/components/atoms";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [sent, setSent] = React.useState(false);
    const [error, setError] = React.useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--muted)]">
            <div className="w-full max-w-md bg-white rounded-xl border border-[var(--border)] p-8">
                {sent ? (
                    <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
                        <p className="text-[var(--muted-foreground)] mb-6">
                            If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a
                            link to set a new password. It expires in 1 hour.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/login">Back to sign in</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold mb-2">Forgot your password?</h1>
                        <p className="text-[var(--muted-foreground)] mb-6">
                            Enter your email and we&apos;ll send you a link to set a new one. If you checked out as a
                            guest, use the same email you entered at checkout.
                        </p>

                        {error && (
                            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                required
                                placeholder="Enter your email"
                                leftIcon={<Mail className="w-5 h-5" />}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={isLoading}>
                                {isLoading ? "Sending..." : "Send reset link"}
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
                            Remembered it? <Link href="/login" className="text-[var(--primary-600)] font-medium hover:underline">Sign in</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
