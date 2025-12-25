import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    bookings: defineTable({
        orgId: v.string(), // SaaS: Company ID
        customerName: v.string(),
        customerPhone: v.string(),
        customerEmail: v.optional(v.string()),
        pickupLocation: v.string(),
        dropoffLocation: v.string(),
        pickupTime: v.string(), // ISO string
        passengers: v.number(),
        price: v.number(), // Price in smallest currency unit (pence for GBP)
        status: v.string(), // BookingStatus
        driverId: v.optional(v.id("drivers")), // Reference to drivers table
        notes: v.optional(v.string()),
        vehicleClass: v.optional(v.string()),
        paymentStatus: v.optional(v.string()), // PENDING | PROCESSING | PAID | FAILED | REFUNDED | PARTIALLY_REFUNDED
        distance: v.optional(v.string()),
        duration: v.optional(v.string()),
        isReturn: v.optional(v.boolean()),
        // WhatsApp notification tracking
        whatsappCustomerNotified: v.optional(v.boolean()),
        whatsappDriverNotified: v.optional(v.boolean()),
        whatsappDriverAccepted: v.optional(v.boolean()),
        whatsappDriverAcceptedAt: v.optional(v.number()),
        // Enhanced payment tracking
        stripeCheckoutSessionId: v.optional(v.string()), // cs_xxx for widget checkouts
        priceValidated: v.optional(v.boolean()), // True if price was server-validated
        currency: v.optional(v.string()), // Currency code (e.g., 'gbp', 'usd')
    }).index("by_org_and_status", ["orgId", "status"])
      .index("by_checkout_session", ["stripeCheckoutSessionId"]),

    drivers: defineTable({
        orgId: v.string(), // SaaS: Company ID
        name: v.string(),
        phone: v.string(),
        vehicle: v.string(),
        vehicleColour: v.optional(v.string()),
        plate: v.string(),
        status: v.string(), // DriverStatus
        rating: v.number(),
        location: v.string(),
        notes: v.optional(v.string()),
        // WhatsApp integration
        whatsappVerified: v.optional(v.boolean()),
        whatsappOptedIn: v.optional(v.boolean()),
    }).index("by_org", ["orgId"])
      .index("by_phone", ["phone"]),

    services: defineTable({
        orgId: v.string(), // SaaS: Company ID
        date: v.string(),
        description: v.string(),
        vendor: v.string(),
        cost: v.number(),
        serviceChargePercent: v.number(),
        serviceFee: v.number(),
        total: v.number(),
        status: v.string(),
        driverId: v.optional(v.id("drivers")),
        notes: v.optional(v.string()),
    }).index("by_org", ["orgId"]),

    // Organizations - stores org profile data synced with Clerk
    organizations: defineTable({
        clerkOrgId: v.string(), // Clerk organization ID (org_xxx)
        name: v.string(), // Company name
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        createdAt: v.number(),
        onboardingComplete: v.boolean(),
        // Widget configuration for public booking widget
        widgetConfig: v.optional(v.object({
            companyName: v.string(),
            primaryColor: v.string(),
            currency: v.string(),
            showMap: v.boolean(),
            distanceUnit: v.union(v.literal("km"), v.literal("mi"), v.literal("hr")),
            vehicles: v.object({
                Business_Class: v.object({
                    enabled: v.boolean(),
                    basePrice: v.number(),
                    pricePerUnit: v.number(),
                    image: v.string(),
                    name: v.string(),
                    description: v.string(),
                    maxPassengers: v.number(),
                    maxLuggage: v.number(),
                }),
                First_Class: v.object({
                    enabled: v.boolean(),
                    basePrice: v.number(),
                    pricePerUnit: v.number(),
                    image: v.string(),
                    name: v.string(),
                    description: v.string(),
                    maxPassengers: v.number(),
                    maxLuggage: v.number(),
                }),
                Business_Van: v.object({
                    enabled: v.boolean(),
                    basePrice: v.number(),
                    pricePerUnit: v.number(),
                    image: v.string(),
                    name: v.string(),
                    description: v.string(),
                    maxPassengers: v.number(),
                    maxLuggage: v.number(),
                }),
            }),
        })),
        // Xero integration - OAuth tokens and connection info
        xeroConnection: v.optional(v.object({
            tenantId: v.string(),
            tenantName: v.string(),
            accessToken: v.string(),
            refreshToken: v.string(),
            expiresAt: v.number(),
            scope: v.string(),
            connectedAt: v.number(),
            connectedBy: v.string(),
        })),
        // Stripe Connect integration
        stripeAccountId: v.optional(v.string()),
        stripeOnboardingComplete: v.optional(v.boolean()),
    }).index("by_clerk_org_id", ["clerkOrgId"]),

    // Xero Invoices - tracks invoices created in Xero
    invoices: defineTable({
        orgId: v.string(),
        xeroInvoiceId: v.string(),
        xeroInvoiceNumber: v.string(),
        status: v.string(),
        xeroContactId: v.string(),
        contactName: v.string(),
        subtotal: v.number(),
        totalTax: v.number(),
        total: v.number(),
        amountDue: v.number(),
        amountPaid: v.number(),
        currencyCode: v.string(),
        lineItems: v.array(v.object({
            description: v.string(),
            quantity: v.number(),
            unitAmount: v.number(),
            taxType: v.string(),
            lineAmount: v.number(),
            bookingId: v.optional(v.id("bookings")),
        })),
        bookingIds: v.array(v.id("bookings")),
        invoiceDate: v.string(),
        dueDate: v.string(),
        createdAt: v.number(),
        createdBy: v.string(),
        updatedAt: v.number(),
        xeroUrl: v.optional(v.string()),
    })
        .index("by_org", ["orgId"])
        .index("by_xero_invoice_id", ["xeroInvoiceId"])
        .index("by_status", ["orgId", "status"]),

    // Xero Contacts cache
    xeroContacts: defineTable({
        orgId: v.string(),
        xeroContactId: v.string(),
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
        isCustomer: v.boolean(),
        cachedAt: v.number(),
    })
        .index("by_org", ["orgId"])
        .index("by_xero_contact_id", ["orgId", "xeroContactId"])
        .index("by_name", ["orgId", "name"]),

    // Stripe Connect accounts
    stripeAccounts: defineTable({
        orgId: v.string(),
        stripeAccountId: v.string(),
        accountStatus: v.string(),
        chargesEnabled: v.boolean(),
        payoutsEnabled: v.boolean(),
        detailsSubmitted: v.boolean(),
        currentlyDue: v.optional(v.array(v.string())),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_org", ["orgId"])
      .index("by_stripe_account", ["stripeAccountId"]),

    // Payment records
    payments: defineTable({
        orgId: v.string(),
        bookingId: v.id("bookings"),
        stripePaymentIntentId: v.optional(v.string()),
        stripeCheckoutSessionId: v.optional(v.string()),
        amount: v.number(),
        currency: v.string(),
        status: v.string(),
        paymentMethod: v.optional(v.string()),
        customerEmail: v.optional(v.string()),
        source: v.string(),
        failureCode: v.optional(v.string()),
        failureMessage: v.optional(v.string()),
        refundedAmount: v.optional(v.number()),
        metadata: v.optional(v.object({
            customerName: v.string(),
            customerPhone: v.string(),
        })),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_booking", ["bookingId"])
      .index("by_org", ["orgId"])
      .index("by_payment_intent", ["stripePaymentIntentId"])
      .index("by_checkout_session", ["stripeCheckoutSessionId"]),

    // Payment links
    paymentLinks: defineTable({
        orgId: v.string(),
        bookingId: v.id("bookings"),
        stripePaymentLinkId: v.string(),
        url: v.string(),
        amount: v.number(),
        currency: v.string(),
        active: v.boolean(),
        expiresAt: v.optional(v.number()),
        createdBy: v.string(),
        createdAt: v.number(),
    }).index("by_booking", ["bookingId"])
      .index("by_org", ["orgId"])
      .index("by_stripe_link", ["stripePaymentLinkId"]),

    // Users - links Clerk users to orgs with roles
    users: defineTable({
        clerkUserId: v.string(), // Clerk user ID (user_xxx)
        email: v.string(),
        name: v.optional(v.string()),
        orgId: v.string(), // References organizations.clerkOrgId
        role: v.union(
            v.literal("admin"),
            v.literal("dispatcher"),
            v.literal("driver")
        ),
        driverId: v.optional(v.id("drivers")), // Link to driver record (for driver role)
        createdAt: v.number(),
        invitedBy: v.optional(v.string()), // clerkUserId of inviter
    })
        .index("by_clerk_user_id", ["clerkUserId"])
        .index("by_org_id", ["orgId"])
        .index("by_org_and_role", ["orgId", "role"]),

    // Invites - pending organization invitations
    invites: defineTable({
        orgId: v.string(), // Organization clerkOrgId
        code: v.string(), // 6-character invite code
        email: v.optional(v.string()), // Optionally restrict to email
        role: v.union(
            v.literal("dispatcher"),
            v.literal("driver")
        ),
        createdBy: v.string(), // clerkUserId of creator
        createdAt: v.number(),
        expiresAt: v.number(),
        usedAt: v.optional(v.number()),
        usedBy: v.optional(v.string()),
    })
        .index("by_code", ["code"])
        .index("by_org", ["orgId"]),

    // OAuth States - temporary storage for OAuth state tokens (CSRF protection)
    oauthStates: defineTable({
        stateToken: v.string(),          // Random state token
        orgId: v.string(),               // Organization this flow is for
        userId: v.string(),              // User who initiated the flow
        createdAt: v.number(),           // When the state was created
        expiresAt: v.number(),           // When the state expires (10 min)
        usedAt: v.optional(v.number()),  // When the state was used (for audit)
    })
        .index("by_state_token", ["stateToken"]),

    // =====================================================
    // WhatsApp Integration Tables
    // =====================================================

    // WhatsApp configuration per organization (Twilio credentials)
    whatsappConfig: defineTable({
        orgId: v.string(), // Organization clerkOrgId
        twilioAccountSid: v.string(),
        twilioAuthToken: v.string(), // Encrypted in production
        twilioPhoneNumber: v.string(), // WhatsApp Business number (e.g., +14155238886)
        enabled: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_org", ["orgId"]),

    // Message log for audit trail & debugging
    whatsappMessages: defineTable({
        orgId: v.string(),
        bookingId: v.optional(v.id("bookings")),
        driverId: v.optional(v.id("drivers")),
        direction: v.union(v.literal("outbound"), v.literal("inbound")),
        recipientPhone: v.string(),
        messageType: v.string(), // BOOKING_CONFIRM, DRIVER_DISPATCH, DRIVER_ACCEPT, etc.
        content: v.string(),
        twilioSid: v.optional(v.string()), // Twilio message SID
        status: v.string(), // QUEUED, SENT, DELIVERED, READ, FAILED
        errorMessage: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_org", ["orgId"])
        .index("by_booking", ["bookingId"])
        .index("by_twilio_sid", ["twilioSid"]),

    // Conversation state for driver interactions (state machine)
    whatsappConversations: defineTable({
        orgId: v.string(),
        driverId: v.id("drivers"),
        phone: v.string(),
        currentBookingId: v.optional(v.id("bookings")),
        state: v.string(), // IDLE, AWAITING_ACCEPT, AWAITING_START, IN_PROGRESS
        lastMessageAt: v.number(),
        expiresAt: v.optional(v.number()), // 24hr WhatsApp session window
    })
        .index("by_phone", ["phone"])
        .index("by_driver", ["driverId"])
        .index("by_org", ["orgId"]),
});
