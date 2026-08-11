"use client";

import Link from "next/link";
import Image from "next/image";
import {
    Instagram,
    Youtube,
    Linkedin,
    Mail,
    ArrowRight,
    Palette,
    GraduationCap,
    Award,
    Shield,
    CreditCard,
    Truck,
    HeartHandshake,
    Globe,
    Phone,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/atoms";
import { useCurrency } from "@/context/CurrencyContext";

const footerSections = [
    {
        title: "Marketplace",
        links: [
            { label: "All Products", href: "/marketplace" },
            { label: "Featured Artists", href: "/artists" },
            { label: "Categories", href: "/product/categories" },
            { label: "New Arrivals", href: "/marketplace/new" },
            { label: "Best Sellers", href: "/marketplace/best-sellers" },
        ],
    },
    {
        title: "Learning",
        links: [
            { label: "All Courses", href: "/learn" },
            { label: "Live Workshops", href: "/workshops" },
            { label: "Free Tutorials", href: "/tutorials" },
            { label: "Learning Paths", href: "/learning-paths" },
            { label: "Certificates", href: "/certificates" },
        ],
    },
    {
        title: "For Creators",
        links: [
            { label: "Become a Creator", href: "/studio/register" },
            { label: "Studio Login", href: "/studio/login" },
            { label: "Studio Dashboard", href: "/studio/dashboard" },
            { label: "Pricing & Fees", href: "/pricing" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About Us", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Blog", href: "/blog" },
            { label: "FAQs", href: "/faqs" },
            { label: "Contact", href: "/contact" },
        ],
    },
    {
        title: "Support",
        links: [
            { label: "Help Center", href: "/help" },
            { label: "Documentation", href: "/documentation" },
            { label: "Shipping Info", href: "/shipping" },
            { label: "Returns Policy", href: "/returns" },
            { label: "Report Issue", href: "/report" },
        ],
    },
];

// Only networks Core Creator actually has a profile on. These all pointed at
// "#" before - a dead link on every page of the site.
const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/core.creator/", label: "Instagram" },
    { icon: Youtube, href: "https://www.youtube.com/@corecreatorstudio/", label: "YouTube" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/96004962/", label: "LinkedIn" },
];

const trustBadges = [
    { icon: Shield, label: "Secure Payments" },
    { icon: CreditCard, label: "Multiple Payment Options" },
    { icon: Truck, label: "Worldwide Shipping" },
    { icon: Award, label: "Quality Guaranteed" },
];

export function Footer() {
    const { currency, setCurrency } = useCurrency();
    return (
        <footer className="relative overflow-hidden">
            {/* Partner CTA Section - Enhanced */}
            <div className="relative py-12 bg-gradient-to-r from-[var(--secondary-700)] via-[var(--secondary-600)] to-[var(--secondary-700)] overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="container-app py-20 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="text-white">
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Palette className="w-7 h-7" />
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <GraduationCap className="w-7 h-7" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold mb-4 leading-tight">Join the Art & Craft Ecosystem</h3>
                            <p className="text-white/80 text-lg lg:text-xl mb-8 mx-auto max-w-2xl leading-relaxed">
                                Whether you want to teach courses, sell your creations, or both — Core Creator gives you the tools to turn your passion into profit.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Button size="xl" className="bg-white text-[var(--secondary-700)] hover:bg-white/90 shadow-lg px-8" asChild>
                                    <Link href="/studio/register">
                                        Become a Creator
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>
                                </Button>
                                <Button size="xl" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8" asChild>
                                    <Link href="/studio/login">Studio Login</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-[var(--neutral-800)] py-4 border-b border-white/10">
                <div className="container-app">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                        {trustBadges.map((badge) => (
                            <div key={badge.label} className="flex items-center justify-center gap-3 text-white/70 py-2">
                                <badge.icon className="w-6 h-6 text-[var(--secondary-400)]" />
                                <span className="text-sm lg:text-base font-medium">{badge.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="bg-[var(--neutral-900)] text-white">
                <div className="container-app py-20">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-10 lg:gap-16">
                        {/* Brand Column */}
                        <div className="col-span-2 lg:col-span-2 py-4">

                            <p className="text-base text-white/60 mb-8 max-w-sm leading-relaxed">
                                The global platform for artists to teach, create, and sell. For learners to discover, learn, and grow their creative skills.
                            </p>

                            {/* Newsletter */}
                            <div className="mb-10 py-4">
                                <p className="text-base font-semibold mb-4">Get creative inspiration weekly</p>
                                <form className="flex gap-3">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        aria-label="Email address for newsletter"
                                        className="flex-1 px-5 py-4 text-base rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-500)] focus:border-transparent transition-all"
                                    />
                                    <button type="submit" aria-label="Subscribe to newsletter" className="px-6 py-4 rounded-xl bg-[var(--secondary-500)] hover:bg-[var(--secondary-600)] transition-colors shadow-lg hover:shadow-xl">
                                        <Mail className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                </form>
                            </div>

                            {/* Social Links */}
                            <div>
                                <p className="text-base font-semibold mb-4">Follow us</p>
                                <div className="flex gap-3">
                                    {socialLinks.map((social) => (
                                        <a
                                            key={social.label}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[var(--secondary-500)] hover:border-[var(--secondary-500)] transition-all"
                                            aria-label={social.label}
                                        >
                                            <social.icon className="w-5 h-5" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Link Columns */}
                        {footerSections.map((section) => (
                            <div key={section.title} className="py-4">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-white/60 mb-6">{section.title}</h4>
                                <ul className="space-y-4">
                                    {section.links.map((link) => (
                                        <li key={link.href}>
                                            <Link href={link.href} className="text-base text-white/60 hover:text-white transition-colors inline-flex items-center group py-2 sm:py-0 min-h-11 sm:min-h-0">
                                                {link.label}
                                                <ArrowRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact & Payment Row */}
                <div className="border-t border-white/10 py-4">
                    <div className="container-app py-16">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 lg:gap-8 text-base text-white/60">
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-[var(--secondary-400)]" />
                                    <span>+91 7424888915</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-[var(--secondary-400)]" />
                                    <Link href="/contact" className="hover:text-white transition-colors">Contact us</Link>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-[var(--secondary-400)]" />
                                    <span>Jaipur, Rajasthan</span>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            {/* Wraps on narrow screens - as a single non-wrapping
                                row these five badges were 438px wide and pushed
                                every page on the site past the viewport. */}
                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                                <span className="text-sm text-white/40">We Accept:</span>
                                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                    {["Visa", "MC", "RuPay", "UPI", "PayPal"].map((method) => (
                                        <div key={method} className="px-3 sm:px-4 py-2 bg-white/10 rounded-lg text-sm font-medium text-white/70 hover:bg-white/15 transition-colors">
                                            {method}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 bg-black/30 py-4">
                    <div className="container-app py-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-base text-white/50">
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                <p>© 2026 Core Creator. Made with <HeartHandshake className="w-4 h-4 inline text-red-400" /> in India. All rights reserved.</p>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Currency Switcher */}
                                <div className="relative group">
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value as any)}
                                        aria-label="Select currency"
                                        className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[var(--secondary-500)] cursor-pointer hover:bg-white/10 transition-colors"
                                    >
                                        <option value="INR" className="bg-[var(--neutral-800)]">INR (₹)</option>
                                        <option value="USD" className="bg-[var(--neutral-800)]">USD ($)</option>
                                        <option value="EUR" className="bg-[var(--neutral-800)]">EUR (€)</option>
                                        <option value="GBP" className="bg-[var(--neutral-800)]">GBP (£)</option>
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8 border-l border-white/10 pl-6">
                                    <Link href="/terms" className="hover:text-white transition-colors py-2 sm:py-0 inline-block">Terms of Service</Link>
                                    <Link href="/privacy" className="hover:text-white transition-colors py-2 sm:py-0 inline-block">Privacy Policy</Link>
                                    <Link href="/cookies" className="hover:text-white transition-colors py-2 sm:py-0 inline-block">Cookies</Link>
                                    <Link href="/accessibility" className="hover:text-white transition-colors py-2 sm:py-0 inline-block">Accessibility</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
