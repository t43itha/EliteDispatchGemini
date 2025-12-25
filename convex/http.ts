import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { MessageStatus } from "./whatsapp/twilio";

const http = httpRouter();

// =====================================================
// Xero OAuth Endpoints
// =====================================================

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

// =====================================================
// WhatsApp Webhook Endpoints
// =====================================================

/**
 * Webhook endpoint for incoming WhatsApp messages from drivers
 * URL: POST /whatsapp/webhook/incoming
 *
 * Configure in Twilio Console:
 * When a message comes in: https://your-deployment.convex.site/whatsapp/webhook/incoming
 */
http.route({
    path: "/whatsapp/webhook/incoming",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            // Parse form data from Twilio
            const formData = await request.formData();
            const params: Record<string, string> = {};
            formData.forEach((value, key) => {
                params[key] = value.toString();
            });

            // Extract key fields
            const from = params["From"]?.replace("whatsapp:", "") || "";
            const body = params["Body"] || "";
            const messageSid = params["MessageSid"] || "";

            console.log(`Incoming WhatsApp message from ${from}: ${body}`);

            // Process the incoming message through the state machine
            await ctx.runAction(api.whatsapp.stateMachine.processIncomingMessage, {
                phone: from,
                messageBody: body,
                twilioSid: messageSid,
            });

            // Return empty TwiML response
            return new Response(
                `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
                {
                    status: 200,
                    headers: { "Content-Type": "text/xml" },
                }
            );
        } catch (error) {
            console.error("Error processing incoming WhatsApp message:", error);
            return new Response(
                `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
                { status: 200, headers: { "Content-Type": "text/xml" } }
            );
        }
    }),
});

/**
 * Webhook endpoint for message status callbacks
 * URL: POST /whatsapp/webhook/status
 *
 * Configure in Twilio Console:
 * Status callback URL: https://your-deployment.convex.site/whatsapp/webhook/status
 */
http.route({
    path: "/whatsapp/webhook/status",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const formData = await request.formData();
            const params: Record<string, string> = {};
            formData.forEach((value, key) => {
                params[key] = value.toString();
            });

            const messageSid = params["MessageSid"] || "";
            const messageStatus = params["MessageStatus"] || "";
            const errorCode = params["ErrorCode"];
            const errorMessage = params["ErrorMessage"];

            console.log(`Message ${messageSid} status: ${messageStatus}`);

            // Map Twilio status to our status
            let status = MessageStatus.QUEUED;
            switch (messageStatus.toLowerCase()) {
                case "queued":
                case "accepted":
                    status = MessageStatus.QUEUED;
                    break;
                case "sent":
                    status = MessageStatus.SENT;
                    break;
                case "delivered":
                    status = MessageStatus.DELIVERED;
                    break;
                case "read":
                    status = MessageStatus.READ;
                    break;
                case "failed":
                case "undelivered":
                    status = MessageStatus.FAILED;
                    break;
            }

            // Update message status in database
            await ctx.runMutation(api.whatsapp.config.updateMessageStatus, {
                twilioSid: messageSid,
                status,
                errorMessage: errorMessage || (errorCode ? `Error code: ${errorCode}` : undefined),
            });

            return new Response("OK", { status: 200 });
        } catch (error) {
            console.error("Error processing status callback:", error);
            return new Response("OK", { status: 200 });
        }
    }),
});

/**
 * Health check endpoint
 * URL: GET /whatsapp/health
 */
http.route({
    path: "/whatsapp/health",
    method: "GET",
    handler: httpAction(async () => {
        return new Response(
            JSON.stringify({
                status: "ok",
                timestamp: new Date().toISOString(),
                service: "whatsapp-webhooks",
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    }),
});

export default http;
