import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export interface GuestContact {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

export interface GuestAccountResult {
    userId: string;
    /** True only when this call created the account. */
    isNewAccount: boolean;
    email: string;
    name: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves a guest checkout to a real user account, because Order.user is
 * required and every downstream feature (order history, course access, workshop
 * seats, seller dashboards) keys off a user id.
 *
 * If the email already belongs to an account, the order is attached to it and
 * NOTHING is returned that would let the buyer into that account - they still
 * have to prove they own the mailbox via the password-reset flow. That matters:
 * otherwise typing a stranger's email at checkout would be an account takeover.
 *
 * New accounts are created without a password, so the only way in is the reset
 * link sent to the address the buyer typed.
 */
export async function findOrCreateGuestUser(contact: GuestContact): Promise<GuestAccountResult> {
    const email = (contact.email || "").toLowerCase().trim();

    if (!EMAIL_RE.test(email)) {
        throw new Error("A valid email address is required to check out as a guest.");
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
        if (existing.isActive === false) {
            throw new Error("This email belongs to a deactivated account. Please contact support.");
        }
        return {
            userId: existing._id.toString(),
            isNewAccount: false,
            email: existing.email,
            name: existing.name,
        };
    }

    const name = [contact.firstName, contact.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || email.split("@")[0];

    const created = await User.create({
        email,
        name,
        role: "user",
        isVerified: false,
        createdViaGuestCheckout: true,
        // Deliberately no password. authorize() refuses passwordless accounts
        // and points the user at the reset flow.
        profile: contact.phone ? { phone: contact.phone } : undefined,
    });

    return {
        userId: created._id.toString(),
        isNewAccount: true,
        email: created.email,
        name: created.name,
    };
}
