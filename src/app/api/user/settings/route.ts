import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(session.user.id).select("preferences twoFactorEnabled email");

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            settings: {
                preferences: user.preferences,
                twoFactorEnabled: user.twoFactorEnabled,
                email: user.email
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();

        await connectDB();

        const updateData: any = {};

        if (data.preferences) {
            updateData.preferences = data.preferences;
        }

        if (typeof data.twoFactorEnabled === 'boolean') {
            updateData.twoFactorEnabled = data.twoFactorEnabled;
        }

        const user = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("preferences twoFactorEnabled");

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            settings: {
                preferences: user.preferences,
                twoFactorEnabled: user.twoFactorEnabled
            },
            message: "Settings updated successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
