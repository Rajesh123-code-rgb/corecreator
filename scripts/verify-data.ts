
import mongoose from "mongoose";
import User from "../src/lib/db/models/User";
import Course from "../src/lib/db/models/Course";
import Product from "../src/lib/db/models/Product";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/corecreator";

async function verify() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB via", MONGODB_URI);

        const admin = await User.findOne({ email: "admin@corecreator.com" });
        console.log("Admin User:", admin ? {
            _id: admin._id,
            email: admin.email,
            role: admin.role,
            adminRole: admin.adminRole,
            isActive: admin.isActive
        } : "NOT FOUND");

        const courseCount = await Course.countDocuments();
        console.log("Total Courses:", courseCount);

        const productCount = await Product.countDocuments();
        console.log("Total Products:", productCount);

        const allUsers = await User.find({}, "email role adminRole");
        console.log("All Users:", allUsers);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

verify();
