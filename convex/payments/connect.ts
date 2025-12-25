/**
 * Stripe Connect onboarding module
 *
 * Handles the onboarding flow for connecting an organization's
 * Stripe account to receive payments directly.
 */

import { mutation, query, action, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../lib/auth";
import { api, internal } from "../_generated/api";

/**
 * Start Stripe Connect onboarding for the current organization
 * Creates a Connect Express account and returns an onboarding link
 */
export const startOnboarding = action({
    args: {
        refreshUrl: v.string(), // URL to redirect if link expires
        returnUrl: v.string(), // URL after completing onboarding
    },
    handler: async (ctx, args) => {
        // Check if account already exists
        const existingAccount = await ctx.runQuery(api.payments.connect.getAccountStatus);

        let stripeAccountId: string;

        if (existingAccount && existingAccount.stripeAccountId) {
            // Account exists, just create a new link
            stripeAccountId = existingAccount.stripeAccountId;
        } else {
            // Get org info for account creation
            const orgInfo = await ctx.runQuery(api.payments.connect.getOrgInfo);
            if (!orgInfo) {
                throw new Error("Organization not found");
            }

            // Create new Stripe Connect account
            const accountResult = await ctx.runAction(api.payments.stripe.createConnectAccount, {
                orgId: orgInfo.orgId,
                email: orgInfo.email || undefined,
                businessName: orgInfo.name,
            });

            stripeAccountId = accountResult.accountId;

            // Save account to database
            await ctx.runMutation(internal.payments.connect.saveStripeAccount, {
                orgId: orgInfo.orgId,
                stripeAccountId: accountResult.accountId,
                chargesEnabled: accountResult.chargesEnabled,
                payoutsEnabled: accountResult.payoutsEnabled,
                detailsSubmitted: accountResult.detailsSubmitted,
            });
        }

        // Create onboarding link
        const linkResult = await ctx.runAction(api.payments.stripe.createAccountLink, {
            stripeAccountId,
            refreshUrl: args.refreshUrl,
            returnUrl: args.returnUrl,
        });

        return {
            onboardingUrl: linkResult.url,
            expiresAt: linkResult.expiresAt,
        };
    },
});

/**
 * Refresh the Stripe Connect account status from Stripe API
 * Call this after user returns from onboarding
 */
export const refreshAccountStatus = action({
    args: {},
    handler: async (ctx) => {
        // Get current account
        const account = await ctx.runQuery(api.payments.connect.getAccountStatus);

        if (!account || !account.stripeAccountId) {
            return { updated: false, reason: "No Stripe account found" };
        }

        // Fetch latest from Stripe
        const stripeAccount = await ctx.runAction(api.payments.stripe.retrieveAccount, {
            stripeAccountId: account.stripeAccountId,
        });

        // Update in database
        await ctx.runMutation(internal.payments.connect.updateStripeAccount, {
            stripeAccountId: account.stripeAccountId,
            chargesEnabled: stripeAccount.chargesEnabled,
            payoutsEnabled: stripeAccount.payoutsEnabled,
            detailsSubmitted: stripeAccount.detailsSubmitted,
            currentlyDue: stripeAccount.requirements?.currentlyDue || [],
        });

        return {
            updated: true,
            chargesEnabled: stripeAccount.chargesEnabled,
            payoutsEnabled: stripeAccount.payoutsEnabled,
            detailsSubmitted: stripeAccount.detailsSubmitted,
            currentlyDue: stripeAccount.requirements?.currentlyDue || [],
        };
    },
});

/**
 * Get the current organization's Stripe account status
 */
export const getAccountStatus = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

        // Check stripeAccounts table first
        const stripeAccount = await ctx.db
            .query("stripeAccounts")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .first();

        if (stripeAccount) {
            return {
                connected: true,
                stripeAccountId: stripeAccount.stripeAccountId,
                accountStatus: stripeAccount.accountStatus,
                chargesEnabled: stripeAccount.chargesEnabled,
                payoutsEnabled: stripeAccount.payoutsEnabled,
                detailsSubmitted: stripeAccount.detailsSubmitted,
                currentlyDue: stripeAccount.currentlyDue || [],
                canAcceptPayments: stripeAccount.chargesEnabled && stripeAccount.detailsSubmitted,
            };
        }

        // Check legacy field on organizations table
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", auth.orgId))
            .first();

        if (org?.stripeAccountId) {
            return {
                connected: true,
                stripeAccountId: org.stripeAccountId,
                accountStatus: org.stripeOnboardingComplete ? "active" : "pending",
                chargesEnabled: org.stripeOnboardingComplete || false,
                payoutsEnabled: org.stripeOnboardingComplete || false,
                detailsSubmitted: org.stripeOnboardingComplete || false,
                currentlyDue: [],
                canAcceptPayments: org.stripeOnboardingComplete || false,
            };
        }

        return {
            connected: false,
            stripeAccountId: null,
            accountStatus: null,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
            currentlyDue: [],
            canAcceptPayments: false,
        };
    },
});

/**
 * Get organization info for Stripe account creation
 */
export const getOrgInfo = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", auth.orgId))
            .first();

        if (!org) {
            return null;
        }

        return {
            orgId: auth.orgId,
            name: org.name,
            email: org.email,
        };
    },
});

/**
 * Internal mutation to save a new Stripe account
 */
export const saveStripeAccount = internalMutation({
    args: {
        orgId: v.string(),
        stripeAccountId: v.string(),
        chargesEnabled: v.boolean(),
        payoutsEnabled: v.boolean(),
        detailsSubmitted: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Insert into stripeAccounts table
        await ctx.db.insert("stripeAccounts", {
            orgId: args.orgId,
            stripeAccountId: args.stripeAccountId,
            accountStatus: args.chargesEnabled ? "active" : "pending",
            chargesEnabled: args.chargesEnabled,
            payoutsEnabled: args.payoutsEnabled,
            detailsSubmitted: args.detailsSubmitted,
            currentlyDue: [],
            createdAt: now,
            updatedAt: now,
        });

        // Also update organizations table for backwards compatibility
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.orgId))
            .first();

        if (org) {
            await ctx.db.patch(org._id, {
                stripeAccountId: args.stripeAccountId,
                stripeOnboardingComplete: args.detailsSubmitted,
            });
        }
    },
});

/**
 * Internal mutation to update Stripe account status
 */
export const updateStripeAccount = internalMutation({
    args: {
        stripeAccountId: v.string(),
        chargesEnabled: v.boolean(),
        payoutsEnabled: v.boolean(),
        detailsSubmitted: v.boolean(),
        currentlyDue: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const account = await ctx.db
            .query("stripeAccounts")
            .withIndex("by_stripe_account", (q) => q.eq("stripeAccountId", args.stripeAccountId))
            .first();

        if (account) {
            await ctx.db.patch(account._id, {
                accountStatus: args.chargesEnabled ? "active" : args.detailsSubmitted ? "restricted" : "pending",
                chargesEnabled: args.chargesEnabled,
                payoutsEnabled: args.payoutsEnabled,
                detailsSubmitted: args.detailsSubmitted,
                currentlyDue: args.currentlyDue,
                updatedAt: Date.now(),
            });

            // Also update organizations table
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", account.orgId))
                .first();

            if (org) {
                await ctx.db.patch(org._id, {
                    stripeOnboardingComplete: args.detailsSubmitted && args.chargesEnabled,
                });
            }
        }
    },
});
