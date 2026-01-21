import { notFound } from "next/navigation";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import ProductClientPage from "./ProductClientPage";

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

    return <ProductClientPage product={product} relatedProducts={relatedProducts} />;
}
