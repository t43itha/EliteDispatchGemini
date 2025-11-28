import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  MessageCircle,
  Zap,
  Clock,
  PoundSterling,
  Smartphone,
  Globe,
  Check,
  X,
  ChevronRight,
  Star,
  Users,
  TrendingUp,
  Shield,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Animated counter component
const AnimatedNumber: React.FC<{ value: number; suffix?: string; prefix?: string }> = ({
  value,
  suffix = '',
  prefix = ''
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// Magnetic button component
const MagneticButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}> = ({ children, onClick, className = '', variant = 'primary' }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) * 0.15;
    const y = (e.clientY - top - height / 2) * 0.15;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const baseStyles = "relative font-semibold transition-all duration-300 ease-out";
  const variants = {
    primary: "bg-whatsapp text-black hover:bg-whatsapp/90 shadow-[0_0_40px_rgba(37,211,102,0.3)] hover:shadow-[0_0_60px_rgba(37,211,102,0.5)]",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm",
    ghost: "bg-transparent text-white hover:text-whatsapp",
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

// Glowing orb background component
const GlowingOrbs: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(37,211,102,0.15) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 50, 0],
        y: [0, 30, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1.2, 1, 1.2],
        x: [0, -30, 0],
        y: [0, -50, 0],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)',
      }}
      animate={{
        rotate: [0, 360],
      }}
      transition={{
        duration: 60,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </div>
);

// Grid pattern background
const GridPattern: React.FC = () => (
  <div
    className="absolute inset-0 opacity-[0.02]"
    style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
    }}
  />
);

// Noise texture overlay
const NoiseTexture: React.FC = () => (
  <div
    className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }}
  />
);

export const LandingPageNew: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.98]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, 50]);

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("You're on the list! We'll be in touch soon.");
      setEmail('');
      setShowWaitlist(false);
    }, 1500);
  };

  const features = [
    {
      icon: MessageCircle,
      title: "WhatsApp-Native",
      description: "Assign jobs, notify drivers, get confirmations—all in the chat your team already uses.",
      gradient: "from-whatsapp to-emerald-400",
      delay: 0,
    },
    {
      icon: Zap,
      title: "AI Driver Assignment",
      description: "Gemini AI analyzes location, availability, and vehicle type. Suggests optimal driver in 2 seconds.",
      gradient: "from-brand-500 to-indigo-500",
      delay: 0.1,
    },
    {
      icon: Globe,
      title: "Embeddable Widget",
      description: "One line of code adds a premium booking engine to your website. Your brand, your rules.",
      gradient: "from-purple-500 to-pink-500",
      delay: 0.2,
    },
    {
      icon: PoundSterling,
      title: "Automated Invoicing",
      description: "Send invoices via WhatsApp. Accept Stripe payments. Export to Xero. Zero chasing.",
      gradient: "from-amber-500 to-orange-500",
      delay: 0.3,
    },
    {
      icon: Smartphone,
      title: "Mobile-First Dashboard",
      description: "Dispatch from your phone at 6 AM or 11 PM. No laptop required. Built for operators on the move.",
      gradient: "from-rose-500 to-red-500",
      delay: 0.4,
    },
    {
      icon: Shield,
      title: "Real-Time Tracking",
      description: "Customers get live driver location links. No more 'where's my driver?' calls.",
      gradient: "from-cyan-500 to-blue-500",
      delay: 0.5,
    },
  ];

  const comparisonData = [
    { feature: "Monthly Price", us: "From £49", them: "£150-300" },
    { feature: "Setup Fee", us: "£0", them: "£200-700" },
    { feature: "Per-Trip Fee", us: "None", them: "£0.15-0.40" },
    { feature: "WhatsApp Dispatch", us: "Native", them: "None" },
    { feature: "AI Assignment", us: "Included", them: "Extra £££" },
    { feature: "Mobile App", us: "Yes", them: "Desktop Only" },
  ];

  const testimonials = [
    {
      quote: "Switched from Limo Anywhere. Saved £1,800/year. The real win? Dispatched 40 jobs yesterday without touching my laptop once.",
      author: "Sarah M.",
      role: "6-driver fleet, London",
      rating: 5,
    },
    {
      quote: "My drivers asked why I didn't do this sooner. WhatsApp dispatch just makes sense. It's where we already talk.",
      author: "Marcus T.",
      role: "4-driver fleet, Manchester",
      rating: 5,
    },
    {
      quote: "Cut dispatch time from 23 minutes to 4 minutes per job. The AI assignment is worth the add-on alone.",
      author: "James K.",
      role: "8-driver fleet, Birmingham",
      rating: 5,
    },
  ];

  const stats = [
    { value: 80, suffix: "%", label: "Faster Dispatch" },
    { value: 1800, prefix: "£", label: "Avg. Annual Savings" },
    { value: 30, suffix: "s", label: "Per Job (vs 8min)" },
    { value: 200, suffix: "+", label: "Happy Operators" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden selection:bg-whatsapp selection:text-black">
      {/* Custom font imports */}
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=general-sans@400,500,600&display=swap');

        .font-clash { font-family: 'Clash Display', sans-serif; }
        .font-general { font-family: 'General Sans', sans-serif; }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(37,211,102,0.3); }
          50% { box-shadow: 0 0 40px rgba(37,211,102,0.6); }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .text-gradient {
          background: linear-gradient(135deg, #25D366 0%, #3b82f6 50%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .border-gradient {
          background: linear-gradient(#0a0a0a, #0a0a0a) padding-box,
                      linear-gradient(135deg, rgba(37,211,102,0.5), rgba(59,130,246,0.5)) border-box;
          border: 1px solid transparent;
        }

        .glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .whatsapp-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2325D366' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>

      {/* Background layers */}
      <div className="fixed inset-0 z-0">
        <GridPattern />
        <GlowingOrbs />
        <NoiseTexture />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <motion.div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={onEnterApp}
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-whatsapp to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-whatsapp/20 group-hover:shadow-whatsapp/40 transition-shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black w-5 h-5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <span className="font-clash font-bold text-xl tracking-tight">
                  ELITE<span className="text-white/40">DISPATCH</span>
                </span>
              </motion.div>

              {/* Nav links */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="font-general text-sm text-white/60 hover:text-whatsapp transition-colors">Features</a>
                <a href="#pricing" className="font-general text-sm text-white/60 hover:text-whatsapp transition-colors">Pricing</a>
                <a href="#testimonials" className="font-general text-sm text-white/60 hover:text-whatsapp transition-colors">Reviews</a>
              </div>

              {/* CTA buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onEnterApp}
                  className="hidden sm:block font-general text-sm text-white/60 hover:text-white transition-colors px-4 py-2"
                >
                  Log In
                </button>
                <MagneticButton
                  onClick={onEnterApp}
                  className="px-5 py-2.5 rounded-xl font-general text-sm"
                >
                  Start Free
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center pt-28 pb-12 px-6 overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 max-w-6xl mx-auto text-center"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Eyebrow */}
            <motion.div variants={itemVariants} className="flex justify-center">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 animate-pulse-glow">
                <MessageCircle className="w-4 h-4 text-whatsapp" />
                <span className="font-general text-sm text-white/80">For operators who live in WhatsApp</span>
              </div>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={itemVariants}
              className="font-clash font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9]"
            >
              <span className="block text-white">Your drivers use</span>
              <span className="block text-gradient">WhatsApp.</span>
              <span className="block text-white/40">Your dispatch should too.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="font-general text-lg sm:text-xl md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed"
            >
              Book → Assign → Notify → Track → Invoice.{' '}
              <span className="text-white">All without leaving WhatsApp.</span>{' '}
              From <span className="text-whatsapp font-semibold">£49/month</span>. No setup fees. No per-trip charges.
            </motion.p>

            {/* CTA Section */}
            <motion.div variants={itemVariants} className="pt-2">
              <AnimatePresence mode="wait">
                {!showWaitlist ? (
                  <motion.div
                    key="buttons"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                  >
                    <MagneticButton
                      onClick={onEnterApp}
                      className="px-8 py-4 rounded-2xl text-lg flex items-center gap-3 group"
                    >
                      <Play className="w-5 h-5" />
                      View Live Demo
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </MagneticButton>
                    <MagneticButton
                      onClick={() => setShowWaitlist(true)}
                      variant="secondary"
                      className="px-8 py-4 rounded-2xl text-lg"
                    >
                      Join Waitlist
                    </MagneticButton>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    onSubmit={handleJoinWaitlist}
                    className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto glass rounded-2xl p-2"
                  >
                    <input
                      type="email"
                      required
                      placeholder="operator@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      className="flex-1 px-6 py-4 bg-transparent border-none rounded-xl font-general focus:outline-none focus:ring-2 focus:ring-whatsapp/50 text-lg placeholder:text-white/30"
                    />
                    <button
                      disabled={isSubmitting}
                      className="px-8 py-4 bg-whatsapp text-black font-semibold rounded-xl hover:bg-whatsapp/90 transition-all disabled:opacity-70 whitespace-nowrap"
                    >
                      {isSubmitting ? 'Joining...' : 'Join'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWaitlist(false)}
                      className="p-4 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-6 pt-2 text-white/40 font-general text-sm"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-whatsapp" /> No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-whatsapp" /> Setup in 15 minutes
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-whatsapp" /> Cancel anytime
              </span>
            </motion.div>

            {/* Dashboard Preview - hidden on mobile */}
            <motion.div
              variants={itemVariants}
              className="mt-10 relative max-w-4xl mx-auto hidden lg:block"
            >
              <div className="relative">
                {/* Glow effect behind */}
                <div className="absolute inset-0 bg-gradient-to-r from-whatsapp/20 via-brand-500/20 to-purple-500/20 blur-3xl opacity-50 -z-10" />

                <div className="glass rounded-3xl p-3 border-gradient">
                  <div className="bg-[#111] rounded-2xl overflow-hidden">
                    {/* Browser chrome */}
                    <div className="h-9 bg-[#1a1a1a] flex items-center px-4 gap-2 border-b border-white/5">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-[#0a0a0a] px-3 py-0.5 rounded text-[10px] text-white/40 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-whatsapp rounded-full" />
                          app.elitedispatch.io
                        </div>
                      </div>
                    </div>
                    {/* Mock dashboard content */}
                    <div className="p-4 grid grid-cols-4 gap-3 h-40">
                      <div className="col-span-3 space-y-3">
                        <div className="h-12 bg-white/5 rounded-xl flex items-center px-4 gap-3">
                          <div className="w-8 h-8 rounded-lg bg-whatsapp/20" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-2 bg-white/10 rounded w-1/3" />
                            <div className="h-1.5 bg-white/5 rounded w-1/2" />
                          </div>
                          <div className="text-[10px] text-whatsapp font-medium px-2 py-1 bg-whatsapp/10 rounded">Active</div>
                        </div>
                        <div className="h-20 bg-white/5 rounded-xl p-3">
                          <div className="flex gap-2 mb-2">
                            <div className="h-1.5 bg-white/10 rounded w-16" />
                            <div className="h-1.5 bg-white/5 rounded w-12" />
                          </div>
                          <div className="flex gap-2">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="flex-1 h-8 bg-white/5 rounded-lg" style={{ height: `${20 + Math.random() * 20}px` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-10 bg-whatsapp/20 rounded-xl flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-whatsapp/60" />
                        </div>
                        <div className="h-10 bg-white/5 rounded-xl" />
                        <div className="h-14 bg-white/5 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  className="absolute -top-3 -right-3 glass rounded-full px-3 py-1.5 flex items-center gap-2 border border-whatsapp/30"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-whatsapp rounded-full animate-pulse" />
                  <span className="text-xs font-general text-white/80">Live Preview</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2 bg-[#0a0a0a]/50 backdrop-blur-sm">
            <motion.div
              className="w-1 h-2 bg-whatsapp rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="font-clash font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
              <span className="text-white/40">It's 6:47 AM.</span>{' '}
              <span className="text-white">Sound familiar?</span>
            </h2>
          </motion.div>

          {/* Problem scenario */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-3xl p-8 md:p-12 mb-12 border-gradient whatsapp-pattern"
          >
            <div className="max-w-4xl mx-auto">
              <p className="font-general text-lg md:text-xl text-white/70 leading-relaxed mb-8">
                A corporate client texts you on WhatsApp: <span className="text-whatsapp font-semibold">"Airport pickup at 8 AM?"</span>
              </p>
              <div className="space-y-6 text-white/50 font-general">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-400 text-sm">1</span>
                  </div>
                  <p>Open laptop. Log into £280/month dispatch software (took 3 weeks to learn).</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-400 text-sm">2</span>
                  </div>
                  <p>Manually check driver availability. Copy booking details. Switch to WhatsApp.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-400 text-sm">3</span>
                  </div>
                  <p>Paste info to driver. Driver confirms on WhatsApp. Switch back to software. Update status.</p>
                </div>
              </div>
              <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-3xl md:text-4xl font-clash font-bold text-white">8 minutes.</p>
                  <p className="text-white/40 font-general">You do this 40 times per day.</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-5xl md:text-6xl font-clash font-bold text-red-400">5+ hours</p>
                  <p className="text-white/40 font-general">Lost every single day to tab-switching.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Three problems */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Paying enterprise prices for 2012 software",
                description: "£150-300/month + £200 setup fees + £0.20 per trip. For features you'll never use.",
                icon: PoundSterling,
                color: "red",
              },
              {
                title: "Juggling two systems that should be one",
                description: "Your drivers live in WhatsApp. Your customers text on WhatsApp. Your software pretends it doesn't exist.",
                icon: MessageCircle,
                color: "amber",
              },
              {
                title: "Doing manually what AI should handle",
                description: "Which driver is closest? Who's available? You figure it out by memory while competitors use algorithms.",
                icon: Zap,
                color: "orange",
              },
            ].map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass rounded-2xl p-6 border-gradient hover:bg-white/[0.02] transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl bg-${problem.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <problem.icon className={`w-6 h-6 text-${problem.color}-400`} />
                </div>
                <h3 className="font-clash font-semibold text-xl text-white mb-3">{problem.title}</h3>
                <p className="font-general text-white/50 leading-relaxed">{problem.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution/Transformation Section */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-whatsapp/5 to-transparent" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
              <span className="font-general text-sm text-whatsapp">The EliteDispatch Difference</span>
            </div>
            <h2 className="font-clash font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
              <span className="text-white">Same request.</span>{' '}
              <span className="text-gradient">30 seconds.</span>
            </h2>
            <p className="font-general text-xl text-white/50 max-w-2xl mx-auto">
              Your competitor opens their phone, taps a button, and the booking is created, driver assigned, and customer notified. All via WhatsApp.
            </p>
          </motion.div>

          {/* Before/After comparison */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="glass rounded-3xl p-8 border border-red-500/20 h-full">
                <div className="inline-block bg-red-500/20 text-red-400 px-4 py-1 rounded-full text-sm font-general font-semibold mb-6">
                  Before
                </div>
                <ul className="space-y-4 font-general">
                  {[
                    "8 minutes per dispatch",
                    "£280/month software",
                    "Juggling 3 apps constantly",
                    "Desktop-only workflow",
                    "Manual driver selection",
                    "No real-time tracking",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/50">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="glass rounded-3xl p-8 border border-whatsapp/20 h-full">
                <div className="inline-block bg-whatsapp/20 text-whatsapp px-4 py-1 rounded-full text-sm font-general font-semibold mb-6">
                  After
                </div>
                <ul className="space-y-4 font-general">
                  {[
                    "30 seconds per dispatch",
                    "From £49/month",
                    "Everything in WhatsApp",
                    "Mobile-first dashboard",
                    "AI-powered assignment",
                    "Live tracking links",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white">
                      <Check className="w-5 h-5 text-whatsapp flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-clash font-bold text-gradient mb-2">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <p className="font-general text-white/50">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-clash font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
              <span className="text-white">Everything you need.</span>
              <br />
              <span className="text-white/40">Nothing you don't.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: feature.delay }}
                className="group relative glass rounded-3xl p-8 border-gradient overflow-hidden hover:bg-white/[0.02] transition-all duration-500"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-clash font-semibold text-2xl text-white mb-3">{feature.title}</h3>
                  <p className="font-general text-white/50 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section id="pricing" className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/5 to-transparent" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-clash font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
              <span className="text-white">Pay less.</span>{' '}
              <span className="text-gradient">Get more.</span>
            </h2>
            <p className="font-general text-xl text-white/50">
              See how we stack up against "enterprise" solutions.
            </p>
          </motion.div>

          {/* Comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-3xl overflow-hidden border-gradient"
          >
            <div className="grid grid-cols-3 bg-white/5 p-6 border-b border-white/5">
              <div className="font-general text-white/50">Feature</div>
              <div className="text-center">
                <span className="font-clash font-bold text-whatsapp">EliteDispatch</span>
              </div>
              <div className="text-center">
                <span className="font-general text-white/40">Others</span>
              </div>
            </div>
            {comparisonData.map((row, index) => (
              <div key={index} className="grid grid-cols-3 p-6 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                <div className="font-general text-white/70">{row.feature}</div>
                <div className="text-center font-general font-semibold text-whatsapp">{row.us}</div>
                <div className="text-center font-general text-white/40">{row.them}</div>
              </div>
            ))}
          </motion.div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              {
                name: "Starter",
                price: 49,
                description: "Perfect for 1-3 driver teams",
                features: ["Unlimited bookings", "WhatsApp dispatch", "Basic widget", "Mobile app"],
                popular: false,
              },
              {
                name: "Professional",
                price: 99,
                description: "For growing operations",
                features: ["Everything in Starter", "AI driver assignment", "Automated invoicing", "Advanced analytics"],
                popular: true,
              },
              {
                name: "Enterprise",
                price: 199,
                description: "For 10+ driver fleets",
                features: ["Everything in Pro", "White-label app", "API access", "Dedicated support"],
                popular: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative glass rounded-3xl p-8 ${plan.popular ? 'border-2 border-whatsapp/50' : 'border-gradient'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-whatsapp text-black px-4 py-1 rounded-full text-sm font-general font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="font-clash font-bold text-2xl text-white mb-2">{plan.name}</h3>
                <p className="font-general text-white/50 text-sm mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="font-clash font-bold text-5xl text-white">£{plan.price}</span>
                  <span className="font-general text-white/50">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 font-general text-white/70">
                      <Check className="w-4 h-4 text-whatsapp" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <MagneticButton
                  onClick={onEnterApp}
                  variant={plan.popular ? "primary" : "secondary"}
                  className="w-full py-4 rounded-xl text-center"
                >
                  Get Started
                </MagneticButton>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-clash font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
              <span className="text-white">Loved by operators.</span>
              <br />
              <span className="text-white/40">Feared by legacy software.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass rounded-3xl p-8 border-gradient"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-whatsapp text-whatsapp" />
                  ))}
                </div>
                <p className="font-general text-lg text-white/80 leading-relaxed mb-8">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-clash font-semibold text-white">{testimonial.author}</p>
                  <p className="font-general text-white/50 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-whatsapp/10 via-transparent to-transparent" />
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(37,211,102,0.15) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-clash font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
              <span className="text-white">Still paying £250/month</span>
              <br />
              <span className="text-white/40">for software that ignores WhatsApp?</span>
            </h2>
            <p className="font-general text-xl text-white/50 mb-10 max-w-2xl mx-auto">
              Your competitors already made the switch. Join 200+ operators who dispatch faster, pay less, and actually enjoy their software.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <MagneticButton
                onClick={onEnterApp}
                className="px-10 py-5 rounded-2xl text-lg flex items-center gap-3 group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <p className="font-general text-white/40 text-sm">
                No credit card • Setup in 15 minutes • Cancel anytime
              </p>
            </div>

            {/* Floating avatars */}
            <div className="flex justify-center items-center gap-2 mt-12">
              <div className="flex -space-x-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-whatsapp/30 to-brand-500/30 border-2 border-[#0a0a0a] flex items-center justify-center"
                  >
                    <Users className="w-4 h-4 text-white/60" />
                  </div>
                ))}
              </div>
              <p className="font-general text-white/50 text-sm ml-2">
                <span className="text-whatsapp font-semibold">200+</span> operators and growing
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-whatsapp to-emerald-400 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black w-5 h-5">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <span className="font-clash font-bold text-xl tracking-tight">
                ELITE<span className="text-white/40">DISPATCH</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-8 font-general text-sm text-white/50">
              <a href="#features" className="hover:text-whatsapp transition-colors">Features</a>
              <a href="#pricing" className="hover:text-whatsapp transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-whatsapp transition-colors">Reviews</a>
              <a href="#" className="hover:text-whatsapp transition-colors">Privacy</a>
              <a href="#" className="hover:text-whatsapp transition-colors">Terms</a>
            </div>

            {/* Copyright */}
            <p className="font-general text-sm text-white/30">
              © 2025 EliteDispatch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageNew;
