/**
 * HTTP Routes for EliteDispatch
 *
 * Handles incoming HTTP requests including:
 * - Xero OAuth callbacks
 * - WhatsApp/Twilio webhooks
 * - Stripe webhooks
 */

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
 */
http.route({
    path: "/xero/oauth/callback",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const stateToken = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

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

        if (!code || !stateToken) {
            return new Response(null, {
                status: 302,
                headers: {
                    Location: `${frontendUrl}?xero_error=${encodeURIComponent("Missing authorization code or state")}`,
                },
            });
        }

        try {
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

            await ctx.runMutation(internal.xero.oauth.markOAuthStateUsed, {
                stateId: stateInfo.stateId,
            });

            const tokenResponse = await exchangeCodeForTokens(code);

            if (!tokenResponse.success) {
                throw new Error(tokenResponse.error || "Token exchange failed");
            }

            const tenantInfo = await getXeroTenants(tokenResponse.accessToken!);

            if (!tenantInfo.success || tenantInfo.tenants.length === 0) {
                throw new Error("No Xero organizations found. Please ensure you have access to at least one organization.");
            }

            const tenant = tenantInfo.tenants[0];

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
 */
http.route({
    path: "/whatsapp/webhook/incoming",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const formData = await request.formData();
            const params: Record<string, string> = {};
            formData.forEach((value, key) => {
                params[key] = value.toString();
            });

            const from = params["From"]?.replace("whatsapp:", "") || "";
            const body = params["Body"] || "";
            const messageSid = params["MessageSid"] || "";

            console.log(`Incoming WhatsApp message from ${from}: ${body}`);

            await ctx.runAction(api.whatsapp.stateMachine.processIncomingMessage, {
                phone: from,
                messageBody: body,
                twilioSid: messageSid,
            });

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
 * Webhook endpoint for WhatsApp message status callbacks
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

// =====================================================
// Stripe Webhook Endpoints
// =====================================================

/**
 * Stripe Webhook Handler
 *
 * Events handled:
 * - checkout.session.completed: Payment successful
 * - checkout.session.expired: Checkout timed out
 * - account.updated: Stripe Connect account status changed
 * - charge.refunded: Refund processed
 */
http.route({
    path: "/stripe-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("STRIPE_WEBHOOK_SECRET not configured");
            return new Response("Webhook secret not configured", { status: 500 });
        }

        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            console.error("No stripe-signature header");
            return new Response("No signature", { status: 400 });
        }

        let event;
        try {
            const stripe = await import("stripe");
            const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY!, {
                apiVersion: "2025-11-17.clover",
            });
            event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error("Webhook signature verification failed:", err.message);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        try {
            switch (event.type) {
                case "checkout.session.completed": {
                    const session = event.data.object as any;
                    await ctx.runMutation(internal.payments.webhooks.handleCheckoutCompleted, {
                        sessionId: session.id,
                        paymentIntentId: session.payment_intent || undefined,
                        paymentStatus: session.payment_status,
                        customerEmail: session.customer_email || undefined,
                        metadata: session.metadata || undefined,
                    });
                    break;
                }

                case "checkout.session.expired": {
                    const session = event.data.object as any;
                    await ctx.runMutation(internal.payments.webhooks.handleCheckoutExpired, {
                        sessionId: session.id,
                    });
                    break;
                }

                case "account.updated": {
                    const account = event.data.object as any;
                    await ctx.runMutation(internal.payments.webhooks.handleAccountUpdated, {
                        accountId: account.id,
                        chargesEnabled: account.charges_enabled ?? false,
                        payoutsEnabled: account.payouts_enabled ?? false,
                        detailsSubmitted: account.details_submitted ?? false,
                        currentlyDue: account.requirements?.currently_due || [],
                    });
                    break;
                }

                case "charge.refunded": {
                    const charge = event.data.object as any;
                    if (charge.payment_intent) {
                        await ctx.runMutation(internal.payments.webhooks.handleRefundCreated, {
                            paymentIntentId: charge.payment_intent,
                            refundAmount: charge.amount_refunded,
                            totalAmount: charge.amount,
                            refundId: charge.refunds?.data?.[0]?.id || `refund_${Date.now()}`,
                        });
                    }
                    break;
                }

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (err: any) {
            console.error(`Error processing ${event.type}:`, err);
            return new Response(JSON.stringify({ received: true, error: err.message }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
    }),
});

// =====================================================
// Health Check Endpoints
// =====================================================

http.route({
    path: "/health",
    method: "GET",
    handler: httpAction(async () => {
        return new Response(JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            services: ["xero", "whatsapp", "stripe"]
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
});

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
