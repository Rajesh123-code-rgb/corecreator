"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { Calendar, Clock, MapPin, Loader2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Workshop {
    _id: string;
    title: string;
    description: string;
    slug: string;
    date: string;
    startTime: string;
    endTime: string;
    instructor: {
        name: string;
    };
    location: string;
    meetingUrl?: string; // For online workshops
    mode: "online" | "offline";
    price: number;
}

export default function MyWorkshopsPage() {
    const { t } = useLanguage();
    const [workshops, setWorkshops] = React.useState<Workshop[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchWorkshops = async () => {
            try {
                const res = await fetch("/api/user/workshops");
                if (res.ok) {
                    const data = await res.json();
                    setWorkshops(data.workshops || []);
                }
            } catch (error) {
                console.error("Failed to fetch workshops:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkshops();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t("dashboard.workshops.title")}</h1>

            {workshops.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Calendar className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
                        <h3 className="text-lg font-medium mb-1">{t("dashboard.no_workshops")}</h3>
                        <p className="text-[var(--muted-foreground)] mb-4">
                            {t("dashboard.workshops.empty")}
                        </p>
                        <Button asChild>
                            <Link href="/workshops">{t("dashboard.workshops.browse")}</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workshops.map((workshop) => (
                        <Card key={workshop._id} className="overflow-hidden flex flex-col h-full group">
                            <div className="bg-[var(--primary-100)] h-32 flex items-center justify-center">
                                <Calendar className="w-12 h-12 text-[var(--primary-600)]" />
                            </div>
                            <CardContent className="p-5 flex-1 flex flex-col">
                                <div className="mb-2">
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${workshop.mode === 'online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        } uppercase`}>
                                        {workshop.mode}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-2 line-clamp-2">{workshop.title}</h3>
                                <p className="text-sm text-[var(--muted-foreground)] mb-4">by {workshop.instructor?.name || "Instructor"}</p>

                                <div className="space-y-2 mb-6 flex-1">
                                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(workshop.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                        <Clock className="w-4 h-4" />
                                        <span>{workshop.startTime} - {workshop.endTime}</span>
                                    </div>
                                    {workshop.mode === 'offline' && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                            <MapPin className="w-4 h-4" />
                                            <span className="truncate">{workshop.location}</span>
                                        </div>
                                    )}
                                </div>

                                <Button className="w-full mt-auto" asChild>
                                    <Link href={`/workshops/${workshop.slug}`}>
                                        {t("dashboard.workshops.view_details")}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
