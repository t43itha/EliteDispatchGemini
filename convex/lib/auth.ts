import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

export type UserRole = "admin" | "dispatcher" | "driver";

export interface AuthContext {
    userId: string; // Clerk user ID
    orgId: string; // Clerk org ID
    role: UserRole; // User's role in org
    user: Doc<"users">; // Full user document
}

/**
 * Core auth function - validates user belongs to org and returns context.
 * Throws if not authenticated or not a member.
 *
 * @param ctx - Convex query or mutation context
 * @param requiredRoles - Optional array of roles that are allowed
 * @returns AuthContext with verified user info
 */
export async function requireAuth(
    ctx: QueryCtx | MutationCtx,
    requiredRoles?: UserRole[]
): Promise<AuthContext> {
    // 1. Get Clerk identity from JWT
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthenticated: Please sign in");
    }

    // 2. Extract Clerk IDs from token
    const clerkUserId = identity.subject; // Clerk user_xxx
    // Clerk stores org_id in the token when user has active org
    const clerkOrgId = (identity as any).org_id as string | undefined;

    if (!clerkOrgId) {
        throw new Error("No organization selected");
    }

    // 3. Look up user in our users table
    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
        .first();

    if (!user) {
        throw new Error("User not found - please complete onboarding");
    }

    // 4. Verify user belongs to the active org
    if (user.orgId !== clerkOrgId) {
        throw new Error("Access denied: Not a member of this organization");
    }

    // 5. Check role permissions if required
    if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(user.role)) {
            throw new Error(
                `Access denied: Requires ${requiredRoles.join(" or ")} role`
            );
        }
    }

    return {
        userId: clerkUserId,
        orgId: clerkOrgId,
        role: user.role,
        user,
    };
}

/**
 * For queries - returns null instead of throwing if not authenticated.
 * Useful for conditional rendering based on auth state.
 */
export async function getAuthOrNull(
    ctx: QueryCtx
): Promise<AuthContext | null> {
    try {
        return await requireAuth(ctx);
    } catch {
        return null;
    }
}

/**
 * Check if user can manage drivers (admin or dispatcher)
 */
export function canManageDrivers(auth: AuthContext): boolean {
    return ["admin", "dispatcher"].includes(auth.role);
}

/**
 * Check if user can manage bookings (admin or dispatcher)
 */
export function canManageBookings(auth: AuthContext): boolean {
    return ["admin", "dispatcher"].includes(auth.role);
}

/**
 * Check if user is an admin
 */
export function isAdmin(auth: AuthContext): boolean {
    return auth.role === "admin";
}
