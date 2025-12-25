/**
 * Server-side price validation module
 *
 * All prices must be calculated and validated server-side to prevent
 * client-side manipulation. This module provides price calculation
 * and validation functions.
 */

import { query, internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Currency configuration
const CURRENCY_CONFIG: Record<string, { symbol: string; code: string; decimals: number }> = {
    "£": { symbol: "£", code: "gbp", decimals: 2 },
    "$": { symbol: "$", code: "usd", decimals: 2 },
    "€": { symbol: "€", code: "eur", decimals: 2 },
};

// Convert display price to smallest currency unit (e.g., pounds to pence)
function toSmallestUnit(amount: number, decimals: number = 2): number {
    return Math.round(amount * Math.pow(10, decimals));
}

// Convert smallest unit to display price (e.g., pence to pounds)
export function fromSmallestUnit(amount: number, decimals: number = 2): number {
    return amount / Math.pow(10, decimals);
}

/**
 * Calculate price for a booking (public query for widget)
 * Returns the validated price breakdown
 */
export const calculatePrice = query({
    args: {
        orgId: v.string(),
        vehicleClass: v.string(), // "Business Class", "First Class", "Business Van"
        distance: v.number(), // Distance in the org's configured unit
    },
    handler: async (ctx, args) => {
        // Get organization and widget config
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.orgId))
            .first();

        if (!org) {
            throw new Error("Organization not found");
        }

        if (!org.widgetConfig) {
            throw new Error("Widget not configured for this organization");
        }

        const config = org.widgetConfig;

        // Map vehicle class to config key
        const vehicleKey = args.vehicleClass.replace(/ /g, "_") as
            | "Business_Class"
            | "First_Class"
            | "Business_Van";

        const vehicleConfig = config.vehicles[vehicleKey];
        if (!vehicleConfig || !vehicleConfig.enabled) {
            throw new Error(`Vehicle class "${args.vehicleClass}" is not available`);
        }

        // Calculate price
        const basePrice = vehicleConfig.basePrice;
        const distancePrice = args.distance * vehicleConfig.pricePerUnit;
        const totalDisplay = basePrice + distancePrice;

        // Get currency info
        const currencyInfo = CURRENCY_CONFIG[config.currency] || CURRENCY_CONFIG["£"];

        // Convert to smallest unit for Stripe
        const totalSmallestUnit = toSmallestUnit(totalDisplay, currencyInfo.decimals);

        return {
            basePrice: toSmallestUnit(basePrice, currencyInfo.decimals),
            distancePrice: toSmallestUnit(distancePrice, currencyInfo.decimals),
            total: totalSmallestUnit,
            totalDisplay: totalDisplay, // For UI display
            currency: currencyInfo.code,
            currencySymbol: currencyInfo.symbol,
            vehicleClass: args.vehicleClass,
            vehicleName: vehicleConfig.name,
            distance: args.distance,
            distanceUnit: config.distanceUnit,
            pricePerUnit: vehicleConfig.pricePerUnit,
        };
    },
});

/**
 * Validate a price submitted by the client
 * Returns true if the price matches server calculation within tolerance
 */
export const validatePrice = internalMutation({
    args: {
        orgId: v.string(),
        vehicleClass: v.string(),
        distance: v.number(),
        clientPrice: v.number(), // Price submitted by client in smallest unit
        tolerance: v.optional(v.number()), // Allowed difference (default 1 = 1 pence)
    },
    handler: async (ctx, args) => {
        // Get organization and widget config
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.orgId))
            .first();

        if (!org || !org.widgetConfig) {
            return {
                valid: false,
                reason: "Organization or widget config not found",
                serverPrice: 0,
            };
        }

        const config = org.widgetConfig;

        // Map vehicle class to config key
        const vehicleKey = args.vehicleClass.replace(/ /g, "_") as
            | "Business_Class"
            | "First_Class"
            | "Business_Van";

        const vehicleConfig = config.vehicles[vehicleKey];
        if (!vehicleConfig || !vehicleConfig.enabled) {
            return {
                valid: false,
                reason: `Vehicle class "${args.vehicleClass}" is not available`,
                serverPrice: 0,
            };
        }

        // Calculate server price
        const basePrice = vehicleConfig.basePrice;
        const distancePrice = args.distance * vehicleConfig.pricePerUnit;
        const totalDisplay = basePrice + distancePrice;

        const currencyInfo = CURRENCY_CONFIG[config.currency] || CURRENCY_CONFIG["£"];
        const serverPrice = toSmallestUnit(totalDisplay, currencyInfo.decimals);

        // Check if prices match within tolerance
        const tolerance = args.tolerance ?? 1; // Default 1 pence tolerance
        const priceDiff = Math.abs(serverPrice - args.clientPrice);

        if (priceDiff > tolerance) {
            console.warn(
                `Price mismatch for org ${args.orgId}: client=${args.clientPrice}, server=${serverPrice}, diff=${priceDiff}`
            );
            return {
                valid: false,
                reason: `Price mismatch: expected ${serverPrice}, got ${args.clientPrice}`,
                serverPrice,
            };
        }

        return {
            valid: true,
            serverPrice,
            currency: currencyInfo.code,
        };
    },
});

/**
 * Get the Stripe-compatible currency code from a display symbol
 */
export const getCurrencyCode = query({
    args: {
        currencySymbol: v.string(),
    },
    handler: async (_, args) => {
        const info = CURRENCY_CONFIG[args.currencySymbol];
        return info ? info.code : "gbp"; // Default to GBP
    },
});

/**
 * Format a price in smallest unit for display
 */
export function formatPrice(amountSmallest: number, currencySymbol: string): string {
    const info = CURRENCY_CONFIG[currencySymbol] || CURRENCY_CONFIG["£"];
    const displayAmount = fromSmallestUnit(amountSmallest, info.decimals);
    return `${info.symbol}${displayAmount.toFixed(info.decimals)}`;
}
