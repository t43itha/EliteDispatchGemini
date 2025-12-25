import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Line item input from frontend
 */
const lineItemInput = v.object({
    description: v.string(),
    quantity: v.number(),
    unitAmount: v.number(),
    taxType: v.string(),       // "OUTPUT2" (20% VAT) or "NONE"
    bookingId: v.optional(v.string()),  // Link to booking if from booking
});

/**
 * Create invoice(s) from selected bookings
 * Main orchestration action that handles both single and bulk invoicing
 */
export const createInvoiceFromBookings = action({
    args: {
        contactId: v.string(),         // Xero contact ID
        contactName: v.string(),       // Contact name
        bookingIds: v.array(v.string()), // Booking IDs to invoice
        extraLineItems: v.array(lineItemInput), // Additional items (parking, tolls)
        combineInvoices: v.boolean(),  // true = one invoice, false = separate
        dueDate: v.string(),           // ISO date string
    },
    handler: async (ctx, args): Promise<{
        success: boolean;
        invoices: Array<{
            invoiceId?: string;
            xeroInvoiceNumber?: string;
            xeroUrl?: string;
            error?: string;
        }>;
        error?: string;
    }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, invoices: [], error: "Not authenticated" };
        }
        const orgId = (identity as any).org_id as string;
        if (!orgId) {
            return { success: false, invoices: [], error: "No organization selected" };
        }

        // Fetch booking details
        const bookings = await ctx.runQuery(api.bookings.list, {});
        const selectedBookings = bookings.filter((b: any) =>
            args.bookingIds.includes(b._id)
        );

        if (selectedBookings.length === 0) {
            return { success: false, invoices: [], error: "No valid bookings found" };
        }

        // Validate bookings are completed
        const notCompleted = selectedBookings.filter((b: any) => b.status !== "COMPLETED");
        if (notCompleted.length > 0) {
            return {
                success: false,
                invoices: [],
                error: `${notCompleted.length} booking(s) are not completed. Only completed bookings can be invoiced.`,
            };
        }

        // Validate bookings aren't already invoiced
        const alreadyInvoiced = selectedBookings.filter((b: any) => b.paymentStatus === "INVOICED");
        if (alreadyInvoiced.length > 0) {
            return {
                success: false,
                invoices: [],
                error: `${alreadyInvoiced.length} booking(s) have already been invoiced.`,
            };
        }

        const today = new Date().toISOString().split("T")[0];
        const results: Array<{
            invoiceId?: string;
            xeroInvoiceNumber?: string;
            xeroUrl?: string;
            error?: string;
        }> = [];

        if (args.combineInvoices) {
            // Create single combined invoice
            const lineItems = [
                // Add booking line items
                ...selectedBookings.map((booking: any) => ({
                    description: `Transport: ${booking.pickupLocation} → ${booking.dropoffLocation} (${new Date(booking.pickupTime).toLocaleDateString("en-GB")})`,
                    quantity: 1,
                    unitAmount: booking.price,
                    taxType: "OUTPUT2", // Default to 20% VAT, can be overridden in UI
                    lineAmount: booking.price,
                    bookingId: booking._id,
                })),
                // Add extra line items
                ...args.extraLineItems.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitAmount: item.unitAmount,
                    taxType: item.taxType,
                    lineAmount: item.quantity * item.unitAmount,
                    bookingId: item.bookingId || undefined,
                })),
            ];

            const result = await ctx.runAction(api.xero.invoices.createInvoice, {
                contactId: args.contactId,
                contactName: args.contactName,
                lineItems,
                bookingIds: selectedBookings.map((b: any) => b._id),
                invoiceDate: today,
                dueDate: args.dueDate,
                reference: selectedBookings.length > 1
                    ? `Combined invoice for ${selectedBookings.length} bookings`
                    : undefined,
            });

            results.push(result);
        } else {
            // Create separate invoices for each booking
            for (const booking of selectedBookings) {
                const lineItems = [
                    {
                        description: `Transport: ${booking.pickupLocation} → ${booking.dropoffLocation} (${new Date(booking.pickupTime).toLocaleDateString("en-GB")})`,
                        quantity: 1,
                        unitAmount: booking.price,
                        taxType: "OUTPUT2",
                        lineAmount: booking.price,
                        bookingId: booking._id,
                    },
                    // Add extra line items that match this booking
                    ...args.extraLineItems
                        .filter((item) => item.bookingId === booking._id || !item.bookingId)
                        .map((item) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitAmount: item.unitAmount,
                            taxType: item.taxType,
                            lineAmount: item.quantity * item.unitAmount,
                            bookingId: undefined,
                        })),
                ];

                const result = await ctx.runAction(api.xero.invoices.createInvoice, {
                    contactId: args.contactId,
                    contactName: args.contactName,
                    lineItems,
                    bookingIds: [booking._id],
                    invoiceDate: today,
                    dueDate: args.dueDate,
                });

                results.push(result);
            }
        }

        const allSuccessful = results.every((r) => r.success);

        return {
            success: allSuccessful,
            invoices: results,
            error: allSuccessful ? undefined : "Some invoices failed to create",
        };
    },
});

/**
 * Get completed bookings that can be invoiced
 * Filters to COMPLETED status and not already INVOICED
 */
export const getInvoiceableBookings = query({
    args: {},
    handler: async (ctx) => {
        const bookings = await ctx.runQuery(api.bookings.list, {});

        return bookings
            .filter((b: any) =>
                b.status === "COMPLETED" &&
                b.paymentStatus !== "INVOICED"
            )
            .map((b: any) => ({
                id: b._id,
                customerName: b.customerName,
                customerEmail: b.customerEmail,
                pickupLocation: b.pickupLocation,
                dropoffLocation: b.dropoffLocation,
                pickupTime: b.pickupTime,
                price: b.price,
                vehicleClass: b.vehicleClass,
                distance: b.distance,
            }));
    },
});

/**
 * Check if organization has Xero connected
 * Used by frontend to show/hide invoice buttons
 */
export const canCreateInvoices = query({
    args: {},
    handler: async (ctx) => {
        const status = await ctx.runQuery(api.xero.oauth.getConnectionStatus, {});
        return {
            canInvoice: status.connected && !status.isExpired,
            reason: !status.connected
                ? "Xero not connected"
                : status.isExpired
                    ? "Xero connection expired"
                    : null,
        };
    },
});
