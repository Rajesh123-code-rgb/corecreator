"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/atoms";
import { SSOButtons } from "@/components/molecules";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/user/dashboard";

    const [showPassword, setShowPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [authError, setAuthError] = React.useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setAuthError(null);

        const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });

        if (result?.error) {
            setAuthError(result.error);
            setIsLoading(false);
        } else {
            router.push(callbackUrl);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <Link href="/" className="inline-block mb-8">
                        <Image src="/logo.png" alt="Core Creator" width={160} height={40} className="h-10 w-auto" />
                    </Link>

                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Sign In</h1>
                        <p className="text-[var(--muted-foreground)]">Welcome back to Core Creator</p>
                    </div>

                    {authError && (
                        <div className="flex items-center gap-2 p-4 mb-6 rounded-lg bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="w-5 h-5" /><p className="text-sm">{authError}</p>
                        </div>
                    )}

                    <SSOButtons callbackUrl={callbackUrl} showDivider={false} />

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[var(--background)] text-[var(--muted-foreground)]">Or sign in with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input label="Email" type="email" placeholder="Enter your email" leftIcon={<Mail className="w-5 h-5" />} error={errors.email?.message} {...register("email")} />
                        <div className="relative">
                            <Input label="Password" type={showPassword ? "text" : "password"} placeholder="Enter your password" leftIcon={<Lock className="w-5 h-5" />} error={errors.password?.message} {...register("password")} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-[var(--muted-foreground)]">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <Button type="submit" size="lg" className="w-full gradient-gold text-white" isLoading={isLoading}>Sign In</Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
                        Don't have an account? <Link href="/register" className="font-medium text-[var(--primary-600)] hover:underline">Create one</Link>
                    </p>
                </div>
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-gray-900">
                <div className="relative w-full h-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                        src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?q=80&w=1000&auto=format&fit=crop"
                        alt="Art"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-12">
                        <div className="text-white">
                            <h2 className="text-3xl font-bold mb-2">Unleash Your Creativity</h2>
                            <p className="text-lg text-white/90">Join a community of artists and learners.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--primary-500)] border-t-transparent rounded-full" />
            </div>
        }>
            <LoginContent />
        </React.Suspense>
    );
}
