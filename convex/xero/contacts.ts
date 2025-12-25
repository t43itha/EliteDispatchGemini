import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../lib/auth";
import { xeroFetch } from "./client";

interface XeroContactFromApi {
    ContactID: string;
    Name: string;
    EmailAddress?: string;
    Phones?: Array<{ PhoneNumber?: string; PhoneType: string }>;
    AccountNumber?: string;
    IsCustomer?: boolean;
    IsSupplier?: boolean;
}

/**
 * Sync contacts from Xero to local cache
 * Fetches all customers from Xero and stores them locally
 */
export const syncContacts = action({
    args: {},
    handler: async (ctx): Promise<{ success: boolean; count: number; error?: string }> => {
        // Get auth context
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, count: 0, error: "Not authenticated" };
        }
        const orgId = (identity as any).org_id as string;
        if (!orgId) {
            return { success: false, count: 0, error: "No organization selected" };
        }

        // Fetch contacts from Xero (customers only)
        const response = await xeroFetch<{ Contacts: XeroContactFromApi[] }>(
            ctx,
            orgId,
            "/Contacts?where=IsCustomer==true"
        );

        if (!response.success || !response.data) {
            return { success: false, count: 0, error: response.error || "Failed to fetch contacts" };
        }

        const contacts = response.data.Contacts || [];

        // Store contacts in database
        await ctx.runMutation(internal.xero.contacts.storeContacts, {
            orgId,
            contacts: contacts.map((c) => ({
                xeroContactId: c.ContactID,
                name: c.Name,
                email: c.EmailAddress,
                phone: c.Phones?.find((p) => p.PhoneType === "DEFAULT")?.PhoneNumber,
                accountNumber: c.AccountNumber,
                isCustomer: c.IsCustomer ?? true,
            })),
        });

        return { success: true, count: contacts.length };
    },
});

// Import internal for mutations
import { internal } from "../_generated/api";

/**
 * Internal mutation to store synced contacts
 */
export const storeContacts = mutation({
    args: {
        orgId: v.string(),
        contacts: v.array(
            v.object({
                xeroContactId: v.string(),
                name: v.string(),
                email: v.optional(v.string()),
                phone: v.optional(v.string()),
                accountNumber: v.optional(v.string()),
                isCustomer: v.boolean(),
            })
        ),
    },
    handler: async (ctx, args) => {
        // Delete existing contacts for this org (full refresh)
        const existingContacts = await ctx.db
            .query("xeroContacts")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();

        for (const contact of existingContacts) {
            await ctx.db.delete(contact._id);
        }

        // Insert new contacts
        const now = Date.now();
        for (const contact of args.contacts) {
            await ctx.db.insert("xeroContacts", {
                orgId: args.orgId,
                xeroContactId: contact.xeroContactId,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                accountNumber: contact.accountNumber,
                isCustomer: contact.isCustomer,
                cachedAt: now,
            });
        }
    },
});

/**
 * Get cached contacts for the organization
 */
export const listCachedContacts = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

        const contacts = await ctx.db
            .query("xeroContacts")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .collect();

        return contacts.map((c) => ({
            id: c._id,
            xeroContactId: c.xeroContactId,
            name: c.name,
            email: c.email,
            phone: c.phone,
            accountNumber: c.accountNumber,
            isCustomer: c.isCustomer,
            cachedAt: c.cachedAt,
        }));
    },
});

/**
 * Search contacts by name (uses cached contacts)
 */
export const searchContacts = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const contacts = await ctx.db
            .query("xeroContacts")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .collect();

        // Filter by name (case-insensitive)
        const searchLower = args.query.toLowerCase();
        const filtered = contacts.filter((c) =>
            c.name.toLowerCase().includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower) ||
            c.accountNumber?.toLowerCase().includes(searchLower)
        );

        return filtered.slice(0, 20).map((c) => ({
            id: c._id,
            xeroContactId: c.xeroContactId,
            name: c.name,
            email: c.email,
            phone: c.phone,
            accountNumber: c.accountNumber,
            isCustomer: c.isCustomer,
        }));
    },
});

/**
 * Search contacts directly from Xero API (for fresh results)
 */
export const searchXeroContacts = action({
    args: { query: v.string() },
    handler: async (ctx, args): Promise<{
        success: boolean;
        contacts: Array<{
            xeroContactId: string;
            name: string;
            email?: string;
            phone?: string;
        }>;
        error?: string;
    }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, contacts: [], error: "Not authenticated" };
        }
        const orgId = (identity as any).org_id as string;
        if (!orgId) {
            return { success: false, contacts: [], error: "No organization selected" };
        }

        // Sanitize search query - remove any characters that could break the query
        // Only allow alphanumeric, spaces, and common punctuation
        const sanitizedQuery = args.query
            .replace(/[^a-zA-Z0-9\s\-_.,']/g, '')
            .trim()
            .substring(0, 100); // Limit length

        if (!sanitizedQuery) {
            return { success: false, contacts: [], error: "Invalid search query" };
        }

        // Build properly encoded WHERE clause
        // Xero uses OData-style filtering - use encodeURIComponent for the whole where clause
        const whereClause = `Name.Contains("${sanitizedQuery}") AND IsCustomer==true`;

        const response = await xeroFetch<{ Contacts: XeroContactFromApi[] }>(
            ctx,
            orgId,
            `/Contacts?where=${encodeURIComponent(whereClause)}`
        );

        if (!response.success || !response.data) {
            return { success: false, contacts: [], error: response.error };
        }

        return {
            success: true,
            contacts: (response.data.Contacts || []).slice(0, 20).map((c) => ({
                xeroContactId: c.ContactID,
                name: c.Name,
                email: c.EmailAddress,
                phone: c.Phones?.find((p) => p.PhoneType === "DEFAULT")?.PhoneNumber,
            })),
        };
    },
});

/**
 * Get the timestamp of when contacts were last synced
 */
export const getLastSyncTime = query({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);

        const firstContact = await ctx.db
            .query("xeroContacts")
            .withIndex("by_org", (q) => q.eq("orgId", auth.orgId))
            .first();

        return {
            lastSyncedAt: firstContact?.cachedAt || null,
            hasContacts: !!firstContact,
        };
    },
});
