import React, { useState } from 'react';
import { OnboardingChoice } from './OnboardingChoice';
import { CreateOrgWizard } from './CreateOrgWizard';
import { JoinOrgFlow } from './JoinOrgFlow';

type OnboardingStep = 'choice' | 'create' | 'join';

interface OnboardingRouterProps {
    onComplete: () => void;
}

export const OnboardingRouter: React.FC<OnboardingRouterProps> = ({
    onComplete,
}) => {
    const [step, setStep] = useState<OnboardingStep>('choice');

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
        default:
            return null;
    }
};
