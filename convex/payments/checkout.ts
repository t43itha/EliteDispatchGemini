/**
 * Widget Checkout Flow
 *
 * Handles the checkout process for booking widget payments.
 * Creates Stripe Checkout sessions and processes successful payments.
 */

import { action, mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

/**
 * Create a checkout session for a widget booking
 * This is a public action (no auth required) for the booking widget
 */
export const createCheckoutSession = action({
    args: {
        orgId: v.string(),
        // Booking details
        customerName: v.string(),
        customerPhone: v.string(),
        customerEmail: v.optional(v.string()),
        pickupLocation: v.string(),
        dropoffLocation: v.string(),
        pickupTime: v.string(),
        passengers: v.number(),
        vehicleClass: v.string(),
        notes: v.optional(v.string()),
        distance: v.optional(v.string()),
        duration: v.optional(v.string()),
        isReturn: v.optional(v.boolean()),
        // Price from client (will be validated server-side)
        clientPrice: v.number(),
        // URLs for redirect
        successUrl: v.string(),
        cancelUrl: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Get organization and verify it has Stripe connected
        const org = await ctx.runQuery(api.payments.checkout.getOrgForCheckout, {
            orgId: args.orgId,
        });

        if (!org) {
            throw new Error("Organization not found");
        }

        if (!org.stripeAccountId) {
            throw new Error("This organization hasn't set up payments yet");
        }

        if (!org.chargesEnabled) {
            throw new Error("This organization cannot accept payments yet");
        }

        // 2. Validate price server-side
        const priceResult = await ctx.runMutation(internal.payments.pricing.validatePrice, {
            orgId: args.orgId,
            vehicleClass: args.vehicleClass,
            distance: parseFloat(args.distance?.replace(/[^\d.]/g, "") || "0"),
            clientPrice: args.clientPrice,
            tolerance: 100, // Allow £1 tolerance for rounding
        });

        if (!priceResult.valid) {
            console.error("Price validation failed:", priceResult.reason);
            throw new Error("Price validation failed. Please refresh and try again.");
        }

        // Use server-validated price
        const validatedPrice = priceResult.serverPrice;
        const currency = priceResult.currency || "gbp";

        // 3. Create pending booking in database
        const bookingId = await ctx.runMutation(internal.payments.checkout.createPendingBooking, {
            orgId: args.orgId,
            customerName: args.customerName,
            customerPhone: args.customerPhone,
            customerEmail: args.customerEmail,
            pickupLocation: args.pickupLocation,
            dropoffLocation: args.dropoffLocation,
            pickupTime: args.pickupTime,
            passengers: args.passengers,
            vehicleClass: args.vehicleClass,
            notes: args.notes,
            distance: args.distance,
            duration: args.duration,
            isReturn: args.isReturn,
            price: validatedPrice,
            currency,
        });

        // 4. Create Stripe Checkout session
        const description = `${args.pickupLocation} → ${args.dropoffLocation}`;

        const session = await ctx.runAction(api.payments.stripe.createStripeCheckoutSession, {
            stripeAccountId: org.stripeAccountId,
            amount: validatedPrice,
            currency,
            customerEmail: args.customerEmail,
            customerName: args.customerName,
            description,
            successUrl: `${args.successUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
            cancelUrl: `${args.cancelUrl}?booking_id=${bookingId}`,
            metadata: {
                orgId: args.orgId,
                bookingId,
                vehicleClass: args.vehicleClass,
                pickup: args.pickupLocation.substring(0, 100), // Limit length
                dropoff: args.dropoffLocation.substring(0, 100),
            },
        });

        // 5. Update booking with checkout session ID
        await ctx.runMutation(internal.payments.checkout.updateBookingCheckoutSession, {
            bookingId,
            checkoutSessionId: session.sessionId,
        });

        // 6. Create payment record
        await ctx.runMutation(internal.payments.checkout.createPaymentRecord, {
            orgId: args.orgId,
            bookingId,
            checkoutSessionId: session.sessionId,
            amount: validatedPrice,
            currency,
            customerEmail: args.customerEmail,
            customerName: args.customerName,
            customerPhone: args.customerPhone,
        });

        return {
            checkoutUrl: session.url,
            sessionId: session.sessionId,
            bookingId,
        };
    },
});

/**
 * Get organization info for checkout (public query)
 */
export const getOrgForCheckout = query({
    args: {
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        // Get org
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.orgId))
            .first();

        if (!org) {
            return null;
        }

        // Get Stripe account status
        const stripeAccount = await ctx.db
            .query("stripeAccounts")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .first();

        return {
            orgId: org.clerkOrgId,
            name: org.name,
            stripeAccountId: stripeAccount?.stripeAccountId || org.stripeAccountId,
            chargesEnabled: stripeAccount?.chargesEnabled || org.stripeOnboardingComplete || false,
        };
    },
});

/**
 * Internal mutation to create a pending booking
 */
export const createPendingBooking = internalMutation({
    args: {
        orgId: v.string(),
        customerName: v.string(),
        customerPhone: v.string(),
        customerEmail: v.optional(v.string()),
        pickupLocation: v.string(),
        dropoffLocation: v.string(),
        pickupTime: v.string(),
        passengers: v.number(),
        vehicleClass: v.string(),
        notes: v.optional(v.string()),
        distance: v.optional(v.string()),
        duration: v.optional(v.string()),
        isReturn: v.optional(v.boolean()),
        price: v.number(),
        currency: v.string(),
    },
    handler: async (ctx, args) => {
        const bookingId = await ctx.db.insert("bookings", {
            orgId: args.orgId,
            customerName: args.customerName,
            customerPhone: args.customerPhone,
            customerEmail: args.customerEmail,
            pickupLocation: args.pickupLocation,
            dropoffLocation: args.dropoffLocation,
            pickupTime: args.pickupTime,
            passengers: args.passengers,
            vehicleClass: args.vehicleClass,
            notes: args.notes ? `${args.notes} [Pending Payment]` : "[Pending Payment]",
            distance: args.distance,
            duration: args.duration,
            isReturn: args.isReturn,
            price: args.price,
            currency: args.currency,
            status: "PENDING",
            paymentStatus: "PROCESSING",
            priceValidated: true,
        });

        return bookingId;
    },
});

/**
 * Internal mutation to update booking with checkout session ID
 */
export const updateBookingCheckoutSession = internalMutation({
    args: {
        bookingId: v.string(),
        checkoutSessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db
            .query("bookings")
            .filter((q) => q.eq(q.field("_id"), args.bookingId))
            .first();

        if (booking) {
            await ctx.db.patch(booking._id, {
                stripeCheckoutSessionId: args.checkoutSessionId,
            });
        }
    },
});

/**
 * Internal mutation to create a payment record
 */
export const createPaymentRecord = internalMutation({
    args: {
        orgId: v.string(),
        bookingId: v.string(),
        checkoutSessionId: v.string(),
        amount: v.number(),
        currency: v.string(),
        customerEmail: v.optional(v.string()),
        customerName: v.string(),
        customerPhone: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Find booking to get the ID
        const booking = await ctx.db
            .query("bookings")
            .filter((q) => q.eq(q.field("_id"), args.bookingId))
            .first();

        if (!booking) {
            throw new Error("Booking not found");
        }

        await ctx.db.insert("payments", {
            orgId: args.orgId,
            bookingId: booking._id,
            stripeCheckoutSessionId: args.checkoutSessionId,
            amount: args.amount,
            currency: args.currency,
            status: "pending",
            source: "widget",
            customerEmail: args.customerEmail,
            metadata: {
                customerName: args.customerName,
                customerPhone: args.customerPhone,
            },
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Handle successful checkout completion (called by webhook)
 */
export const handleCheckoutSuccess = internalMutation({
    args: {
        checkoutSessionId: v.string(),
        paymentIntentId: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
        customerEmail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Find payment by checkout session
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_checkout_session", (q) =>
                q.eq("stripeCheckoutSessionId", args.checkoutSessionId)
            )
            .first();

        if (!payment) {
            console.error("Payment not found for checkout session:", args.checkoutSessionId);
            return { success: false, reason: "Payment record not found" };
        }

        // Idempotent: skip if already succeeded
        if (payment.status === "succeeded") {
            return { success: true, reason: "Already processed" };
        }

        // Update payment record
        await ctx.db.patch(payment._id, {
            status: "succeeded",
            stripePaymentIntentId: args.paymentIntentId,
            paymentMethod: args.paymentMethod,
            customerEmail: args.customerEmail || payment.customerEmail,
            updatedAt: now,
        });

        // Update booking
        const booking = await ctx.db.get(payment.bookingId);
        if (booking) {
            // Remove "[Pending Payment]" from notes
            const cleanedNotes = booking.notes?.replace(/\s*\[Pending Payment\]\s*/g, "").trim() || undefined;

            await ctx.db.patch(booking._id, {
                paymentStatus: "PAID",
                notes: cleanedNotes || undefined,
            });
        }

        return { success: true, bookingId: payment.bookingId };
    },
});

/**
 * Handle checkout cancellation or expiration
 */
export const handleCheckoutCancelled = internalMutation({
    args: {
        checkoutSessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Find payment by checkout session
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_checkout_session", (q) =>
                q.eq("stripeCheckoutSessionId", args.checkoutSessionId)
            )
            .first();

        if (!payment) {
            return { success: false, reason: "Payment record not found" };
        }

        // Update payment record
        await ctx.db.patch(payment._id, {
            status: "failed",
            failureCode: "cancelled",
            failureMessage: "Checkout was cancelled or expired",
            updatedAt: now,
        });

        // Update booking
        const booking = await ctx.db.get(payment.bookingId);
        if (booking) {
            await ctx.db.patch(booking._id, {
                paymentStatus: "FAILED",
                notes: (booking.notes || "") + " [Payment Cancelled]",
            });
        }

        return { success: true };
    },
});

/**
 * Get booking status after checkout (public query for success page)
 */
export const getBookingStatus = query({
    args: {
        bookingId: v.string(),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db
            .query("bookings")
            .filter((q) => q.eq(q.field("_id"), args.bookingId))
            .first();

        if (!booking) {
            return null;
        }

        // Get org name
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", booking.orgId))
            .first();

        return {
            bookingId: booking._id,
            customerName: booking.customerName,
            pickupLocation: booking.pickupLocation,
            dropoffLocation: booking.dropoffLocation,
            pickupTime: booking.pickupTime,
            vehicleClass: booking.vehicleClass,
            price: booking.price,
            currency: booking.currency || "gbp",
            paymentStatus: booking.paymentStatus,
            status: booking.status,
            companyName: org?.name || "Your Chauffeur",
        };
    },
});
