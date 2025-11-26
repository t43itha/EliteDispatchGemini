import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

        return await ctx.db
            .query("drivers")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        phone: v.string(),
        vehicle: v.string(),
        plate: v.string(),
        location: v.string(),
        vehicleColour: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin", "dispatcher"]);

        return await ctx.db.insert("drivers", {
            orgId: auth.orgId,
            ...args,
            status: "AVAILABLE",
            rating: 5.0,
        });
    },
});

export const updateStatus = mutation({
    args: { id: v.id("drivers"), status: v.string() },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const driver = await ctx.db.get(args.id);
        if (!driver || driver.orgId !== auth.orgId) {
            throw new Error("Driver not found");
        }

        // Drivers can only update their own status
        if (auth.role === "driver" && auth.user.driverId !== args.id) {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const update = mutation({
    args: {
        id: v.id("drivers"),
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        vehicle: v.optional(v.string()),
        plate: v.optional(v.string()),
        location: v.optional(v.string()),
        vehicleColour: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin", "dispatcher"]);

        const driver = await ctx.db.get(args.id);
        if (!driver || driver.orgId !== auth.orgId) {
            throw new Error("Driver not found");
        }

        const { id, ...updates } = args;
        // Filter out undefined values
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(args.id, filteredUpdates);
    },
});

export const remove = mutation({
    args: { id: v.id("drivers") },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const driver = await ctx.db.get(args.id);
        if (!driver || driver.orgId !== auth.orgId) {
            throw new Error("Driver not found");
        }

        await ctx.db.delete(args.id);
    },
});
