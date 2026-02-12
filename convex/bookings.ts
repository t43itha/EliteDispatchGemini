import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, getAuthOrNull } from "./lib/auth";
import { api } from "./_generated/api";

export const list = query({
    args: {},
    handler: async (ctx) => {
        // For queries, return empty if not authenticated (don't throw)
        const auth = await getAuthOrNull(ctx);
        if (!auth) return [];

        // Drivers can only see their assigned bookings
        if (auth.role === "driver") {
            const driverId = auth.user.driverId;
            if (!driverId) return [];

            return await ctx.db
                .query("bookings")
                .withIndex("by_org_and_status", (q) => q.eq("orgId", auth.orgId))
                .filter((q) => q.eq(q.field("driverId"), driverId))
                .order("desc")
                .collect();
        }

        // Admin/Dispatcher see all org bookings
        return await ctx.db
            .query("bookings")
            .withIndex("by_org_and_status", (q) => q.eq("orgId", auth.orgId))
            .order("desc")
            .collect();
    },
});

export const create = mutation({
    args: {
        customerName: v.string(),
        customerPhone: v.string(),
        pickupLocation: v.string(),
        dropoffLocation: v.string(),
        pickupTime: v.string(),
        passengers: v.number(),
        price: v.number(),
        notes: v.optional(v.string()),
        vehicleClass: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin", "dispatcher"]);

        return await ctx.db.insert("bookings", {
            orgId: auth.orgId,
            ...args,
            status: "PENDING",
            paymentStatus: "PENDING",
        });
    },
});

export const updateStatus = mutation({
    args: { id: v.id("bookings"), status: v.string() },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        // Verify booking belongs to user's org
        const booking = await ctx.db.get(args.id);
        if (!booking || booking.orgId !== auth.orgId) {
            throw new Error("Booking not found");
        }

        // Drivers can only update their own assigned bookings
        if (auth.role === "driver") {
            if (booking.driverId !== auth.user.driverId) {
                throw new Error("Access denied");
            }
            // Drivers can only mark as IN_PROGRESS or COMPLETED
            if (!["IN_PROGRESS", "COMPLETED"].includes(args.status)) {
                throw new Error(
                    "Drivers can only mark bookings as in progress or completed"
                );
            }
        }

        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const assignDriver = mutation({
    args: { id: v.id("bookings"), driverId: v.id("drivers") },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin", "dispatcher"]);

        // Verify booking belongs to org
        const booking = await ctx.db.get(args.id);
        if (!booking || booking.orgId !== auth.orgId) {
            throw new Error("Booking not found");
        }

        // Verify driver belongs to org
        const driver = await ctx.db.get(args.driverId);
        if (!driver || driver.orgId !== auth.orgId) {
            throw new Error("Driver not found");
        }

        await ctx.db.patch(args.id, {
            driverId: args.driverId,
            status: "ASSIGNED",
        });
    },
});

/**
 * Create a booking from the public widget (no auth required)
 * Used by embedded booking widgets on external websites
 */
export const createFromWidget = mutation({
    args: {
        orgId: v.string(), // Clerk org ID from widget URL
        customerName: v.string(),
        customerPhone: v.string(),
        customerEmail: v.optional(v.string()),
        pickupLocation: v.string(),
        dropoffLocation: v.string(),
        pickupTime: v.string(),
        passengers: v.number(),

        // Pricing inputs (server-calculated price)
        vehicleClass: v.string(),
        distance: v.number(), // Distance in org widget config unit

        // Display-only / non-authoritative fields
        notes: v.optional(v.string()),
        duration: v.optional(v.string()),
        isReturn: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Verify the organization exists (no auth required)
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.orgId))
            .first();

        if (!org) {
            throw new Error("Organization not found");
        }

        // Calculate price server-side (do NOT trust client-provided prices)
        const price = await ctx.runQuery(api.payments.pricing.calculatePrice, {
            orgId: args.orgId,
            vehicleClass: args.vehicleClass,
            distance: args.distance,
        });

        // Create the booking
        return await ctx.db.insert("bookings", {
            orgId: args.orgId,
            customerName: args.customerName,
            customerPhone: args.customerPhone,
            customerEmail: args.customerEmail,
            pickupLocation: args.pickupLocation,
            dropoffLocation: args.dropoffLocation,
            pickupTime: args.pickupTime,
            passengers: args.passengers,

            // Authoritative pricing fields
            price: price.total,
            currency: price.currency,
            priceValidated: true,

            status: "PENDING",
            paymentStatus: "PENDING",

            vehicleClass: args.vehicleClass,
            notes: args.notes,

            // Optional informational fields
            distance: `${args.distance} ${price.distanceUnit}`,
            duration: args.duration,
            isReturn: args.isReturn,
        });
    },
});
