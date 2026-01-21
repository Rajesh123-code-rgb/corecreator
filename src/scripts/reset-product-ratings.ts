// Script to reset all product ratings to 0
// Run with: npx tsx src/scripts/reset-product-ratings.ts

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

async function resetProductRatings() {
    const { default: Product } = await import("../lib/db/models/Product");

    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI not found in environment variables");
        }

        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Reset all product ratings and reviewCount to 0
        const result = await Product.updateMany(
            {}, // All products
            { $set: { rating: 0, reviewCount: 0 } }
        );

        console.log(`Reset ${result.modifiedCount} products to 0 rating`);

        // Verify the update
        const products = await Product.find({}).select("name rating reviewCount").lean();
        console.log("\nUpdated products:");
        products.forEach((p: any) => {
            console.log(`  ${p.name}: rating=${p.rating}, reviewCount=${p.reviewCount}`);
        });

        await mongoose.disconnect();
        console.log("\nDone! Disconnected from MongoDB");
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

resetProductRatings();
