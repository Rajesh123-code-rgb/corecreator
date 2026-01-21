import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Category from "@/lib/db/models/Category";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

// Hardcoded categories from lib files
const productCategories = [
    { name: "Paintings", slug: "paintings", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop", description: "Original paintings in oil, acrylic, watercolor and more" },
    { name: "Sculptures", slug: "sculptures", image: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=300&fit=crop", description: "Hand-carved sculptures in stone, wood, and metal" },
    { name: "Ceramics", slug: "ceramics", image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop", description: "Handmade pottery, vases, and ceramic art" },
    { name: "Textiles", slug: "textiles", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop", description: "Woven fabrics, embroidery, and textile crafts" },
    { name: "Jewelry", slug: "jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop", description: "Handcrafted necklaces, rings, and earrings" },
    { name: "Digital Art", slug: "digital-art", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop", description: "Digital paintings, NFTs, and illustrations" },
    { name: "Photography", slug: "photography", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop", description: "Fine art photography and prints" },
    { name: "Crafts", slug: "crafts", image: "https://images.unsplash.com/photo-1459749411177-8c4750bb0e5f?w=400&h=300&fit=crop", description: "DIY kits, paper crafts, and handmade goods" },
    { name: "Prints", slug: "prints", image: "https://images.unsplash.com/photo-1581299894007-a243696f52b4?w=400&h=300&fit=crop", description: "Art prints, posters, and limited editions" },
    { name: "Glass Art", slug: "glass-art", image: "https://images.unsplash.com/photo-1565060169194-1e095b943260?w=400&h=300&fit=crop", description: "Blown glass, stained glass, and glass sculptures" },
    { name: "Woodwork", slug: "woodwork", image: "https://images.unsplash.com/photo-1610427842603-6052f556b621?w=400&h=300&fit=crop", description: "Carved wood art, furniture, and decor" },
    { name: "Drawing", slug: "drawing", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop", description: "Pencil, charcoal, and ink drawings" }
];

const courseCategories = [
    { name: "Painting", slug: "painting-course", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop", description: "Master oil, acrylic, watercolor, and mixed media painting techniques." },
    { name: "Drawing", slug: "drawing-course", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop", description: "Learn fundamentals of sketching, shading, and perspective." },
    { name: "Sculpture", slug: "sculpture-course", image: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=300&fit=crop", description: "Create 3D art with clay, stone, wood, and metal." },
    { name: "Digital Art", slug: "digital-art-course", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop", description: "Digital painting, illustration, and 3D modeling courses." },
    { name: "Crafts", slug: "crafts-course", image: "https://images.unsplash.com/photo-1459749411177-8c4750bb0e5f?w=400&h=300&fit=crop", description: "DIY projects, knitting, paper crafts, and handmade goods." },
    { name: "Photography", slug: "photography-course", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop", description: "Master camera settings, composition, and photo editing." },
    { name: "Ceramics", slug: "ceramics-course", image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop", description: "Pottery wheel throwing, hand-building, and glazing." },
    { name: "Textile Art", slug: "textile-art-course", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop", description: "Weaving, embroidery, macrame, and fabric design." }
];

const workshopCategories = [
    { name: "Painting Workshops", slug: "painting-workshop", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop", description: "Live painting sessions and demonstrations." },
    { name: "Pottery Workshops", slug: "pottery-workshop", image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop", description: "Hands-on pottery and ceramics workshops." },
    { name: "Jewelry Making", slug: "jewelry-workshop", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop", description: "Create your own jewelry pieces." },
    { name: "Mixed Media", slug: "mixed-media-workshop", image: "https://images.unsplash.com/photo-1459749411177-8c4750bb0e5f?w=400&h=300&fit=crop", description: "Combine different art forms in creative workshops." }
];

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    console.log("[Seed Categories] Session:", JSON.stringify(session?.user));

    if (!hasAdminPermission(session, PERMISSIONS.MANAGE_CATEGORIES)) {
        console.log("[Seed Categories] Permission denied");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[Seed Categories] Connecting to DB...");
        await connectDB();
        console.log("[Seed Categories] Connected to DB");

        let created = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Seed Product Categories
        console.log("[Seed Categories] Seeding product categories...");
        for (let i = 0; i < productCategories.length; i++) {
            const cat = productCategories[i];
            try {
                const exists = await Category.findOne({ slug: cat.slug });
                if (!exists) {
                    await Category.create({
                        ...cat,
                        type: "product",
                        order: i,
                        isActive: true,
                    });
                    created++;
                    console.log(`[Seed Categories] Created product: ${cat.name}`);
                } else {
                    skipped++;
                }
            } catch (err: any) {
                console.error(`[Seed Categories] Error creating product ${cat.name}:`, err.message);
                errors.push(`Product ${cat.name}: ${err.message}`);
            }
        }

        // Seed Course Categories
        console.log("[Seed Categories] Seeding course categories...");
        for (let i = 0; i < courseCategories.length; i++) {
            const cat = courseCategories[i];
            try {
                const exists = await Category.findOne({ slug: cat.slug });
                if (!exists) {
                    await Category.create({
                        ...cat,
                        type: "course",
                        order: i,
                        isActive: true,
                    });
                    created++;
                    console.log(`[Seed Categories] Created course: ${cat.name}`);
                } else {
                    skipped++;
                }
            } catch (err: any) {
                console.error(`[Seed Categories] Error creating course ${cat.name}:`, err.message);
                errors.push(`Course ${cat.name}: ${err.message}`);
            }
        }

        // Seed Workshop Categories
        console.log("[Seed Categories] Seeding workshop categories...");
        for (let i = 0; i < workshopCategories.length; i++) {
            const cat = workshopCategories[i];
            try {
                const exists = await Category.findOne({ slug: cat.slug });
                if (!exists) {
                    await Category.create({
                        ...cat,
                        type: "workshop",
                        order: i,
                        isActive: true,
                    });
                    created++;
                    console.log(`[Seed Categories] Created workshop: ${cat.name}`);
                } else {
                    skipped++;
                }
            } catch (err: any) {
                console.error(`[Seed Categories] Error creating workshop ${cat.name}:`, err.message);
                errors.push(`Workshop ${cat.name}: ${err.message}`);
            }
        }

        console.log(`[Seed Categories] Complete. Created: ${created}, Skipped: ${skipped}, Errors: ${errors.length}`);

        if (errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: `Seeding completed with errors. Created: ${created}, Skipped: ${skipped}`,
                errors,
            }, { status: 207 });
        }

        return NextResponse.json({
            success: true,
            message: `Seeding complete. Created: ${created}, Skipped (already exist): ${skipped}`,
        });
    } catch (error: any) {
        console.error("[Seed Categories] Fatal error:", error);
        return NextResponse.json({
            error: "Failed to seed categories",
            details: error.message
        }, { status: 500 });
    }
}

