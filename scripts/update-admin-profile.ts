import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set. Add it to .env.local");
    process.exit(1);
}

// ── Minimal User Schema for updating ──────────────────
const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    role: String,
    avatar: String,
    bio: String,
    studioProfile: {
        name: String,
        description: String,
        coverImage: String,
        specializations: [String],
        yearsOfExperience: Number,
        rating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        totalStudents: { type: Number, default: 0 },
        totalSales: { type: Number, default: 0 },
    },
    profile: {
        location: String,
        website: String,
        socialLinks: {
            instagram: String,
            twitter: String,
            facebook: String,
            youtube: String,
            linkedin: String,
        },
    }
}, { strict: false });

async function updateAdminProfile() {
    try {
        console.log("📡 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI!);
        console.log("✅ Connected");

        const User = mongoose.models.User || mongoose.model("User", userSchema);

        // Find the admin user (prefer "admin@corecreator.com" or just the first admin)
        let adminUser = await User.findOne({ email: "admin@corecreator.com" });
        if (!adminUser) {
            adminUser = await User.findOne({ role: "admin" });
        }

        if (!adminUser) {
            console.error("❌ No admin user found in database!");
            process.exit(1);
        }

        console.log(`👤 Found admin: ${adminUser.email}`);

        // Update details
        adminUser.name = "Core Creator Official";
        adminUser.bio = "The official studio account for Core Creator, showcasing curated artwork, masterclasses, and premium resources directly from our team.";
        
        // Ensure studioProfile exists
        if (!adminUser.studioProfile) {
            adminUser.studioProfile = {};
        }

        adminUser.studioProfile.name = "Core Creator Official";
        adminUser.studioProfile.description = "Welcome to the Core Creator Official Studio. Here you will find expertly curated art supplies, official Core Creator merchandise, and masterclass courses produced by our in-house team of professional artists and educators.";
        adminUser.studioProfile.specializations = ["Mixed Media", "Digital Art", "Curated Supplies", "Masterclasses"];
        adminUser.studioProfile.yearsOfExperience = 10;
        
        // Ensure profile exists
        if (!adminUser.profile) {
            adminUser.profile = {};
        }
        adminUser.profile.location = "Global Headquarters";
        adminUser.profile.website = "https://corecreator.com";
        
        if (!adminUser.profile.socialLinks) {
            adminUser.profile.socialLinks = {};
        }
        adminUser.profile.socialLinks.instagram = "corecreatorofficial";

        await adminUser.save();
        
        // Also update any existing products linked to this seller to show the new name
        try {
            const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({ seller: mongoose.Types.ObjectId, sellerName: String }, { strict: false }));
            const result = await Product.updateMany(
                { seller: adminUser._id },
                { $set: { sellerName: "Core Creator Official" } }
            );
            console.log(`📦 Updated ${result.modifiedCount} products to reflect new sellerName.`);
        } catch (err: any) {
            console.warn("⚠️ Could not update product sellerNames:", err.message);
        }

        console.log("✅ Admin profile updated successfully to 'Core Creator Official'!");
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err: any) {
        console.error("❌ Failed:", err.message);
        process.exit(1);
    }
}

updateAdminProfile();
