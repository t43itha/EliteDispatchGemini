/**
 * Stripe Webhook Handler
 *
 * Handles incoming Stripe webhook events to update payment status.
 * Critical for payment confirmation after Stripe Checkout.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Handle checkout.session.completed event
 * Updates booking payment status to PAID
 */
export const handleCheckoutCompleted = internalMutation({
    args: {
        sessionId: v.string(),
        paymentIntentId: v.optional(v.string()),
        paymentStatus: v.string(),
        customerEmail: v.optional(v.string()),
        metadata: v.optional(v.object({
            orgId: v.optional(v.string()),
            bookingId: v.optional(v.string()),
            customerName: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Find payment by checkout session ID
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_checkout_session", (q) =>
                q.eq("stripeCheckoutSessionId", args.sessionId)
            )
            .first();

        if (!payment) {
            // Try to find booking directly by checkout session
            const booking = await ctx.db
                .query("bookings")
                .withIndex("by_checkout_session", (q) =>
                    q.eq("stripeCheckoutSessionId", args.sessionId)
                )
                .first();

            if (booking && args.paymentStatus === "paid") {
                await ctx.db.patch(booking._id, {
                    paymentStatus: "PAID",
                    notes: booking.notes?.replace(/\s*\[Pending Payment\]\s*/g, "").trim() || undefined,
                });
                return { success: true, source: "booking_direct" };
            }

            console.log("No payment record found for session:", args.sessionId);
            return { success: false, reason: "Payment not found" };
        }

        // Idempotent: skip if already succeeded
        if (payment.status === "succeeded") {
            return { success: true, reason: "Already processed" };
        }

        // Only update if payment was successful
        if (args.paymentStatus !== "paid") {
            await ctx.db.patch(payment._id, {
                status: "failed",
                failureMessage: `Payment status: ${args.paymentStatus}`,
                updatedAt: now,
            });

            const booking = await ctx.db.get(payment.bookingId);
            if (booking) {
                await ctx.db.patch(booking._id, {
                    paymentStatus: "FAILED",
                });
            }

            return { success: true, paymentFailed: true };
        }

        // Update payment record
        await ctx.db.patch(payment._id, {
            status: "succeeded",
            stripePaymentIntentId: args.paymentIntentId,
            customerEmail: args.customerEmail || payment.customerEmail,
            updatedAt: now,
        });

        // Update booking
        const booking = await ctx.db.get(payment.bookingId);
        if (booking) {
            const cleanedNotes = booking.notes
                ?.replace(/\s*\[Pending Payment\]\s*/g, "")
                .trim() || undefined;

            await ctx.db.patch(booking._id, {
                paymentStatus: "PAID",
                notes: cleanedNotes,
            });
        }

        return { success: true, bookingId: payment.bookingId };
    },
});

/**
 * Handle checkout.session.expired event
 * Marks payment as failed
 */
export const handleCheckoutExpired = internalMutation({
    args: {
        sessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const payment = await ctx.db
            .query("payments")
            .withIndex("by_checkout_session", (q) =>
                q.eq("stripeCheckoutSessionId", args.sessionId)
            )
            .first();

        if (!payment) {
            return { success: false, reason: "Payment not found" };
        }

        // Don't override successful payments
        if (payment.status === "succeeded") {
            return { success: true, reason: "Already succeeded" };
        }

        await ctx.db.patch(payment._id, {
            status: "failed",
            failureCode: "expired",
            failureMessage: "Checkout session expired",
            updatedAt: now,
        });

        // Update booking
        const booking = await ctx.db.get(payment.bookingId);
        if (booking) {
            await ctx.db.patch(booking._id, {
                paymentStatus: "FAILED",
                notes: (booking.notes || "") + " [Checkout Expired]",
            });
        }

        return { success: true };
    },
});

/**
 * Handle account.updated event for Stripe Connect
 * Updates organization's Stripe account status
 */
export const handleAccountUpdated = internalMutation({
    args: {
        accountId: v.string(),
        chargesEnabled: v.boolean(),
        payoutsEnabled: v.boolean(),
        detailsSubmitted: v.boolean(),
        currentlyDue: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Find account by Stripe account ID
        const account = await ctx.db
            .query("stripeAccounts")
            .withIndex("by_stripe_account", (q) =>
                q.eq("stripeAccountId", args.accountId)
            )
            .first();

        if (!account) {
            console.log("No account found for:", args.accountId);
            return { success: false, reason: "Account not found" };
        }

        // Determine status
        let status = "pending";
        if (args.chargesEnabled && args.detailsSubmitted) {
            status = "active";
        } else if (args.detailsSubmitted) {
            status = "restricted";
        }

        // Update account
        await ctx.db.patch(account._id, {
            accountStatus: status,
            chargesEnabled: args.chargesEnabled,
            payoutsEnabled: args.payoutsEnabled,
            detailsSubmitted: args.detailsSubmitted,
            currentlyDue: args.currentlyDue,
            updatedAt: now,
        });

        // Also update organizations table
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", account.orgId))
            .first();

        if (org) {
            await ctx.db.patch(org._id, {
                stripeOnboardingComplete: args.chargesEnabled && args.detailsSubmitted,
            });
        }

        return { success: true };
    },
});

/**
 * Handle charge.refunded event
 * Updates payment and booking status for refunds
 */
export const handleRefundCreated = internalMutation({
    args: {
        paymentIntentId: v.string(),
        refundAmount: v.number(),
        totalAmount: v.number(),
        refundId: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Find payment by payment intent ID
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_payment_intent", (q) =>
                q.eq("stripePaymentIntentId", args.paymentIntentId)
            )
            .first();

        if (!payment) {
            console.log("No payment found for refund:", args.paymentIntentId);
            return { success: false, reason: "Payment not found" };
        }

        // Determine if partial or full refund
        const isFullRefund = args.refundAmount >= args.totalAmount;
        const newStatus = isFullRefund ? "refunded" : "succeeded";
        const refundedTotal = (payment.refundedAmount || 0) + args.refundAmount;

        await ctx.db.patch(payment._id, {
            status: newStatus,
            refundedAmount: refundedTotal,
            updatedAt: now,
        });

        // Update booking
        const booking = await ctx.db.get(payment.bookingId);
        if (booking) {
            await ctx.db.patch(booking._id, {
                paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
                notes: (booking.notes || "") + ` [Refund: £${(args.refundAmount / 100).toFixed(2)}]`,
            });
        }

        return { success: true, fullRefund: isFullRefund };
    },
});
