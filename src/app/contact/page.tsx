import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Mail, MapPin, Phone, MessageSquare, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero */}
            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Get in <span className="text-gradient">Touch</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        Have questions? We'd love to hear from you. informative and friendly support team is here to help.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app">
                    <div className="grid lg:grid-cols-3 gap-12">

                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                                <p className="text-[var(--muted-foreground)] mb-8">
                                    Fill out the form and our team will get back to you within 24 hours.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-[var(--primary-100)] rounded-lg flex items-center justify-center text-[var(--primary-600)] flex-shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Chat to us</h3>
                                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Our friendly team is here to help.</p>
                                        <a href="mailto:support@corecreator.com" className="text-[var(--primary-600)] font-medium hover:underline">support@corecreator.com</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-[var(--secondary-100)] rounded-lg flex items-center justify-center text-[var(--secondary-600)] flex-shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Visit us</h3>
                                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Come say hello at our office HQ.</p>
                                        <p className="text-[var(--foreground)] font-medium">Jaipur, Rajasthan</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Call us</h3>
                                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Mon-Fri from 8am to 5pm.</p>
                                        <a href="tel:+917424888915" className="text-[var(--primary-600)] font-medium hover:underline">+91 7424888915</a>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-[var(--border)]">
                                <h3 className="font-bold mb-4">Frequently Asked Questions</h3>
                                <div className="space-y-3">
                                    <Link href="/faq" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--primary-600)] hover:underline flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4" /> How do I start selling?
                                    </Link>
                                    <Link href="/faq" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--primary-600)] hover:underline flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4" /> What are the platform fees?
                                    </Link>
                                    <Link href="/faq" className="block text-sm text-[var(--muted-foreground)] hover:text-[var(--primary-600)] hover:underline flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4" /> Improving course quality?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2 bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm">
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="first-name" className="text-sm font-medium">First name</label>
                                        <input type="text" id="first-name" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]" placeholder="First name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="last-name" className="text-sm font-medium">Last name</label>
                                        <input type="text" id="last-name" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]" placeholder="Last name" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                                    <input type="email" id="email" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]" placeholder="you@company.com" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                    <select id="subject" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]">
                                        <option>General Inquiry</option>
                                        <option>Support Request</option>
                                        <option>Partnership Proposal</option>
                                        <option>Report a Bug</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                                    <textarea id="message" rows={6} className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]" placeholder="Leave us a message..." />
                                </div>

                                <Button size="lg" className="w-full sm:w-auto">Send Message</Button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
