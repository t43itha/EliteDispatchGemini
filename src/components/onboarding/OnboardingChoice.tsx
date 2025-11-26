import React from 'react';
import { Building2, Users } from 'lucide-react';

interface OnboardingChoiceProps {
    onCreateOrg: () => void;
    onJoinOrg: () => void;
}

export const OnboardingChoice: React.FC<OnboardingChoiceProps> = ({
    onCreateOrg,
    onJoinOrg,
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-lg w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                        ELITE<span className="text-slate-400 font-light">DISPATCH</span>
                    </h1>
                    <p className="text-slate-500">Welcome! Let's get you set up.</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={onCreateOrg}
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:shadow-lg transition-all duration-200 group text-left"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                                <Building2 className="w-6 h-6 text-brand-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    Create Organization
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Start a new dispatch company. You'll be the admin and can invite team members later.
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={onJoinOrg}
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:shadow-lg transition-all duration-200 group text-left"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                <Users className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    Join with Invite Code
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Have an invite code? Join an existing organization as a dispatcher or driver.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
