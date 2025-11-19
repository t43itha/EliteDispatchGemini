
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
  Star
} from 'lucide-react';
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

import { Booking, Driver, BookingStatus, DashboardStats, DriverStatus, PaymentStatus, ServiceRecord } from './types';
import { MOCK_BOOKINGS, MOCK_DRIVERS, MOCK_SERVICES } from './constants';
import { StatCard } from './components/StatCard';
import { BookingModal } from './components/BookingModal';
import { DispatchModal } from './components/DispatchModal';
import { CancelModal } from './components/CancelModal';
import { BookingWidget } from './components/BookingWidget';
import { ServiceModal } from './components/ServiceModal';
import { DriverModal } from './components/DriverModal';
import { LandingPage } from './components/LandingPage';

// --- Layout Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
      active 
      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 font-semibold' 
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium'
    }`}
  >
    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <span>{label}</span>
  </button>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'bookings' | 'drivers' | 'services'>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [services, setServices] = useState<ServiceRecord[]>(MOCK_SERVICES);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  
  const [selectedBookingForDispatch, setSelectedBookingForDispatch] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

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

  const handleCreateBooking = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  const handleCreateService = (newService: ServiceRecord) => {
    setServices(prev => [newService, ...prev]);
  };

  const handleCreateDriver = (newDriver: Driver) => {
    setDrivers(prev => [newDriver, ...prev]);
  };

  const handleAssignDriver = (bookingId: string, driverId: string) => {
    setBookings(prev => prev.map(b => 
      b.id === bookingId 
      ? { ...b, driverId, status: BookingStatus.ASSIGNED } 
      : b
    ));
    // Also update driver status simulation
    setDrivers(prev => prev.map(d => 
      d.id === driverId ? { ...d, status: 'BUSY' } : d
    ));
  };

  const handleCancelBooking = () => {
    if (!bookingToCancel) return;

    setBookings(prev => prev.map(b => 
      b.id === bookingToCancel.id 
      ? { ...b, status: BookingStatus.CANCELLED, driverId: undefined } 
      : b
    ));

    // If a driver was assigned, free them up
    if (bookingToCancel.driverId) {
      setDrivers(prev => prev.map(d => 
        d.id === bookingToCancel.driverId ? { ...d, status: DriverStatus.AVAILABLE } : d
      ));
    }
    
    setBookingToCancel(null);
  };

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard 
          title="Total Revenue" 
          value={`£${stats.revenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="text-emerald-600"
          trend="+12% vs last week"
        />
        <StatCard 
          title="Active Jobs" 
          value={stats.activeJobs} 
          icon={Car} 
          color="text-brand-600"
        />
        <StatCard 
          title="Pending Dispatch" 
          value={stats.pendingDispatch} 
          icon={Clock} 
          color="text-amber-600"
        />
        <StatCard 
          title="Completed" 
          value={stats.completedToday} 
          icon={CheckCircle} 
          color="text-slate-600"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface p-8 rounded-3xl shadow-card border border-slate-100/50">
          <h3 className="font-bold text-xl text-slate-900 mb-6 tracking-tight">Revenue Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} tickFormatter={(val) => `£${val}`} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-3xl shadow-card border border-slate-100/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-slate-900 tracking-tight">Drivers Status</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Live</span>
          </div>
          <div className="space-y-3">
             {drivers.slice(0, 5).map(driver => (
               <div key={driver.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-default">
                 <div className="flex items-center gap-4">
                   <div className="relative">
                        <div className={`w-3 h-3 rounded-full border-2 border-white ${
                            driver.status === 'AVAILABLE' ? 'bg-emerald-500' : 
                            driver.status === 'BUSY' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                     <p className="text-xs text-slate-500 font-medium">{driver.vehicle}</p>
                   </div>
                 </div>
                 <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide ${
                    driver.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' :
                    driver.status === 'BUSY' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                 }`}>
                    {driver.status.replace('_', ' ')}
                 </span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-card border border-slate-100/50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-xl text-slate-900 tracking-tight">Recent Bookings</h3>
          <button onClick={() => setCurrentView('bookings')} className="text-sm text-brand-600 font-bold hover:text-brand-700 hover:text-brand-700 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-8 py-4 font-bold">Customer</th>
                <th className="px-8 py-4 font-bold">Route</th>
                <th className="px-8 py-4 font-bold">Time</th>
                <th className="px-8 py-4 font-bold">Details</th>
                <th className="px-8 py-4 font-bold">Status</th>
                <th className="px-8 py-4 font-bold">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.slice(0, 5).map(booking => {
                const assignedDriver = drivers.find(d => d.id === booking.driverId);
                return (
                  <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5 font-bold text-slate-800">
                        {booking.customerName}
                        <div className="flex gap-1 mt-1">
                            {booking.paymentStatus === PaymentStatus.PAID && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-100">PAID</span>}
                            {booking.paymentStatus === PaymentStatus.INVOICED && <span className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-md border border-brand-100">XERO</span>}
                        </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 max-w-[250px]">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-xs font-medium"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>{booking.pickupLocation}</span>
                        <span className="flex items-center gap-2 text-xs font-medium"><span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>{booking.dropoffLocation}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-600 font-medium">
                      {new Date(booking.pickupTime).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-8 py-5 text-slate-600">
                        <div className="flex flex-col">
                            <span className="font-bold text-xs uppercase tracking-wide text-slate-400">{booking.vehicleClass || 'Standard'}</span>
                            <span className="font-bold text-slate-900">£{booking.price}</span>
                        </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
                        booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        booking.status === 'ASSIGNED' ? 'bg-brand-50 text-brand-600 border-brand-100' :
                        booking.status === 'CANCELLED' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-500">
                      {booking.status === BookingStatus.CANCELLED ? (
                        <span className="text-xs text-slate-400 font-medium italic">Cancelled</span>
                      ) : assignedDriver ? (
                        <span className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">{assignedDriver.name[0]}</div>
                          <span className="font-semibold text-slate-700 text-sm">{assignedDriver.name.split(' ')[0]}</span>
                        </span>
                      ) : (
                        <button 
                          onClick={() => setSelectedBookingForDispatch(booking)}
                          className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 shadow-md shadow-slate-900/20 transition-all active:scale-95"
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
      </div>
    </div>
  );

  const renderBookingsList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dispatch Board</h2>
            <p className="text-slate-500 font-medium mt-1">Manage active jobs and assignments</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Search..." className="pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" />
           </div>
        </div>
      </div>
      
      <div className="grid gap-5">
        {bookings.map(booking => {
          const assignedDriver = drivers.find(d => d.id === booking.driverId);
          const isCancellable = booking.status === BookingStatus.PENDING || booking.status === BookingStatus.ASSIGNED;

          return (
            <div key={booking.id} className={`bg-surface p-6 rounded-3xl border transition-all flex flex-col md:flex-row gap-6 md:items-center justify-between group relative overflow-hidden ${
              booking.status === BookingStatus.CANCELLED ? 'border-slate-100 opacity-60 bg-slate-50' : 'border-slate-100/50 shadow-card hover:shadow-soft'
            }`}>
              {booking.status === 'PENDING' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400" />}
              {booking.status === 'ASSIGNED' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500" />}
              {booking.status === 'COMPLETED' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />}
              {booking.status === 'CANCELLED' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-300" />}

              <div className="flex-1 pl-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">#{booking.id.toUpperCase()}</span>
                    <span className={`text-lg font-bold tracking-tight ${booking.status === 'CANCELLED' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {booking.customerName}
                    </span>
                    <div className="flex gap-1">
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-500 uppercase">{booking.passengers} pax</span>
                        {booking.paymentStatus === PaymentStatus.PAID && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold border border-emerald-100">PAID</span>}
                        {booking.paymentStatus === PaymentStatus.INVOICED && <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-1 rounded-md font-bold border border-brand-100">XERO</span>}
                    </div>
                  </div>
                  {isCancellable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingToCancel(booking);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors md:hidden"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                   <div className="flex items-center gap-3 text-slate-600 bg-slate-50/50 p-2 rounded-xl">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${booking.status === 'CANCELLED' ? 'bg-slate-300' : 'bg-emerald-400'}`} />
                      <span className="truncate font-medium">{booking.pickupLocation}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-600 bg-slate-50/50 p-2 rounded-xl">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${booking.status === 'CANCELLED' ? 'bg-slate-300' : 'bg-red-400'}`} />
                      <span className="truncate font-medium">{booking.dropoffLocation}</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8 mt-2 md:mt-0">
                <div className="text-left md:text-right">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(booking.pickupTime).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                     {new Date(booking.pickupTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {booking.status === 'PENDING' ? (
                    <button 
                      onClick={() => setSelectedBookingForDispatch(booking)}
                      className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                    >
                      Dispatch
                    </button>
                  ) : booking.status === 'CANCELLED' ? (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                      CANCELLED
                    </span>
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-50 pl-2 pr-5 py-2 rounded-full border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm">
                          {assignedDriver?.name[0]}
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">{assignedDriver?.name.split(' ')[0]}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">On Job</span>
                      </div>
                    </div>
                  )}

                  {isCancellable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingToCancel(booking);
                      }}
                      className="hidden md:block p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors border border-transparent hover:border-red-100"
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
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Services & Concierge</h2>
           <p className="text-slate-500 font-medium mt-1">Track driver purchases and service charges</p>
        </div>
      </div>
      
      <div className="bg-surface rounded-3xl border border-slate-100/50 shadow-card overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-400 uppercase tracking-wider text-xs">
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
            <tbody className="divide-y divide-slate-50">
                {services.map(service => {
                    const driver = drivers.find(d => d.id === service.driverId);
                    return (
                        <tr key={service.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-8 py-5 text-slate-500 font-medium">{new Date(service.date).toLocaleDateString('en-GB')}</td>
                            <td className="px-8 py-5 font-bold text-slate-900">{service.description}</td>
                            <td className="px-8 py-5 text-slate-600 font-medium">{service.vendor}</td>
                            <td className="px-8 py-5 text-slate-600 font-medium">£{service.cost.toFixed(2)}</td>
                            <td className="px-8 py-5 text-accent-600 font-bold">+£{service.serviceFee.toFixed(2)} <span className="text-xs font-normal text-slate-400 ml-1">({service.serviceChargePercent}%)</span></td>
                            <td className="px-8 py-5 font-black text-slate-900">£{service.total.toFixed(2)}</td>
                            <td className="px-8 py-5 text-slate-500">
                                {driver ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">{driver.name[0]}</div>
                                        <span className="text-xs font-bold">{driver.name.split(' ')[0]}</span>
                                    </div>
                                ) : <span className="text-xs italic text-slate-400">Unassigned</span>}
                            </td>
                            <td className="px-8 py-5">
                                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                                    service.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    service.status === 'PAID' ? 'bg-brand-50 text-brand-700 border-brand-100' :
                                    'bg-amber-50 text-amber-700 border-amber-100'
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
            <div className="p-12 text-center text-slate-400">
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
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Management</h2>
                <p className="text-slate-500 font-medium mt-1">Manage your drivers, vehicles, and availability</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map(driver => (
                <div key={driver.id} className="bg-surface rounded-3xl border border-slate-100 shadow-card p-6 hover:shadow-soft transition-all group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xl flex items-center justify-center shadow-inner">
                                {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg leading-tight">{driver.name}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <span className="font-bold text-slate-700">{driver.rating}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-medium">{driver.location}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                            driver.status === DriverStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            driver.status === DriverStatus.BUSY ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                            {driver.status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3 text-slate-700">
                                <Car className="w-4 h-4 text-slate-400" />
                                <span className="font-bold">{driver.vehicle}</span>
                            </div>
                            <div className="text-slate-500 text-xs font-medium bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">{driver.vehicleColour} • {driver.plate}</div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="font-medium tracking-wide">{driver.phone}</span>
                        </div>
                    </div>

                    {driver.notes && (
                        <div className="text-xs text-slate-500 bg-amber-50/50 border border-amber-100 p-3 rounded-xl italic mb-6">
                            "{driver.notes}"
                        </div>
                    )}

                    <div className="flex gap-3">
                         <button className="flex-1 py-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm">
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
    <div className="min-h-screen bg-background flex font-sans text-slate-900">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-72 bg-surface border-r border-slate-100 flex-col fixed h-full z-10 shadow-soft">
        <div className="p-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/40">
               <Car className="text-white w-6 h-6" />
            </div>
            <div>
                ELITE<span className="text-slate-400 font-light">DISPATCH</span>
            </div>
          </h1>
        </div>
        
        <nav className="flex-1 px-6 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <SidebarItem icon={CalendarPlus} label="Dispatch Board" active={currentView === 'bookings'} onClick={() => setCurrentView('bookings')} />
          <SidebarItem icon={Users} label="Drivers" active={currentView === 'drivers'} onClick={() => setCurrentView('drivers')} />
          <SidebarItem icon={ShoppingBag} label="Concierge" active={currentView === 'services'} onClick={() => setCurrentView('services')} />
        </nav>

        <div className="p-6 border-t border-slate-50">
            <button 
                onClick={() => setIsWidgetOpen(true)}
                className="flex items-center gap-2 px-4 py-3 mb-5 text-xs font-bold text-brand-700 bg-brand-50 rounded-2xl hover:bg-brand-100 w-full justify-center transition-colors border border-brand-100"
            >
                <Globe className="w-4 h-4" />
                Booking Widget
            </button>
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-slate-900/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                    <h4 className="font-bold text-base mb-1">Pro Plan</h4>
                    <p className="text-xs text-slate-300 mb-4 font-medium">Unlock AI Auto-Assign & Analytics</p>
                    <button className="w-full py-2 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">Upgrade Now</button>
                </div>
            </div>
            <button onClick={() => setShowLanding(true)} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 transition-colors mt-4 w-full justify-center group">
                <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-bold text-sm">Sign Out</span>
            </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-surface z-20 px-4 py-3 border-b border-slate-100 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2">
             <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Car className="text-white w-5 h-5" />
             </div>
             <span className="font-black text-lg tracking-tight">ELITE</span>
         </div>
         <button onClick={() => setIsWidgetOpen(true)} className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
            <Globe className="w-5 h-5 text-slate-600" />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-10 pt-20 md:pt-10 pb-28 md:pb-10 overflow-y-auto max-w-[1920px] mx-auto w-full">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'bookings' && renderBookingsList()}
        {currentView === 'services' && renderServicesList()}
        {currentView === 'drivers' && renderDriversList()}
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
        className={`fixed bottom-24 md:bottom-10 right-6 md:right-10 w-16 h-16 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-30 ${
            currentView === 'services' ? 'bg-accent-500 hover:bg-accent-600 shadow-glow shadow-accent-500/40' : 
            currentView === 'drivers' ? 'bg-slate-900 hover:bg-slate-800 shadow-glow shadow-slate-900/40' :
            'bg-brand-600 hover:bg-brand-700 shadow-glow shadow-brand-500/40'
        }`}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-slate-100 px-6 py-3 flex justify-between items-center z-30 pb-safe">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-brand-600' : 'text-slate-400'}`}>
            <LayoutDashboard className={`w-6 h-6 ${currentView === 'dashboard' ? 'fill-brand-100' : ''}`} />
            <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setCurrentView('bookings')} className={`flex flex-col items-center gap-1 ${currentView === 'bookings' ? 'text-brand-600' : 'text-slate-400'}`}>
            <CalendarPlus className={`w-6 h-6 ${currentView === 'bookings' ? 'fill-brand-100' : ''}`} />
            <span className="text-[10px] font-bold">Dispatch</span>
        </button>
        <button onClick={() => setCurrentView('services')} className={`flex flex-col items-center gap-1 ${currentView === 'services' ? 'text-accent-600' : 'text-slate-400'}`}>
            <ShoppingBag className={`w-6 h-6 ${currentView === 'services' ? 'fill-accent-100' : ''}`} />
            <span className="text-[10px] font-bold">Concierge</span>
        </button>
        <button onClick={() => setCurrentView('drivers')} className={`flex flex-col items-center gap-1 ${currentView === 'drivers' ? 'text-brand-600' : 'text-slate-400'}`}>
            <Users className={`w-6 h-6 ${currentView === 'drivers' ? 'fill-brand-100' : ''}`} />
            <span className="text-[10px] font-bold">Fleet</span>
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

      {isWidgetOpen && (
          <BookingWidget 
            onClose={() => setIsWidgetOpen(false)}
            onCreate={handleCreateBooking}
          />
      )}
    </div>
  );
};

export default App;
