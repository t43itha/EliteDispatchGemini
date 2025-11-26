import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, Loader2 } from 'lucide-react';
import { useOrganizationList, useUser, useAuth } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Key for storing pending org data
const PENDING_ORG_KEY = 'elitedispatch_pending_org';

interface CreateOrgWizardProps {
    onBack: () => void;
    onComplete: () => void;
}

interface PendingOrgData {
    clerkOrgId: string;
    name: string;
    phone?: string;
    email?: string;
}

export const CreateOrgWizard: React.FC<CreateOrgWizardProps> = ({
    onBack,
    onComplete,
}) => {
    const { user } = useUser();
    const { orgId } = useAuth();
    const { createOrganization, setActive } = useOrganizationList();
    const ensureSetup = useMutation(api.organizations.ensureSetup);

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');
    const [isCompletingPending, setIsCompletingPending] = useState(false);

    // Check for pending org data on mount (after page reload)
    useEffect(() => {
        const completePendingOrg = async () => {
            const pendingData = localStorage.getItem(PENDING_ORG_KEY);
            if (!pendingData || !orgId) return;

            setIsCompletingPending(true);
            setIsLoading(true);

            try {
                const data: PendingOrgData = JSON.parse(pendingData);
                console.log('Found pending org data, completing setup:', data);

                // Verify this is the org we created
                if (data.clerkOrgId !== orgId) {
                    console.log('Org ID mismatch, skipping pending completion');
                    localStorage.removeItem(PENDING_ORG_KEY);
                    setIsCompletingPending(false);
                    setIsLoading(false);
                    return;
                }

                // Idempotent setup - safe to call multiple times
                console.log('Running ensureSetup...');
                await ensureSetup({
                    orgName: data.name,
                    phone: data.phone,
                    email: data.email,
                });

                // Clear pending data
                localStorage.removeItem(PENDING_ORG_KEY);
                console.log('Pending org setup complete!');

                onComplete();
            } catch (err) {
                console.error('Failed to complete pending org setup:', err);
                localStorage.removeItem(PENDING_ORG_KEY);
                setError('Failed to complete setup. Please try again.');
            } finally {
                setIsCompletingPending(false);
                setIsLoading(false);
            }
        };

        completePendingOrg();
    }, [orgId, ensureSetup, onComplete]);

    const handleNext = async () => {
        if (step === 1) {
            if (!companyName.trim()) {
                setError('Company name is required');
                return;
            }
            setError(null);
            setStep(2);
        } else if (step === 2) {
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!createOrganization || !setActive) {
            setError('Organization features not available');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Create Clerk organization
            console.log('Creating Clerk organization...');
            const clerkOrg = await createOrganization({
                name: companyName.trim(),
            });
            console.log('Clerk org created:', clerkOrg.id);

            // 2. Store pending org data in localStorage
            const pendingData: PendingOrgData = {
                clerkOrgId: clerkOrg.id,
                name: companyName.trim(),
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
            };
            localStorage.setItem(PENDING_ORG_KEY, JSON.stringify(pendingData));
            console.log('Stored pending org data');

            // 3. Set it as active org
            console.log('Setting active organization...');
            await setActive({ organization: clerkOrg.id });

            // 4. Reload the page to get a fresh auth token with org_id
            console.log('Reloading page to sync auth...');
            window.location.reload();
        } catch (err) {
            console.error('Failed to create organization:', err);
            localStorage.removeItem(PENDING_ORG_KEY);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to create organization. Please try again.'
            );
            setIsLoading(false);
        }
    };

    // Show loading screen while completing pending org setup
    if (isCompletingPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                        ELITE<span className="text-slate-400 font-light">DISPATCH</span>
                    </h1>
                    <div className="flex items-center justify-center gap-3 text-slate-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Completing organization setup...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                        ELITE<span className="text-slate-400 font-light">DISPATCH</span>
                    </h1>
                    <p className="text-slate-500">Create your organization</p>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                            }`}
                    >
                        {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <div
                        className={`w-12 h-1 rounded ${step >= 2 ? 'bg-brand-500' : 'bg-slate-200'
                            }`}
                    />
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                            }`}
                    >
                        2
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                                <Building2 className="w-6 h-6 text-brand-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Company Name
                            </h2>
                            <p className="text-sm text-slate-500">
                                This will be displayed to your team and on bookings.
                            </p>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. Elite Executive Cars"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">
                                Contact Details
                            </h2>
                            <p className="text-sm text-slate-500">
                                Optional - you can add these later in settings.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. +44 20 1234 5678"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. bookings@company.com"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                        <button
                            onClick={step === 1 ? onBack : () => setStep(1)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                            disabled={isLoading}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : step === 2 ? (
                                <>
                                    Create Organization
                                    <Check className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
