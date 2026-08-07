import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/organisms";
import { categories } from "@/lib/categories";
import CategoryProductList from "./CategoryProductList";
import { getProducts } from "@/lib/productSearch";
import JsonLd from "@/components/atoms/JsonLd";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

// Rendered per request: the listing comes from the database, and the Docker
// build has no DB connection, so this must not be statically generated.
export const dynamic = "force-dynamic";

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

    // Matches CategoryProductList's own default query (name, limit 20, newest).
    const { products } = await getProducts({
        category: category.name,
        limit: 20,
        sort: "newest",
    });
    const initialProducts = JSON.parse(JSON.stringify(products));

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <JsonLd
                data={generateBreadcrumbJsonLd([
                    { name: "Home", url: "/" },
                    { name: "Marketplace", url: "/marketplace" },
                    { name: category.name, url: `/product/categories/${category.slug}` },
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
                    <CategoryProductList categorySlug={category.name} initialProducts={initialProducts} />
                </div>
            </section>

            </main>
            <Footer />
        </div>
    );
}
