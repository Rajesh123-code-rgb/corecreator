import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/organisms";
import { courseCategories } from "@/lib/courseCategories";
import CategoryCourseList from "./CategoryCourseList";
import { getCourses } from "@/lib/courseSearch";
import JsonLd from "@/components/atoms/JsonLd";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

// Rendered per request: the listing comes from the database, and the Docker
// build has no DB connection, so this must not be statically generated.
export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string }>;
};

export default async function CourseCategoryPage({ params }: Props) {
    const { slug } = await params;

    const category = courseCategories.find((c) => c.slug === slug);

    if (!category) {
        notFound();
    }

    // Matches CategoryCourseList's own default query (name, limit 20, popular).
    const { courses } = await getCourses({
        category: category.name,
        limit: 20,
        sort: "popular",
    });
    const initialCourses = JSON.parse(JSON.stringify(courses));

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <JsonLd
                data={generateBreadcrumbJsonLd([
                    { name: "Home", url: "/" },
                    { name: "Learn", url: "/learn" },
                    { name: category.name, url: `/learn/categories/${category.slug}` },
                ])}
            />
            <Header />
            <main id="main-content">

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-[var(--background)]/90" />
                </div>

                <div className="container-app relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-100)] text-[var(--primary-700)] text-sm font-medium mb-6 border border-[var(--primary-200)]">
                            <span>Course Category</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name} Courses</h1>
                        <p className="text-xl text-[var(--muted-foreground)] max-w-2xl">
                            {category.description}
                        </p>
                    </div>
                </div>
            </section>

            {/* Courses Section */}
            <section className="py-12">
                <div className="container-app">
                    <CategoryCourseList categorySlug={category.name} initialCourses={initialCourses} />
                </div>
            </section>

            </main>
            <Footer />
        </div>
    );
}
