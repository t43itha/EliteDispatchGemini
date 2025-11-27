import { SignIn } from "@clerk/clerk-react";

export function SignInComponent() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="max-w-md w-full p-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">ELITE<span className="text-slate-400 font-light">DISPATCH</span></h1>
                    <p className="text-slate-500">Sign in to access your dispatch dashboard</p>
                </div>
                <div className="flex justify-center">
                    <SignIn />
                </div>
            </div>
        </div>
    );
}
