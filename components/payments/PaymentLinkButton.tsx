/**
 * Payment Link Button Component
 *
 * Button to create and copy a payment link for an existing booking.
 * Shows in booking rows for unpaid bookings.
 */

import React, { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Link, Copy, Check, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface PaymentLinkButtonProps {
    bookingId: Id<"bookings">;
    compact?: boolean;
    className?: string;
}

export const PaymentLinkButton: React.FC<PaymentLinkButtonProps> = ({
    bookingId,
    compact = false,
    className = "",
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canCreate = useQuery(api.payments.paymentLinks.canCreatePaymentLink, { bookingId });
    const existingLinks = useQuery(api.payments.paymentLinks.getPaymentLinksForBooking, { bookingId });
    const createPaymentLink = useAction(api.payments.paymentLinks.createPaymentLink);

    const handleCreateLink = async () => {
        setIsCreating(true);
        setError(null);

        try {
            const result = await createPaymentLink({ bookingId });
            setCopiedUrl(result.url);
            await navigator.clipboard.writeText(result.url);

            // Auto-clear copied state after 3 seconds
            setTimeout(() => setCopiedUrl(null), 3000);
        } catch (err: any) {
            console.error("Failed to create payment link:", err);
            setError(err.message || "Failed to create payment link");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyExisting = async (url: string) => {
        await navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 3000);
    };

    // Loading state
    if (canCreate === undefined) {
        return null;
    }

    // Can't create (already paid or no Stripe)
    if (!canCreate.canCreate) {
        if (canCreate.reason === "Already paid") {
            return null; // Don't show anything for paid bookings
        }
        if (canCreate.reason === "Stripe not connected") {
            return (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {compact ? "No Stripe" : "Connect Stripe to accept payments"}
                </span>
            );
        }
        return null;
    }

    // Has existing active link
    const activeLink = existingLinks?.find((l) => l.active);
    if (activeLink) {
        const isCopied = copiedUrl === activeLink.url;
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <button
                    onClick={() => handleCopyExisting(activeLink.url)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCopied
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                >
                    {isCopied ? (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            {compact ? "Copy" : "Copy Payment Link"}
                        </>
                    )}
                </button>
                <a
                    href={activeLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Open payment link"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>
        );
    }

    // Create new link button
    return (
        <div className={className}>
            {error && (
                <span className="text-xs text-red-500 mb-1 block">{error}</span>
            )}
            <button
                onClick={handleCreateLink}
                disabled={isCreating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copiedUrl
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isCreating ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                    </>
                ) : copiedUrl ? (
                    <>
                        <Check className="w-3.5 h-3.5" />
                        Link Copied!
                    </>
                ) : (
                    <>
                        <Link className="w-3.5 h-3.5" />
                        {compact ? "Payment Link" : "Create Payment Link"}
                    </>
                )}
            </button>
        </div>
    );
};

export default PaymentLinkButton;
