"use client";

import Script from "next/script";
import React, { useEffect, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "es", label: "Spanish" },
    { code: "fr", label: "French" },
    { code: "de", label: "German" },
    { code: "zh-CN", label: "Chinese" },
    { code: "ja", label: "Japanese" },
    { code: "ar", label: "Arabic" },
    { code: "ru", label: "Russian" },
    { code: "ko", label: "Korean" }
];

export default function GoogleTranslate({ id = "google_translate_element", className }: { id?: string, className?: string }) {
    const [mounted, setMounted] = useState(false);
    const [currentLang, setCurrentLang] = useState("en");

    useEffect(() => {
        setMounted(true);
        const initFuncName = `googleTranslateElementInit_${id}`;
        
        (window as any)[initFuncName] = () => {
            if (window.google?.translate?.TranslateElement) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages: LANGUAGES.map(l => l.code).join(","),
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                        autoDisplay: false
                    },
                    id
                );
            }
        };

        // Try to read existing language from Google's cookie to set our picker state correctly
        const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
        if (match && match[1]) {
            const parsed = match[1].split('/')[2];
            if (parsed) setCurrentLang(parsed);
        }
    }, [id]);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const targetLang = e.target.value;
        setCurrentLang(targetLang);

        // Find the hidden Google Translate combo box and trigger it programmatically!
        const googleSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        
        if (googleSelect) {
            googleSelect.value = targetLang;
            googleSelect.dispatchEvent(new Event('change'));
        } else {
            // Fallback: Set the cookie directly and reload the page if script isn't loaded yet
            document.cookie = `googtrans=/en/${targetLang}; path=/; domain=${window.location.hostname}`;
            window.location.reload();
        }
    };

    if (!mounted) {
        return <div className={cn("w-28 h-9 bg-[var(--muted)] rounded-lg animate-pulse", className)} />;
    }

    return (
        <>
            {/* The actual Native Beautiful UI that the User Sees */}
            <div className={cn("relative group", className)}>
                <div className="relative flex items-center">
                    <Globe className="absolute left-3 w-4 h-4 text-[var(--foreground)] opacity-50 pointer-events-none" />
                    
                    <select
                        value={currentLang}
                        onChange={handleLanguageChange}
                        className={cn(
                            "appearance-none cursor-pointer pl-9 pr-8 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all",
                            "bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)]"
                        )}
                        aria-label="Select Language"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code} className="bg-[var(--card)] text-[var(--foreground)]">
                                {lang.label}
                            </option>
                        ))}
                    </select>
                    
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 opacity-50 text-[var(--foreground)]" />
                    </div>
                </div>
            </div>

            {/* Hidden Google Engine - Does all the heavy lifting silently in the DOM */}
            <div id={id} className="hidden"></div>
            
            <Script
                src={`//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit_${id}`}
                strategy="afterInteractive"
            />
            
            {/* Kill all external Google CSS that leaks to the body */}
            <style jsx global>{`
                body {
                    top: 0px !important;
                }
                .goog-te-banner-frame.skiptranslate, 
                .goog-te-gadget-icon,
                #goog-gt-tt,
                .goog-tooltip,
                .goog-tooltip:hover {
                    display: none !important;
                }
                font { background: transparent !important; box-shadow: none !important; }
            `}</style>
        </>
    );
}

declare global {
    interface Window {
        google: any;
    }
}
