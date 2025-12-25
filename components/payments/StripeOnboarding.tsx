/**
 * Stripe Connect Onboarding Component
 *
 * Displays Stripe account status and handles onboarding flow
 * for connecting an organization's Stripe account.
 */

import React, { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    CreditCard,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    RefreshCw,
    Loader2,
    Shield,
    Zap,
    Building2,
} from "lucide-react";

interface StripeOnboardingProps {
    className?: string;
}

export const StripeOnboarding: React.FC<StripeOnboardingProps> = ({ className = "" }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const accountStatus = useQuery(api.payments.connect.getAccountStatus);
    const startOnboarding = useAction(api.payments.connect.startOnboarding);
    const refreshStatus = useAction(api.payments.connect.refreshAccountStatus);

    const handleStartOnboarding = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const baseUrl = window.location.origin;
            const result = await startOnboarding({
                refreshUrl: `${baseUrl}/settings?stripe=refresh`,
                returnUrl: `${baseUrl}/settings?stripe=complete`,
            });

            // Redirect to Stripe onboarding
            window.location.href = result.onboardingUrl;
        } catch (err: any) {
            console.error("Onboarding error:", err);
            setError(err.message || "Failed to start onboarding");
            setIsLoading(false);
        }
    };

    const handleRefreshStatus = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await refreshStatus();
        } catch (err: any) {
            console.error("Refresh error:", err);
            setError(err.message || "Failed to refresh status");
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (accountStatus === undefined) {
        return (
            <div className={`bg-white rounded-2xl border border-slate-200 p-8 ${className}`}>
                <div className="flex items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading payment settings...</span>
                </div>
            </div>
        );
    }

    // Connected and active
    if (accountStatus.canAcceptPayments) {
        return (
            <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                    <div className="flex items-center gap-3 text-white">
                        <CheckCircle className="w-6 h-6" />
                        <div>
                            <h3 className="font-bold text-lg">Payments Active</h3>
                            <p className="text-emerald-100 text-sm">
                                Your Stripe account is connected and ready to accept payments
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-600 mb-1">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-sm font-medium">Card Payments</span>
                            </div>
                            <span className="text-emerald-600 font-bold">Enabled</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-600 mb-1">
                                <Building2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Payouts</span>
                            </div>
                            <span className={accountStatus.payoutsEnabled ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                {accountStatus.payoutsEnabled ? "Enabled" : "Pending"}
                            </span>
                        </div>
                    </div>

                    {accountStatus.currentlyDue && accountStatus.currentlyDue.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-800">Action Required</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Please complete the following to enable all features:
                                    </p>
                                    <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                                        {accountStatus.currentlyDue.map((item: string, i: number) => (
                                            <li key={i}>{item.replace(/_/g, " ")}</li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={handleStartOnboarding}
                                        disabled={isLoading}
                                        className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                                    >
                                        Complete Setup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            Account: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{accountStatus.stripeAccountId}</code>
                        </p>
                        <button
                            onClick={handleRefreshStatus}
                            disabled={isLoading}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Connected but pending/restricted
    if (accountStatus.connected) {
        return (
            <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                    <div className="flex items-center gap-3 text-white">
                        <AlertCircle className="w-6 h-6" />
                        <div>
                            <h3 className="font-bold text-lg">Setup Incomplete</h3>
                            <p className="text-amber-100 text-sm">
                                Complete your Stripe onboarding to accept payments
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                            {error}
                        </div>
                    )}

                    <p className="text-slate-600">
                        Your Stripe account has been created but requires additional information
                        to start accepting payments.
                    </p>

                    {accountStatus.currentlyDue && accountStatus.currentlyDue.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="font-medium text-slate-700 mb-2">Required Information:</p>
                            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                {accountStatus.currentlyDue.map((item: string, i: number) => (
                                    <li key={i}>{item.replace(/_/g, " ")}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={handleStartOnboarding}
                        disabled={isLoading}
                        className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <ExternalLink className="w-5 h-5" />
                                Continue Setup on Stripe
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleRefreshStatus}
                        disabled={isLoading}
                        className="w-full py-2 text-slate-600 text-sm hover:text-slate-900 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh Status
                    </button>
                </div>
            </div>
        );
    }

    // Not connected - show onboarding CTA
    return (
        <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center text-white">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h3 className="font-bold text-2xl mb-2">Accept Payments</h3>
                <p className="text-indigo-100 max-w-md mx-auto">
                    Connect your Stripe account to accept credit card payments directly
                    from your booking widget.
                </p>
            </div>

            <div className="p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Shield className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                        <p className="font-medium text-slate-900">Secure</p>
                        <p className="text-xs text-slate-500 mt-1">
                            PCI-compliant payments
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Zap className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                        <p className="font-medium text-slate-900">Instant</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Get paid immediately
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Building2 className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                        <p className="font-medium text-slate-900">Direct</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Payments go to your account
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-600">
                        <strong>How it works:</strong> Customers pay directly through Stripe when
                        booking. Funds are deposited to your bank account, minus Stripe&apos;s
                        standard fees (2.9% + 30p per transaction).
                    </p>
                </div>

                <button
                    onClick={handleStartOnboarding}
                    disabled={isLoading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Setting up...
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-5 h-5" />
                            Connect Stripe Account
                        </>
                    )}
                </button>

                <p className="text-xs text-center text-slate-400">
                    You&apos;ll be redirected to Stripe to complete setup.
                    Takes about 5 minutes.
                </p>
            </div>
        </div>
    );
};

export default StripeOnboarding;
