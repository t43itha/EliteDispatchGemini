"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { MessageTypes, ConversationState } from "./twilio";

/**
 * Send booking confirmation to customer
 */
export const notifyCustomerBookingConfirmed = action({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        // Get booking details
        const booking = await ctx.runQuery(api.whatsapp.notifications.getBookingWithOrg, {
            bookingId: args.bookingId,
        });

        if (!booking) {
            console.error("Booking not found:", args.bookingId);
            return { success: false, error: "Booking not found" };
        }

        // Format the message
        const pickupDate = new Date(booking.pickupTime);
        const formattedDate = pickupDate.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
        const formattedTime = pickupDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const message = `Hi ${booking.customerName},

Your booking has been confirmed!

📅 *${formattedDate}*
🕐 *${formattedTime}*

📍 *Pickup:* ${booking.pickupLocation}
🏁 *Dropoff:* ${booking.dropoffLocation}

💷 *Total:* £${booking.price.toFixed(2)}

We'll notify you when your driver is assigned.

Thank you for choosing ${booking.orgName || "our service"}!`;

        // Send the message
        const result = await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: booking.customerPhone,
            body: message,
            orgId: booking.orgId,
            bookingId: args.bookingId,
            messageType: MessageTypes.BOOKING_CONFIRM,
        });

        // Update booking to mark customer as notified
        if (result.success) {
            await ctx.runMutation(api.whatsapp.notifications.markCustomerNotified, {
                bookingId: args.bookingId,
            });
        }

        return result;
    },
});

/**
 * Send driver dispatch notification (job offer)
 */
export const notifyDriverNewJob = action({
    args: {
        bookingId: v.id("bookings"),
        driverId: v.id("drivers"),
    },
    handler: async (ctx, args) => {
        // Get booking and driver details
        const booking = await ctx.runQuery(api.whatsapp.notifications.getBookingWithOrg, {
            bookingId: args.bookingId,
        });
        const driver = await ctx.runQuery(api.whatsapp.notifications.getDriver, {
            driverId: args.driverId,
        });

        if (!booking || !driver) {
            console.error("Booking or driver not found");
            return { success: false, error: "Booking or driver not found" };
        }

        // Format the message
        const pickupDate = new Date(booking.pickupTime);
        const formattedDate = pickupDate.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
        const formattedTime = pickupDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const message = `🚗 *NEW JOB REQUEST*

Hi ${driver.name},

📅 ${formattedDate} at ${formattedTime}

👤 *Customer:* ${booking.customerName}
📍 *Pickup:* ${booking.pickupLocation}
🏁 *Dropoff:* ${booking.dropoffLocation}
👥 *Passengers:* ${booking.passengers}
💷 *Fare:* £${booking.price.toFixed(2)}
${booking.notes ? `📝 *Notes:* ${booking.notes}` : ""}

━━━━━━━━━━━━━━━━━
Reply *1* to ACCEPT
Reply *2* to DECLINE
━━━━━━━━━━━━━━━━━`;

        // Send the message
        const result = await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: driver.phone,
            body: message,
            orgId: booking.orgId,
            bookingId: args.bookingId,
            driverId: args.driverId,
            messageType: MessageTypes.DRIVER_DISPATCH,
        });

        // Update conversation state and booking
        if (result.success) {
            await ctx.runMutation(api.whatsapp.stateMachine.updateConversation, {
                driverId: args.driverId,
                phone: driver.phone,
                orgId: booking.orgId,
                state: ConversationState.AWAITING_ACCEPT,
                currentBookingId: args.bookingId,
            });

            await ctx.runMutation(api.whatsapp.notifications.markDriverNotified, {
                bookingId: args.bookingId,
            });
        }

        return result;
    },
});

/**
 * Notify customer that driver has been assigned
 */
export const notifyCustomerDriverAssigned = action({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.runQuery(api.whatsapp.notifications.getBookingWithDriver, {
            bookingId: args.bookingId,
        });

        if (!booking || !booking.driver) {
            return { success: false, error: "Booking or driver not found" };
        }

        const pickupDate = new Date(booking.pickupTime);
        const formattedTime = pickupDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const message = `Hi ${booking.customerName},

Your driver has been assigned!

🚗 *Driver:* ${booking.driver.name}
🚙 *Vehicle:* ${booking.driver.vehicle}${booking.driver.vehicleColour ? ` (${booking.driver.vehicleColour})` : ""}
🔢 *Plate:* ${booking.driver.plate}

⏰ *Pickup Time:* ${formattedTime}
📍 *Location:* ${booking.pickupLocation}

Your driver will confirm shortly.`;

        return await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: booking.customerPhone,
            body: message,
            orgId: booking.orgId,
            bookingId: args.bookingId,
            messageType: MessageTypes.CUSTOMER_DRIVER_ASSIGNED,
        });
    },
});

/**
 * Notify customer that driver has confirmed
 */
export const notifyCustomerDriverConfirmed = action({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.runQuery(api.whatsapp.notifications.getBookingWithDriver, {
            bookingId: args.bookingId,
        });

        if (!booking || !booking.driver) {
            return { success: false, error: "Booking or driver not found" };
        }

        const message = `Great news, ${booking.customerName}!

✅ Your driver *${booking.driver.name}* has confirmed your booking.

They will arrive at your pickup location on time. We'll send you another message when they're on their way.`;

        return await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: booking.customerPhone,
            body: message,
            orgId: booking.orgId,
            bookingId: args.bookingId,
            messageType: "CUSTOMER_DRIVER_CONFIRMED",
        });
    },
});

/**
 * Notify customer that driver is en route
 */
export const notifyCustomerEnRoute = action({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.runQuery(api.whatsapp.notifications.getBookingWithDriver, {
            bookingId: args.bookingId,
        });

        if (!booking || !booking.driver) {
            return { success: false, error: "Booking or driver not found" };
        }

        // Generate tracking URL
        // Note: In production, replace with actual app URL
        const baseUrl = process.env.APP_URL || "https://your-app.com";
        const trackingUrl = `${baseUrl}/booking/${args.bookingId}/status`;

        const message = `Hi ${booking.customerName},

🚗 *Your driver is on the way!*

${booking.driver.name} has picked you up and is heading to your destination.

🏁 *Dropoff:* ${booking.dropoffLocation}

Track your trip: ${trackingUrl}`;

        return await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: booking.customerPhone,
            body: message,
            orgId: booking.orgId,
            bookingId: args.bookingId,
            messageType: MessageTypes.CUSTOMER_EN_ROUTE,
        });
    },
});

/**
 * Notify customer that trip is complete
 */
export const notifyCustomerComplete = action({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.runQuery(api.whatsapp.notifications.getBookingWithOrg, {
            bookingId: args.bookingId,
        });

        if (!booking) {
            return { success: false, error: "Booking not found" };
        }

        const message = `Hi ${booking.customerName},

✅ *Trip Complete!*

Thank you for travelling with ${booking.orgName || "us"}.

💷 *Total:* £${booking.price.toFixed(2)}

We hope you had a pleasant journey. See you next time!`;

        return await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: booking.customerPhone,
            body: message,
            orgId: booking.orgId,
            bookingId: args.bookingId,
            messageType: MessageTypes.CUSTOMER_COMPLETE,
        });
    },
});

// Helper queries
import { query, mutation } from "../_generated/server";

export const getBookingWithOrg = query({
    args: { bookingId: v.id("bookings") },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) return null;

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", booking.orgId))
            .first();

        return {
            ...booking,
            orgName: org?.name,
        };
    },
});

export const getBookingWithDriver = query({
    args: { bookingId: v.id("bookings") },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) return null;

        let driver = null;
        if (booking.driverId) {
            driver = await ctx.db.get(booking.driverId);
        }

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", booking.orgId))
            .first();

        return {
            ...booking,
            driver,
            orgName: org?.name,
        };
    },
});

export const getDriver = query({
    args: { driverId: v.id("drivers") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.driverId);
    },
});

export const markCustomerNotified = mutation({
    args: { bookingId: v.id("bookings") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.bookingId, {
            whatsappCustomerNotified: true,
        });
    },
});

export const markDriverNotified = mutation({
    args: { bookingId: v.id("bookings") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.bookingId, {
            whatsappDriverNotified: true,
        });
    },
});
