"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button, Input } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import {
    Bell,
    Shield,
    Globe,
    Lock,
    CheckCircle,
    Save,
    Smartphone,
    X,
} from "lucide-react";

const settingsSchema = z.object({
    preferences: z.object({
        language: z.string(),
        emailNotifications: z.boolean(),
        pushNotifications: z.boolean(),
    }),
    twoFactorEnabled: z.boolean(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SettingsFormData = z.infer<typeof settingsSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function UserSettingsPage() {
    const { data: session } = useSession();
    const { language, setLanguage, t } = useLanguage();
    // Currency is now global via header, no settings page config needed

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = React.useState(false);
    const [passwordError, setPasswordError] = React.useState("");
    const [passwordSuccess, setPasswordSuccess] = React.useState("");
    const [isChangingPassword, setIsChangingPassword] = React.useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            preferences: {
                language: "en",
                emailNotifications: true,
                pushNotifications: true,
            },
            twoFactorEnabled: false,
        },
    });

    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        formState: { errors: passwordErrors },
        reset: resetPassword
    } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema)
    });

    const twoFactorEnabled = watch("twoFactorEnabled");

    React.useEffect(() => {
        setValue("preferences.language", language);
    }, [language, setValue]);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/user/settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings) {
                        const syncedSettings = {
                            ...data.settings,
                            preferences: {
                                ...data.settings.preferences,
                                language: language,
                            }
                        };
                        reset(syncedSettings);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user) {
            fetchSettings();
        }
    }, [session, reset, language]);

    const onSubmit = async (data: SettingsFormData) => {
        setIsSaving(true);
        setLanguage(data.preferences.language as any);

        try {
            const res = await fetch("/api/user/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error("Failed to update settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        setIsChangingPassword(true);
        setPasswordError("");
        setPasswordSuccess("");

        try {
            const res = await fetch("/api/user/password/change", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setPasswordError(result.message || "Failed to change password");
            } else {
                setPasswordSuccess("Password changed successfully!");
                resetPassword();
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setPasswordSuccess("");
                }, 2000);
            }
        } catch (error) {
            setPasswordError("An error occurred. Please try again.");
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
                <p className="text-[var(--muted-foreground)]">Manage your account preferences and security</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Preferences */}
                <Card>
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Globe className="w-5 h-5 text-[var(--primary-600)]" />
                            {t("settings.preferences")}
                        </h2>
                    </div>
                    <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Language</label>
                            <select
                                {...register("preferences.language")}
                                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi (हिंदी)</option>
                            </select>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                Select your preferred language for the interface.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Bell className="w-5 h-5 text-[var(--primary-600)]" />
                            Notifications
                        </h2>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Receive updates about your courses, orders, and promotions.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    {...register("preferences.emailNotifications")}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--primary-500)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-600)]"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-[var(--border)]">
                            <div>
                                <p className="font-medium">Push Notifications</p>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Receive real-time alerts on your device.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    {...register("preferences.pushNotifications")}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--primary-500)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-600)]"></div>
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[var(--primary-600)]" />
                            Security
                        </h2>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" />
                                    Two-Factor Authentication (2FA)
                                </h3>
                                <p className="text-sm text-[var(--muted-foreground)] max-w-lg mt-1">
                                    Add an extra layer of security to your account by requiring a code from your authentication app to log in.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[var(--primary-600)] px-2 py-1 bg-[var(--primary-100)] rounded-full border border-[var(--primary-200)]">
                                    COMING SOON
                                </span>
                                <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        disabled
                                        checked={false}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[var(--border)]">
                            <h3 className="font-medium mb-4 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Password
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">
                                        Update your password to keep your account secure.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setShowPasswordModal(true)}
                                >
                                    Change Password
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="sticky bottom-4 z-10 flex justify-end">
                    <Button type="submit" variant="secondary" size="lg" isLoading={isSaving} className="shadow-lg">
                        {saved ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" /> {t("settings.saved")}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> {t("settings.save")}
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md border border-[var(--border)] overflow-hidden">
                        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--muted)]">
                            <h3 className="font-bold">Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="p-1 hover:bg-[var(--border)] rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {passwordError && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-100">
                                    {passwordSuccess}
                                </div>
                            )}
                            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                                <Input
                                    label="Current Password"
                                    type="password"
                                    {...registerPassword("currentPassword")}
                                    error={passwordErrors.currentPassword?.message}
                                />
                                <Input
                                    label="New Password"
                                    type="password"
                                    {...registerPassword("newPassword")}
                                    error={passwordErrors.newPassword?.message}
                                />
                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    {...registerPassword("confirmPassword")}
                                    error={passwordErrors.confirmPassword?.message}
                                />
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" isLoading={isChangingPassword}>
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
