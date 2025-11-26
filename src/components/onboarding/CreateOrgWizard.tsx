import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, Loader2 } from 'lucide-react';
import { useOrganizationList, useUser } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface CreateOrgWizardProps {
    onBack: () => void;
    onComplete: () => void;
}

export const CreateOrgWizard: React.FC<CreateOrgWizardProps> = ({
    onBack,
    onComplete,
}) => {
    const { user } = useUser();
    const { createOrganization, setActive } = useOrganizationList();
    const createOrg = useMutation(api.organizations.create);
    const createAdmin = useMutation(api.users.createAdmin);
    const completeOnboarding = useMutation(api.organizations.completeOnboarding);

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');

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
            const clerkOrg = await createOrganization({
                name: companyName.trim(),
            });

            // 2. Set it as active org
            await setActive({ organization: clerkOrg.id });

            // Wait a moment for auth to update
            await new Promise((resolve) => setTimeout(resolve, 500));

            // 3. Create Convex organization record
            await createOrg({
                clerkOrgId: clerkOrg.id,
                name: companyName.trim(),
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
            });

            // 4. Create admin user record
            await createAdmin({
                clerkOrgId: clerkOrg.id,
                email: user?.primaryEmailAddress?.emailAddress || email,
                name: user?.fullName || undefined,
            });

            // 5. Mark onboarding as complete
            await completeOnboarding({});

            onComplete();
        } catch (err) {
            console.error('Failed to create organization:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to create organization. Please try again.'
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
                    <p className="text-slate-500">Create your organization</p>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            step >= 1
                                ? 'bg-brand-500 text-white'
                                : 'bg-slate-200 text-slate-500'
                        }`}
                    >
                        {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <div
                        className={`w-12 h-1 rounded ${
                            step >= 2 ? 'bg-brand-500' : 'bg-slate-200'
                        }`}
                    />
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            step >= 2
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

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
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
                            className="flex items-center gap-2 bg-brand-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
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
