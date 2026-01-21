
import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
}

async function checkAdmin() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB");

        // Use raw collection access to avoid Schema/Model issues
        const user = await mongoose.connection.db?.collection('users').findOne({ email: "admin@corecreator.com" });

        if (!user) {
            console.log("Admin user NOT FOUND");
        } else {
            console.log("Admin user found (RAW):");
            // print specific fields to avoid clutter
            console.log("ID:", user._id);
            console.log("Email:", user.email);
            console.log("Role:", user.role);
            console.log("AdminRole:", user.adminRole);
            console.log("Permissions:", user.permissions);

            // Check if adminRole is actually set to 'super'
            if (user.adminRole !== 'super') {
                console.warn("WARNING: adminRole is NOT 'super'");
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkAdmin();
