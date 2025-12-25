/**
 * Refunds Module
 *
 * Handles refund processing for payments.
 * Supports full and partial refunds through Stripe.
 */

import { mutation, query, action } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../lib/auth";
import { api, internal } from "../_generated/api";

/**
 * Get refund eligibility for a booking
 */
export const getRefundEligibility = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.orgId !== auth.orgId) {
            return { canRefund: false, reason: "Booking not found" };
        }

        // Get payment record
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
            .first();

        if (!payment) {
            return { canRefund: false, reason: "No payment found" };
        }

        if (payment.status !== "succeeded") {
            return { canRefund: false, reason: `Payment status: ${payment.status}` };
        }

        if (!payment.stripePaymentIntentId) {
            return { canRefund: false, reason: "No payment intent ID" };
        }

        const refundedAmount = payment.refundedAmount || 0;
        const remainingAmount = payment.amount - refundedAmount;

        if (remainingAmount <= 0) {
            return { canRefund: false, reason: "Already fully refunded" };
        }

        return {
            canRefund: true,
            payment: {
                id: payment._id,
                amount: payment.amount,
                refundedAmount,
                remainingAmount,
                currency: payment.currency,
                paymentIntentId: payment.stripePaymentIntentId,
            },
        };
    },
});

/**
 * Issue a refund for a payment
 */
export const issueRefund = action({
    args: {
        bookingId: v.id("bookings"),
        amount: v.optional(v.number()), // If not provided, full refund
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Validate and get payment info
        const result = await ctx.runMutation(internal.payments.refunds.validateRefund, {
            bookingId: args.bookingId,
            amount: args.amount,
        });

        if (!result.success) {
            throw new Error(result.error || "Cannot process refund");
        }

        const { paymentIntentId, stripeAccountId, refundAmount, currency } = result;

        // Create refund in Stripe (map reason to Stripe format)
        const stripeReason = args.reason === "duplicate" || args.reason === "fraudulent"
            ? args.reason
            : "requested_by_customer";

        const refundResult = await ctx.runAction(api.payments.stripe.createRefund, {
            paymentIntentId,
            stripeAccountId,
            amount: refundAmount,
            reason: stripeReason,
        });

        // Record refund in database
        await ctx.runMutation(internal.payments.refunds.recordRefund, {
            bookingId: args.bookingId,
            stripeRefundId: refundResult.refundId,
            amount: refundAmount,
            reason: args.reason,
            initiatedBy: result.userId,
        });

        return {
            success: true,
            refundId: refundResult.refundId,
            amount: refundAmount,
            currency,
        };
    },
});

/**
 * Internal: Validate refund request
 */
export const validateRefund = mutation({
    args: {
        bookingId: v.id("bookings"),
        amount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.orgId !== auth.orgId) {
            return { success: false, error: "Booking not found" };
        }

        // Get payment
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
            .first();

        if (!payment || payment.status !== "succeeded") {
            return { success: false, error: "No successful payment found" };
        }

        if (!payment.stripePaymentIntentId) {
            return { success: false, error: "Payment cannot be refunded" };
        }

        const refundedAmount = payment.refundedAmount || 0;
        const remainingAmount = payment.amount - refundedAmount;

        if (remainingAmount <= 0) {
            return { success: false, error: "Payment already fully refunded" };
        }

        // Calculate refund amount
        const refundAmount = args.amount
            ? Math.min(args.amount, remainingAmount)
            : remainingAmount;

        if (refundAmount <= 0) {
            return { success: false, error: "Invalid refund amount" };
        }

        // Get Stripe account
        const stripeAccount = await ctx.db
            .query("stripeAccounts")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .first();

        let stripeAccountId = stripeAccount?.stripeAccountId;

        if (!stripeAccountId) {
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", auth.orgId))
                .first();
            stripeAccountId = org?.stripeAccountId;
        }

        if (!stripeAccountId) {
            return { success: false, error: "Stripe account not found" };
        }

        return {
            success: true,
            paymentIntentId: payment.stripePaymentIntentId,
            stripeAccountId,
            refundAmount,
            currency: payment.currency,
            userId: auth.userId,
        };
    },
});

/**
 * Internal: Record refund in database
 */
export const recordRefund = mutation({
    args: {
        bookingId: v.id("bookings"),
        stripeRefundId: v.string(),
        amount: v.number(),
        reason: v.optional(v.string()),
        initiatedBy: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Update payment record
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
            .first();

        if (payment) {
            const newRefundedAmount = (payment.refundedAmount || 0) + args.amount;
            const isFullRefund = newRefundedAmount >= payment.amount;

            await ctx.db.patch(payment._id, {
                status: isFullRefund ? "refunded" : "succeeded",
                refundedAmount: newRefundedAmount,
                updatedAt: now,
            });

            // Update booking
            const booking = await ctx.db.get(args.bookingId);
            if (booking) {
                const reasonNote = args.reason ? ` (${args.reason})` : "";
                await ctx.db.patch(args.bookingId, {
                    paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
                    notes: (booking.notes || "") + ` [Refund: £${(args.amount / 100).toFixed(2)}${reasonNote}]`,
                });
            }
        }

        return { success: true };
    },
});

/**
 * Get refund history for a booking
 */
export const getRefundHistory = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.orgId !== auth.orgId) {
            return [];
        }

        const payment = await ctx.db
            .query("payments")
            .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
            .first();

        if (!payment) {
            return [];
        }

        // Return payment info with refund details
        return {
            paymentId: payment._id,
            originalAmount: payment.amount,
            refundedAmount: payment.refundedAmount || 0,
            currency: payment.currency,
            status: payment.status,
        };
    },
});
