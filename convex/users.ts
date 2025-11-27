import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

/**
 * Get the current user's record
 */
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_clerk_user_id", (q) =>
                q.eq("clerkUserId", identity.subject)
            )
            .first();
    },
});

/**
 * Check if the current user needs onboarding.
 * Returns { needsOnboarding: boolean, reason: string | null }
 */
export const needsOnboarding = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { needsOnboarding: false, reason: "not_signed_in" };
        }

        // Check if user record exists
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_user_id", (q) =>
                q.eq("clerkUserId", identity.subject)
            )
            .first();

        if (!user) {
            return { needsOnboarding: true, reason: "no_user_record" };
        }

        // Check if org record exists
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", user.orgId))
            .first();

        if (!org) {
            return { needsOnboarding: true, reason: "no_org_record" };
        }

        if (!org.onboardingComplete) {
            return { needsOnboarding: true, reason: "onboarding_incomplete" };
        }

        return { needsOnboarding: false, reason: null };
    },
});

/**
 * Create an admin user for a new organization (called during org creation)
 */
export const createAdmin = mutation({
    args: {
        clerkOrgId: v.string(),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const clerkUserId = identity.subject;
        // Use email from args or fall back to identity email
        const email = args.email || identity.email || "";

        // Check if user already exists
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerk_user_id", (q) =>
                q.eq("clerkUserId", clerkUserId)
            )
            .first();

        if (existing) {
            throw new Error("User already exists");
        }

        return await ctx.db.insert("users", {
            clerkUserId,
            email,
            name: args.name || identity.name,
            orgId: args.clerkOrgId,
            role: "admin",
            createdAt: Date.now(),
        });
    },
});

/**
 * List all users in the current organization (admin only)
 */
export const listOrgUsers = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx, ["admin"]);

        return await ctx.db
            .query("users")
            .withIndex("by_org_id", (q) => q.eq("orgId", auth.orgId))
            .collect();
    },
});

/**
 * Update a user's role (admin only)
 */
export const updateRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(
            v.literal("admin"),
            v.literal("dispatcher"),
            v.literal("driver")
        ),
        driverId: v.optional(v.id("drivers")),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const user = await ctx.db.get(args.userId);
        if (!user || user.orgId !== auth.orgId) {
            throw new Error("User not found");
        }

        // Can't demote yourself if you're the last admin
        if (user.clerkUserId === auth.userId && args.role !== "admin") {
            const admins = await ctx.db
                .query("users")
                .withIndex("by_org_and_role", (q) =>
                    q.eq("orgId", auth.orgId).eq("role", "admin")
                )
                .collect();

            if (admins.length <= 1) {
                throw new Error(
                    "Cannot demote: You are the only admin in this organization"
                );
            }
        }

        // Driver role requires a driverId
        if (args.role === "driver" && !args.driverId) {
            throw new Error("Driver ID required for driver role");
        }

        await ctx.db.patch(args.userId, {
            role: args.role,
            ...(args.driverId && { driverId: args.driverId }),
            ...(!args.driverId &&
                args.role !== "driver" && { driverId: undefined }),
        });
    },
});

/**
 * Remove a user from the organization (admin only)
 */
export const removeUser = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const user = await ctx.db.get(args.userId);
        if (!user || user.orgId !== auth.orgId) {
            throw new Error("User not found");
        }

        // Can't remove yourself
        if (user.clerkUserId === auth.userId) {
            throw new Error("Cannot remove yourself from the organization");
        }

        await ctx.db.delete(args.userId);
    },
});
