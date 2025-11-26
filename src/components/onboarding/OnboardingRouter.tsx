import React, { useState, useEffect } from 'react';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { OnboardingChoice } from './OnboardingChoice';
import { CreateOrgWizard } from './CreateOrgWizard';
import { JoinOrgFlow } from './JoinOrgFlow';
import { Loader2 } from 'lucide-react';

type OnboardingStep = 'choice' | 'create' | 'join' | 'complete-existing';

// Key for storing pending org data (must match CreateOrgWizard)
const PENDING_ORG_KEY = 'elitedispatch_pending_org';

interface OnboardingRouterProps {
    onComplete: () => void;
}

// Component to complete setup for existing Clerk org
const CompleteExistingOrg: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const { orgId } = useAuth();
    const { organization } = useOrganization();
    const ensureSetup = useMutation(api.organizations.ensureSetup);

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const setupConvexRecords = async () => {
            if (!orgId || !organization) {
                setError('Organization not found. Please refresh and try again.');
                setIsLoading(false);
                return;
            }

            try {
                console.log('Setting up Convex records for existing Clerk org:', orgId);

                // Idempotent setup - safe to call multiple times
                await ensureSetup({
                    orgName: organization.name,
                    phone: undefined,
                    email: undefined,
                });
                console.log('Convex setup complete');

                // Clear any pending data
                localStorage.removeItem(PENDING_ORG_KEY);

                onComplete();
            } catch (err) {
                console.error('Failed to setup Convex records:', err);
                setError(err instanceof Error ? err.message : 'Setup failed. Please try again.');
                setIsLoading(false);
            }
        };

        setupConvexRecords();
    }, [orgId, organization, ensureSetup, onComplete]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="text-center">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                    ELITE<span className="text-slate-400 font-light">DISPATCH</span>
                </h1>
                {isLoading ? (
                    <div className="flex items-center justify-center gap-3 text-slate-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Setting up your organization...</span>
                    </div>
                ) : error ? (
                    <div className="max-w-md mx-auto">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-4">
                            {error}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600"
                        >
                            Retry
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export const OnboardingRouter: React.FC<OnboardingRouterProps> = ({
    onComplete,
}) => {
    const { orgId } = useAuth();

    // Determine initial step based on state
    const [step, setStep] = useState<OnboardingStep>(() => {
        const pendingData = localStorage.getItem(PENDING_ORG_KEY);
        if (pendingData) return 'create';
        return 'choice';
    });

    // If user already has a Clerk org but we're at choice, go to complete-existing
    useEffect(() => {
        if (orgId && step === 'choice') {
            console.log('User has Clerk org, completing setup:', orgId);
            setStep('complete-existing');
        }
    }, [orgId, step]);

    switch (step) {
        case 'choice':
            return (
                <OnboardingChoice
                    onCreateOrg={() => setStep('create')}
                    onJoinOrg={() => setStep('join')}
                />
            );
        case 'create':
            return (
                <CreateOrgWizard
                    onBack={() => setStep('choice')}
                    onComplete={onComplete}
                />
            );
        case 'join':
            return (
                <JoinOrgFlow
                    onBack={() => setStep('choice')}
                    onComplete={onComplete}
                />
            );
        case 'complete-existing':
            return <CompleteExistingOrg onComplete={onComplete} />;
        default:
            return null;
    }
};
