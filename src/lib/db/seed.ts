
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "./models/User";
import Course from "./models/Course";
import Product from "./models/Product";
import Workshop from "./models/Workshop";
import Order from "./models/Order";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/corecreator";

const users = [
    {
        name: "Admin User",
        email: "admin@corecreator.com",
        password: "admin123",
        role: "admin",
        adminRole: "super",
        permissions: [],
        isVerified: true,
    },
    {
        name: "Sarah Mitchell",
        email: "sarah@corecreator.com",
        password: "creator123",
        role: "studio",
        isVerified: true,
        bio: "Award-winning watercolor artist and instructor",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
        studioProfile: {
            name: "Sarah's Watercolor Studio",
            description: "Dedicated to teaching the art of watercolor painting.",
            specializations: ["Watercolor", "Painting"],
            yearsOfExperience: 15,
            rating: 4.9,
            totalStudents: 12500,
            totalReviews: 890,
        },
    },
    {
        name: "Michael Chen",
        email: "michael@corecreator.com",
        password: "creator123",
        role: "studio",
        isVerified: true,
        bio: "Professional oil painter specializing in landscapes",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        studioProfile: {
            name: "Chen Fine Arts",
            description: "Classical oil painting techniques.",
            specializations: ["Oil Painting", "Portraits"],
            yearsOfExperience: 10,
            rating: 4.8,
            totalStudents: 8900,
            totalReviews: 450,
        },
    },
    {
        name: "Emma Rodriguez",
        email: "emma@corecreator.com",
        password: "creator123",
        role: "studio",
        isVerified: true,
        bio: "Digital artist and illustrator",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
        studioProfile: {
            name: "Emma Rodriguez Design",
            description: "Digital art, illustration, and character design.",
            specializations: ["Digital Art", "Illustration"],
            yearsOfExperience: 8,
            rating: 4.9,
            totalStudents: 15200,
            totalReviews: 1200,
        },
    },
    {
        name: "John User",
        email: "john@example.com",
        password: "user123",
        role: "user",
        isVerified: true,
    },
];

async function seedDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        await User.deleteMany({});
        await Course.deleteMany({});
        await Product.deleteMany({});
        await Workshop.deleteMany({});
        await Order.deleteMany({});
        console.log("Cleared existing data");

        // Create users
        const createdUsers: Record<string, mongoose.Types.ObjectId> = {};
        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const user = await User.create({
                ...userData,
                password: hashedPassword,
            } as any);
            createdUsers[userData.email] = user._id;
            console.log(`Created user: ${userData.name}`);
        }

        // Create Courses
        const courses = [
            {
                title: "Watercolor Masterclass",
                slug: "watercolor-masterclass",
                thumbnail: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=450&fit=crop",
                instructor: createdUsers["sarah@corecreator.com"],
                instructorName: "Sarah Mitchell",
                category: "Painting",
                level: "all",
                price: 79,
                description: "Master watercolor techniques.",
                duration: 1200,
                status: "published",
                rating: 4.9,
                enrollmentCount: 12500,
                sections: [
                    {
                        title: "Basics",
                        order: 1,
                        lessons: [{ title: "Intro", type: "video", duration: 15, order: 1, isFree: true }],
                    }
                ],
            },
            {
                title: "Oil Painting Fundamentals",
                slug: "oil-painting-fundamentals",
                thumbnail: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop",
                instructor: createdUsers["michael@corecreator.com"],
                instructorName: "Michael Chen",
                category: "Painting",
                level: "beginner",
                price: 99,
                description: "Learn oil painting.",
                duration: 1500,
                status: "published",
                rating: 4.8,
                enrollmentCount: 8900,
                sections: [
                    {
                        title: "Basics",
                        order: 1,
                        lessons: [{ title: "Intro", type: "video", duration: 15, order: 1, isFree: true }],
                    }
                ],
            }
        ];

        for (const courseData of courses) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await Course.create(courseData as any);
            console.log(`Created course: ${courseData.title}`);
        }

        // Create Products
        const products = [
            {
                name: "Ocean Sunset Painting",
                slug: "ocean-sunset",
                shortDescription: "Original Acrylic",
                description: "Beautiful sunset painting.",
                price: 450,
                category: "Paintings",
                seller: createdUsers["sarah@corecreator.com"],
                sellerName: "Sarah Mitchell",
                images: [{ url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5", isPrimary: true }],
                stock: 1,
                status: "active",
            },
            {
                name: "Ceramic Vase",
                slug: "ceramic-vase",
                shortDescription: "Handcrafted",
                description: "Unique vase.",
                price: 85,
                category: "Ceramics",
                seller: createdUsers["emma@corecreator.com"],
                sellerName: "Emma Rodriguez",
                images: [{ url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261", isPrimary: true }],
                stock: 12,
                status: "active",
            }
        ];

        for (const productData of products) {
            await Product.create(productData);
            console.log(`Created product: ${productData.name}`);
        }

        // Create Workshops
        const workshops = [
            {
                title: "Live Portrait Drawing",
                slug: "live-portrait",
                description: "Interactive session.",
                thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
                instructor: createdUsers["emma@corecreator.com"],
                instructorName: "Emma Rodriguez",
                category: "Drawing",
                type: "online",
                price: 35,
                capacity: 30,
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                duration: 120,
                status: "upcoming",
            }
        ];

        for (const workshopData of workshops) {
            await Workshop.create(workshopData);
            console.log(`Created workshop: ${workshopData.title}`);
        }

        // Create Orders
        const coursesDb = await Course.find();
        const productsDb = await Product.find();
        const workshopsDb = await Workshop.find();

        const orders = [
            {
                orderNumber: "ORD-000001",
                user: createdUsers["john@example.com"],
                items: [{
                    itemType: "course",
                    itemId: coursesDb[0]._id,
                    name: coursesDb[0].title,
                    price: coursesDb[0].price,
                    quantity: 1,
                    image: coursesDb[0].thumbnail
                }],
                subtotal: coursesDb[0].price,
                total: coursesDb[0].price,
                paymentStatus: "paid",
                paymentMethod: "stripe",
                status: "confirmed",
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                orderNumber: "ORD-000002",
                user: createdUsers["john@example.com"],
                items: [{
                    itemType: "product",
                    itemId: productsDb[0]._id,
                    name: productsDb[0].name,
                    price: productsDb[0].price,
                    quantity: 1,
                    image: productsDb[0].images[0].url
                }],
                subtotal: productsDb[0].price,
                total: productsDb[0].price,
                paymentStatus: "paid",
                paymentMethod: "paypal",
                status: "processing",
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ];

        for (const orderData of orders) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await Order.create(orderData as any);
            console.log(`Created order for user: ${orderData.user}`);
        }

        console.log("\n✅ Database seeded successfully!");
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seedDatabase();
