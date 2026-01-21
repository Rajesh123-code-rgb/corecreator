"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { User as UserIcon, Mail, Phone, MapPin, Camera, Save, CheckCircle, Plus, Trash2, Home, Briefcase, Truck, CreditCard } from "lucide-react";
import { countries } from "@/lib/data/countries";
import { useLanguage } from "@/context/LanguageContext";

const addressSchema = z.object({
    type: z.enum(["home", "work", "billing", "shipping"]),
    street: z.string().min(3, "Street is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().min(3, "Zip Code is required"),
    country: z.string().min(2, "Country is required"),
    isDefault: z.boolean(),
});

const profileSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email(),
    countryCode: z.string(),
    phoneNumber: z.string(),
    location: z.string().optional(),
    bio: z.string().max(500).optional(),
    addresses: z.array(addressSchema),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function StudentProfilePage() {
    const { t } = useLanguage();
    const { data: session, update: updateSession } = useSession();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [showAddressForm, setShowAddressForm] = React.useState(false);

    const { register, handleSubmit, setValue, watch, control, formState: { errors }, reset } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            email: "",
            countryCode: "+91",
            phoneNumber: "",
            location: "",
            bio: "",
            addresses: [],
        },
    });

    const addresses = watch("addresses");

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();
                    const user = data.user;

                    // Parse phone number to split country code if possible (simple heuristic)
                    // Assuming stored phone might be just number or full string. 
                    // For now, if we don't have stored split, we default.

                    reset({
                        name: user.name || "",
                        email: user.email || "",
                        // If phone is stored as +9112345, we might need to split it properly.
                        // Ideally backend should store them separately or we parse.
                        // Here we just put the whole string or default.
                        countryCode: "+91",
                        phoneNumber: user.profile?.phone || "",
                        location: user.profile?.location || "",
                        bio: user.bio || "",
                        addresses: user.addresses || [],
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user) {
            fetchProfile();
        }
    }, [session, reset]);


    const onSubmit = async (data: ProfileFormData) => {
        setIsSaving(true);
        try {
            const fullPhone = data.phoneNumber ? `${data.phoneNumber}` : ""; // Could prefix with countryCode if we change backend to store full string formatted

            // NOTE: Currently backend stores 'phone' as a single string. 
            // We can just save the number, or format it. Let's just save the number for now as per schema.

            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    phone: data.phoneNumber // Saving just the number part as requested, or maybe we should save combo?
                }),
            });

            if (res.ok) {
                setSaved(true);
                updateSession(); // Refresh session data
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error("Failed to update profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const addAddress = () => {
        const newAddress = {
            type: "home" as const,
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "India",
            isDefault: addresses.length === 0,
        };
        setValue("addresses", [...addresses, newAddress]);
        setShowAddressForm(true); // Simplified: Just opens the list which will now have a new empty item to edit? 
        // Actually, better to just append and let user edit fields.
    };

    const removeAddress = (index: number) => {
        const newAddresses = [...addresses];
        newAddresses.splice(index, 1);
        setValue("addresses", newAddresses);
    };

    if (isLoading) {
        return <div className="p-8 text-center">{t("dashboard.profile.loading")}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t("dashboard.profile.title")}</h1>
                <p className="text-[var(--muted-foreground)]">{t("dashboard.profile.subtitle")}</p>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Personal Info Card */}
                <Card>
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="font-semibold">{t("dashboard.profile.personal_info")}</h2>
                    </div>
                    <CardContent className="p-6 grid md:grid-cols-2 gap-5">
                        <Input
                            label={t("dashboard.profile.full_name")}
                            placeholder={t("dashboard.profile.full_name")}
                            leftIcon={<UserIcon className="w-5 h-5" />}
                            error={errors.name?.message}
                            {...register("name")}
                        />
                        <Input
                            label={t("dashboard.profile.email")}
                            type="email"
                            placeholder="your@email.com"
                            leftIcon={<Mail className="w-5 h-5" />}
                            error={errors.email?.message}
                            disabled
                            {...register("email")}
                        />

                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t("dashboard.profile.phone")}</label>
                            <div className="flex gap-2">
                                <select
                                    className="w-24 px-3 py-2 rounded-lg border border-[var(--border)] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    {...register("countryCode")}
                                >
                                    {countries.map((c) => (
                                        <option key={c.code} value={c.dial_code}>
                                            {c.flag} {c.code} ({c.dial_code})
                                        </option>
                                    ))}
                                </select>
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="1234567890"
                                        leftIcon={<Phone className="w-5 h-5" />}
                                        error={errors.phoneNumber?.message}
                                        {...register("phoneNumber")}
                                    />
                                </div>
                            </div>
                        </div>

                        <Input
                            label={t("dashboard.profile.location")}
                            placeholder="City, Country"
                            leftIcon={<MapPin className="w-5 h-5" />}
                            {...register("location")}
                        />

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">{t("dashboard.profile.bio")}</label>
                            <textarea
                                placeholder="Tell us about yourself..."
                                className="w-full h-24 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                                {...register("bio")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Addresses Card */}
                <Card>
                    <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                        <h2 className="font-semibold">{t("dashboard.profile.saved_addresses")}</h2>
                        <Button type="button" variant="outline" size="sm" onClick={addAddress}>
                            <Plus className="w-4 h-4 mr-2" /> {t("dashboard.profile.add_address")}
                        </Button>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        {addresses.length === 0 ? (
                            <div className="text-center py-6 text-[var(--muted-foreground)]">
                                {t("dashboard.profile.no_addresses")}
                            </div>
                        ) : (
                            addresses.map((address, index) => (
                                <div key={index} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 space-y-4 relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeAddress(index)}
                                        className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Address"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">{t("dashboard.profile.label")}</label>
                                            <select
                                                {...register(`addresses.${index}.type`)}
                                                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-background text-sm"
                                            >
                                                <option value="home">{t("dashboard.profile.address_type_home")}</option>
                                                <option value="work">{t("dashboard.profile.address_type_work")}</option>
                                                <option value="billing">{t("dashboard.profile.address_type_billing")}</option>
                                                <option value="shipping">{t("dashboard.profile.address_type_shipping")}</option>
                                            </select>
                                        </div>
                                        <Input
                                            label={t("dashboard.profile.country")}
                                            placeholder={t("dashboard.profile.country")}
                                            {...register(`addresses.${index}.country`)}
                                            error={errors.addresses?.[index]?.country?.message}
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label={t("dashboard.profile.street")}
                                                placeholder="123 Main St"
                                                {...register(`addresses.${index}.street`)}
                                                error={errors.addresses?.[index]?.street?.message}
                                            />
                                        </div>
                                        <Input
                                            label={t("dashboard.profile.city")}
                                            placeholder={t("dashboard.profile.city")}
                                            {...register(`addresses.${index}.city`)}
                                            error={errors.addresses?.[index]?.city?.message}
                                        />
                                        <Input
                                            label={t("dashboard.profile.state")}
                                            placeholder={t("dashboard.profile.state")}
                                            {...register(`addresses.${index}.state`)}
                                            error={errors.addresses?.[index]?.state?.message}
                                        />
                                        <Input
                                            label={t("dashboard.profile.zip")}
                                            placeholder="12345"
                                            {...register(`addresses.${index}.zipCode`)}
                                            error={errors.addresses?.[index]?.zipCode?.message}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`default-${index}`}
                                            {...register(`addresses.${index}.isDefault`)}
                                            className="w-4 h-4 rounded border-gray-300 text-[var(--secondary-600)] focus:ring-[var(--secondary-500)]"
                                        />
                                        <label htmlFor={`default-${index}`} className="text-sm">{t("dashboard.profile.default")}</label>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Save Button Sticky */}
                <div className="sticky bottom-4 z-10 flex justify-end">
                    <Button type="submit" variant="secondary" size="lg" isLoading={isSaving} className="shadow-lg">
                        {saved ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" /> {t("dashboard.profile.saved")}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> {t("dashboard.profile.save")}
                            </>
                        )}
                    </Button>
                </div>

            </form>
        </div>
    );
}
