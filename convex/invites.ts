import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

/**
 * Generate a random 6-character invite code
 */
function generateInviteCode(): string {
    // Exclude confusing characters like 0/O, 1/I/L
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

/**
 * Create a new invite code (admin only)
 */
export const create = mutation({
    args: {
        role: v.union(v.literal("dispatcher"), v.literal("driver")),
        email: v.optional(v.string()),
        expiresInDays: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const code = generateInviteCode();
        const expiresAt =
            Date.now() + (args.expiresInDays || 7) * 24 * 60 * 60 * 1000;

        const inviteId = await ctx.db.insert("invites", {
            orgId: auth.orgId,
            code,
            email: args.email?.toLowerCase(),
            role: args.role,
            createdBy: auth.userId,
            createdAt: Date.now(),
            expiresAt,
        });

        return { inviteId, code };
    },
});

/**
 * Validate an invite code (public - for join flow)
 */
export const validate = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        const invite = await ctx.db
            .query("invites")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .first();

        if (!invite) {
            return { valid: false, error: "Invalid invite code" };
        }

        if (invite.usedAt) {
            return { valid: false, error: "Invite code already used" };
        }

        if (Date.now() > invite.expiresAt) {
            return { valid: false, error: "Invite code expired" };
        }

        // Get org name for display
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) =>
                q.eq("clerkOrgId", invite.orgId)
            )
            .first();

        return {
            valid: true,
            orgId: invite.orgId,
            orgName: org?.name || "Unknown Organization",
            role: invite.role,
            restrictedEmail: invite.email,
        };
    },
});

/**
 * Use an invite code to join an organization
 */
export const useInvite = mutation({
    args: {
        code: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Find the invite
        const invite = await ctx.db
            .query("invites")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .first();

        if (!invite) throw new Error("Invalid invite code");
        if (invite.usedAt) throw new Error("Invite code already used");
        if (Date.now() > invite.expiresAt) throw new Error("Invite code expired");

        // Check email restriction if set
        if (
            invite.email &&
            invite.email.toLowerCase() !== args.email.toLowerCase()
        ) {
            throw new Error("This invite is restricted to a specific email");
        }

        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_user_id", (q) =>
                q.eq("clerkUserId", identity.subject)
            )
            .first();

        if (existingUser) {
            throw new Error("User already belongs to an organization");
        }

        // Create the user
        const userId = await ctx.db.insert("users", {
            clerkUserId: identity.subject,
            email: args.email.toLowerCase(),
            name: args.name,
            orgId: invite.orgId,
            role: invite.role,
            createdAt: Date.now(),
            invitedBy: invite.createdBy,
        });

        // Mark invite as used
        await ctx.db.patch(invite._id, {
            usedAt: Date.now(),
            usedBy: identity.subject,
        });

        return { userId, orgId: invite.orgId, role: invite.role };
    },
});

/**
 * List all invites for the current organization (admin only)
 */
export const list = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx, ["admin"]);

        return await ctx.db
            .query("invites")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .order("desc")
            .collect();
    },
});

/**
 * Revoke/delete an invite (admin only)
 */
export const revoke = mutation({
    args: { inviteId: v.id("invites") },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const invite = await ctx.db.get(args.inviteId);
        if (!invite || invite.orgId !== auth.orgId) {
            throw new Error("Invite not found");
        }

        await ctx.db.delete(args.inviteId);
    },
});
