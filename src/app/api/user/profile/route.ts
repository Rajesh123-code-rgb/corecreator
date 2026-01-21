import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";


export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(session.user.id).select("-password");

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });

    } catch (error) {
        console.error("Error fetching profile:", error);
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

        // Construct update object safely
        const updates: Record<string, unknown> = {};

        // Top level fields
        if (data.name) updates.name = data.name;
        if (data.bio) updates.bio = data.bio;
        if (data.avatar) updates.avatar = data.avatar;

        // Profile fields
        if (data.phone) updates["profile.phone"] = data.phone;
        if (data.location) updates["profile.location"] = data.location;
        if (data.website) updates["profile.website"] = data.website;
        if (data.socialLinks) updates["profile.socialLinks"] = data.socialLinks;

        // Studio Profile fields
        if (data.studioProfile) {
            if (data.studioProfile.name) updates["studioProfile.name"] = data.studioProfile.name;
            if (data.studioProfile.description) updates["studioProfile.description"] = data.studioProfile.description;
            if (data.studioProfile.coverImage) updates["studioProfile.coverImage"] = data.studioProfile.coverImage;
            if (data.studioProfile.specializations) updates["studioProfile.specializations"] = data.studioProfile.specializations;
        }

        // Addresses
        if (data.addresses) updates.addresses = data.addresses;

        // Preferences
        if (data.preferences) {
            if (data.preferences.currency) updates["preferences.currency"] = data.preferences.currency;
            if (data.preferences.emailNotifications !== undefined) updates["preferences.emailNotifications"] = data.preferences.emailNotifications;
            if (data.preferences.pushNotifications !== undefined) updates["preferences.pushNotifications"] = data.preferences.pushNotifications;
        }

        // Payout Methods
        if (data.payoutMethods) updates.payoutMethods = data.payoutMethods;

        const user = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user, message: "Profile updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
