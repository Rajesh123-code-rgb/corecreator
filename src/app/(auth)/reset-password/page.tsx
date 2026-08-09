"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/atoms";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [done, setDone] = React.useState(false);
    const [error, setError] = React.useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("Both passwords must match.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            setDone(true);
            setTimeout(() => router.push("/login"), 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">This link isn&apos;t valid</h1>
                <p className="text-[var(--muted-foreground)] mb-6">
                    The reset link is missing its token. Please request a new one.
                </p>
                <Button variant="secondary" className="w-full" asChild>
                    <Link href="/forgot-password">Request a new link</Link>
                </Button>
            </div>
        );
    }

    if (done) {
        return (
            <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Password set</h1>
                <p className="text-[var(--muted-foreground)] mb-6">
                    You can now sign in with your email and new password. Taking you there...
                </p>
                <Button variant="secondary" className="w-full" asChild>
                    <Link href="/login">Sign in</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-2xl font-bold mb-2">Set a new password</h1>
            <p className="text-[var(--muted-foreground)] mb-6">
                Choose a password of at least 8 characters.
            </p>

            {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="New password"
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    leftIcon={<Lock className="w-5 h-5" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                    label="Confirm password"
                    type="password"
                    required
                    placeholder="Re-enter your password"
                    leftIcon={<Lock className="w-5 h-5" />}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                />
                <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Set password"}
                </Button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--muted)]">
            <div className="w-full max-w-md bg-white rounded-xl border border-[var(--border)] p-8">
                {/* useSearchParams needs a Suspense boundary during prerender. */}
                <React.Suspense fallback={<div className="h-40" />}>
                    <ResetPasswordForm />
                </React.Suspense>
            </div>
        </div>
    );
}
