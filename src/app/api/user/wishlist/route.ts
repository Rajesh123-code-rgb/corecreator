import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";
import Workshop from "@/lib/db/models/Workshop";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const wishlistItems = user.wishlist || [];

        // Fetch details for each item
        const enrichedItems = await Promise.all(wishlistItems.map(async (item: any) => {
            let details = null;
            if (item.itemType === 'course') {
                details = await Course.findById(item.itemId).select('title slug thumbnail price instructor');
            } else if (item.itemType === 'product') {
                details = await Product.findById(item.itemId).select('title slug images price seller');
            }

            if (!details) return null; // Item might have been deleted

            return {
                id: item.itemId,
                type: item.itemType,
                addedAt: item.addedAt,
                details: item.itemType === 'course' ? {
                    ...details.toObject(),
                    image: (details as any).thumbnail,
                    subtitle: typeof (details as any).instructor === 'string' ? (details as any).instructor : 'Instructor'
                } : {
                    ...details.toObject(),
                    image: (details as any).images?.[0] || '',
                    subtitle: 'Product'
                }
            };
        }));

        // Filter out nulls (deleted items)
        const validItems = enrichedItems.filter(item => item !== null);

        // Also return just the IDs for quick checking
        const wishlistIds = wishlistItems.map((item: any) => item.itemId.toString());

        return NextResponse.json({ wishlist: validItems, ids: wishlistIds }, { status: 200 });

    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// POST - Toggle wishlist item (add/remove)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { itemId, itemType } = await req.json();

        if (!itemId || !itemType) {
            return NextResponse.json({ message: "Item ID and type are required" }, { status: 400 });
        }

        if (!['product', 'course', 'workshop'].includes(itemType)) {
            return NextResponse.json({ message: "Invalid item type" }, { status: 400 });
        }

        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Initialize wishlist if doesn't exist
        if (!user.wishlist) {
            user.wishlist = [];
        }

        // Check if item already in wishlist
        const existingIndex = user.wishlist.findIndex(
            (item: any) => item.itemId.toString() === itemId && item.itemType === itemType
        );

        let action = '';
        if (existingIndex > -1) {
            // Remove from wishlist
            user.wishlist.splice(existingIndex, 1);
            action = 'removed';
        } else {
            // Add to wishlist
            user.wishlist.push({
                itemId,
                itemType,
                addedAt: new Date()
            });
            action = 'added';
        }

        await user.save();

        return NextResponse.json({
            message: `Item ${action} from wishlist`,
            action,
            inWishlist: action === 'added'
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating wishlist:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

