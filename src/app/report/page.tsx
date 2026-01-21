import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { AlertTriangle, Upload, CheckCircle } from "lucide-react";

export default function ReportPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Report an <span className="text-gradient">Issue</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        Help us keep Core Creator safe and working smoothly. Tell us about the problem you encountered.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-2xl">
                    <form className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm space-y-6">

                        <div className="space-y-2">
                            <label htmlFor="issue-type" className="font-medium">What type of issue are you reporting?</label>
                            <select id="issue-type" className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]">
                                <option value="">Select a category...</option>
                                <option value="bug">Technical Bug / Broken Feature</option>
                                <option value="content">Inappropriate Content / Policy Violation</option>
                                <option value="scam">Suspicious User / Scam</option>
                                <option value="ip">Intellectual Property Infringement</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="url" className="font-medium">Related URL (Optional)</label>
                            <input type="url" id="url" placeholder="https://corecreator.com/..." className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]" />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="font-medium">Description</label>
                            <textarea id="description" rows={5} placeholder="Please provide as much detail as possible..." className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]" />
                        </div>

                        <div className="space-y-2">
                            <label className="font-medium">Attachments (Optional)</label>
                            <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center hover:bg-[var(--muted)] transition-colors cursor-pointer">
                                <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--muted-foreground)]" />
                                <p className="text-sm text-[var(--muted-foreground)]">Drop files here or click to upload</p>
                                <p className="text-xs text-[var(--muted-foreground)/70] mt-1">PNG, JPG up to 5MB</p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button size="lg" className="w-full">Submit Report</Button>
                        </div>

                    </form>

                    <p className="text-center text-sm text-[var(--muted-foreground)] mt-8">
                        For immediate assistance with an order, please visit our <a href="/help" className="text-[var(--primary-600)] underline">Help Center</a> or contact support directly.
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
}
