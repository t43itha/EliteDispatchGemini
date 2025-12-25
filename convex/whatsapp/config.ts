import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../lib/auth";

/**
 * Get WhatsApp configuration for an organization
 */
export const getConfig = query({
    args: {
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const config = await ctx.db
            .query("whatsappConfig")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .first();

        return config;
    },
});

/**
 * Get WhatsApp configuration for authenticated user's org (safe version)
 */
export const getMyConfig = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const orgId = identity.org_id as string | undefined;
        if (!orgId) return null;

        const config = await ctx.db
            .query("whatsappConfig")
            .withIndex("by_org", (q) => q.eq("orgId", orgId))
            .first();

        // Don't expose auth token to client - return masked version
        if (config) {
            return {
                ...config,
                twilioAuthToken: config.twilioAuthToken ? "••••••••" : "",
            };
        }

        return null;
    },
});

/**
 * Save or update WhatsApp configuration (admin only)
 */
export const saveConfig = mutation({
    args: {
        twilioAccountSid: v.string(),
        twilioAuthToken: v.string(),
        twilioPhoneNumber: v.string(),
        enabled: v.boolean(),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        // Check if config already exists
        const existing = await ctx.db
            .query("whatsappConfig")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .first();

        const now = Date.now();

        if (existing) {
            // Update existing config
            // Only update auth token if a new one was provided (not masked)
            const updateData: Record<string, unknown> = {
                twilioAccountSid: args.twilioAccountSid,
                twilioPhoneNumber: args.twilioPhoneNumber,
                enabled: args.enabled,
                updatedAt: now,
            };

            // Only update token if it's not the masked placeholder
            if (args.twilioAuthToken && !args.twilioAuthToken.includes("•")) {
                updateData.twilioAuthToken = args.twilioAuthToken;
            }

            await ctx.db.patch(existing._id, updateData);
            return existing._id;
        } else {
            // Create new config
            return await ctx.db.insert("whatsappConfig", {
                orgId: auth.orgId,
                twilioAccountSid: args.twilioAccountSid,
                twilioAuthToken: args.twilioAuthToken,
                twilioPhoneNumber: args.twilioPhoneNumber,
                enabled: args.enabled,
                createdAt: now,
                updatedAt: now,
            });
        }
    },
});

/**
 * Toggle WhatsApp enabled/disabled
 */
export const toggleEnabled = mutation({
    args: {
        enabled: v.boolean(),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const config = await ctx.db
            .query("whatsappConfig")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .first();

        if (!config) {
            throw new Error("WhatsApp not configured");
        }

        await ctx.db.patch(config._id, {
            enabled: args.enabled,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Log a WhatsApp message (internal use)
 */
export const logMessage = mutation({
    args: {
        orgId: v.string(),
        bookingId: v.optional(v.id("bookings")),
        driverId: v.optional(v.id("drivers")),
        direction: v.union(v.literal("outbound"), v.literal("inbound")),
        recipientPhone: v.string(),
        messageType: v.string(),
        content: v.string(),
        twilioSid: v.optional(v.string()),
        status: v.string(),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        return await ctx.db.insert("whatsappMessages", {
            orgId: args.orgId,
            bookingId: args.bookingId,
            driverId: args.driverId,
            direction: args.direction,
            recipientPhone: args.recipientPhone,
            messageType: args.messageType,
            content: args.content,
            twilioSid: args.twilioSid,
            status: args.status,
            errorMessage: args.errorMessage,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Update message status (for webhook callbacks)
 */
export const updateMessageStatus = mutation({
    args: {
        twilioSid: v.string(),
        status: v.string(),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db
            .query("whatsappMessages")
            .withIndex("by_twilio_sid", (q) => q.eq("twilioSid", args.twilioSid))
            .first();

        if (message) {
            await ctx.db.patch(message._id, {
                status: args.status,
                errorMessage: args.errorMessage,
                updatedAt: Date.now(),
            });
        }
    },
});

/**
 * Get message history for an organization
 */
export const getMessageHistory = query({
    args: {
        limit: v.optional(v.number()),
        bookingId: v.optional(v.id("bookings")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const orgId = identity.org_id as string | undefined;
        if (!orgId) return [];

        let query = ctx.db
            .query("whatsappMessages")
            .withIndex("by_org", (q) => q.eq("orgId", orgId))
            .order("desc");

        const messages = await query.collect();

        // Filter by booking if specified
        let filtered = messages;
        if (args.bookingId) {
            filtered = messages.filter((m) => m.bookingId === args.bookingId);
        }

        // Apply limit
        const limit = args.limit || 100;
        return filtered.slice(0, limit);
    },
});

/**
 * Get messages for a specific booking
 */
export const getBookingMessages = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const messages = await ctx.db
            .query("whatsappMessages")
            .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
            .order("desc")
            .collect();

        return messages;
    },
});
