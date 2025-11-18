
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

// --- Layout Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-brand-400' : ''}`} />
    <span className="font-medium">{label}</span>
  </button>
);

// --- Main App Component ---

const App: React.FC = () => {
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
    if (isWidgetOpen) {
        // If created via widget, maybe show a success toast or similar (omitted for brevity)
    }
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

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.revenue.toFixed(0)}`} 
          icon={DollarSign} 
          color="text-emerald-600"
          trend="+12% vs last week"
        />
        <StatCard 
          title="Active Jobs" 
          value={stats.activeJobs} 
          icon={Car} 
          color="text-blue-600"
        />
        <StatCard 
          title="Pending Dispatch" 
          value={stats.pendingDispatch} 
          icon={Clock} 
          color="text-orange-500"
        />
        <StatCard 
          title="Completed" 
          value={stats.completedToday} 
          icon={CheckCircle} 
          color="text-slate-600"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-900 mb-4">Revenue Overview</h3>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-900">Drivers Status</h3>
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Live</span>
          </div>
          <div className="space-y-4">
             {drivers.map(driver => (
               <div key={driver.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                 <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${
                     driver.status === 'AVAILABLE' ? 'bg-emerald-500' : 
                     driver.status === 'BUSY' ? 'bg-orange-400' : 'bg-slate-400'
                   }`} />
                   <div>
                     <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                     <p className="text-xs text-slate-500">{driver.vehicle}</p>
                   </div>
                 </div>
                 <span className="text-xs font-medium text-slate-600">{driver.status}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900">Recent Bookings</h3>
          <button onClick={() => setCurrentView('bookings')} className="text-sm text-brand-600 font-medium hover:text-brand-700">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Route</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Details</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.slice(0, 5).map(booking => {
                const assignedDriver = drivers.find(d => d.id === booking.driverId);
                return (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                        {booking.customerName}
                        {booking.paymentStatus === PaymentStatus.PAID && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">PAID</span>}
                        {booking.paymentStatus === PaymentStatus.INVOICED && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">XERO</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1"><span className="w-1 h-1 bg-green-500 rounded-full"></span>{booking.pickupLocation}</span>
                        <span className="flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{booking.dropoffLocation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(booking.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                        <div className="flex flex-col">
                            <span className="font-medium">{booking.vehicleClass || 'Standard'}</span>
                            <span className="text-xs">${booking.price}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                        booking.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-600' :
                        booking.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {booking.status === BookingStatus.CANCELLED ? (
                        <span className="text-xs text-slate-400 italic">Cancelled</span>
                      ) : assignedDriver ? (
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">{assignedDriver.name[0]}</span>
                          {assignedDriver.name.split(' ')[0]}
                        </span>
                      ) : (
                        <button 
                          onClick={() => setSelectedBookingForDispatch(booking)}
                          className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
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
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-slate-900">Dispatch Board</h2>
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Search bookings..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
           </div>
        </div>
      </div>
      
      <div className="grid gap-4">
        {bookings.map(booking => {
          const assignedDriver = drivers.find(d => d.id === booking.driverId);
          const isCancellable = booking.status === BookingStatus.PENDING || booking.status === BookingStatus.ASSIGNED;

          return (
            <div key={booking.id} className={`bg-white p-5 rounded-xl border transition-shadow flex flex-col md:flex-row gap-4 md:items-center justify-between group relative overflow-hidden ${
              booking.status === BookingStatus.CANCELLED ? 'border-slate-100 opacity-75 bg-slate-50' : 'border-slate-200 shadow-sm hover:shadow-md'
            }`}>
              {booking.status === 'PENDING' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400" />}
              {booking.status === 'ASSIGNED' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
              {booking.status === 'COMPLETED' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
              {booking.status === 'CANCELLED' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300" />}

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400">#{booking.id.toUpperCase()}</span>
                    <span className={`text-sm font-bold ${booking.status === 'CANCELLED' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {booking.customerName}
                    </span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{booking.passengers} pax</span>
                    {booking.paymentStatus === PaymentStatus.PAID && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">PAID</span>}
                    {booking.paymentStatus === PaymentStatus.INVOICED && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">XERO</span>}
                  </div>
                  {isCancellable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingToCancel(booking);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors md:hidden"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                   <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className={`w-4 h-4 ${booking.status === 'CANCELLED' ? 'text-slate-400' : 'text-green-500'}`} />
                      <span className="truncate max-w-[200px]">{booking.pickupLocation}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className={`w-4 h-4 ${booking.status === 'CANCELLED' ? 'text-slate-400' : 'text-red-500'}`} />
                      <span className="truncate max-w-[200px]">{booking.dropoffLocation}</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 mt-2 md:mt-0">
                <div className="text-left md:text-right">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(booking.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="text-xs text-slate-500">
                     {new Date(booking.pickupTime).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {booking.status === 'PENDING' ? (
                    <button 
                      onClick={() => setSelectedBookingForDispatch(booking)}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                      Dispatch
                    </button>
                  ) : booking.status === 'CANCELLED' ? (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      CANCELLED
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-50 pl-2 pr-4 py-1.5 rounded-full border border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                          {assignedDriver?.name[0]}
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">{assignedDriver?.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Assigned</span>
                      </div>
                    </div>
                  )}

                  {isCancellable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingToCancel(booking);
                      }}
                      className="hidden md:block p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Cancel Booking"
                    >
                      <Trash2 className="w-4 h-4" />
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
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-2">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Services & Concierge</h2>
           <p className="text-slate-500 text-sm">Track driver purchases and service charges</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Vendor</th>
                <th className="px-6 py-4 font-medium">Cost</th>
                <th className="px-6 py-4 font-medium">Fee</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Driver</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {services.map(service => {
                    const driver = drivers.find(d => d.id === service.driverId);
                    return (
                        <tr key={service.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-500">{new Date(service.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{service.description}</td>
                            <td className="px-6 py-4 text-slate-600">{service.vendor}</td>
                            <td className="px-6 py-4 text-slate-600">£{service.cost.toFixed(2)}</td>
                            <td className="px-6 py-4 text-purple-600 font-medium">+£{service.serviceFee.toFixed(2)} ({service.serviceChargePercent}%)</td>
                            <td className="px-6 py-4 font-bold text-slate-900">£{service.total.toFixed(2)}</td>
                            <td className="px-6 py-4 text-slate-500">
                                {driver ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">{driver.name[0]}</div>
                                        <span className="text-xs">{driver.name}</span>
                                    </div>
                                ) : <span className="text-xs italic text-slate-400">Unassigned</span>}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                    service.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    service.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
                                    'bg-orange-100 text-orange-700'
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
            <div className="p-8 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No service records yet.</p>
            </div>
        )}
      </div>
    </div>
  );

  const renderDriversList = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-2">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Fleet Management</h2>
                <p className="text-slate-500 text-sm">Manage your drivers, vehicles, and availability</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map(driver => (
                <div key={driver.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-bold text-lg flex items-center justify-center">
                                {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{driver.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="font-medium text-slate-700">{driver.rating}</span>
                                    <span>• {driver.location}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            driver.status === DriverStatus.AVAILABLE ? 'bg-emerald-100 text-emerald-700' :
                            driver.status === DriverStatus.BUSY ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                            {driver.status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Car className="w-4 h-4" />
                                <span className="font-medium">{driver.vehicle}</span>
                            </div>
                            <div className="text-slate-500 text-xs">{driver.vehicleColor} • {driver.plate}</div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 p-2">
                            <Phone className="w-4 h-4" />
                            <span>{driver.phone}</span>
                        </div>
                    </div>

                    {driver.notes && (
                        <div className="text-xs text-slate-500 bg-white border border-slate-100 p-2 rounded-lg italic mb-4">
                            "{driver.notes}"
                        </div>
                    )}

                    <div className="flex gap-2">
                         <button className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                            Edit Profile
                         </button>
                         <button 
                            onClick={() => window.open(`https://wa.me/${driver.phone.replace(/\+/g, '')}`, '_blank')}
                            className="flex-1 py-2 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                         </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
               <Car className="text-white w-5 h-5" />
            </div>
            ELITE<span className="text-slate-400 font-light">DISPATCH</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <SidebarItem icon={CalendarPlus} label="Dispatch Board" active={currentView === 'bookings'} onClick={() => setCurrentView('bookings')} />
          <SidebarItem icon={Users} label="Drivers" active={currentView === 'drivers'} onClick={() => setCurrentView('drivers')} />
          <SidebarItem icon={ShoppingBag} label="Services" active={currentView === 'services'} onClick={() => setCurrentView('services')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
            <button 
                onClick={() => setIsWidgetOpen(true)}
                className="flex items-center gap-2 px-4 py-2 mb-4 text-xs font-bold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 w-full justify-center"
            >
                <Globe className="w-3 h-3" />
                Open Booking Widget
            </button>
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                <h4 className="font-bold text-sm mb-1">Pro Plan</h4>
                <p className="text-xs text-slate-300 mb-3">Unlock AI Auto-Assign</p>
                <button className="w-full py-1.5 bg-white text-slate-900 text-xs font-bold rounded-lg">Upgrade</button>
            </div>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 transition-colors mt-2 w-full">
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Sign Out</span>
            </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-20 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
         <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Car className="text-white w-5 h-5" />
         </div>
         <h1 className="text-lg font-bold text-slate-900">ED</h1>
         <button onClick={() => setIsWidgetOpen(true)} className="p-2 bg-brand-50 rounded-full">
            <Globe className="w-5 h-5 text-brand-600" />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
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
        className={`fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 z-30 ${
            currentView === 'services' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/40' : 
            currentView === 'drivers' ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/40' :
            'bg-brand-600 hover:bg-brand-700 shadow-brand-500/40'
        }`}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-30">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-brand-600' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => setCurrentView('bookings')} className={`flex flex-col items-center gap-1 ${currentView === 'bookings' ? 'text-brand-600' : 'text-slate-400'}`}>
            <CalendarPlus className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dispatch</span>
        </button>
        <button onClick={() => setCurrentView('services')} className={`flex flex-col items-center gap-1 ${currentView === 'services' ? 'text-purple-600' : 'text-slate-400'}`}>
            <ShoppingBag className="w-6 h-6" />
            <span className="text-[10px] font-medium">Services</span>
        </button>
        <button onClick={() => setCurrentView('drivers')} className={`flex flex-col items-center gap-1 ${currentView === 'drivers' ? 'text-brand-600' : 'text-slate-400'}`}>
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium">Drivers</span>
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