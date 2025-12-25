import { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";

const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

interface XeroTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    tenantId: string;
}

interface XeroApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}

/**
 * Get valid Xero tokens for an organization
 * Refreshes if expired (with 5 minute buffer)
 */
export async function getValidTokens(
    ctx: ActionCtx,
    orgId: string
): Promise<XeroTokens | null> {
    // Get organization with Xero connection
    const org = await ctx.runQuery(internal.xero.queries.getOrgWithXeroConnection, { orgId });

    if (!org || !org.xeroConnection) {
        return null;
    }

    const { xeroConnection } = org;

    // Check if token is expired or will expire in 5 minutes
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    const isExpired = xeroConnection.expiresAt < (Date.now() + bufferMs);

    if (isExpired) {
        // Refresh the tokens
        const refreshed = await refreshXeroTokens(
            xeroConnection.refreshToken,
            orgId,
            ctx
        );

        if (!refreshed) {
            return null;
        }

        return {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: refreshed.expiresAt,
            tenantId: xeroConnection.tenantId,
        };
    }

    return {
        accessToken: xeroConnection.accessToken,
        refreshToken: xeroConnection.refreshToken,
        expiresAt: xeroConnection.expiresAt,
        tenantId: xeroConnection.tenantId,
    };
}

/**
 * Refresh Xero tokens using refresh token
 */
async function refreshXeroTokens(
    refreshToken: string,
    orgId: string,
    ctx: ActionCtx
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
    const clientId = process.env.XERO_CLIENT_ID;
    const clientSecret = process.env.XERO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("Xero OAuth credentials not configured");
        return null;
    }

    try {
        const response = await fetch("https://identity.xero.com/connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Token refresh failed:", errorText);
            return null;
        }

        const data = await response.json();

        const newTokens = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + (data.expires_in * 1000),
        };

        // Store updated tokens
        await ctx.runMutation(internal.xero.oauth.refreshTokens, {
            orgId,
            ...newTokens,
        });

        return newTokens;
    } catch (err) {
        console.error("Token refresh error:", err);
        return null;
    }
}

/**
 * Make an authenticated request to Xero API
 * Handles token refresh, rate limiting, and retries
 */
export async function xeroFetch<T>(
    ctx: ActionCtx,
    orgId: string,
    endpoint: string,
    options: {
        method?: "GET" | "POST" | "PUT" | "DELETE";
        body?: object;
        retries?: number;
    } = {}
): Promise<XeroApiResponse<T>> {
    const { method = "GET", body, retries = 2 } = options;

    // Get valid tokens
    const tokens = await getValidTokens(ctx, orgId);
    if (!tokens) {
        return {
            success: false,
            error: "Xero not connected or token refresh failed. Please reconnect.",
        };
    }

    const url = `${XERO_API_BASE}${endpoint}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                    "xero-tenant-id": tokens.tenantId,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
                if (attempt < retries) {
                    await sleep(retryAfter * 1000);
                    continue;
                }
                return {
                    success: false,
                    error: "Xero rate limit exceeded. Please try again later.",
                    statusCode: 429,
                };
            }

            // Handle unauthorized (token expired during request)
            if (response.status === 401) {
                if (attempt < retries) {
                    // Try to refresh token and retry
                    const refreshed = await refreshXeroTokens(tokens.refreshToken, orgId, ctx);
                    if (refreshed) {
                        tokens.accessToken = refreshed.accessToken;
                        continue;
                    }
                }
                return {
                    success: false,
                    error: "Xero authentication failed. Please reconnect.",
                    statusCode: 401,
                };
            }

            // Handle other errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.Message || errorData.message || `Xero API error: ${response.status}`,
                    statusCode: response.status,
                };
            }

            // Parse successful response
            const data = await response.json();
            return {
                success: true,
                data,
                statusCode: response.status,
            };
        } catch (err) {
            if (attempt < retries) {
                await sleep(1000 * (attempt + 1)); // Exponential backoff
                continue;
            }
            return {
                success: false,
                error: err instanceof Error ? err.message : "Network error",
            };
        }
    }

    return {
        success: false,
        error: "Max retries exceeded",
    };
}

/**
 * Helper to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
