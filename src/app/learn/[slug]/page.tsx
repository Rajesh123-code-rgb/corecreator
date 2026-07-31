import { notFound } from "next/navigation";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import CourseClientPage from "./CourseClientPage";
import JsonLd from "@/components/atoms/JsonLd";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage(props: PageProps) {
    const params = await props.params;
    await connectDB();

    // Only select required metadata for the server page, the client fetches the rest
    const courseDoc = await Course.findOne({ slug: params.slug })
        .populate("instructor", "name")
        .select("title description thumbnail price compareAtPrice rating instructorName reviewCount")
        .lean();

    if (!courseDoc) {
        notFound();
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": courseDoc.title,
        "description": courseDoc.description,
        "provider": {
            "@type": "Organization",
            "name": "Core Creator",
            "sameAs": process.env.NEXT_PUBLIC_APP_URL
        },
        "instructor": {
            "@type": "Person",
            "name": (courseDoc.instructor as any)?.name || courseDoc.instructorName || "Core Creator Instructor"
        },
        "image": courseDoc.thumbnail,
        "offers": {
            "@type": "Offer",
            "category": "Paid",
            "priceCurrency": "USD",
            "price": courseDoc.price,
        },
        ...(courseDoc.averageRating ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": courseDoc.averageRating,
                "reviewCount": courseDoc.totalReviews || 1
            }
        } : {})
    };

    return (
        <>
            <JsonLd data={jsonLd} />
            <CourseClientPage />
        </>
    );
}

export async function generateMetadata({ params }: PageProps): Promise<import("next").Metadata> {
    const { slug } = await params;
    await connectDB();
    const course = await Course.findOne({ slug }).select("title description thumbnail").lean();

    if (!course) return { title: "Course Not Found | Core Creator" };

    return {
        title: `${course.title} | Core Creator`,
        description: course.description.substring(0, 160),
        openGraph: {
            title: course.title,
            description: course.description.substring(0, 160),
            images: course.thumbnail ? [{ url: course.thumbnail }] : [],
            type: "website"
        }
    };
}
