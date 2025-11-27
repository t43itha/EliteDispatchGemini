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
        price: v.number(),
        status: v.string(), // BookingStatus
        driverId: v.optional(v.id("drivers")), // Reference to drivers table
        notes: v.optional(v.string()),
        vehicleClass: v.optional(v.string()),
        paymentStatus: v.optional(v.string()),
        distance: v.optional(v.string()),
        duration: v.optional(v.string()),
        isReturn: v.optional(v.boolean()),
    }).index("by_org_and_status", ["orgId", "status"]),

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
    }).index("by_org", ["orgId"]),

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
    }).index("by_clerk_org_id", ["clerkOrgId"]),

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
});
