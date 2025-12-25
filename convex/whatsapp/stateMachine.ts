"use node";

import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { ConversationState, MessageTypes, MessageStatus } from "./twilio";
import { Id } from "../_generated/dataModel";

// Fuzzy matching patterns for driver responses
const ACCEPT_PATTERNS = ["1", "yes", "accept", "ok", "okay", "sure", "confirm", "confirmed", "yep", "yeah"];
const DECLINE_PATTERNS = ["2", "no", "decline", "pass", "skip", "cant", "can't", "cannot", "busy", "reject"];
const START_PATTERNS = ["start", "started", "picked", "pickup", "picked up", "on way", "onway", "en route", "collecting"];
const COMPLETE_PATTERNS = ["done", "complete", "completed", "finished", "dropped", "drop off", "dropoff", "delivered"];

/**
 * Normalize message for pattern matching
 */
function normalizeMessage(message: string): string {
    return message.toLowerCase().trim().replace(/[^\w\s]/g, "");
}

/**
 * Check if message matches any pattern
 */
function matchesPattern(message: string, patterns: string[]): boolean {
    const normalized = normalizeMessage(message);
    return patterns.some((pattern) => {
        const normalizedPattern = normalizeMessage(pattern);
        return normalized === normalizedPattern || normalized.includes(normalizedPattern);
    });
}

/**
 * Determine the intent of an incoming message
 */
function parseIntent(message: string): "ACCEPT" | "DECLINE" | "START" | "COMPLETE" | "UNKNOWN" {
    if (matchesPattern(message, ACCEPT_PATTERNS)) return "ACCEPT";
    if (matchesPattern(message, DECLINE_PATTERNS)) return "DECLINE";
    if (matchesPattern(message, START_PATTERNS)) return "START";
    if (matchesPattern(message, COMPLETE_PATTERNS)) return "COMPLETE";
    return "UNKNOWN";
}

/**
 * Get or create conversation state for a driver
 */
export const getConversation = query({
    args: {
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        // Normalize phone number
        const phone = args.phone.replace(/[^\d+]/g, "");

        const conversation = await ctx.db
            .query("whatsappConversations")
            .withIndex("by_phone", (q) => q.eq("phone", phone))
            .first();

        return conversation;
    },
});

/**
 * Update conversation state
 */
export const updateConversation = mutation({
    args: {
        driverId: v.id("drivers"),
        phone: v.string(),
        orgId: v.string(),
        state: v.string(),
        currentBookingId: v.optional(v.id("bookings")),
    },
    handler: async (ctx, args) => {
        const phone = args.phone.replace(/[^\d+]/g, "");
        const now = Date.now();

        // Check if conversation exists
        const existing = await ctx.db
            .query("whatsappConversations")
            .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                state: args.state,
                currentBookingId: args.currentBookingId,
                lastMessageAt: now,
                expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
            });
            return existing._id;
        } else {
            return await ctx.db.insert("whatsappConversations", {
                orgId: args.orgId,
                driverId: args.driverId,
                phone,
                state: args.state,
                currentBookingId: args.currentBookingId,
                lastMessageAt: now,
                expiresAt: now + 24 * 60 * 60 * 1000,
            });
        }
    },
});

/**
 * Find driver by phone number
 */
export const findDriverByPhone = query({
    args: {
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        // Normalize phone number (remove everything except digits and +)
        const phone = args.phone.replace(/[^\d+]/g, "");

        // Try to find driver with exact match first
        let driver = await ctx.db
            .query("drivers")
            .withIndex("by_phone", (q) => q.eq("phone", phone))
            .first();

        if (!driver) {
            // Try without + prefix
            const phoneWithoutPlus = phone.replace("+", "");
            driver = await ctx.db
                .query("drivers")
                .withIndex("by_phone", (q) => q.eq("phone", phoneWithoutPlus))
                .first();
        }

        if (!driver) {
            // Try with + prefix
            const phoneWithPlus = phone.startsWith("+") ? phone : "+" + phone;
            driver = await ctx.db
                .query("drivers")
                .withIndex("by_phone", (q) => q.eq("phone", phoneWithPlus))
                .first();
        }

        return driver;
    },
});

/**
 * Process an incoming WhatsApp message from a driver
 */
export const processIncomingMessage = action({
    args: {
        phone: v.string(),
        messageBody: v.string(),
        twilioSid: v.string(),
    },
    handler: async (ctx, args): Promise<{ success: boolean; response?: string; error?: string }> => {
        const phone = args.phone.replace(/[^\d+]/g, "");

        // Find the driver by phone number
        const driver = await ctx.runQuery(api.whatsapp.stateMachine.findDriverByPhone, {
            phone,
        });

        if (!driver) {
            console.log(`Unknown phone number: ${phone}`);
            return {
                success: false,
                error: "Driver not found for this phone number",
            };
        }

        // Get current conversation state
        const conversation = await ctx.runQuery(api.whatsapp.stateMachine.getConversation, {
            phone,
        });

        const currentState = conversation?.state || ConversationState.IDLE;
        const currentBookingId = conversation?.currentBookingId;

        // Log the incoming message
        await ctx.runMutation(api.whatsapp.config.logMessage, {
            orgId: driver.orgId,
            driverId: driver._id,
            bookingId: currentBookingId,
            direction: "inbound",
            recipientPhone: phone,
            messageType: MessageTypes.INBOUND,
            content: args.messageBody,
            twilioSid: args.twilioSid,
            status: MessageStatus.DELIVERED,
        });

        // Parse the intent
        const intent = parseIntent(args.messageBody);

        // Handle based on current state and intent
        let response: string | undefined;
        let newState = currentState;

        switch (currentState) {
            case ConversationState.AWAITING_ACCEPT:
                if (intent === "ACCEPT" && currentBookingId) {
                    // Driver accepted the job
                    await ctx.runMutation(api.whatsapp.stateMachine.handleDriverAccept, {
                        bookingId: currentBookingId,
                        driverId: driver._id,
                    });
                    newState = ConversationState.AWAITING_START;
                    response = "Great! Job confirmed. Reply START when you pick up the customer.";

                    // Send confirmation to driver
                    await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
                        to: phone,
                        body: response,
                        orgId: driver.orgId,
                        bookingId: currentBookingId,
                        driverId: driver._id,
                        messageType: MessageTypes.DRIVER_ACCEPT,
                    });

                    // Notify customer that driver is confirmed
                    await ctx.runAction(api.whatsapp.notifications.notifyCustomerDriverConfirmed, {
                        bookingId: currentBookingId,
                    });
                } else if (intent === "DECLINE" && currentBookingId) {
                    // Driver declined the job
                    await ctx.runMutation(api.whatsapp.stateMachine.handleDriverDecline, {
                        bookingId: currentBookingId,
                        driverId: driver._id,
                    });
                    newState = ConversationState.IDLE;
                    response = "No problem. The dispatcher will assign another driver.";

                    await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
                        to: phone,
                        body: response,
                        orgId: driver.orgId,
                        bookingId: currentBookingId,
                        driverId: driver._id,
                        messageType: MessageTypes.DRIVER_DECLINE,
                    });
                } else {
                    response = "Please reply 1 to ACCEPT or 2 to DECLINE the job.";
                    await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
                        to: phone,
                        body: response,
                        orgId: driver.orgId,
                        bookingId: currentBookingId,
                        driverId: driver._id,
                        messageType: "PROMPT",
                    });
                }
                break;

            case ConversationState.AWAITING_START:
                if (intent === "START" && currentBookingId) {
                    // Driver started the job
                    await ctx.runMutation(api.whatsapp.stateMachine.handleDriverStart, {
                        bookingId: currentBookingId,
                        driverId: driver._id,
                    });
                    newState = ConversationState.IN_PROGRESS;
                    response = "Customer picked up! Reply DONE when the trip is complete.";

                    await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
                        to: phone,
                        body: response,
                        orgId: driver.orgId,
                        bookingId: currentBookingId,
                        driverId: driver._id,
                        messageType: MessageTypes.DRIVER_START,
                    });

                    // Notify customer that driver is en route
                    await ctx.runAction(api.whatsapp.notifications.notifyCustomerEnRoute, {
                        bookingId: currentBookingId,
                    });
                } else {
                    response = "Reply START when you pick up the customer.";
                    await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
                        to: phone,
                        body: response,
                        orgId: driver.orgId,
                        bookingId: currentBookingId,
                        driverId: driver._id,
                        messageType: "PROMPT",
                    });
                }
                break;

            case ConversationState.IN_PROGRESS:
                if (intent === "COMPLETE" && currentBookingId) {
                    // Driver completed the job
                    await ctx.runMutation(api.whatsapp.stateMachine.handleDriverComplete, {
                        bookingId: currentBookingId,
                        driverId: driver._id,
                    });
                    newState = ConversationState.IDLE;
                    response = "Trip complete! Great job. You're now available for new jobs.";

                    await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
                        to: phone,
                        body: response,
                        orgId: driver.orgId,
                        bookingId: currentBookingId,
                        driverId: driver._id,
                        messageType: MessageTypes.DRIVER_COMPLETE,
                    });

                    // Notify customer that job is complete
                    await ctx.runAction(api.whatsapp.notifications.notifyCustomerComplete, {
                        bookingId: currentBookingId,
                    });
                } else {
                    response = "Reply DONE when the trip is complete.";
                    await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
                        to: phone,
                        body: response,
                        orgId: driver.orgId,
                        bookingId: currentBookingId,
                        driverId: driver._id,
                        messageType: "PROMPT",
                    });
                }
                break;

            case ConversationState.IDLE:
            default:
                response = "No active job. You'll receive a message when a new job is assigned to you.";
                await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
                    to: phone,
                    body: response,
                    orgId: driver.orgId,
                    driverId: driver._id,
                    messageType: "INFO",
                });
                break;
        }

        // Update conversation state
        await ctx.runMutation(api.whatsapp.stateMachine.updateConversation, {
            driverId: driver._id,
            phone,
            orgId: driver.orgId,
            state: newState,
            currentBookingId: newState === ConversationState.IDLE ? undefined : currentBookingId,
        });

        return { success: true, response };
    },
});

/**
 * Handle driver accepting a job
 */
export const handleDriverAccept = mutation({
    args: {
        bookingId: v.id("bookings"),
        driverId: v.id("drivers"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        // Update booking with acceptance
        await ctx.db.patch(args.bookingId, {
            whatsappDriverAccepted: true,
            whatsappDriverAcceptedAt: Date.now(),
        });

        // Update driver status to BUSY
        await ctx.db.patch(args.driverId, {
            status: "BUSY",
        });
    },
});

/**
 * Handle driver declining a job
 */
export const handleDriverDecline = mutation({
    args: {
        bookingId: v.id("bookings"),
        driverId: v.id("drivers"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        // Reset booking to pending (unassign driver)
        await ctx.db.patch(args.bookingId, {
            status: "PENDING",
            driverId: undefined,
            whatsappDriverNotified: false,
            whatsappDriverAccepted: false,
        });

        // TODO: Optionally notify dispatcher that driver declined
    },
});

/**
 * Handle driver starting a job (picked up customer)
 */
export const handleDriverStart = mutation({
    args: {
        bookingId: v.id("bookings"),
        driverId: v.id("drivers"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        // Update booking status to IN_PROGRESS
        await ctx.db.patch(args.bookingId, {
            status: "IN_PROGRESS",
        });
    },
});

/**
 * Handle driver completing a job
 */
export const handleDriverComplete = mutation({
    args: {
        bookingId: v.id("bookings"),
        driverId: v.id("drivers"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        // Update booking status to COMPLETED
        await ctx.db.patch(args.bookingId, {
            status: "COMPLETED",
        });

        // Update driver status back to AVAILABLE
        await ctx.db.patch(args.driverId, {
            status: "AVAILABLE",
        });
    },
});
