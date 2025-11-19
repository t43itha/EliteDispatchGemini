
import React, { useState } from 'react';
import { Check, ArrowRight, Smartphone, Zap, X, ChevronRight, Shield } from 'lucide-react';
import RotatingText from './RotatingText';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Thanks! You've been added to the priority list.");
      setEmail('');
      setShowWaitlist(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-900">
      
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
           <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white w-4 h-4"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
           </div>
           <span>ELITE<span className="text-slate-400 font-light">DISPATCH</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
          <a href="#" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Testimonials</a>
          <button onClick={onEnterApp} className="text-brand-600 hover:text-brand-700 transition-colors">Log In</button>
        </div>
        <button onClick={onEnterApp} className="md:hidden font-bold text-brand-600">Log In</button>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-brand-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
          New: WhatsApp AI Dispatch
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 flex flex-col items-center">
          <span className="text-slate-900">Modern Dispatch</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-600 pb-2">
            Operating System
          </span>
          <span className="flex items-center gap-3 md:gap-4 mt-4 text-3xl md:text-5xl text-slate-400 font-bold tracking-tight flex-wrap justify-center">
            for 
            <RotatingText
              texts={['Chauffeurs', 'Drivers', 'Operators', 'Fleets', 'YOU']}
              mainClassName="px-3 md:px-4 bg-brand-100 text-brand-600 overflow-hidden py-1 justify-center rounded-xl text-left min-w-[180px] md:min-w-[240px]"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Stop juggling spreadsheets and WhatsApp. Dispatch, track, and invoice in one seamless flow. Plus, use our <strong className="text-slate-700">embeddable widget</strong> to integrate your website and manage all your bookings in one place.
        </p>
        
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 min-h-[80px]">
          {!showWaitlist ? (
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <button onClick={onEnterApp} className="px-8 py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 group min-w-[200px]">
                  View Live Demo <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button onClick={() => setShowWaitlist(true)} className="px-8 py-4 bg-brand-600 text-white font-bold text-lg rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/30 min-w-[200px]">
                  Join Waitlist
                </button>
            </div>
          ) : (
            <form onSubmit={handleJoinWaitlist} className="flex flex-col md:flex-row gap-2 w-full max-w-md animate-in zoom-in-95 duration-300">
                <input 
                  type="email" 
                  required
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg"
                />
                <button disabled={isSubmitting} className="px-8 py-4 bg-brand-600 text-white font-bold text-lg rounded-2xl hover:bg-brand-700 transition-all disabled:opacity-70 whitespace-nowrap shadow-lg shadow-brand-500/30">
                  {isSubmitting ? '...' : 'Join Now'}
                </button>
                <button type="button" onClick={() => setShowWaitlist(false)} className="p-4 text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </form>
          )}
        </div>

        <div className="mt-24 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-slate-300 animate-in fade-in duration-1000 delay-500 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
           {/* Mock Logos */}
           <div className="font-black text-2xl tracking-widest uppercase cursor-default select-none">UBER</div>
           <div className="font-serif font-bold text-2xl cursor-default select-none">Blacklane</div>
           <div className="font-mono font-bold text-2xl tracking-tighter cursor-default select-none">WHEELY</div>
           <div className="font-bold text-2xl italic cursor-default select-none">ADDISON LEE</div>
        </div>
      </div>

      {/* Problem / Solution Section */}
      <div className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Why 200+ Operators switched.</h2>
             <p className="text-lg text-slate-500 max-w-2xl mx-auto">The old way is slow, manual, and error-prone. EliteDispatch is instant, automated, and delightful.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 opacity-80 hover:opacity-100 transition-all hover:shadow-md group">
              <div className="flex items-center gap-4 mb-8 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <X className="w-6 h-6 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-700 transition-colors">The Old Way</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4 text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 font-bold text-xs border border-red-100">1</div>
                  <span className="font-medium">Copy-pasting details into WhatsApp (8 mins/job).</span>
                </li>
                <li className="flex gap-4 text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 font-bold text-xs border border-red-100">2</div>
                  <span className="font-medium">Paying £350/mo for clunky "Enterprise" software.</span>
                </li>
                <li className="flex gap-4 text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 font-bold text-xs border border-red-100">3</div>
                  <span className="font-medium">Drivers calling asking "Where is the pickup?"</span>
                </li>
                <li className="flex gap-4 text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 font-bold text-xs border border-red-100">4</div>
                  <span className="font-medium">Manual invoicing nightmares at month-end.</span>
                </li>
              </ul>
            </div>

            {/* EliteDispatch */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden group transform hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600 rounded-full opacity-20 blur-3xl -mr-20 -mt-20 group-hover:opacity-30 transition-opacity"></div>
              
              <div className="flex items-center gap-4 mb-8 text-brand-400 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                    <Check className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest text-white">EliteDispatch</h3>
              </div>
              <ul className="space-y-6 relative z-10">
                <li className="flex gap-4 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-lg shadow-brand-500/50">1</div>
                  <span className="font-bold">One-click AI Dispatch via WhatsApp (30 secs/job).</span>
                </li>
                <li className="flex gap-4 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                  <span className="font-medium">Fair pricing starting at £49/mo. No setup fees.</span>
                </li>
                <li className="flex gap-4 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                  <span className="font-medium">Live tracking links sent automatically to clients.</span>
                </li>
                <li className="flex gap-4 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 font-bold text-xs">4</div>
                  <span className="font-medium">Auto-generated invoices synced to Xero/Stripe.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof / Stats */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-surface p-8 rounded-3xl shadow-card border border-slate-100 text-center group hover:border-brand-100 transition-colors">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-brand-600 group-hover:scale-110 transition-transform">
              <Smartphone className="w-7 h-7" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">1.2M+</h3>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Messages Sent</p>
          </div>
          <div className="bg-surface p-8 rounded-3xl shadow-card border border-slate-100 text-center group hover:border-accent-100 transition-colors">
            <div className="w-14 h-14 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-accent-600 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">85%</h3>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Less Admin Time</p>
          </div>
          <div className="bg-surface p-8 rounded-3xl shadow-card border border-slate-100 text-center group hover:border-emerald-100 transition-colors">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-600 group-hover:scale-110 transition-transform">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">£250M</h3>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Value Processed</p>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-slate-900 text-white py-32 text-center px-6 relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-3xl -mt-[400px]"></div>
         
         <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Ready to modernize your fleet?</h2>
            <button onClick={onEnterApp} className="px-10 py-6 bg-white text-slate-900 font-bold text-xl rounded-2xl hover:bg-brand-50 transition-all shadow-2xl shadow-brand-900/50 active:scale-95 flex items-center gap-3 mx-auto group">
                Get Started for Free <ChevronRight className="w-6 h-6 text-slate-400 group-hover:translate-x-1 transition-transform"/>
            </button>
            <p className="mt-8 text-slate-400 font-medium flex items-center justify-center gap-2 text-sm">
                <Check className="w-4 h-4 text-brand-500" /> No credit card required 
                <span className="w-1 h-1 bg-slate-600 rounded-full mx-2"></span>
                <Check className="w-4 h-4 text-brand-500" /> Cancel anytime
            </p>
         </div>
      </div>
    </div>
  );
};
