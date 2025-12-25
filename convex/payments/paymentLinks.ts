/**
 * Payment Links Module
 *
 * Handles creating and managing Stripe Payment Links for existing bookings.
 * Used when dispatchers need to collect payment for phone/WhatsApp bookings.
 */

import { mutation, query, action } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../lib/auth";
import { api, internal } from "../_generated/api";

/**
 * Create a payment link for an existing booking
 */
export const createPaymentLink = action({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        // Get booking and verify access
        const result = await ctx.runMutation(internal.payments.paymentLinks.validateAndPreparePaymentLink, {
            bookingId: args.bookingId,
        });

        if (!result.success) {
            throw new Error(result.error || "Cannot create payment link");
        }

        const { booking, stripeAccountId, orgId, createdBy } = result;

        // Create Stripe Payment Link
        const linkResult = await ctx.runAction(api.payments.stripe.createPaymentLinkAction, {
            stripeAccountId,
            amount: booking.price,
            currency: booking.currency || "gbp",
            productName: `Chauffeur Booking - ${booking.vehicleClass || "Standard"}`,
            productDescription: `${booking.pickupLocation} → ${booking.dropoffLocation}`,
            metadata: {
                orgId,
                bookingId: args.bookingId,
            },
        });

        // Save payment link to database
        await ctx.runMutation(internal.payments.paymentLinks.savePaymentLink, {
            orgId,
            bookingId: args.bookingId,
            stripePaymentLinkId: linkResult.paymentLinkId,
            url: linkResult.url,
            amount: booking.price,
            currency: booking.currency || "gbp",
            createdBy,
        });

        // Update booking to track that a link was created
        await ctx.runMutation(internal.payments.paymentLinks.updateBookingWithLink, {
            bookingId: args.bookingId,
        });

        return {
            url: linkResult.url,
            paymentLinkId: linkResult.paymentLinkId,
        };
    },
});

/**
 * Internal mutation to validate booking and get Stripe account
 */
export const validateAndPreparePaymentLink = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin", "dispatcher"]);

        // Get booking
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            return { success: false, error: "Booking not found" };
        }

        // Verify booking belongs to user's org
        if (booking.orgId !== auth.orgId) {
            return { success: false, error: "Access denied" };
        }

        // Check booking isn't already paid
        if (booking.paymentStatus === "PAID") {
            return { success: false, error: "Booking is already paid" };
        }

        // Get Stripe account
        const stripeAccount = await ctx.db
            .query("stripeAccounts")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .first();

        if (!stripeAccount || !stripeAccount.chargesEnabled) {
            // Check legacy field on organizations
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", auth.orgId))
                .first();

            if (!org?.stripeAccountId || !org?.stripeOnboardingComplete) {
                return { success: false, error: "Please connect your Stripe account first" };
            }

            return {
                success: true,
                booking: {
                    price: booking.price,
                    currency: booking.currency,
                    vehicleClass: booking.vehicleClass,
                    pickupLocation: booking.pickupLocation,
                    dropoffLocation: booking.dropoffLocation,
                },
                stripeAccountId: org.stripeAccountId,
                orgId: auth.orgId,
                createdBy: auth.userId,
            };
        }

        return {
            success: true,
            booking: {
                price: booking.price,
                currency: booking.currency,
                vehicleClass: booking.vehicleClass,
                pickupLocation: booking.pickupLocation,
                dropoffLocation: booking.dropoffLocation,
            },
            stripeAccountId: stripeAccount.stripeAccountId,
            orgId: auth.orgId,
            createdBy: auth.userId,
        };
    },
});

/**
 * Internal mutation to save payment link
 */
export const savePaymentLink = mutation({
    args: {
        orgId: v.string(),
        bookingId: v.id("bookings"),
        stripePaymentLinkId: v.string(),
        url: v.string(),
        amount: v.number(),
        currency: v.string(),
        createdBy: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("paymentLinks", {
            orgId: args.orgId,
            bookingId: args.bookingId,
            stripePaymentLinkId: args.stripePaymentLinkId,
            url: args.url,
            amount: args.amount,
            currency: args.currency,
            active: true,
            createdBy: args.createdBy,
            createdAt: Date.now(),
        });
    },
});

/**
 * Internal mutation to update booking with payment link info
 */
export const updateBookingWithLink = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (booking) {
            const currentNotes = booking.notes || "";
            await ctx.db.patch(args.bookingId, {
                notes: currentNotes.includes("[Payment Link Sent]")
                    ? currentNotes
                    : `${currentNotes} [Payment Link Sent]`.trim(),
            });
        }
    },
});

/**
 * Get payment links for a booking
 */
export const getPaymentLinksForBooking = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        // Verify booking belongs to org
        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.orgId !== auth.orgId) {
            return [];
        }

        return await ctx.db
            .query("paymentLinks")
            .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
            .collect();
    },
});

/**
 * Deactivate a payment link
 */
export const deactivateLink = mutation({
    args: {
        linkId: v.id("paymentLinks"),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const link = await ctx.db.get(args.linkId);
        if (!link || link.orgId !== auth.orgId) {
            throw new Error("Payment link not found");
        }

        await ctx.db.patch(args.linkId, {
            active: false,
        });

        return { success: true };
    },
});

/**
 * Check if a booking can have a payment link created
 */
export const canCreatePaymentLink = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.orgId !== auth.orgId) {
            return { canCreate: false, reason: "Booking not found" };
        }

        if (booking.paymentStatus === "PAID") {
            return { canCreate: false, reason: "Already paid" };
        }

        // Check for Stripe account
        const stripeAccount = await ctx.db
            .query("stripeAccounts")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .first();

        if (!stripeAccount?.chargesEnabled) {
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", auth.orgId))
                .first();

            if (!org?.stripeAccountId || !org?.stripeOnboardingComplete) {
                return { canCreate: false, reason: "Stripe not connected" };
            }
        }

        return { canCreate: true };
    },
});
