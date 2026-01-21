"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle, AlertTriangle, Instagram, Twitter, MessageCircle } from "lucide-react";
import { Button } from "@/components/atoms";

export default function MaintenancePage() {
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/enquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, type: "maintenance", source: "Maintenance Page" }),
            });

            if (res.ok) {
                setSubmitted(true);
                setFormData({ name: "", email: "", phone: "", message: "" });
            } else {
                const data = await res.json();
                setError(data.error || "Failed to submit. Please try again.");
            }
        } catch (err) {
            setError("Something went wrong. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
                {/* Left Side: Messaging */}
                <div className="text-center md:text-left space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Under Maintenance</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
                        We're crafting <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">something amazing.</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-lg mx-auto md:mx-0">
                        Our platform is currently undergoing scheduled upgrades to bring you a better experience. We'll be back shortly!
                    </p>

                    <div className="flex justify-center md:justify-start gap-4 text-gray-400">
                        <a href="#" className="hover:text-purple-600 transition-colors"><Instagram className="w-6 h-6" /></a>
                        <a href="#" className="hover:text-purple-600 transition-colors"><Twitter className="w-6 h-6" /></a>
                        <a href="#" className="hover:text-purple-600 transition-colors"><MessageCircle className="w-6 h-6" /></a>
                    </div>
                </div>

                {/* Right Side: Interest Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
                    {submitted ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Thank You!</h3>
                            <p className="text-gray-500">
                                We've received your details. We'll verify your details and notify you once we're live.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setSubmitted(false)}
                            >
                                Send another message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Get Notified</h3>
                                <p className="text-sm text-gray-500">Leave your details to get early updates.</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <textarea
                                    placeholder="Any questions or message? (Optional)"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-6 text-base font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                {loading ? "Sending..." : "Notify Me When Live"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            <div className="absolute bottom-4 text-center w-full text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Core Creator. All rights reserved.
                {/* Admin backdoor link kept discreet */}
                <a href="/admin/login" className="ml-2 hover:text-gray-600">Admin Login</a>
            </div>
        </div>
    );
}
