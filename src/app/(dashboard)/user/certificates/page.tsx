"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { Award, Download, Loader2, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Certificate {
    _id: string;
    title: string;
    slug: string;
    thumbnail: string;
    completedAt: string;
    certificateId: string;
}

export default function CertificatesPage() {
    const { t } = useLanguage();
    const [certificates, setCertificates] = React.useState<Certificate[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const res = await fetch("/api/user/certificates");
                if (res.ok) {
                    const data = await res.json();
                    setCertificates(data.certificates || []);
                }
            } catch (error) {
                console.error("Failed to fetch certificates:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, []);

    const handleDownload = (certId: string, courseTitle: string) => {
        // In a real app, this would trigger a PDF download from an API
        alert(`Downloading certificate ${certId} for "${courseTitle}"... (This is a demo)`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t("dashboard.certificates.title")}</h1>
            <p className="text-[var(--muted-foreground)]">
                {t("dashboard.certificates.subtitle")}
            </p>

            {certificates.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Award className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
                        <h3 className="text-lg font-medium mb-1">{t("dashboard.certificates.empty_title")}</h3>
                        <p className="text-[var(--muted-foreground)] mb-4">
                            {t("dashboard.certificates.empty_desc")}
                        </p>
                        <Button asChild>
                            <Link href="/user/courses">{t("dashboard.certificates.resume_learning")}</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert) => (
                        <Card key={cert._id} className="overflow-hidden flex flex-col h-full group">
                            {/* Certificate Preview / Mockup */}
                            <div className="relative bg-[var(--primary-50)] aspect-[4/3] flex items-center justify-center border-b border-[var(--border)] p-4">
                                <div className="absolute inset-0 bg-white/50" /> {/* Texture overlay */}
                                <div className="relative z-10 text-center border-4 border-double border-[var(--primary-200)] p-4 bg-white shadow-sm w-full h-full flex flex-col justify-center items-center">
                                    <Award className="w-8 h-8 text-[var(--primary-500)] mb-2" />
                                    <h4 className="font-serif font-bold text-[var(--primary-900)] text-sm mb-1">{t("dashboard.certificates.preview_title")}</h4>
                                    <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest mb-2">{t("dashboard.certificates.preview_subtitle")}</p>
                                    <p className="font-bold text-xs line-clamp-2">{cert.title}</p>
                                </div>
                            </div>

                            <CardContent className="p-5 flex-1 flex flex-col">
                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{cert.title}</h3>
                                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                                    Completed on {new Date(cert.completedAt).toLocaleDateString()}
                                </p>

                                <div className="mt-auto space-y-2">
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1"
                                            variant="secondary"
                                            onClick={() => handleDownload(cert.certificateId, cert.title)}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            {t("dashboard.certificates.download")}
                                        </Button>
                                        <Button size="icon" variant="outline" asChild>
                                            <Link href={`/learn/${cert.slug}`} title="View Course">
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-center text-[var(--muted-foreground)]">
                                        {t("dashboard.certificates.id")}: {cert.certificateId}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
