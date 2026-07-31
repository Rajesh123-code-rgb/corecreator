"use client";

import { useEffect } from "react";
import "./globals.css"; // Ensure styles are loaded for this fallback

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Root Error:", error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>Critical System Error</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            A critical error occurred while loading the application shell.
                        </p>
                        <button
                            onClick={() => reset()}
                            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', width: '100%' }}
                        >
                            Restart Application
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
