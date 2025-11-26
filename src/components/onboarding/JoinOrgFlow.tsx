import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Loader2, Users, AlertCircle } from 'lucide-react';
import { useUser, useOrganizationList } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface JoinOrgFlowProps {
    onBack: () => void;
    onComplete: () => void;
}

export const JoinOrgFlow: React.FC<JoinOrgFlowProps> = ({
    onBack,
    onComplete,
}) => {
    const { user } = useUser();
    const { setActive } = useOrganizationList();
    const useInvite = useMutation(api.invites.useInvite);

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validate code as user types
    const validation = useQuery(
        api.invites.validate,
        code.length === 6 ? { code } : 'skip'
    );

    const handleCodeChange = (value: string) => {
        // Only allow alphanumeric, uppercase, max 6 chars
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        setCode(cleaned);
        setError(null);
    };

    const handleJoin = async () => {
        if (!validation?.valid || !setActive) return;

        setIsLoading(true);
        setError(null);

        try {
            const email = user?.primaryEmailAddress?.emailAddress;
            if (!email) {
                throw new Error('No email address found');
            }

            // Check email restriction
            if (validation.restrictedEmail && validation.restrictedEmail.toLowerCase() !== email.toLowerCase()) {
                throw new Error(`This invite is restricted to ${validation.restrictedEmail}`);
            }

            // Use the invite
            const result = await useInvite({
                code,
                email,
                name: user?.fullName || undefined,
            });

            // Set active organization in Clerk
            await setActive({ organization: result.orgId });

            // Small delay for auth to propagate
            await new Promise((resolve) => setTimeout(resolve, 500));

            onComplete();
        } catch (err) {
            console.error('Failed to join organization:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to join organization. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                        ELITE<span className="text-slate-400 font-light">DISPATCH</span>
                    </h1>
                    <p className="text-slate-500">Join an organization</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-emerald-600" />
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-2">
                        Enter Invite Code
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Enter the 6-character code you received from your organization admin.
                    </p>

                    {/* Code input */}
                    <div className="mb-4">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            placeholder="XXXXXX"
                            className="w-full px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase"
                            maxLength={6}
                            autoFocus
                        />
                    </div>

                    {/* Validation status */}
                    {code.length === 6 && validation && (
                        <div
                            className={`p-4 rounded-xl mb-4 ${
                                validation.valid
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : 'bg-red-50 border border-red-200'
                            }`}
                        >
                            {validation.valid ? (
                                <div className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-emerald-800">
                                            Valid invite code!
                                        </p>
                                        <p className="text-sm text-emerald-700 mt-1">
                                            You'll join <strong>{validation.orgName}</strong> as a{' '}
                                            <strong>{validation.role}</strong>.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-800">
                                            Invalid code
                                        </p>
                                        <p className="text-sm text-red-700 mt-1">
                                            {validation.error}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                            disabled={isLoading}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <button
                            onClick={handleJoin}
                            disabled={isLoading || !validation?.valid}
                            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    Join Organization
                                    <Check className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
