import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add a user to a Clerk organization.
 * Requires CLERK_SECRET_KEY environment variable.
 */
export const addMemberToOrg = action({
    args: {
        clerkUserId: v.string(),
        clerkOrgId: v.string(),
        role: v.union(v.literal("org:member"), v.literal("org:admin")),
    },
    handler: async (ctx, args) => {
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (!clerkSecretKey) {
            throw new Error("CLERK_SECRET_KEY not configured");
        }

        const response = await fetch(
            `https://api.clerk.com/v1/organizations/${args.clerkOrgId}/memberships`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${clerkSecretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: args.clerkUserId,
                    role: args.role,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Clerk API error:", error);
            throw new Error(`Failed to add member to organization: ${response.status}`);
        }

        return await response.json();
    },
});
