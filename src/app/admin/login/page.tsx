"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/atoms";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";

    const [showPassword, setShowPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [authError, setAuthError] = React.useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setAuthError(null);

        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false
        });

        if (result?.error) {
            setAuthError(result.error);
            setIsLoading(false);
        } else {
            router.push(callbackUrl);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                    <p className="text-gray-500 mt-2">Sign in to access the dashboard</p>
                </div>

                {authError && (
                    <div className="flex items-center gap-2 p-4 mb-6 rounded-lg bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">{authError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="admin@corecreator.com"
                        leftIcon={<Mail className="w-5 h-5" />}
                        error={errors.email?.message}
                        {...register("email")}
                    />
                    <div className="relative">
                        <Input
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            leftIcon={<Lock className="w-5 h-5" />}
                            error={errors.password?.message}
                            {...register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 text-[var(--muted-foreground)]"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        isLoading={isLoading}
                    >
                        Sign In to Admin
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
