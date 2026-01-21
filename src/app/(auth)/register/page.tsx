"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/atoms";
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle, GraduationCap } from "lucide-react";

const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain number"),
        confirmPassword: z.string(),
        acceptTerms: z.boolean().refine((val) => val, { message: "Required" }),
    })
    .refine((data) => data.password === data.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { acceptTerms: false },
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: data.name, email: data.email, password: data.password, role: "user" }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setSuccess(true);
            setTimeout(() => signIn("credentials", { email: data.email, password: data.password, callbackUrl: "/user/dashboard" }), 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Welcome to Core Creator!</h1>
                    <p className="text-[var(--muted-foreground)]">Signing you in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left - Hero */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-gray-900">
                <div className="relative w-full h-full max-w-2xl text-center flex flex-col items-center justify-center">
                    <GraduationCap className="w-16 h-16 text-white mb-6" />
                    <h2 className="text-4xl font-bold mb-4 text-white">Start Your Journey</h2>
                    <p className="text-lg text-white/90">Join thousands of artists and creators in the most vibrant community.</p>
                </div>
            </div>

            {/* Right - Form */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md">
                    <Link href="/" className="inline-block mb-6">
                        <Image src="/logo.png" alt="Core Creator" width={160} height={40} className="h-10 w-auto" />
                    </Link>

                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Create Account</h1>
                        <p className="text-[var(--muted-foreground)]">Join our creative learning community</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="w-5 h-5" /><p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input label="Full Name" placeholder="Your name" leftIcon={<User className="w-5 h-5" />} error={errors.name?.message} {...register("name")} />
                        <Input label="Email" type="email" placeholder="your@email.com" leftIcon={<Mail className="w-5 h-5" />} error={errors.email?.message} {...register("email")} />
                        <div className="relative">
                            <Input label="Password" type={showPassword ? "text" : "password"} placeholder="Min 8 chars, 1 uppercase, 1 number" leftIcon={<Lock className="w-5 h-5" />} error={errors.password?.message} {...register("password")} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-[var(--muted-foreground)]">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <Input label="Confirm Password" type={showPassword ? "text" : "password"} placeholder="Repeat password" leftIcon={<Lock className="w-5 h-5" />} error={errors.confirmPassword?.message} {...register("confirmPassword")} />

                        <div className="flex items-start gap-2">
                            <input type="checkbox" id="terms" className="mt-1 w-4 h-4 rounded" {...register("acceptTerms")} />
                            <label htmlFor="terms" className="text-sm text-[var(--muted-foreground)]">
                                I agree to the <Link href="/terms" className="text-[var(--secondary-500)] hover:underline">Terms</Link> and <Link href="/privacy" className="text-[var(--secondary-500)] hover:underline">Privacy Policy</Link>
                            </label>
                        </div>

                        <Button type="submit" variant="secondary" size="lg" className="w-full gradient-gold text-white" isLoading={isLoading}>Create Account</Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
                        Already have an account? <Link href="/login" className="font-medium text-[var(--primary-600)] hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
