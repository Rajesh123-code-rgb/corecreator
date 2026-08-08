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

    // Fetch the full course server-side and pass it down, so the page's content
    // is in the initial HTML rather than arriving via a client fetch.
    // status: "published" mirrors the filter in /api/courses/[slug] - without it
    // this would render unpublished/draft courses publicly.
    const courseDoc = await Course.findOne({ slug: params.slug, status: "published" })
        .populate("instructor", "name avatar bio rating students courses")
        .lean();

    if (!courseDoc) {
        notFound();
    }

    const course = JSON.parse(JSON.stringify(courseDoc));

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
            <CourseClientPage initialCourse={course} />
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
        alternates: { canonical: `/learn/${slug}` },
        description: course.description.substring(0, 160),
        openGraph: {
            title: course.title,
            description: course.description.substring(0, 160),
            images: course.thumbnail ? [{ url: course.thumbnail }] : [],
            type: "website"
        }
    };
}
