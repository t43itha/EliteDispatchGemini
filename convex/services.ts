import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, getAuthOrNull } from "./lib/auth";

export const list = query({
    args: {},
    handler: async (ctx) => {
        // For queries, return empty if not authenticated (don't throw)
        const auth = await getAuthOrNull(ctx);
        if (!auth) return [];

        return await ctx.db
            .query("services")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .order("desc")
            .collect();
    },
});

export const create = mutation({
    args: {
        date: v.string(),
        description: v.string(),
        vendor: v.string(),
        cost: v.number(),
        serviceChargePercent: v.number(),
        driverId: v.optional(v.id("drivers")),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin", "dispatcher"]);

        // Verify driver belongs to org if provided
        if (args.driverId) {
            const driver = await ctx.db.get(args.driverId);
            if (!driver || driver.orgId !== auth.orgId) {
                throw new Error("Driver not found");
            }
        }

        const serviceFee = args.cost * (args.serviceChargePercent / 100);
        const total = args.cost + serviceFee;

        return await ctx.db.insert("services", {
            orgId: auth.orgId,
            ...args,
            serviceFee,
            total,
            status: "PENDING",
        });
    },
});

export const updateStatus = mutation({
    args: { id: v.id("services"), status: v.string() },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin", "dispatcher"]);

        const service = await ctx.db.get(args.id);
        if (!service || service.orgId !== auth.orgId) {
            throw new Error("Service not found");
        }

        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("services") },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx, ["admin"]);

        const service = await ctx.db.get(args.id);
        if (!service || service.orgId !== auth.orgId) {
            throw new Error("Service not found");
        }

        await ctx.db.delete(args.id);
    },
});
