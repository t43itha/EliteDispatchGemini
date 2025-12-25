import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get public booking status (no auth required)
 * Used by customers to track their booking via link
 */
export const getBookingStatus = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            return null;
        }

        // Get driver details if assigned
        let driver = null;
        if (booking.driverId) {
            const driverRecord = await ctx.db.get(booking.driverId);
            if (driverRecord) {
                // Only expose safe driver info to customer
                driver = {
                    name: driverRecord.name,
                    vehicle: driverRecord.vehicle,
                    vehicleColour: driverRecord.vehicleColour,
                    plate: driverRecord.plate,
                    phone: driverRecord.phone,
                };
            }
        }

        // Get organization name
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", booking.orgId))
            .first();

        // Return public-safe booking info
        return {
            id: booking._id,
            status: booking.status,
            customerName: booking.customerName,
            pickupLocation: booking.pickupLocation,
            dropoffLocation: booking.dropoffLocation,
            pickupTime: booking.pickupTime,
            passengers: booking.passengers,
            vehicleClass: booking.vehicleClass,
            price: booking.price,
            driver,
            orgName: org?.name || "Your Service Provider",
            orgPhone: org?.phone,
            whatsappDriverAccepted: booking.whatsappDriverAccepted,
        };
    },
});
