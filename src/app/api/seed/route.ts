import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";
import Workshop from "@/lib/db/models/Workshop";
import Review from "@/lib/db/models/Review";

// Sample data
const users = [
    {
        name: "Admin User",
        email: "admin@corecreator.com",
        password: "admin123",
        role: "admin",
        isVerified: true,
    },
    {
        name: "Sarah Mitchell",
        email: "sarah@corecreator.com",
        password: "creator123",
        role: "studio",
        isVerified: true,
        bio: "Award-winning watercolor artist and instructor with 15+ years of experience",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
        name: "Michael Chen",
        email: "michael@corecreator.com",
        password: "creator123",
        role: "studio",
        isVerified: true,
        bio: "Professional oil painter specializing in landscapes and portraits",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
        name: "Emma Rodriguez",
        email: "emma@corecreator.com",
        password: "creator123",
        role: "studio",
        isVerified: true,
        bio: "Digital artist and illustrator, formerly at Disney Animation",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
        name: "John Student",
        email: "john@example.com",
        password: "student123",
        role: "user",
        isVerified: true,
    },
    {
        name: "Alice Walker",
        email: "alice@example.com",
        password: "student123",
        role: "user",
        isVerified: true,
    },
    {
        name: "Bob Builder",
        email: "bob@example.com",
        password: "student123",
        role: "user",
        isVerified: true,
    },
    {
        name: "Charlie Day",
        email: "charlie@example.com",
        password: "student123",
        role: "user",
        isVerified: true,
    },
];

export async function POST(request: NextRequest) {
    try {
        // Only allow in development
        if (process.env.NODE_ENV === "production") {
            return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
        }

        await connectDB();

        // Clear existing data
        await User.deleteMany({});
        await Course.deleteMany({});
        await Product.deleteMany({});
        await Workshop.deleteMany({});
        await Review.deleteMany({});

        // Create users
        const createdUsers: Record<string, string> = {};
        const studentIds: string[] = [];

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await User.create({
                ...userData,
                password: hashedPassword,
            });
            createdUsers[userData.email] = user._id.toString();
            if (userData.role === "user") {
                studentIds.push(user._id.toString());
            }
        }

        // Create courses
        const courses = [
            {
                title: "Watercolor Masterclass: From Beginner to Pro",
                subtitle: "Learn the art of watercolor painting with professional techniques",
                slug: "watercolor-masterclass",
                thumbnail: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=450&fit=crop",
                instructor: createdUsers["sarah@corecreator.com"],
                instructorName: "Sarah Mitchell",
                category: "Painting",
                level: "all",
                price: 79,
                description: "Master watercolor techniques from basic washes to advanced layering.",
                duration: 1200,
                status: "published",
                enrollmentCount: 12500,
                sections: [
                    {
                        title: "Getting Started with Watercolors",
                        order: 1,
                        lessons: [
                            { title: "Introduction to Materials", type: "video" as const, duration: 15, order: 1, isFree: true },
                            { title: "Understanding Paper Types", type: "video" as const, duration: 12, order: 2, isFree: false },
                            { title: "Basic Brush Techniques", type: "video" as const, duration: 20, order: 3, isFree: false },
                        ],
                    },
                ],
            },
            {
                title: "Oil Painting Fundamentals",
                subtitle: "Build a strong foundation in oil painting",
                slug: "oil-painting-fundamentals",
                thumbnail: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop",
                instructor: createdUsers["michael@corecreator.com"],
                instructorName: "Michael Chen",
                category: "Painting",
                level: "beginner",
                price: 99,
                description: "Learn the timeless art of oil painting.",
                duration: 1500,
                status: "published",
                enrollmentCount: 8900,
                sections: [],
            },
            {
                title: "Digital Illustration Mastery",
                subtitle: "Create stunning digital artwork",
                slug: "digital-illustration-mastery",
                thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop",
                instructor: createdUsers["emma@corecreator.com"],
                instructorName: "Emma Rodriguez",
                category: "Digital Art",
                level: "intermediate",
                price: 89,
                description: "Master digital illustration using Procreate and Photoshop.",
                duration: 1800,
                status: "published",
                enrollmentCount: 15200,
                sections: [],
            },
        ];

        const createdCourses = [];
        for (const courseData of courses) {
            const course = await Course.create(courseData);
            createdCourses.push(course);
        }

        // Create reviews for courses
        for (const course of createdCourses) {
            // Generate random reviews (1 to numStudents)
            const numReviews = Math.floor(Math.random() * studentIds.length) + 1;
            let totalRating = 0;

            // Shuffle students to get unique reviewers
            const reviewers = [...studentIds].sort(() => 0.5 - Math.random()).slice(0, numReviews);

            for (const reviewerId of reviewers) {
                const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
                totalRating += rating;

                await Review.create({
                    targetType: "course",
                    targetId: course._id,
                    user: reviewerId,
                    rating: rating,
                    title: "Great course!",
                    comment: "I learned so much from this course. Highly recommended!",
                    status: "approved",
                });
            }

            // Update course with aggregate stats
            // Avoid division by zero if numReviews is somehow 0
            const finalRating = numReviews > 0 ? totalRating / numReviews : 0;

            await Course.findByIdAndUpdate(course._id, {
                rating: finalRating,
                reviewCount: numReviews
            });
        }

        const totalReviews = await Review.countDocuments();

        // Create products
        const products = [
            {
                name: "Ocean Sunset - Original Acrylic Painting",
                slug: "ocean-sunset-original",
                shortDescription: "Vibrant ocean sunset painting on 24x36 canvas",
                description: "This stunning original acrylic painting captures the magic of a Pacific coast sunset.",
                price: 450,
                category: "Paintings",
                seller: createdUsers["sarah@corecreator.com"],
                sellerName: "Sarah Mitchell",
                images: [{ url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop", isPrimary: true }],
                stock: 1,
                status: "active",
                rating: 4.8,
            },
            {
                name: "Abstract Mountain Range - Limited Print",
                slug: "abstract-mountain-range",
                shortDescription: "Limited edition giclée print",
                description: "A beautiful abstract interpretation of mountain landscapes.",
                price: 120,
                category: "Prints",
                seller: createdUsers["michael@corecreator.com"],
                sellerName: "Michael Chen",
                images: [{ url: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&h=600&fit=crop", isPrimary: true }],
                stock: 45,
                status: "active",
                rating: 4.9,
            },
            {
                name: "Handcrafted Ceramic Vase",
                slug: "handcrafted-ceramic-vase",
                shortDescription: "Unique wheel-thrown pottery piece",
                description: "Each vase is individually crafted and glazed.",
                price: 85,
                category: "Ceramics",
                seller: createdUsers["emma@corecreator.com"],
                sellerName: "Emma Rodriguez",
                images: [{ url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=600&fit=crop", isPrimary: true }],
                stock: 12,
                status: "active",
                rating: 4.7,
            },
        ];

        for (const productData of products) {
            await Product.create(productData);
        }

        // Create workshops
        const workshops = [
            {
                title: "Live Portrait Drawing Session",
                slug: "live-portrait-drawing",
                description: "Join us for an interactive portrait drawing session.",
                thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop",
                instructor: createdUsers["emma@corecreator.com"],
                instructorName: "Emma Rodriguez",
                category: "Drawing",
                type: "online",
                price: 35,
                capacity: 30,
                enrolledCount: 18,
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                duration: 120,
                status: "upcoming",
            },
            {
                title: "Acrylic Pouring Workshop",
                slug: "acrylic-pouring-workshop",
                description: "Learn the mesmerizing art of acrylic pouring.",
                thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=450&fit=crop",
                instructor: createdUsers["sarah@corecreator.com"],
                instructorName: "Sarah Mitchell",
                category: "Painting",
                type: "in-person",
                location: "Core Creator Studio, San Francisco",
                price: 75,
                capacity: 15,
                enrolledCount: 12,
                date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                duration: 180,
                status: "upcoming",
            },
        ];

        for (const workshopData of workshops) {
            await Workshop.create(workshopData);
        }

        return NextResponse.json({
            success: true,
            message: "Database seeded successfully!",
            data: {
                users: users.length,
                courses: courses.length,
                reviews: totalReviews,
                products: products.length,
                workshops: workshops.length,
            },
            testAccounts: {
                admin: "admin@corecreator.com / admin123",
                creator: "sarah@corecreator.com / creator123",
                student: "john@example.com / student123",
            },
        });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: "Failed to seed database", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
