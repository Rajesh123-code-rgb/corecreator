
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/lib/db/models/User";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/corecreator";

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB at " + MONGODB_URI);

        const email = "admin@corecreator.com";
        const password = "admin123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const adminData = {
            name: "Super Admin",
            email,
            password: hashedPassword,
            role: "admin",
            adminRole: "super",
            permissions: [], // Super role implies all
            isVerified: true,
            avatar: "https://ui-avatars.com/api/?name=Super+Admin&background=8b5cf6&color=fff"
        };

        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            console.log("Admin user exists. Updating permissions...");
            existingAdmin.role = "admin";
            existingAdmin.adminRole = "super";
            existingAdmin.permissions = [];
            // Optional: Update password if you want, but maybe better to leave it if known.
            // existingAdmin.password = hashedPassword; 
            await existingAdmin.save();
            console.log("✅ Admin permissions updated.");
        } else {
            console.log("Creating new admin user...");
            await User.create(adminData);
            console.log("✅ Admin user created.");
        }

        console.log(`
Login Credentials:
Email: ${email}
Password: ${password} (if newly created)
        `);

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
}

createAdmin();
