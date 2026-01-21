
import mongoose from "mongoose";
import User from "../src/lib/db/models/User";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/corecreator";

async function checkAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB at", MONGODB_URI);

        const admin = await User.findOne({ email: "admin@corecreator.com" });
        console.log("Found Admin User:");
        console.log(JSON.stringify(admin, null, 2));

        if (admin) {
            console.log("\nRole Check:");
            console.log("Role:", admin.role);
            console.log("AdminRole:", admin.adminRole);
            console.log("Permissions:", admin.permissions);
        } else {
            console.log("Admin user not found!");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkAdmin();
