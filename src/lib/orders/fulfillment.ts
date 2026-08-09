import Workshop from "@/lib/db/models/Workshop";

// An order can be confirmed by two independent paths: the browser calling
// /api/payment/razorpay/verify after the Razorpay modal closes, and Razorpay's
// payment.captured webhook. Either can arrive first, and if the customer closes
// the tab straight after paying, only the webhook arrives at all.
//
// Course and product ownership is derived from confirmed orders, so those need
// nothing extra. Workshop attendance is stored on the Workshop document, so it
// has to be written explicitly - and written by BOTH paths, or a paying
// customer ends up with no seat.
//
// Callers must pass whether the order was already paid before this confirmation,
// so a second confirmation does not increment enrolledCount twice.
export async function grantWorkshopAttendance(
    order: { items?: any[]; user?: any },
    alreadyPaid: boolean
): Promise<void> {
    if (alreadyPaid) return;

    const workshopItems = (order.items || []).filter((i: any) => i.itemType === "workshop");
    if (workshopItems.length === 0) return;

    for (const item of workshopItems) {
        // Guarding on attendees is a second layer of idempotency: even if two
        // confirmations race past the alreadyPaid check, the seat count cannot
        // be incremented twice for the same buyer.
        await Workshop.updateOne(
            { _id: item.itemId, attendees: { $ne: order.user } },
            {
                $addToSet: { attendees: order.user },
                $inc: { enrolledCount: item.quantity || 1 },
            }
        );
    }
}
