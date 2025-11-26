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
