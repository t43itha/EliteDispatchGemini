import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

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
