
import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  Users,
  Car,
  Settings,
  LogOut,
  Plus,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  MessageSquare,
  Search,
  Trash2,
  Globe,
  ShoppingBag,
  Receipt,
  Phone,
  Star,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useQuery, useMutation } from "convex/react";
import { useAuth, UserButton, OrganizationSwitcher } from "@clerk/clerk-react";
import { api } from "./convex/_generated/api";

import { Booking, Driver, BookingStatus, DashboardStats, DriverStatus, PaymentStatus, ServiceRecord } from './types';
import { StatCard } from './components/StatCard';
import { BookingModal } from './components/BookingModal';
import { DispatchModal } from './components/DispatchModal';
import { CancelModal } from './components/CancelModal';
import { ServiceModal } from './components/ServiceModal';
import { DriverModal } from './components/DriverModal';
import { LandingPageNew as LandingPage } from './components/LandingPageNew';
import { WidgetBuilder } from './components/WidgetBuilder';
import { SignInComponent } from './src/components/SignInComponent';
import { OnboardingRouter } from './src/components/onboarding';
import { useToast } from './src/providers/ToastProvider';
import { useTheme } from './src/providers/ThemeProvider';
import { ThemeToggle } from './src/components/ui/ThemeToggle';
import { Badge, getBookingStatusVariant, getDriverStatusVariant } from './src/components/ui/Badge';
import { HeroStat, MiniStat } from './src/components/ui/HeroStat';
import { AnimatedCounter } from './src/components/ui/AnimatedCounter';
import { XeroInvoiceModal } from './components/XeroInvoiceModal';
import { XeroConnectionCard } from './components/XeroConnectionCard';

// --- Layout Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${active
      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 font-semibold'
      : 'text-text-secondary hover:bg-background-subtle dark:hover:bg-surface-elevated hover:text-text-primary font-medium'
      }`}
  >
    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
    <span>{label}</span>
  </motion.button>
);

// --- Main App Component ---

const App: React.FC = () => {
  const { isSignedIn, isLoaded, orgId } = useAuth();

  const [showLanding, setShowLanding] = useState(!isSignedIn);
  const [currentView, setCurrentView] = useState<'dashboard' | 'bookings' | 'drivers' | 'services' | 'widget_builder'>('dashboard');

  // Check if user needs onboarding (runs when signed in, even without org)
  const onboardingStatus = useQuery(
    api.users.needsOnboarding,
    isSignedIn ? {} : "skip"
  );

  // Convex Queries - only run when signed in, has org, and onboarding complete
  const shouldFetchData = isSignedIn && orgId && onboardingStatus?.needsOnboarding === false;
  const rawBookings = useQuery(api.bookings.list, shouldFetchData ? {} : "skip") || [];
  const rawDrivers = useQuery(api.drivers.list, shouldFetchData ? {} : "skip") || [];
  const rawServices = useQuery(api.services.list, shouldFetchData ? {} : "skip") || [];

  const bookings: Booking[] = useMemo(() => rawBookings.map(b => ({ ...b, id: b._id })), [rawBookings]);
  const drivers: Driver[] = useMemo(() => rawDrivers.map(d => ({ ...d, id: d._id })), [rawDrivers]);
  const services: ServiceRecord[] = useMemo(() => rawServices.map(s => ({ ...s, id: s._id })), [rawServices]);

  // Convex Mutations
  const createBookingMutation = useMutation(api.bookings.create);
  const createDriverMutation = useMutation(api.drivers.create);
  const createServiceMutation = useMutation(api.services.create);
  const assignDriverMutation = useMutation(api.bookings.assignDriver);
  const updateBookingStatusMutation = useMutation(api.bookings.updateStatus);
  const updateDriverStatusMutation = useMutation(api.drivers.updateStatus);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const [selectedBookingForDispatch, setSelectedBookingForDispatch] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  // Toast notifications
  const toast = useToast();

  // Xero Invoice state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedBookingIdsForInvoice, setSelectedBookingIdsForInvoice] = useState<string[]>([]);

  const handleOpenInvoiceModal = (bookingIds: string[]) => {
    setSelectedBookingIdsForInvoice(bookingIds);
    setIsInvoiceModalOpen(true);
  };

  // Computed Stats
  const stats: DashboardStats = useMemo(() => {
    return {
      revenue: bookings.reduce((acc, b) => acc + (b.status !== BookingStatus.CANCELLED ? b.price : 0), 0),
      activeJobs: bookings.filter(b => b.status === BookingStatus.ASSIGNED).length,
      pendingDispatch: bookings.filter(b => b.status === BookingStatus.PENDING).length,
      completedToday: bookings.filter(b => b.status === BookingStatus.COMPLETED).length,
    };
  }, [bookings]);

  // Chart Data
  const chartData = [
    { name: 'Mon', revenue: 400 },
    { name: 'Tue', revenue: 300 },
    { name: 'Wed', revenue: 550 },
    { name: 'Thu', revenue: 450 },
    { name: 'Fri', revenue: 800 },
    { name: 'Sat', revenue: 1200 },
    { name: 'Sun', revenue: 950 },
  ];

  const handleCreateBooking = async (newBooking: Booking) => {
    try {
      await createBookingMutation({
        customerName: newBooking.customerName,
        customerPhone: newBooking.customerPhone,
        pickupLocation: newBooking.pickupLocation,
        dropoffLocation: newBooking.dropoffLocation,
        pickupTime: newBooking.pickupTime,
        passengers: newBooking.passengers,
        price: newBooking.price,
        notes: newBooking.notes,
        vehicleClass: newBooking.vehicleClass,
      });
      toast.success('Booking created successfully');
    } catch (error) {
      toast.error('Failed to create booking');
    }
  };

  const handleCreateService = async (newService: ServiceRecord) => {
    try {
      await createServiceMutation({
        date: newService.date,
        description: newService.description,
        vendor: newService.vendor,
        cost: newService.cost,
        serviceChargePercent: newService.serviceChargePercent,
        driverId: newService.driverId as any,
      });
      toast.success('Service record added');
    } catch (error) {
      toast.error('Failed to add service record');
    }
  };

  const handleCreateDriver = async (newDriver: Driver) => {
    try {
      await createDriverMutation({
        name: newDriver.name,
        phone: newDriver.phone,
        vehicle: newDriver.vehicle,
        plate: newDriver.plate,
        location: newDriver.location,
        vehicleColour: newDriver.vehicleColour,
        notes: newDriver.notes,
      });
      toast.success(`${newDriver.name} added to fleet`);
    } catch (error) {
      toast.error('Failed to add driver');
    }
  };

  const handleAssignDriver = async (bookingId: string, driverId: string) => {
    try {
      await assignDriverMutation({ id: bookingId as any, driverId: driverId as any });
      await updateDriverStatusMutation({ id: driverId as any, status: DriverStatus.BUSY });
      const driver = drivers.find(d => d.id === driverId);
      toast.whatsapp(`Job dispatched to ${driver?.name || 'driver'}`);
    } catch (error) {
      toast.error('Failed to assign driver');
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      await updateBookingStatusMutation({ id: bookingToCancel.id as any, status: BookingStatus.CANCELLED });

      // If a driver was assigned, free them up
      if (bookingToCancel.driverId) {
        await updateDriverStatusMutation({ id: bookingToCancel.driverId as any, status: DriverStatus.AVAILABLE });
      }

      toast.info('Booking cancelled');
      setBookingToCancel(null);
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  // Wait for Clerk to load before deciding what to show
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-3xl font-black text-text-primary tracking-tighter mb-2">ELITE<span className="text-text-tertiary font-light">DISPATCH</span></h1>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // If signed in, check onboarding status
  if (isSignedIn) {
    // Wait for onboarding status to load
    if (onboardingStatus === undefined) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-3xl font-black text-text-primary tracking-tighter mb-2">ELITE<span className="text-text-tertiary font-light">DISPATCH</span></h1>
            <p className="text-text-secondary">Setting up your account...</p>
          </div>
        </div>
      );
    }
    // If no org selected, Convex can't auth (reason="not_signed_in"), or onboarding needed - show onboarding
    // This lets user create an org in Clerk which will fix the auth issue
    if (!orgId || onboardingStatus.reason === "not_signed_in" || onboardingStatus.needsOnboarding) {
      return <OnboardingRouter onComplete={() => window.location.reload()} />;
    }
    // Continue to render dashboard below
  } else if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  } else {
    return <SignInComponent />;
  }

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* ===== HERO SECTION - Revenue dominates ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Background gradient mesh - creates depth */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-[2rem]">
          <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px] dark:bg-brand-500/10" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px] dark:bg-emerald-500/8" />
        </div>

        {/* Main hero card */}
        <div className="relative bg-surface/80 dark:bg-surface/60 backdrop-blur-2xl rounded-[2rem] border border-border p-8 md:p-10 overflow-hidden grain">
          {/* Decorative grid lines */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Revenue - The Hero */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="lg:col-span-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-[0.2em] font-general">Total Revenue</span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-6xl md:text-7xl lg:text-8xl font-clash font-bold tracking-tight text-text-primary">
                  £<AnimatedCounter value={stats.revenue} className="text-6xl md:text-7xl lg:text-8xl font-clash font-bold" />
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+12.5%</span>
                </div>
                <span className="text-sm text-text-tertiary font-medium">vs last week</span>
              </div>
            </motion.div>

            {/* Secondary Stats - Compact row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="lg:col-span-6 grid grid-cols-3 gap-4"
            >
              {/* Active Jobs */}
              <div className="group relative bg-gradient-to-br from-brand-500/5 to-brand-500/0 dark:from-brand-500/10 dark:to-brand-500/5 rounded-2xl p-5 border border-brand-500/10 hover:border-brand-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-brand-500/10 dark:bg-brand-500/20">
                    <Car className="w-4 h-4 text-brand-500" />
                  </div>
                </div>
                <div className="text-3xl font-clash font-bold text-text-primary mb-1">
                  <AnimatedCounter value={stats.activeJobs} />
                </div>
                <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Active</div>
              </div>

              {/* Pending */}
              <div className="group relative bg-gradient-to-br from-amber-500/5 to-amber-500/0 dark:from-amber-500/10 dark:to-amber-500/5 rounded-2xl p-5 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <div className="text-3xl font-clash font-bold text-text-primary mb-1">
                  <AnimatedCounter value={stats.pendingDispatch} />
                </div>
                <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Pending</div>
              </div>

              {/* Completed */}
              <div className="group relative bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <div className="text-3xl font-clash font-bold text-text-primary mb-1">
                  <AnimatedCounter value={stats.completedToday} />
                </div>
                <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Done</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ===== MAIN CONTENT - Asymmetric Bento Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="lg:col-span-8 bg-surface rounded-[1.5rem] border border-border overflow-hidden"
        >
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-clash font-semibold text-text-primary">Weekly Performance</h3>
              <p className="text-xs text-text-tertiary mt-0.5">Revenue trend over the past 7 days</p>
            </div>
            <div className="flex gap-1 p-1 bg-background-subtle rounded-xl">
              <button className="px-4 py-2 text-xs font-bold rounded-lg bg-surface text-text-primary shadow-sm">Week</button>
              <button className="px-4 py-2 text-xs font-medium rounded-lg text-text-tertiary hover:text-text-secondary transition-colors">Month</button>
            </div>
          </div>
          <div className="h-[280px] w-full px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgb(var(--border-default))" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-tertiary))', fontSize: 11, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--text-tertiary))', fontSize: 11, fontWeight: 600 }} tickFormatter={(val) => `£${val}`} dx={-5} width={50} />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--surface))',
                    borderRadius: '12px',
                    border: '1px solid rgb(var(--border-default))',
                    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ color: 'rgb(var(--text-tertiary))', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}
                  itemStyle={{ color: 'rgb(var(--text-primary))', fontSize: '14px', fontWeight: 700 }}
                  cursor={{ stroke: 'rgb(var(--brand-500))', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fleet Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-4 bg-surface rounded-[1.5rem] border border-border overflow-hidden"
        >
          <div className="p-5 pb-3 flex justify-between items-center border-b border-border">
            <h3 className="font-clash font-semibold text-text-primary">Fleet Status</h3>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="p-3 space-y-1 max-h-[320px] overflow-y-auto">
            {drivers.slice(0, 6).map((driver, index) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex items-center justify-between p-3 hover:bg-background-subtle rounded-xl transition-all cursor-default group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105 ${
                      driver.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      driver.status === 'BUSY' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${
                      driver.status === 'AVAILABLE' ? 'bg-emerald-500' :
                      driver.status === 'BUSY' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary leading-tight">{driver.name.split(' ')[0]}</p>
                    <p className="text-[11px] text-text-tertiary">{driver.vehicle.split(' ').slice(0, 2).join(' ')}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase tracking-wide ${
                  driver.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  driver.status === 'BUSY' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-500/10 text-slate-500'
                }`}>
                  {driver.status === 'AVAILABLE' ? 'Free' : driver.status === 'BUSY' ? 'On Job' : 'Off'}
                </span>
              </motion.div>
            ))}
          </div>
          {drivers.length > 6 && (
            <div className="p-3 pt-0">
              <button
                onClick={() => setCurrentView('drivers')}
                className="w-full py-3 text-xs font-bold text-brand-500 hover:bg-brand-500/5 rounded-xl transition-all border border-dashed border-brand-500/30 hover:border-brand-500/50"
              >
                View all {drivers.length} drivers →
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== RECENT BOOKINGS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="bg-surface rounded-[1.5rem] border border-border overflow-hidden"
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="font-clash font-semibold text-lg text-text-primary">Recent Bookings</h3>
            <p className="text-xs text-text-tertiary mt-1">Latest dispatch activity</p>
          </div>
          <button
            onClick={() => setCurrentView('bookings')}
            className="px-4 py-2 text-xs font-bold text-brand-500 hover:bg-brand-500/5 rounded-xl transition-all border border-brand-500/20 hover:border-brand-500/40"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-subtle text-text-tertiary uppercase tracking-wider text-xs">
              <tr>
                <th className="px-8 py-4 font-bold">Customer</th>
                <th className="px-8 py-4 font-bold">Route</th>
                <th className="px-8 py-4 font-bold">Time</th>
                <th className="px-8 py-4 font-bold">Details</th>
                <th className="px-8 py-4 font-bold">Status</th>
                <th className="px-8 py-4 font-bold">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.slice(0, 5).map(booking => {
                const assignedDriver = drivers.find(d => d.id === booking.driverId);
                return (
                  <tr key={booking.id} className="hover:bg-background-subtle transition-colors group">
                    <td className="px-8 py-5 font-bold text-text-primary">
                      {booking.customerName}
                      <div className="flex gap-1 mt-1">
                        {booking.paymentStatus === PaymentStatus.PAID && <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">PAID</span>}
                        {booking.paymentStatus === PaymentStatus.INVOICED && <span className="text-[10px] bg-brand-50 dark:bg-brand-950 text-brand-500 px-1.5 py-0.5 rounded-md border border-brand-200 dark:border-brand-800">XERO</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-text-secondary max-w-[250px]">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-xs font-medium"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>{booking.pickupLocation}</span>
                        <span className="flex items-center gap-2 text-xs font-medium"><span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>{booking.dropoffLocation}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-text-secondary font-medium">
                      {new Date(booking.pickupTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-5 text-text-secondary">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs uppercase tracking-wide text-text-tertiary">{booking.vehicleClass || 'Standard'}</span>
                        <span className="font-bold text-text-primary">£{booking.price}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${booking.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-200 dark:border-amber-800' :
                        booking.status === 'ASSIGNED' ? 'bg-brand-50 dark:bg-brand-950 text-brand-500 border-brand-200 dark:border-brand-800' :
                          booking.status === 'CANCELLED' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' :
                            'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                        }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-text-secondary">
                      {booking.status === BookingStatus.CANCELLED ? (
                        <span className="text-xs text-text-tertiary font-medium italic">Cancelled</span>
                      ) : assignedDriver ? (
                        <span className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-background-subtle rounded-full flex items-center justify-center text-[10px] font-bold text-text-secondary border border-border">{assignedDriver.name[0]}</div>
                          <span className="font-semibold text-text-primary text-sm">{assignedDriver.name.split(' ')[0]}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedBookingForDispatch(booking)}
                          className="text-xs font-bold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-500 shadow-md shadow-brand-600/20 transition-all active:scale-95"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );

  const renderBookingsList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-clash font-bold text-text-primary tracking-tight">Dispatch Board</h2>
          <p className="text-text-secondary font-medium mt-1">Manage active jobs and assignments</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="Search..." className="pl-10 pr-4 py-3 bg-surface border border-border rounded-2xl text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64 text-text-primary placeholder:text-text-tertiary" />
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        {bookings.map(booking => {
          const assignedDriver = drivers.find(d => d.id === booking.driverId);
          const isCancellable = booking.status === BookingStatus.PENDING || booking.status === BookingStatus.ASSIGNED;

          return (
            <div key={booking.id} className={`bg-surface p-6 rounded-3xl border transition-all flex flex-col md:flex-row gap-6 md:items-center justify-between group relative overflow-hidden ${booking.status === BookingStatus.CANCELLED ? 'border-border opacity-60 bg-background-subtle' : 'border-border shadow-card hover:shadow-soft'
              }`}>
              {booking.status === 'PENDING' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400" />}
              {booking.status === 'ASSIGNED' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500" />}
              {booking.status === 'COMPLETED' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />}
              {booking.status === 'CANCELLED' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-300" />}

              <div className="flex-1 pl-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-text-tertiary bg-background-subtle px-2 py-1 rounded-md border border-border">#{booking.id.substring(0, 6).toUpperCase()}</span>
                    <span className={`text-lg font-bold tracking-tight ${booking.status === 'CANCELLED' ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                      {booking.customerName}
                    </span>
                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] font-bold bg-background-subtle px-2 py-1 rounded-md text-text-tertiary uppercase">{booking.passengers} pax</span>
                      {booking.paymentStatus === PaymentStatus.PAID && <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md font-bold border border-emerald-200 dark:border-emerald-800">PAID</span>}
                      {booking.paymentStatus === PaymentStatus.INVOICED && <span className="text-[10px] bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-2 py-1 rounded-md font-bold border border-brand-200 dark:border-brand-800">XERO</span>}
                      {booking.status === BookingStatus.COMPLETED && booking.paymentStatus !== PaymentStatus.INVOICED && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInvoiceModal([booking.id]);
                          }}
                          className="text-[10px] bg-[#13B5EA]/10 text-[#13B5EA] hover:bg-[#13B5EA]/20 px-2 py-1 rounded-md font-bold border border-[#13B5EA]/20 transition-colors flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />
                          Invoice
                        </button>
                      )}
                    </div>
                  </div>
                  {isCancellable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingToCancel(booking);
                      }}
                      className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-full transition-colors md:hidden"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-3 text-text-secondary bg-background-subtle p-2 rounded-xl">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${booking.status === 'CANCELLED' ? 'bg-slate-400' : 'bg-emerald-400'}`} />
                    <span className="truncate font-medium">{booking.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary bg-background-subtle p-2 rounded-xl">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${booking.status === 'CANCELLED' ? 'bg-slate-400' : 'bg-red-400'}`} />
                    <span className="truncate font-medium">{booking.dropoffLocation}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8 mt-2 md:mt-0">
                <div className="text-left md:text-right">
                  <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
                    <Clock className="w-4 h-4 text-text-tertiary" />
                    {new Date(booking.pickupTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs font-medium text-text-tertiary">
                    {new Date(booking.pickupTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {booking.status === 'PENDING' ? (
                    <button
                      onClick={() => setSelectedBookingForDispatch(booking)}
                      className="bg-text-primary text-background px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                      Dispatch
                    </button>
                  ) : booking.status === 'CANCELLED' ? (
                    <span className="text-xs font-bold text-text-tertiary bg-background-subtle px-4 py-2 rounded-xl border border-border">
                      CANCELLED
                    </span>
                  ) : (
                    <div className="flex items-center gap-3 bg-background-subtle pl-2 pr-5 py-2 rounded-full border border-border">
                      <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-text-secondary shadow-sm">
                        {assignedDriver?.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{assignedDriver?.name.split(' ')[0]}</span>
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wide font-bold">On Job</span>
                      </div>
                    </div>
                  )}

                  {isCancellable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingToCancel(booking);
                      }}
                      className="hidden md:block p-3 text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-2xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                      title="Cancel Booking"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderServicesList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-clash font-bold text-text-primary tracking-tight">Services & Concierge</h2>
          <p className="text-text-secondary font-medium mt-1">Track driver purchases and service charges</p>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-background-subtle text-text-tertiary uppercase tracking-wider text-xs">
            <tr>
              <th className="px-8 py-5 font-bold">Date</th>
              <th className="px-8 py-5 font-bold">Description</th>
              <th className="px-8 py-5 font-bold">Vendor</th>
              <th className="px-8 py-5 font-bold">Cost</th>
              <th className="px-8 py-5 font-bold">Fee</th>
              <th className="px-8 py-5 font-bold">Total</th>
              <th className="px-8 py-5 font-bold">Driver</th>
              <th className="px-8 py-5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map(service => {
              const driver = drivers.find(d => d.id === service.driverId);
              return (
                <tr key={service.id} className="hover:bg-background-subtle transition-colors">
                  <td className="px-8 py-5 text-text-tertiary font-medium">{new Date(service.date).toLocaleDateString('en-GB')}</td>
                  <td className="px-8 py-5 font-bold text-text-primary">{service.description}</td>
                  <td className="px-8 py-5 text-text-secondary font-medium">{service.vendor}</td>
                  <td className="px-8 py-5 text-text-secondary font-medium">£{service.cost.toFixed(2)}</td>
                  <td className="px-8 py-5 text-accent-600 dark:text-accent-400 font-bold">+£{service.serviceFee.toFixed(2)} <span className="text-xs font-normal text-text-tertiary ml-1">({service.serviceChargePercent}%)</span></td>
                  <td className="px-8 py-5 font-black text-text-primary">£{service.total.toFixed(2)}</td>
                  <td className="px-8 py-5 text-text-tertiary">
                    {driver ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-background-subtle rounded-full flex items-center justify-center text-[10px] font-bold text-text-secondary">{driver.name[0]}</div>
                        <span className="text-xs font-bold text-text-primary">{driver.name.split(' ')[0]}</span>
                      </div>
                    ) : <span className="text-xs italic text-text-tertiary">Unassigned</span>}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${service.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                      service.status === 'PAID' ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800' :
                        'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      }`}>
                      {service.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {services.length === 0 && (
          <div className="p-12 text-center text-text-tertiary">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No service records yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDriversList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-clash font-bold text-text-primary tracking-tight">Fleet Management</h2>
          <p className="text-text-secondary font-medium mt-1">Manage your drivers, vehicles, and availability</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map(driver => (
          <div key={driver.id} className="bg-surface rounded-3xl border border-border shadow-card p-6 hover:shadow-soft transition-all group cursor-default">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-background-subtle text-text-secondary font-bold text-xl flex items-center justify-center">
                  {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg leading-tight">{driver.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-tertiary mt-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-text-secondary">{driver.rating}</span>
                    <span className="text-text-muted">•</span>
                    <span className="font-medium">{driver.location}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${driver.status === DriverStatus.AVAILABLE ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                driver.status === DriverStatus.BUSY ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                  'bg-background-subtle text-text-tertiary border-border'
                }`}>
                {driver.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm p-3 bg-background-subtle rounded-2xl border border-border">
                <div className="flex items-center gap-3 text-text-secondary">
                  <Car className="w-4 h-4 text-text-tertiary" />
                  <span className="font-bold">{driver.vehicle}</span>
                </div>
                <div className="text-text-tertiary text-xs font-medium bg-surface px-2 py-1 rounded-lg border border-border shadow-sm">{driver.vehicleColour} • {driver.plate}</div>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary p-3 bg-background-subtle rounded-2xl border border-border">
                <Phone className="w-4 h-4 text-text-tertiary" />
                <span className="font-medium tracking-wide">{driver.phone}</span>
              </div>
            </div>

            {driver.notes && (
              <div className="text-xs text-text-secondary bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-xl italic mb-6">
                "{driver.notes}"
              </div>
            )}

            <div className="flex gap-3">
              <button className="flex-1 py-3 text-xs font-bold text-text-secondary bg-surface border border-border hover:bg-background-subtle rounded-xl transition-colors shadow-sm">
                Edit Profile
              </button>
              <button
                onClick={() => window.open(`https://wa.me/${driver.phone.replace(/\+/g, '')}`, '_blank')}
                className="flex-1 py-3 text-xs font-bold text-white bg-whatsapp hover:bg-whatsapp-dark rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex font-sans text-text-primary">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-72 bg-surface border-r border-border flex-col fixed h-full z-10 shadow-soft">
        <div className="p-8">
          <h1 className="text-2xl font-black text-text-primary tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/40">
              <Car className="text-white w-6 h-6" />
            </div>
            <div>
              ELITE<span className="text-text-tertiary font-light">DISPATCH</span>
            </div>
          </h1>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <SidebarItem icon={CalendarPlus} label="Dispatch Board" active={currentView === 'bookings'} onClick={() => setCurrentView('bookings')} />
          <SidebarItem icon={Users} label="Drivers" active={currentView === 'drivers'} onClick={() => setCurrentView('drivers')} />
          <SidebarItem icon={ShoppingBag} label="Concierge" active={currentView === 'services'} onClick={() => setCurrentView('services')} />
        </nav>

        <div className="p-6 border-t border-border">
          {/* Xero Connection Status */}
          <div className="mb-4">
            <XeroConnectionCard compact />
          </div>

          <button
            onClick={() => setCurrentView('widget_builder')}
            className={`flex items-center gap-2 px-4 py-3 mb-5 text-xs font-bold rounded-2xl w-full justify-center transition-colors border ${currentView === 'widget_builder' ? 'bg-brand-600 text-white border-brand-600 shadow-lg' : 'bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-800 dark:hover:bg-brand-900/50'}`}
          >
            <Globe className="w-4 h-4" />
            Booking Widget
          </button>

          <div className="flex items-center justify-between gap-2 mb-4">
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger: "w-full px-3 py-2 rounded-xl border border-border hover:bg-background-subtle text-sm font-bold text-text-primary flex justify-between"
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 px-2 py-2">
              <UserButton afterSignOutUrl="/" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-primary">My Account</span>
                <span className="text-[10px] text-text-tertiary">Manage Profile</span>
              </div>
            </div>
            <ThemeToggle variant="compact" />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-surface z-20 px-4 py-3 border-b border-border flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Car className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-lg tracking-tight text-text-primary">ELITE</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="compact" />
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-10 pt-20 md:pt-10 pb-28 md:pb-10 overflow-y-auto max-w-[1920px] mx-auto w-full h-screen">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'bookings' && renderBookingsList()}
        {currentView === 'services' && renderServicesList()}
        {currentView === 'drivers' && renderDriversList()}
        {currentView === 'widget_builder' && <WidgetBuilder />}
      </main>

      {/* Floating Action Button (Mobile & Desktop) */}
      <button
        onClick={() => {
          if (currentView === 'services') {
            setIsServiceModalOpen(true);
          } else if (currentView === 'drivers') {
            setIsDriverModalOpen(true);
          } else {
            setIsBookingModalOpen(true);
          }
        }}
        className={`fixed bottom-24 md:bottom-10 right-6 md:right-10 w-16 h-16 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-30 ${currentView === 'services' ? 'bg-accent-500 hover:bg-accent-600 shadow-glow shadow-accent-500/40' :
          currentView === 'drivers' ? 'bg-slate-900 hover:bg-slate-800 shadow-glow shadow-slate-900/40' :
            'bg-brand-600 hover:bg-brand-700 shadow-glow shadow-brand-500/40'
          } ${currentView === 'widget_builder' ? 'hidden' : ''}`}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-6 py-3 flex justify-between items-center z-30 pb-safe">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-brand-600' : 'text-text-tertiary'}`}>
          <LayoutDashboard className={`w-6 h-6 ${currentView === 'dashboard' ? 'fill-brand-100' : ''}`} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setCurrentView('bookings')} className={`flex flex-col items-center gap-1 ${currentView === 'bookings' ? 'text-brand-600' : 'text-text-tertiary'}`}>
          <CalendarPlus className={`w-6 h-6 ${currentView === 'bookings' ? 'fill-brand-100' : ''}`} />
          <span className="text-[10px] font-bold">Dispatch</span>
        </button>
        <button onClick={() => setCurrentView('services')} className={`flex flex-col items-center gap-1 ${currentView === 'services' ? 'text-accent-600' : 'text-text-tertiary'}`}>
          <ShoppingBag className={`w-6 h-6 ${currentView === 'services' ? 'fill-accent-100' : ''}`} />
          <span className="text-[10px] font-bold">Concierge</span>
        </button>
        <button onClick={() => setCurrentView('drivers')} className={`flex flex-col items-center gap-1 ${currentView === 'drivers' ? 'text-brand-600' : 'text-text-tertiary'}`}>
          <Users className={`w-6 h-6 ${currentView === 'drivers' ? 'fill-brand-100' : ''}`} />
          <span className="text-[10px] font-bold">Drivers</span>
        </button>
      </div>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onCreate={handleCreateBooking}
      />

      <DispatchModal
        booking={selectedBookingForDispatch}
        drivers={drivers}
        onClose={() => setSelectedBookingForDispatch(null)}
        onAssign={handleAssignDriver}
      />

      <CancelModal
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleCancelBooking}
      />

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onCreate={handleCreateService}
      />

      <DriverModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onCreate={handleCreateDriver}
      />

      <XeroInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedBookingIdsForInvoice([]);
        }}
        preSelectedBookingIds={selectedBookingIdsForInvoice}
        bookings={bookings}
      />
    </div>
  );
};

export default App;