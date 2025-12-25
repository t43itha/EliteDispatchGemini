import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../lib/auth";
import { xeroFetch } from "./client";
import { internal } from "../_generated/api";

// Xero invoice response types
interface XeroInvoiceFromApi {
    InvoiceID: string;
    InvoiceNumber: string;
    Status: string;
    Contact: { ContactID: string; Name: string };
    LineItems: Array<{
        Description: string;
        Quantity: number;
        UnitAmount: number;
        TaxType: string;
        LineAmount: number;
    }>;
    SubTotal: number;
    TotalTax: number;
    Total: number;
    AmountDue: number;
    AmountPaid: number;
    CurrencyCode: string;
    Date: string;
    DueDate: string;
}

// Line item validator for mutations
const lineItemValidator = v.object({
    description: v.string(),
    quantity: v.number(),
    unitAmount: v.number(),
    taxType: v.string(), // OUTPUT2 (20% VAT) or NONE
    lineAmount: v.number(),
    bookingId: v.optional(v.id("bookings")),
});

/**
 * Create invoice in Xero
 * Main action that sends invoice to Xero API
 */
export const createInvoice = action({
    args: {
        contactId: v.string(),        // Xero contact ID
        contactName: v.string(),      // Contact name (for our record)
        lineItems: v.array(lineItemValidator),
        bookingIds: v.array(v.id("bookings")),
        invoiceDate: v.string(),      // ISO date string
        dueDate: v.string(),          // ISO date string
        reference: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{
        success: boolean;
        invoiceId?: string;
        xeroInvoiceNumber?: string;
        xeroUrl?: string;
        error?: string;
    }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Not authenticated" };
        }
        const orgId = (identity as any).org_id as string;
        const userId = identity.subject;
        if (!orgId) {
            return { success: false, error: "No organization selected" };
        }

        // Validate line items
        if (args.lineItems.length === 0) {
            return { success: false, error: "At least one line item is required" };
        }

        for (const item of args.lineItems) {
            if (!item.description || item.description.trim().length === 0) {
                return { success: false, error: "Line item description cannot be empty" };
            }
            if (item.quantity <= 0) {
                return { success: false, error: "Line item quantity must be greater than 0" };
            }
            if (item.unitAmount < 0) {
                return { success: false, error: "Line item unit amount cannot be negative" };
            }
            if (!["OUTPUT2", "NONE"].includes(item.taxType)) {
                return { success: false, error: "Invalid tax type. Must be OUTPUT2 (VAT) or NONE" };
            }
        }

        // Build Xero invoice payload
        const xeroInvoice = {
            Type: "ACCREC", // Accounts Receivable (sales invoice)
            Contact: { ContactID: args.contactId },
            Date: args.invoiceDate,
            DueDate: args.dueDate,
            Reference: args.reference,
            LineItems: args.lineItems.map((item) => ({
                Description: item.description,
                Quantity: item.quantity,
                UnitAmount: item.unitAmount,
                TaxType: item.taxType,
                AccountCode: "200", // Default sales account - may need to be configurable
            })),
            Status: "DRAFT", // Create as draft, user can approve in Xero
        };

        // Send to Xero
        const response = await xeroFetch<{ Invoices: XeroInvoiceFromApi[] }>(
            ctx,
            orgId,
            "/Invoices",
            {
                method: "POST",
                body: { Invoices: [xeroInvoice] },
            }
        );

        if (!response.success || !response.data?.Invoices?.[0]) {
            return { success: false, error: response.error || "Failed to create invoice in Xero" };
        }

        const createdInvoice = response.data.Invoices[0];

        // Calculate totals from line items
        const subtotal = args.lineItems.reduce((sum, item) => sum + item.lineAmount, 0);
        const totalTax = args.lineItems.reduce((sum, item) => {
            if (item.taxType === "OUTPUT2") {
                return sum + (item.lineAmount * 0.2); // 20% VAT
            }
            return sum;
        }, 0);
        const total = subtotal + totalTax;

        // Store invoice in our database
        const invoiceId = await ctx.runMutation(internal.xero.invoices.storeInvoice, {
            orgId,
            xeroInvoiceId: createdInvoice.InvoiceID,
            xeroInvoiceNumber: createdInvoice.InvoiceNumber,
            status: createdInvoice.Status,
            xeroContactId: args.contactId,
            contactName: args.contactName,
            subtotal: createdInvoice.SubTotal || subtotal,
            totalTax: createdInvoice.TotalTax || totalTax,
            total: createdInvoice.Total || total,
            amountDue: createdInvoice.AmountDue || total,
            amountPaid: createdInvoice.AmountPaid || 0,
            currencyCode: createdInvoice.CurrencyCode || "GBP",
            lineItems: args.lineItems,
            bookingIds: args.bookingIds,
            invoiceDate: args.invoiceDate,
            dueDate: args.dueDate,
            createdBy: userId,
        });

        // Update booking payment statuses
        await ctx.runMutation(internal.xero.invoices.updateBookingsToInvoiced, {
            bookingIds: args.bookingIds,
        });

        // Generate Xero URL (deep link to invoice)
        const xeroUrl = `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${createdInvoice.InvoiceID}`;

        return {
            success: true,
            invoiceId,
            xeroInvoiceNumber: createdInvoice.InvoiceNumber,
            xeroUrl,
        };
    },
});

/**
 * Internal mutation to store invoice in database
 */
export const storeInvoice = mutation({
    args: {
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
        lineItems: v.array(lineItemValidator),
        bookingIds: v.array(v.id("bookings")),
        invoiceDate: v.string(),
        dueDate: v.string(),
        createdBy: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const invoiceId = await ctx.db.insert("invoices", {
            orgId: args.orgId,
            xeroInvoiceId: args.xeroInvoiceId,
            xeroInvoiceNumber: args.xeroInvoiceNumber,
            status: args.status,
            xeroContactId: args.xeroContactId,
            contactName: args.contactName,
            subtotal: args.subtotal,
            totalTax: args.totalTax,
            total: args.total,
            amountDue: args.amountDue,
            amountPaid: args.amountPaid,
            currencyCode: args.currencyCode,
            lineItems: args.lineItems,
            bookingIds: args.bookingIds,
            invoiceDate: args.invoiceDate,
            dueDate: args.dueDate,
            createdAt: now,
            createdBy: args.createdBy,
            updatedAt: now,
            xeroUrl: `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${args.xeroInvoiceId}`,
        });

        return invoiceId;
    },
});

/**
 * Internal mutation to update bookings to INVOICED status
 */
export const updateBookingsToInvoiced = mutation({
    args: {
        bookingIds: v.array(v.id("bookings")),
    },
    handler: async (ctx, args) => {
        for (const bookingId of args.bookingIds) {
            await ctx.db.patch(bookingId, {
                paymentStatus: "INVOICED",
            });
        }
    },
});

/**
 * Sync invoice status from Xero
 */
export const syncInvoiceStatus = action({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args): Promise<{ success: boolean; status?: string; error?: string }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Not authenticated" };
        }
        const orgId = (identity as any).org_id as string;
        if (!orgId) {
            return { success: false, error: "No organization selected" };
        }

        // Get our invoice record
        const invoice = await ctx.runQuery(internal.xero.invoices.getInvoiceInternal, {
            invoiceId: args.invoiceId,
        });

        if (!invoice) {
            return { success: false, error: "Invoice not found" };
        }

        // Fetch from Xero
        const response = await xeroFetch<{ Invoices: XeroInvoiceFromApi[] }>(
            ctx,
            orgId,
            `/Invoices/${invoice.xeroInvoiceId}`
        );

        if (!response.success || !response.data?.Invoices?.[0]) {
            return { success: false, error: response.error || "Failed to fetch invoice from Xero" };
        }

        const xeroInvoice = response.data.Invoices[0];

        // Update our record
        await ctx.runMutation(internal.xero.invoices.updateInvoiceStatus, {
            invoiceId: args.invoiceId,
            status: xeroInvoice.Status,
            amountDue: xeroInvoice.AmountDue,
            amountPaid: xeroInvoice.AmountPaid,
        });

        return { success: true, status: xeroInvoice.Status };
    },
});

/**
 * Internal query to get invoice
 */
export const getInvoiceInternal = query({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.invoiceId);
    },
});

/**
 * Internal mutation to update invoice status
 */
export const updateInvoiceStatus = mutation({
    args: {
        invoiceId: v.id("invoices"),
        status: v.string(),
        amountDue: v.number(),
        amountPaid: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.invoiceId, {
            status: args.status,
            amountDue: args.amountDue,
            amountPaid: args.amountPaid,
            updatedAt: Date.now(),
        });
    },
});

/**
 * List invoices for the organization
 */
export const listInvoices = query({
    args: {
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        let invoicesQuery = ctx.db
            .query("invoices")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId));

        const invoices = await invoicesQuery.order("desc").collect();

        // Filter by status if provided
        const filtered = args.status
            ? invoices.filter((inv) => inv.status === args.status)
            : invoices;

        return filtered.map((inv) => ({
            id: inv._id,
            xeroInvoiceId: inv.xeroInvoiceId,
            xeroInvoiceNumber: inv.xeroInvoiceNumber,
            status: inv.status,
            contactName: inv.contactName,
            total: inv.total,
            amountDue: inv.amountDue,
            amountPaid: inv.amountPaid,
            currencyCode: inv.currencyCode,
            invoiceDate: inv.invoiceDate,
            dueDate: inv.dueDate,
            createdAt: inv.createdAt,
            xeroUrl: inv.xeroUrl,
            bookingIds: inv.bookingIds,
        }));
    },
});

/**
 * Get single invoice with full details
 */
export const getInvoice = query({
    args: { id: v.id("invoices") },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const invoice = await ctx.db.get(args.id);

        if (!invoice || invoice.orgId !== auth.orgId) {
            return null;
        }

        return {
            id: invoice._id,
            xeroInvoiceId: invoice.xeroInvoiceId,
            xeroInvoiceNumber: invoice.xeroInvoiceNumber,
            status: invoice.status,
            xeroContactId: invoice.xeroContactId,
            contactName: invoice.contactName,
            subtotal: invoice.subtotal,
            totalTax: invoice.totalTax,
            total: invoice.total,
            amountDue: invoice.amountDue,
            amountPaid: invoice.amountPaid,
            currencyCode: invoice.currencyCode,
            lineItems: invoice.lineItems,
            bookingIds: invoice.bookingIds,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            createdAt: invoice.createdAt,
            createdBy: invoice.createdBy,
            xeroUrl: invoice.xeroUrl,
        };
    },
});

/**
 * Get invoices for specific bookings
 */
export const getInvoicesForBookings = query({
    args: { bookingIds: v.array(v.id("bookings")) },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .collect();

        // Filter invoices that contain any of the booking IDs
        return invoices.filter((inv) =>
            inv.bookingIds.some((id) => args.bookingIds.includes(id))
        ).map((inv) => ({
            id: inv._id,
            xeroInvoiceNumber: inv.xeroInvoiceNumber,
            status: inv.status,
            total: inv.total,
            xeroUrl: inv.xeroUrl,
        }));
    },
});
