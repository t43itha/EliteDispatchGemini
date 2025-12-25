"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

// Twilio API base URL
const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

// WhatsApp message types for logging
export const MessageTypes = {
    BOOKING_CONFIRM: "BOOKING_CONFIRM",
    DRIVER_DISPATCH: "DRIVER_DISPATCH",
    DRIVER_ACCEPT: "DRIVER_ACCEPT",
    DRIVER_DECLINE: "DRIVER_DECLINE",
    DRIVER_START: "DRIVER_START",
    DRIVER_COMPLETE: "DRIVER_COMPLETE",
    CUSTOMER_DRIVER_ASSIGNED: "CUSTOMER_DRIVER_ASSIGNED",
    CUSTOMER_EN_ROUTE: "CUSTOMER_EN_ROUTE",
    CUSTOMER_COMPLETE: "CUSTOMER_COMPLETE",
    INBOUND: "INBOUND",
} as const;

// Message status types
export const MessageStatus = {
    QUEUED: "QUEUED",
    SENT: "SENT",
    DELIVERED: "DELIVERED",
    READ: "READ",
    FAILED: "FAILED",
} as const;

// Conversation states for driver interactions
export const ConversationState = {
    IDLE: "IDLE",
    AWAITING_ACCEPT: "AWAITING_ACCEPT",
    AWAITING_START: "AWAITING_START",
    IN_PROGRESS: "IN_PROGRESS",
} as const;

interface TwilioConfig {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
}

interface SendMessageResult {
    success: boolean;
    messageSid?: string;
    error?: string;
}

/**
 * Formats a phone number for WhatsApp (adds whatsapp: prefix)
 */
export function formatWhatsAppNumber(phone: string): string {
    // Remove any existing whatsapp: prefix
    let cleaned = phone.replace(/^whatsapp:/, "");
    // Remove spaces, dashes, parentheses
    cleaned = cleaned.replace(/[\s\-\(\)]/g, "");
    // Ensure it starts with +
    if (!cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
    }
    return `whatsapp:${cleaned}`;
}

/**
 * Sends a WhatsApp message via Twilio API
 */
export const sendWhatsAppMessage = action({
    args: {
        to: v.string(),
        body: v.string(),
        orgId: v.string(),
        bookingId: v.optional(v.id("bookings")),
        driverId: v.optional(v.id("drivers")),
        messageType: v.string(),
    },
    handler: async (ctx, args): Promise<SendMessageResult> => {
        // Get org's WhatsApp config
        const config = await ctx.runQuery(api.whatsapp.config.getConfig, {
            orgId: args.orgId,
        });

        if (!config || !config.enabled) {
            return {
                success: false,
                error: "WhatsApp not configured or disabled for this organization",
            };
        }

        const twilioConfig: TwilioConfig = {
            accountSid: config.twilioAccountSid,
            authToken: config.twilioAuthToken,
            phoneNumber: config.twilioPhoneNumber,
        };

        try {
            // Format phone numbers for WhatsApp
            const fromNumber = formatWhatsAppNumber(twilioConfig.phoneNumber);
            const toNumber = formatWhatsAppNumber(args.to);

            // Build the API URL
            const url = `${TWILIO_API_BASE}/Accounts/${twilioConfig.accountSid}/Messages.json`;

            // Create form data
            const formData = new URLSearchParams();
            formData.append("To", toNumber);
            formData.append("From", fromNumber);
            formData.append("Body", args.body);

            // Make the API request
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            });

            const result = await response.json();

            if (!response.ok) {
                // Log failed message
                await ctx.runMutation(api.whatsapp.config.logMessage, {
                    orgId: args.orgId,
                    bookingId: args.bookingId,
                    driverId: args.driverId,
                    direction: "outbound",
                    recipientPhone: args.to,
                    messageType: args.messageType,
                    content: args.body,
                    status: MessageStatus.FAILED,
                    errorMessage: result.message || "Failed to send message",
                });

                return {
                    success: false,
                    error: result.message || "Failed to send WhatsApp message",
                };
            }

            // Log successful message
            await ctx.runMutation(api.whatsapp.config.logMessage, {
                orgId: args.orgId,
                bookingId: args.bookingId,
                driverId: args.driverId,
                direction: "outbound",
                recipientPhone: args.to,
                messageType: args.messageType,
                content: args.body,
                twilioSid: result.sid,
                status: MessageStatus.QUEUED,
            });

            return {
                success: true,
                messageSid: result.sid,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            // Log error
            await ctx.runMutation(api.whatsapp.config.logMessage, {
                orgId: args.orgId,
                bookingId: args.bookingId,
                driverId: args.driverId,
                direction: "outbound",
                recipientPhone: args.to,
                messageType: args.messageType,
                content: args.body,
                status: MessageStatus.FAILED,
                errorMessage,
            });

            return {
                success: false,
                error: errorMessage,
            };
        }
    },
});

/**
 * Validates a Twilio webhook signature
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioSignature(
    authToken: string,
    signature: string,
    url: string,
    params: Record<string, string>
): boolean {
    // Import crypto for HMAC
    const crypto = require("crypto");

    // Sort parameters and concatenate
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => key + params[key])
        .join("");

    // Create the string to sign
    const stringToSign = url + sortedParams;

    // Calculate HMAC-SHA1
    const hmac = crypto.createHmac("sha1", authToken);
    hmac.update(stringToSign);
    const calculatedSignature = hmac.digest("base64");

    // Compare signatures (timing-safe comparison)
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(calculatedSignature)
        );
    } catch {
        return false;
    }
}

/**
 * Test WhatsApp connection by sending a test message
 */
export const testConnection = action({
    args: {
        orgId: v.string(),
        testPhone: v.string(),
    },
    handler: async (ctx, args): Promise<SendMessageResult> => {
        return await ctx.runAction(api.whatsapp.twilio.sendWhatsAppMessage, {
            to: args.testPhone,
            body: "This is a test message from EliteDispatch. Your WhatsApp integration is working correctly!",
            orgId: args.orgId,
            messageType: "TEST",
        });
    },
});
