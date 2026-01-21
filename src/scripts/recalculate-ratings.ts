// Script to recalculate all product ratings from actual reviews
// Run with: npx tsx src/scripts/recalculate-ratings.ts

import * as fs from "fs";
import * as path from "path";
import mongoose from "mongoose";

// Manually load .env.local
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
    }
});

async function recalculateRatings() {
    const { default: Product } = await import("../lib/db/models/Product");
    const { default: Review } = await import("../lib/db/models/Review");

    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI not found in environment variables");
        }

        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Get all products
        const products = await Product.find({}).select("_id name").lean();
        console.log(`Found ${products.length} products\n`);

        for (const product of products) {
            // Calculate stats from reviews for this product
            const stats = await Review.aggregate([
                {
                    $match: {
                        targetType: "product",
                        targetId: product._id,
                        status: "approved"
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: "$rating" },
                        count: { $sum: 1 },
                    },
                },
            ]);

            const avgRating = stats[0]?.avgRating || 0;
            const reviewCount = stats[0]?.count || 0;

            // Update the product
            await Product.findByIdAndUpdate(product._id, {
                rating: avgRating,
                reviewCount: reviewCount,
            });

            console.log(`${product.name}: rating=${avgRating.toFixed(1)}, reviewCount=${reviewCount}`);
        }

        console.log("\nDone! All product ratings recalculated from reviews.");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

recalculateRatings();
