import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

/**
 * Get the current organization's details
 */
export const getCurrent = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

        return await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", auth.orgId)
            )
            .first();
    },
});

/**
 * Create a new organization record (called during onboarding)
 */
export const create = mutation({
    args: {
        clerkOrgId: v.string(),
        name: v.string(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Check if org already exists
        const existing = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", args.clerkOrgId)
            )
            .first();

        if (existing) {
            throw new Error("Organization already exists");
        }

        return await ctx.db.insert("organizations", {
            clerkOrgId: args.clerkOrgId,
            name: args.name,
            phone: args.phone,
            email: args.email,
            createdAt: Date.now(),
            onboardingComplete: false,
        });
    },
});

/**
 * Update organization details (admin only)
 */
export const update = mutation({
    args: {
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", auth.orgId)
            )
            .first();

        if (!org) throw new Error("Organization not found");

        const updates: Partial<typeof args> = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.email !== undefined) updates.email = args.email;

        await ctx.db.patch(org._id, updates);
    },
});

/**
 * Mark onboarding as complete
 */
export const completeOnboarding = mutation({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", auth.orgId)
            )
            .first();

        if (!org) throw new Error("Organization not found");

        await ctx.db.patch(org._id, { onboardingComplete: true });
    },
});

/**
 * Check if organization exists by Clerk org ID (for onboarding flow)
 */
export const exists = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return false;

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", args.clerkOrgId)
            )
            .first();

        return !!org;
    },
});

/**
 * Debug: Check what identity info we're getting from Convex auth
 */
export const debugAuth = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { authenticated: false, identity: null };
        }
        return {
            authenticated: true,
            subject: identity.subject,
            issuer: identity.issuer,
            tokenIdentifier: identity.tokenIdentifier,
        };
    },
});

/**
 * Idempotent setup: ensures org and user records exist, marks onboarding complete.
 * Safe to call multiple times - skips creation if records already exist.
 */
export const ensureSetup = mutation({
    args: {
        orgName: v.string(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const clerkOrgId = (identity as any).org_id as string | undefined;
        if (!clerkOrgId) throw new Error("No organization selected");

        const clerkUserId = identity.subject;

        // 1. Check/create organization record
        let org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", clerkOrgId))
            .first();

        if (!org) {
            const orgId = await ctx.db.insert("organizations", {
                clerkOrgId,
                name: args.orgName,
                phone: args.phone,
                email: args.email,
                createdAt: Date.now(),
                onboardingComplete: false,
            });
            org = await ctx.db.get(orgId);
        }

        // 2. Check/create user record
        let user = await ctx.db
            .query("users")
            .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
            .first();

        if (!user) {
            await ctx.db.insert("users", {
                clerkUserId,
                email: identity.email || "",
                name: identity.name,
                orgId: clerkOrgId,
                role: "admin",
                createdAt: Date.now(),
            });
        }

        // 3. Mark onboarding complete
        if (org && !org.onboardingComplete) {
            await ctx.db.patch(org._id, { onboardingComplete: true });
        }

        return { success: true };
    },
});

// Widget config validator for reuse
const widgetConfigValidator = v.object({
    companyName: v.string(),
    primaryColor: v.string(),
    currency: v.string(),
    showMap: v.boolean(),
    distanceUnit: v.union(v.literal("km"), v.literal("mi"), v.literal("hr")),
    vehicles: v.object({
        Business_Class: v.object({
            enabled: v.boolean(),
            basePrice: v.number(),
            pricePerUnit: v.number(),
            image: v.string(),
            name: v.string(),
            description: v.string(),
            maxPassengers: v.number(),
            maxLuggage: v.number(),
        }),
        First_Class: v.object({
            enabled: v.boolean(),
            basePrice: v.number(),
            pricePerUnit: v.number(),
            image: v.string(),
            name: v.string(),
            description: v.string(),
            maxPassengers: v.number(),
            maxLuggage: v.number(),
        }),
        Business_Van: v.object({
            enabled: v.boolean(),
            basePrice: v.number(),
            pricePerUnit: v.number(),
            image: v.string(),
            name: v.string(),
            description: v.string(),
            maxPassengers: v.number(),
            maxLuggage: v.number(),
        }),
    }),
});

/**
 * Get widget configuration for the current organization (authenticated)
 */
export const getWidgetConfig = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", auth.orgId)
            )
            .first();

        if (!org) throw new Error("Organization not found");

        return {
            orgId: org.clerkOrgId,
            config: org.widgetConfig ?? null,
        };
    },
});

/**
 * Save widget configuration for the current organization (admin only)
 */
export const saveWidgetConfig = mutation({
    args: {
        config: widgetConfigValidator,
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", auth.orgId)
            )
            .first();

        if (!org) throw new Error("Organization not found");

        await ctx.db.patch(org._id, { widgetConfig: args.config });

        return { success: true };
    },
});

/**
 * Get widget configuration by org ID (PUBLIC - no auth required)
 * Used by embedded widgets to load configuration
 */
export const getPublicWidgetConfig = query({
    args: { orgId: v.string() },
    handler: async (ctx, args) => {
        // No authentication required - this is public
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", args.orgId)
            )
            .first();

        if (!org) {
            return null;
        }

        // Return only safe public data
        return {
            companyName: org.widgetConfig?.companyName ?? org.name,
            config: org.widgetConfig ?? null,
        };
    },
});
