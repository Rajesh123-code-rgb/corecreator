import { Metadata } from "next";

/**
 * Base site configuration
 */
export const siteConfig = {
    name: "Core Creator",
    description: "Global Art & Craft eLearning & Marketplace",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://corecreator.com",
    ogImage: "/og-image.jpg",
    twitterHandle: "@corecreator",
    keywords: [
        "art marketplace",
        "craft learning",
        "online art courses",
        "handmade products",
        "art workshops",
        "creative learning",
        "artists platform",
        "craft tutorials",
    ],
};

/**
 * Generate default metadata for the site
 */
export function getDefaultMetadata(): Metadata {
    return {
        title: {
            default: siteConfig.name,
            template: `%s | ${siteConfig.name}`,
        },
        description: siteConfig.description,
        keywords: siteConfig.keywords,
        authors: [{ name: siteConfig.name }],
        creator: siteConfig.name,
        metadataBase: new URL(siteConfig.url),
        openGraph: {
            type: "website",
            locale: "en_IN",
            url: siteConfig.url,
            siteName: siteConfig.name,
            title: siteConfig.name,
            description: siteConfig.description,
            images: [
                {
                    url: siteConfig.ogImage,
                    width: 1200,
                    height: 630,
                    alt: siteConfig.name,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: siteConfig.name,
            description: siteConfig.description,
            images: [siteConfig.ogImage],
            creator: siteConfig.twitterHandle,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        icons: {
            icon: "/favicon.ico",
            shortcut: "/favicon-16x16.png",
            apple: "/apple-touch-icon.png",
        },
        manifest: "/site.webmanifest",
    };
}

/**
 * Generate page-specific metadata
 */
export function generatePageMetadata({
    title,
    description,
    image,
    keywords,
    noIndex = false,
}: {
    title: string;
    description?: string;
    image?: string;
    keywords?: string[];
    noIndex?: boolean;
}): Metadata {
    const pageDescription = description || siteConfig.description;
    const pageImage = image || siteConfig.ogImage;

    return {
        title,
        description: pageDescription,
        keywords: keywords || siteConfig.keywords,
        openGraph: {
            title,
            description: pageDescription,
            images: [pageImage],
        },
        twitter: {
            title,
            description: pageDescription,
            images: [pageImage],
        },
        robots: noIndex ? { index: false, follow: false } : undefined,
    };
}

/**
 * Generate product structured data (JSON-LD)
 */
export function generateProductJsonLd(product: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency?: string;
    sku?: string;
    brand?: string;
    rating?: { value: number; count: number };
    availability?: "InStock" | "OutOfStock" | "PreOrder";
}): string {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.image,
        sku: product.sku,
        brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
        offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency || "INR",
            availability: `https://schema.org/${product.availability || "InStock"}`,
        },
        aggregateRating: product.rating ? {
            "@type": "AggregateRating",
            ratingValue: product.rating.value,
            reviewCount: product.rating.count,
        } : undefined,
    });
}

/**
 * Generate course structured data (JSON-LD)
 */
export function generateCourseJsonLd(course: {
    name: string;
    description: string;
    image: string;
    instructor: string;
    price: number;
    currency?: string;
    duration?: string;
}): string {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.name,
        description: course.description,
        image: course.image,
        provider: {
            "@type": "Organization",
            name: siteConfig.name,
        },
        instructor: {
            "@type": "Person",
            name: course.instructor,
        },
        offers: {
            "@type": "Offer",
            price: course.price,
            priceCurrency: course.currency || "INR",
        },
        hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
        },
    });
}

/**
 * Generate breadcrumb structured data (JSON-LD)
 */
export function generateBreadcrumbJsonLd(
    items: { name: string; url: string }[]
): string {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `${siteConfig.url}${item.url}`,
        })),
    });
}

/**
 * Generate organization structured data (JSON-LD)
 */
export function generateOrganizationJsonLd(): string {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
        sameAs: [
            `https://twitter.com/${siteConfig.twitterHandle.replace("@", "")}`,
        ],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "support@corecreator.com",
        },
    });
}

/**
 * Generate FAQ structured data (JSON-LD)
 */
export function generateFaqJsonLd(
    faqs: { question: string; answer: string }[]
): string {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    });
}
