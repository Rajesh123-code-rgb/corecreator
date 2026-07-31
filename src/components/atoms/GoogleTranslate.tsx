"use client";

import Script from "next/script";
import React, { useEffect, useState } from "react";

/**
 * Global Google Translate Widget Injection
 * Loads strictly on the client side to avoid HTML mismatch errors during SSR/SSG.
 */
export default function GoogleTranslate({ id = "google_translate_element" }: { id?: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Expose a unique init function for this specific instance
        const initFuncName = `googleTranslateElementInit_${id}`;
        
        (window as any)[initFuncName] = () => {
            if (window.google?.translate?.TranslateElement) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages: "en,es,fr,de,hi,zh-CN,ja,ar,ru,ko",
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                        autoDisplay: false
                    },
                    id
                );
            }
        };
    }, [id]);

    if (!mounted) return null;

    return (
        <>
            <div 
                id={id} 
                className="inline-block relative z-[50]"
            ></div>
            <Script
                src={`//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit_${id}`}
                strategy="afterInteractive"
            />
            {/* Custom CSS overrides to clean up the widget design and hide the upper banner */}
            <style jsx global>{`
                .goog-te-banner-frame.skiptranslate, 
                .goog-te-gadget-icon {
                    display: none !important;
                }
                body {
                    top: 0px !important;
                }
                .goog-te-gadget-simple {
                    background-color: transparent !important;
                    border: 1px solid var(--border) !important;
                    border-radius: 9999px !important;
                    padding: 6px 12px !important;
                    font-size: 14px !important;
                    color: var(--foreground) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                }
                .goog-te-gadget-simple:hover {
                    border-color: var(--primary) !important;
                }
                .goog-te-gadget-simple span {
                    color: inherit !important;
                }
                /* Hide the google branding text if necessary, though TOS often wants it */
            `}</style>
        </>
    );
}

declare global {
    interface Window {
        googleTranslateElementInit: () => void;
        google: any;
    }
}
