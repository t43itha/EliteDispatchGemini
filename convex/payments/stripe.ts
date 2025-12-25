/**
 * Stripe API wrapper for Convex actions
 *
 * This module provides Stripe client initialization and action wrappers
 * for all Stripe API calls. Uses Convex actions since Stripe requires
 * external HTTP calls.
 */

import Stripe from "stripe";
import { action } from "../_generated/server";
import { v } from "convex/values";

// Initialize Stripe client (lazy initialization)
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
    if (!stripeClient) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error("STRIPE_SECRET_KEY environment variable is not set");
        }
        stripeClient = new Stripe(secretKey, {
            apiVersion: "2025-11-17.clover",
            typescript: true,
        });
    }
    return stripeClient;
}

/**
 * Create a Stripe Connect Express account for an organization
 */
export const createConnectAccount = action({
    args: {
        orgId: v.string(),
        email: v.optional(v.string()),
        businessName: v.optional(v.string()),
    },
    handler: async (_, args) => {
        const stripe = getStripeClient();

        try {
            const account = await stripe.accounts.create({
                type: "express",
                country: "GB", // UK-based
                email: args.email,
                business_type: "company",
                company: args.businessName ? { name: args.businessName } : undefined,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    orgId: args.orgId,
                },
            });

            return {
                accountId: account.id,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
            };
        } catch (error: any) {
            console.error("Stripe createConnectAccount error:", error);
            throw new Error(`Failed to create Stripe account: ${error.message}`);
        }
    },
});

/**
 * Create an account link for Stripe Connect onboarding
 */
export const createAccountLink = action({
    args: {
        stripeAccountId: v.string(),
        refreshUrl: v.string(),
        returnUrl: v.string(),
    },
    handler: async (_, args) => {
        const stripe = getStripeClient();

        try {
            const accountLink = await stripe.accountLinks.create({
                account: args.stripeAccountId,
                refresh_url: args.refreshUrl,
                return_url: args.returnUrl,
                type: "account_onboarding",
            });

            return {
                url: accountLink.url,
                expiresAt: accountLink.expires_at,
            };
        } catch (error: any) {
            console.error("Stripe createAccountLink error:", error);
            throw new Error(`Failed to create account link: ${error.message}`);
        }
    },
});

/**
 * Retrieve a Stripe Connect account to check status
 */
export const retrieveAccount = action({
    args: {
        stripeAccountId: v.string(),
    },
    handler: async (_, args) => {
        const stripe = getStripeClient();

        try {
            const account = await stripe.accounts.retrieve(args.stripeAccountId);

            return {
                accountId: account.id,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                requirements: account.requirements ? {
                    currentlyDue: account.requirements.currently_due || [],
                    errors: account.requirements.errors?.map(e => ({
                        code: e.code,
                        reason: e.reason,
                        requirement: e.requirement,
                    })) || [],
                } : null,
            };
        } catch (error: any) {
            console.error("Stripe retrieveAccount error:", error);
            throw new Error(`Failed to retrieve account: ${error.message}`);
        }
    },
});

/**
 * Create a Stripe Checkout Session for widget payments
 * Charges go directly to the connected account (no platform fee)
 */
export const createStripeCheckoutSession = action({
    args: {
        stripeAccountId: v.string(),
        amount: v.number(), // In smallest currency unit (pence)
        currency: v.string(), // 'gbp', 'usd', etc.
        customerEmail: v.optional(v.string()),
        customerName: v.string(),
        description: v.string(),
        successUrl: v.string(),
        cancelUrl: v.string(),
        metadata: v.object({
            orgId: v.string(),
            bookingId: v.string(),
            vehicleClass: v.string(),
            pickup: v.string(),
            dropoff: v.string(),
        }),
    },
    handler: async (_, args) => {
        const stripe = getStripeClient();

        try {
            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: args.currency.toLowerCase(),
                            product_data: {
                                name: `Chauffeur Booking - ${args.metadata.vehicleClass}`,
                                description: args.description,
                            },
                            unit_amount: args.amount,
                        },
                        quantity: 1,
                    },
                ],
                customer_email: args.customerEmail,
                success_url: args.successUrl,
                cancel_url: args.cancelUrl,
                metadata: {
                    ...args.metadata,
                    customerName: args.customerName,
                },
            }, {
                stripeAccount: args.stripeAccountId, // Direct charge to connected account
            });

            return {
                sessionId: session.id,
                url: session.url,
            };
        } catch (error: any) {
            console.error("Stripe createCheckoutSession error:", error);
            throw new Error(`Failed to create checkout session: ${error.message}`);
        }
    },
});

/**
 * Create a reusable Payment Link for phone/WhatsApp bookings
 */
export const createPaymentLinkAction = action({
    args: {
        stripeAccountId: v.string(),
        amount: v.number(),
        currency: v.string(),
        productName: v.string(),
        productDescription: v.string(),
        metadata: v.object({
            orgId: v.string(),
            bookingId: v.string(),
        }),
    },
    handler: async (_, args) => {
        const stripe = getStripeClient();

        try {
            // First create a price
            const price = await stripe.prices.create({
                currency: args.currency.toLowerCase(),
                unit_amount: args.amount,
                product_data: {
                    name: args.productName,
                },
            }, {
                stripeAccount: args.stripeAccountId,
            });

            // Then create the payment link
            const paymentLink = await stripe.paymentLinks.create({
                line_items: [
                    {
                        price: price.id,
                        quantity: 1,
                    },
                ],
                metadata: args.metadata,
                after_completion: {
                    type: "redirect",
                    redirect: {
                        url: `${process.env.CONVEX_SITE_URL || "https://your-app.com"}/payment-success?booking=${args.metadata.bookingId}`,
                    },
                },
            }, {
                stripeAccount: args.stripeAccountId,
            });

            return {
                paymentLinkId: paymentLink.id,
                url: paymentLink.url,
            };
        } catch (error: any) {
            console.error("Stripe createPaymentLink error:", error);
            throw new Error(`Failed to create payment link: ${error.message}`);
        }
    },
});

/**
 * Retrieve a Checkout Session to verify payment status
 */
export const retrieveCheckoutSession = action({
    args: {
        stripeAccountId: v.string(),
        sessionId: v.string(),
    },
    handler: async (_, args) => {
        const stripe = getStripeClient();

        try {
            const session = await stripe.checkout.sessions.retrieve(
                args.sessionId,
                { expand: ["payment_intent"] },
                { stripeAccount: args.stripeAccountId }
            );

            return {
                id: session.id,
                status: session.status,
                paymentStatus: session.payment_status,
                paymentIntentId: typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : session.payment_intent?.id,
                customerEmail: session.customer_email,
                amountTotal: session.amount_total,
                currency: session.currency,
                metadata: session.metadata,
            };
        } catch (error: any) {
            console.error("Stripe retrieveCheckoutSession error:", error);
            throw new Error(`Failed to retrieve checkout session: ${error.message}`);
        }
    },
});

/**
 * Create a refund for a payment
 */
export const createRefund = action({
    args: {
        stripeAccountId: v.string(),
        paymentIntentId: v.string(),
        amount: v.optional(v.number()), // Partial refund amount, or full refund if not specified
        reason: v.optional(v.union(
            v.literal("duplicate"),
            v.literal("fraudulent"),
            v.literal("requested_by_customer")
        )),
    },
    handler: async (_, args) => {
        const stripe = getStripeClient();

        try {
            const refund = await stripe.refunds.create({
                payment_intent: args.paymentIntentId,
                amount: args.amount,
                reason: args.reason,
            }, {
                stripeAccount: args.stripeAccountId,
            });

            return {
                refundId: refund.id,
                amount: refund.amount,
                status: refund.status,
                currency: refund.currency,
            };
        } catch (error: any) {
            console.error("Stripe createRefund error:", error);
            throw new Error(`Failed to create refund: ${error.message}`);
        }
    },
});

/**
 * Construct and verify a Stripe webhook event
 * Returns the verified event or throws if signature is invalid
 */
export function constructWebhookEvent(
    payload: string,
    signature: string,
    webhookSecret: string
): Stripe.Event {
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
