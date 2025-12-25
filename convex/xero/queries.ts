import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal query to get organization with Xero connection
 * Used by xero/client.ts to get tokens
 */
export const getOrgWithXeroConnection = internalQuery({
    args: { orgId: v.string() },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.orgId))
            .first();

        return org;
    },
});
