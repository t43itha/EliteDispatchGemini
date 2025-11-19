
import React, { useState } from 'react';
import { Check, ArrowRight, Smartphone, Zap, X, ChevronRight, Shield, Globe, MessageCircle, LayoutDashboard } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-500 selection:text-white overflow-x-hidden">
      
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-brand-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-accent-500 opacity-10 blur-[120px]"></div>
      </div>

      {/* Glass Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/50 bg-white/60 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter group cursor-pointer" onClick={onEnterApp}>
             <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white w-5 h-5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
             </div>
             <span className="text-slate-900">ELITE<span className="text-slate-400 font-medium">DISPATCH</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <a href="#" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Pricing</a>
            <button onClick={onEnterApp} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">
              Log In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 text-center relative">
          
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 hover:scale-105 transition-transform cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            v2.0 Now Live: WhatsApp AI Dispatch
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.95] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="block text-slate-900 drop-shadow-sm">Modern Dispatch</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-500 pb-4">
              Operating System
            </span>
          </h1>
          
          <div className="flex items-center justify-center gap-3 md:gap-5 text-3xl md:text-5xl font-bold tracking-tight text-slate-400 mb-10 h-16 md:h-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <span>for</span>
            <RotatingText
              texts={['Chauffeurs', 'Drivers', 'Taxi Fleets', 'Limo Services', 'Operators']}
              mainClassName="px-4 md:px-6 bg-slate-900 text-white overflow-hidden py-1 md:py-2 justify-center rounded-2xl shadow-xl shadow-brand-500/20 -rotate-1"
              staggerFrom="last"
              initial={{ y: "100%", filter: "blur(4px)", opacity: 0 }}
              animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
              exit={{ y: "-120%", filter: "blur(4px)", opacity: 0 }}
              staggerDuration={0.03}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              rotationInterval={3000}
            />
          </div>

          <p className="text-xl md:text-2xl text-slate-500 max-w-4xl mx-auto mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <span className="text-slate-900 font-bold">Ditch the chaos.</span> Manage dispatch, tracking, and invoicing in one seamless platform. <span className="text-brand-600 font-bold underline decoration-brand-200 underline-offset-4">Embed our widget</span> on your website and keep every booking under control—no spreadsheets, no juggling apps.
          </p>
          
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {!showWaitlist ? (
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button onClick={onEnterApp} className="px-8 py-5 bg-slate-900 text-white font-bold text-lg rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 group hover:-translate-y-1">
                    View Live Demo <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button onClick={() => setShowWaitlist(true)} className="px-8 py-5 bg-white text-brand-600 border-2 border-brand-100 font-bold text-lg rounded-2xl hover:bg-brand-50 hover:border-brand-200 transition-all shadow-lg shadow-brand-500/10 hover:-translate-y-1">
                    Join Waitlist
                  </button>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-2 w-full max-w-lg animate-in zoom-in-95 duration-300 bg-white p-2 rounded-3xl shadow-2xl shadow-brand-500/10 border border-brand-100">
                  <input 
                    type="email" 
                    required
                    placeholder="operator@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="flex-1 px-6 py-4 bg-transparent border-none rounded-2xl font-medium focus:outline-none focus:ring-0 text-lg placeholder:text-slate-300"
                  />
                  <button disabled={isSubmitting} className="px-8 py-4 bg-brand-600 text-white font-bold text-lg rounded-2xl hover:bg-brand-700 transition-all disabled:opacity-70 whitespace-nowrap shadow-lg shadow-brand-500/30">
                    {isSubmitting ? 'Joining...' : 'Join'}
                  </button>
                  <button type="button" onClick={() => setShowWaitlist(false)} className="p-4 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-colors">
                      <X className="w-6 h-6" />
                  </button>
              </form>
            )}
          </div>

          {/* Floating UI Element (Mockup) */}
          <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 perspective-[2000px]">
             <div className="relative bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(50,50,93,0.15),0_30px_60px_-30px_rgba(0,0,0,0.2)] border border-slate-200/60 p-2 md:p-4 transform rotate-x-12 hover:rotate-x-0 transition-transform duration-1000 ease-out">
                <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100">
                   {/* Fake Browser Header */}
                   <div className="h-12 bg-white border-b border-slate-100 flex items-center px-6 gap-2">
                      <div className="flex gap-2">
                         <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                         <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                         <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                      </div>
                      <div className="flex-1 flex justify-center">
                         <div className="bg-slate-100 px-4 py-1 rounded-lg text-[10px] font-bold text-slate-400 flex items-center gap-2">
                            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                            app.elitedispatch.com
                         </div>
                      </div>
                   </div>
                   {/* Mock Content Snippet */}
                   <div className="p-8 grid grid-cols-3 gap-6 opacity-50 blur-[0.5px] select-none pointer-events-none">
                       <div className="col-span-2 space-y-4">
                          <div className="h-32 bg-white rounded-3xl shadow-sm w-full"></div>
                          <div className="h-64 bg-white rounded-3xl shadow-sm w-full"></div>
                       </div>
                       <div className="space-y-4">
                          <div className="h-24 bg-brand-500/10 rounded-3xl w-full"></div>
                          <div className="h-24 bg-white rounded-3xl shadow-sm w-full"></div>
                          <div className="h-48 bg-white rounded-3xl shadow-sm w-full"></div>
                       </div>
                   </div>
                   
                   {/* Overlay Callout */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur text-white px-8 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer z-20 border border-white/10">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                      </span>
                      Live Dashboard Preview
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Bento Grid Section */}
      <div className="py-32 max-w-7xl mx-auto px-6">
         <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Everything you need.<br/><span className="text-slate-400">Nothing you don't.</span></h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Card */}
            <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-brand-900/5 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-900/20">
                       <LayoutDashboard className="w-7 h-7" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Command Center</h3>
                    <p className="text-lg text-slate-500 max-w-md leading-relaxed">
                       A unified view of your entire fleet. Drag, drop, and dispatch in seconds. Built for speed, designed for clarity.
                    </p>
                </div>
                <div className="mt-12 flex gap-3">
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-100">Real-time Map</div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-100">Driver Status</div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-100">Live Revenue</div>
                </div>
            </div>

            {/* WhatsApp Card */}
            <div className="bg-[#25D366] rounded-[2.5rem] p-10 shadow-xl shadow-green-500/20 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
                <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-10 bg-repeat bg-[length:200px]"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 bg-white text-[#25D366] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                           <MessageCircle className="w-7 h-7" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">WhatsApp First</h3>
                        <p className="text-white/90 font-medium leading-relaxed">
                           Native integration. Drivers receive jobs, location, and updates directly in WhatsApp.
                        </p>
                    </div>
                    <div className="mt-8 bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white text-xs font-medium">
                        "New Job: LHR T5 to Mayfair. £145. Accept?"
                    </div>
                </div>
            </div>

            {/* Widget Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-xl shadow-slate-900/20 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 text-white">
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur text-white rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                       <Globe className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 tracking-tight">Embeddable Widget</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                       Copy-paste one line of code to add a premium booking engine to your existing website.
                    </p>
                </div>
            </div>

            {/* AI Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-[2.5rem] p-10 shadow-xl shadow-brand-500/30 relative overflow-hidden group text-white">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 blur-[80px] -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="flex-1">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur text-white rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                           <Zap className="w-7 h-7" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4 tracking-tight">AI-Powered Dispatch</h3>
                        <p className="text-brand-100 text-lg leading-relaxed max-w-md">
                           Our Gemini AI analyzes traffic, driver location, and vehicle type to suggest the perfect assignment in milliseconds.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl w-full md:w-72">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold uppercase tracking-wider">AI Recommendation</span>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 bg-white/20 rounded-full w-3/4"></div>
                            <div className="h-2 bg-white/10 rounded-full w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-slate-100 py-20">
         <div className="max-w-4xl mx-auto px-6 text-center">
             <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Ready to modernize?</h2>
             <button onClick={onEnterApp} className="px-12 py-6 bg-slate-900 text-white font-bold text-xl rounded-3xl hover:bg-brand-600 hover:scale-105 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-3 mx-auto">
                Get Started Now <ChevronRight className="w-6 h-6" />
             </button>
         </div>
      </div>

    </div>
  );
};
