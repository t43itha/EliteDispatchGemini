"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * Assign a driver to a booking and send WhatsApp notifications
 * This is the WhatsApp-enabled version of bookings.assignDriver
 */
export const assignDriverWithNotification = action({
    args: {
        bookingId: v.id("bookings"),
        driverId: v.id("drivers"),
        sendWhatsApp: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // First, perform the assignment
        await ctx.runMutation(api.bookings.assignDriver, {
            id: args.bookingId,
            driverId: args.driverId,
        });

        // If WhatsApp is enabled, send notifications
        if (args.sendWhatsApp !== false) {
            try {
                // Send notification to driver
                const driverResult = await ctx.runAction(
                    api.whatsapp.notifications.notifyDriverNewJob,
                    {
                        bookingId: args.bookingId,
                        driverId: args.driverId,
                    }
                );

                // Send notification to customer that driver is assigned
                const customerResult = await ctx.runAction(
                    api.whatsapp.notifications.notifyCustomerDriverAssigned,
                    {
                        bookingId: args.bookingId,
                    }
                );

                return {
                    success: true,
                    driverNotified: driverResult.success,
                    customerNotified: customerResult.success,
                };
            } catch (error) {
                console.error("WhatsApp notification failed:", error);
                // Assignment succeeded, but notification failed
                return {
                    success: true,
                    driverNotified: false,
                    customerNotified: false,
                    error: "Assignment succeeded but WhatsApp notification failed",
                };
            }
        }

        return { success: true, driverNotified: false, customerNotified: false };
    },
});

/**
 * Create a booking from widget and send WhatsApp confirmation
 * This is the WhatsApp-enabled version of bookings.createFromWidget
 */
export const createBookingWithNotification = action({
    args: {
        orgId: v.string(),
        customerName: v.string(),
        customerPhone: v.string(),
        customerEmail: v.optional(v.string()),
        pickupLocation: v.string(),
        dropoffLocation: v.string(),
        pickupTime: v.string(),
        passengers: v.number(),
        price: v.number(),
        vehicleClass: v.optional(v.string()),
        notes: v.optional(v.string()),
        distance: v.optional(v.string()),
        duration: v.optional(v.string()),
        isReturn: v.optional(v.boolean()),
        paymentStatus: v.optional(v.string()),
        sendWhatsApp: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Create the booking
        const bookingId = await ctx.runMutation(api.bookings.createFromWidget, {
            orgId: args.orgId,
            customerName: args.customerName,
            customerPhone: args.customerPhone,
            customerEmail: args.customerEmail,
            pickupLocation: args.pickupLocation,
            dropoffLocation: args.dropoffLocation,
            pickupTime: args.pickupTime,
            passengers: args.passengers,
            price: args.price,
            vehicleClass: args.vehicleClass,
            notes: args.notes,
            distance: args.distance,
            duration: args.duration,
            isReturn: args.isReturn,
            paymentStatus: args.paymentStatus,
        });

        // If WhatsApp is enabled, send confirmation to customer
        if (args.sendWhatsApp !== false) {
            try {
                const result = await ctx.runAction(
                    api.whatsapp.notifications.notifyCustomerBookingConfirmed,
                    {
                        bookingId,
                    }
                );

                return {
                    bookingId,
                    customerNotified: result.success,
                };
            } catch (error) {
                console.error("WhatsApp notification failed:", error);
                return {
                    bookingId,
                    customerNotified: false,
                    error: "Booking created but WhatsApp notification failed",
                };
            }
        }

        return { bookingId, customerNotified: false };
    },
});

/**
 * Send a manual WhatsApp message to a driver for a booking
 * Used when dispatcher wants to resend or send custom message
 */
export const sendDriverMessage = action({
    args: {
        bookingId: v.id("bookings"),
        driverId: v.id("drivers"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        // Get driver details
        const driver = await ctx.runQuery(api.whatsapp.notifications.getDriver, {
            driverId: args.driverId,
        });

        if (!driver) {
            return { success: false, error: "Driver not found" };
        }

        // Get booking for orgId
        const booking = await ctx.runQuery(api.whatsapp.notifications.getBookingWithOrg, {
            bookingId: args.bookingId,
        });

        if (!booking) {
            return { success: false, error: "Booking not found" };
        }

        // Send the message
        return await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: driver.phone,
            body: args.message,
            orgId: booking.orgId,
            bookingId: args.bookingId,
            driverId: args.driverId,
            messageType: "MANUAL",
        });
    },
});

/**
 * Send a manual WhatsApp message to a customer
 */
export const sendCustomerMessage = action({
    args: {
        bookingId: v.id("bookings"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        // Get booking details
        const booking = await ctx.runQuery(api.whatsapp.notifications.getBookingWithOrg, {
            bookingId: args.bookingId,
        });

        if (!booking) {
            return { success: false, error: "Booking not found" };
        }

        // Send the message
        return await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: booking.customerPhone,
            body: args.message,
            orgId: booking.orgId,
            bookingId: args.bookingId,
            messageType: "MANUAL",
        });
    },
});
