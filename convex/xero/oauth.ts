import { action, internalMutation, internalQuery, query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../lib/auth";
import { internal } from "../_generated/api";

// Xero OAuth scopes needed for invoicing
const XERO_SCOPES = [
    "openid",
    "profile",
    "email",
    "accounting.transactions",      // Create/read invoices
    "accounting.contacts.read",     // Read contacts
    "accounting.settings.read",     // Read org settings
    "offline_access",               // Get refresh token
].join(" ");

/**
 * Generate a cryptographically secure random state token
 */
function generateStateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Internal mutation to create OAuth state token
 */
export const createOAuthState = internalMutation({
    args: {
        stateToken: v.string(),
        orgId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiresAt = now + 10 * 60 * 1000; // 10 minutes

        await ctx.db.insert("oauthStates", {
            stateToken: args.stateToken,
            orgId: args.orgId,
            userId: args.userId,
            createdAt: now,
            expiresAt,
        });
    },
});

/**
 * Internal query to validate OAuth state token
 * Returns the org info if valid, null if invalid/expired
 */
export const validateOAuthState = internalQuery({
    args: {
        stateToken: v.string(),
    },
    handler: async (ctx, args) => {
        const state = await ctx.db
            .query("oauthStates")
            .withIndex("by_state_token", (q) => q.eq("stateToken", args.stateToken))
            .first();

        if (!state) {
            return null; // Invalid state token
        }

        if (state.expiresAt < Date.now()) {
            return null; // Expired
        }

        if (state.usedAt) {
            return null; // Already used (replay attack)
        }

        return {
            orgId: state.orgId,
            userId: state.userId,
            stateId: state._id,
        };
    },
});

/**
 * Internal mutation to mark OAuth state as used
 */
export const markOAuthStateUsed = internalMutation({
    args: {
        stateId: v.id("oauthStates"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.stateId, {
            usedAt: Date.now(),
        });
    },
});

/**
 * Generate Xero OAuth authorization URL
 * Called from frontend to initiate OAuth flow
 */
export const getAuthUrl = action({
    args: {},
    handler: async (ctx): Promise<{ url: string; error?: string }> => {
        const clientId = process.env.XERO_CLIENT_ID;
        const redirectUri = process.env.XERO_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            return { url: "", error: "Xero OAuth not configured. Please set XERO_CLIENT_ID and XERO_REDIRECT_URI environment variables." };
        }

        // Get org ID from auth context
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { url: "", error: "Not authenticated" };
        }

        const orgId = (identity as any).org_id as string | undefined;
        if (!orgId) {
            return { url: "", error: "No organization selected" };
        }

        const userId = identity.subject;

        // Generate secure state token
        const stateToken = generateStateToken();

        // Store the state token
        await ctx.runMutation(internal.xero.oauth.createOAuthState, {
            stateToken,
            orgId,
            userId,
        });

        // Build OAuth URL with secure state token
        const params = new URLSearchParams({
            response_type: "code",
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: XERO_SCOPES,
            state: stateToken, // Secure random token, not orgId
        });

        const authUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;

        return { url: authUrl };
    },
});

/**
 * Internal mutation to store Xero connection after OAuth callback
 * Called from HTTP action in http.ts
 */
export const storeXeroConnection = internalMutation({
    args: {
        orgId: v.string(),
        tenantId: v.string(),
        tenantName: v.string(),
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresAt: v.number(),
        scope: v.string(),
        connectedBy: v.string(), // User ID who initiated the connection
    },
    handler: async (ctx, args) => {
        // Find the organization
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.orgId))
            .first();

        if (!org) {
            throw new Error("Organization not found");
        }

        // Store the Xero connection
        await ctx.db.patch(org._id, {
            xeroConnection: {
                tenantId: args.tenantId,
                tenantName: args.tenantName,
                accessToken: args.accessToken,
                refreshToken: args.refreshToken,
                expiresAt: args.expiresAt,
                scope: args.scope,
                connectedAt: Date.now(),
                connectedBy: args.connectedBy,
            },
        });
    },
});

/**
 * Get current Xero connection status
 */
export const getConnectionStatus = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", auth.orgId))
            .first();

        if (!org || !org.xeroConnection) {
            return {
                connected: false,
                tenantName: null,
                connectedAt: null,
                expiresAt: null,
            };
        }

        return {
            connected: true,
            tenantName: org.xeroConnection.tenantName,
            connectedAt: org.xeroConnection.connectedAt,
            expiresAt: org.xeroConnection.expiresAt,
            isExpired: org.xeroConnection.expiresAt < Date.now(),
        };
    },
});

/**
 * Disconnect Xero integration
 * Removes tokens and connection info
 */
export const disconnect = mutation({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", auth.orgId))
            .first();

        if (!org) {
            throw new Error("Organization not found");
        }

        // Remove Xero connection
        await ctx.db.patch(org._id, {
            xeroConnection: undefined,
        });

        // Optionally: Clear cached contacts
        const contacts = await ctx.db
            .query("xeroContacts")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .collect();

        for (const contact of contacts) {
            await ctx.db.delete(contact._id);
        }

        return { success: true };
    },
});

/**
 * Internal mutation to refresh tokens
 * Called when access token is expired
 */
export const refreshTokens = internalMutation({
    args: {
        orgId: v.string(),
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.orgId))
            .first();

        if (!org || !org.xeroConnection) {
            throw new Error("Organization or Xero connection not found");
        }

        // Update tokens
        await ctx.db.patch(org._id, {
            xeroConnection: {
                ...org.xeroConnection,
                accessToken: args.accessToken,
                refreshToken: args.refreshToken,
                expiresAt: args.expiresAt,
            },
        });
    },
});
