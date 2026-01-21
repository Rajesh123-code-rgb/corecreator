
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
}

async function checkAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Use raw collection access
        const user = await mongoose.connection.db.collection('users').findOne({ email: "admin@corecreator.com" });

        if (!user) {
            console.log("Admin user NOT FOUND");
        } else {
            console.log("Admin user found (RAW):");
            console.log("ID:", user._id);
            console.log("Email:", user.email);
            console.log("Role:", user.role);
            console.log("AdminRole:", user.adminRole);
            console.log("Permissions:", user.permissions);

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
