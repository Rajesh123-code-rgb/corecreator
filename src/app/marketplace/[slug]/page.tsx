import { notFound } from "next/navigation";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import ProductClientPage from "./ProductClientPage";
import JsonLd from "@/components/atoms/JsonLd";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage(props: PageProps) {
    const params = await props.params;
    await connectDB();

    const productDoc = await Product.findOne({ slug: params.slug }).populate("seller", "name avatar rating sales location").lean();

    if (!productDoc) {
        notFound();
    }

    // Fetch related products (same category, excluding current)
    const relatedProductsDocs = await Product.find({
        category: productDoc.category,
        _id: { $ne: productDoc._id }
    })
        .limit(4)
        .populate("seller", "name")
        .lean();

    // Serialize to plain JSON to avoid serialization errors with Mongoose objects (ObjectIds/Dates)
    const product = JSON.parse(JSON.stringify(productDoc));
    const relatedProducts = JSON.parse(JSON.stringify(relatedProductsDocs));

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.images ? product.images.map((img: any) => img.url) : [],
        "description": product.description,
        "sku": product._id,
        "brand": {
            "@type": "Brand",
            "name": product.seller?.name || "Core Creator"
        },
        "offers": {
            "@type": "Offer",
            "url": `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${product.slug}`,
            "priceCurrency": "USD",
            "price": product.price,
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        },
        ...(product.rating ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": product.rating,
                "reviewCount": product.reviews?.length || 1
            }
        } : {})
    };

    return (
        <>
            <JsonLd data={jsonLd} />
            <JsonLd
                data={generateBreadcrumbJsonLd([
                    { name: "Home", url: "/" },
                    { name: "Marketplace", url: "/marketplace" },
                    { name: product.name, url: `/marketplace/${product.slug}` },
                ])}
            />
            <ProductClientPage product={product} relatedProducts={relatedProducts} />
        </>
    );
}

export async function generateMetadata({ params }: PageProps): Promise<import("next").Metadata> {
    const { slug } = await params;
    await connectDB();
    const product = await Product.findOne({ slug }).select("name description images").lean();

    if (!product) return { title: "Product Not Found" };

    let imageUrl = "";
    if (product.images && product.images.length > 0) {
        imageUrl = product.images[0].url;
    }

    return {
        title: `${product.name} | Core Creator Marketplace`,
        alternates: { canonical: `/marketplace/${slug}` },
        description: product.description.substring(0, 160),
        openGraph: {
            title: product.name,
            description: product.description.substring(0, 160),
            images: imageUrl ? [{ url: imageUrl }] : [],
        }
    };
}
