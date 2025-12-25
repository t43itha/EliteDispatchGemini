import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Xero OAuth2 callback handler
 * Receives authorization code from Xero after user approves connection
 *
 * Flow:
 * 1. Xero redirects to this endpoint with ?code=...&state=<secure_token>
 * 2. Validate state token (CSRF protection)
 * 3. Exchange the code for tokens
 * 4. Store tokens in organization record
 * 5. Redirect user back to app
 */
http.route({
    path: "/xero/oauth/callback",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const stateToken = url.searchParams.get("state"); // Secure random token
        const error = url.searchParams.get("error");

        // Get frontend URL from environment or default
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        // Handle OAuth errors
        if (error) {
            const errorDescription = url.searchParams.get("error_description") || "Unknown error";
            console.error("Xero OAuth error:", error, errorDescription);
            return new Response(null, {
                status: 302,
                headers: {
                    Location: `${frontendUrl}?xero_error=${encodeURIComponent(errorDescription)}`,
                },
            });
        }

        // Validate required parameters
        if (!code || !stateToken) {
            return new Response(null, {
                status: 302,
                headers: {
                    Location: `${frontendUrl}?xero_error=${encodeURIComponent("Missing authorization code or state")}`,
                },
            });
        }

        try {
            // Validate the state token (CSRF protection)
            const stateInfo = await ctx.runQuery(internal.xero.oauth.validateOAuthState, {
                stateToken,
            });

            if (!stateInfo) {
                console.error("Invalid or expired OAuth state token");
                return new Response(null, {
                    status: 302,
                    headers: {
                        Location: `${frontendUrl}?xero_error=${encodeURIComponent("Invalid or expired OAuth session. Please try connecting again.")}`,
                    },
                });
            }

            // Mark state as used to prevent replay attacks
            await ctx.runMutation(internal.xero.oauth.markOAuthStateUsed, {
                stateId: stateInfo.stateId,
            });

            // Exchange authorization code for tokens
            const tokenResponse = await exchangeCodeForTokens(code);

            if (!tokenResponse.success) {
                throw new Error(tokenResponse.error || "Token exchange failed");
            }

            // Get Xero tenant info (organization info)
            const tenantInfo = await getXeroTenants(tokenResponse.accessToken!);

            if (!tenantInfo.success || tenantInfo.tenants.length === 0) {
                throw new Error("No Xero organizations found. Please ensure you have access to at least one organization.");
            }

            // Use the first tenant (most users have one)
            const tenant = tenantInfo.tenants[0];

            // Store tokens in database via internal mutation (using validated orgId from state)
            await ctx.runMutation(internal.xero.oauth.storeXeroConnection, {
                orgId: stateInfo.orgId,
                tenantId: tenant.tenantId,
                tenantName: tenant.tenantName,
                accessToken: tokenResponse.accessToken!,
                refreshToken: tokenResponse.refreshToken!,
                expiresAt: Date.now() + (tokenResponse.expiresIn! * 1000),
                scope: tokenResponse.scope!,
                connectedBy: stateInfo.userId,
            });

            // Redirect to success page
            return new Response(null, {
                status: 302,
                headers: {
                    Location: `${frontendUrl}?xero_connected=true`,
                },
            });
        } catch (err) {
            console.error("Xero OAuth callback error:", err);
            const message = err instanceof Error ? err.message : "Connection failed";
            return new Response(null, {
                status: 302,
                headers: {
                    Location: `${frontendUrl}?xero_error=${encodeURIComponent(message)}`,
                },
            });
        }
    }),
});

/**
 * Exchange authorization code for access/refresh tokens
 */
async function exchangeCodeForTokens(code: string): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
    error?: string;
}> {
    const clientId = process.env.XERO_CLIENT_ID;
    const clientSecret = process.env.XERO_CLIENT_SECRET;
    const redirectUri = process.env.XERO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        return { success: false, error: "Xero OAuth not configured" };
    }

    try {
        const response = await fetch("https://identity.xero.com/connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Token exchange failed:", errorData);
            return { success: false, error: "Failed to exchange code for tokens" };
        }

        const data = await response.json();

        return {
            success: true,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            scope: data.scope,
        };
    } catch (err) {
        console.error("Token exchange error:", err);
        return { success: false, error: "Token exchange request failed" };
    }
}

/**
 * Get list of Xero tenants (organizations) the user has access to
 */
async function getXeroTenants(accessToken: string): Promise<{
    success: boolean;
    tenants: Array<{ tenantId: string; tenantName: string; tenantType: string }>;
    error?: string;
}> {
    try {
        const response = await fetch("https://api.xero.com/connections", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return { success: false, tenants: [], error: "Failed to get Xero tenants" };
        }

        const data = await response.json();

        return {
            success: true,
            tenants: data.map((t: any) => ({
                tenantId: t.tenantId,
                tenantName: t.tenantName,
                tenantType: t.tenantType,
            })),
        };
    } catch (err) {
        console.error("Get tenants error:", err);
        return { success: false, tenants: [], error: "Failed to fetch Xero organizations" };
    }
}

export default http;
