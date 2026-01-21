import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/organisms";
import { categories } from "@/lib/categories";
import CategoryProductList from "./CategoryProductList";

export function generateStaticParams() {
    return categories.map((category) => ({
        slug: category.slug,
    }));
}

// Define params type correctly for Next.js 15+ / 16
type Props = {
    params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
    // Await the params object
    const { slug } = await params;

    const category = categories.find((c) => c.slug === slug);

    if (!category) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

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
                            <span>Category</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
                        <p className="text-xl text-[var(--muted-foreground)] max-w-2xl">
                            {category.description}
                        </p>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="py-12">
                <div className="container-app">
                    <CategoryProductList categorySlug={category.name} />
                </div>
            </section>

            <Footer />
        </div>
    );
}
