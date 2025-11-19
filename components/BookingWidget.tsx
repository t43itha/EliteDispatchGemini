
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Calendar, Clock, Users, Briefcase, Check, 
  ArrowRight, Shield, CreditCard, MessageCircle, Plane, Ship, Repeat, ChevronLeft, X
} from 'lucide-react';
import { Booking, BookingStatus, VehicleClass, PaymentStatus } from '../types';

interface BookingWidgetProps {
  onClose: () => void;
  onCreate: (booking: Booking) => void;
}

// Simulated Places Autocomplete (London/UK)
const MOCK_PLACES = [
  "Heathrow Airport (LHR), London",
  "Gatwick Airport (LGW), London",
  "The Ritz London, Piccadilly",
  "Canary Wharf, London",
  "Mayfair, London",
  "Oxford Street, London",
  "Cambridge, UK",
  "Brighton, UK",
  "St Pancras International",
  "The Savoy, Strand"
];

export const BookingWidget: React.FC<BookingWidgetProps> = ({ onClose, onCreate }) => {
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState<'oneway' | 'hourly' | 'airport'>('oneway');
  const [isReturn, setIsReturn] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    passengers: 1,
    luggage: 1,
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleClass | null>(null);
  const [quote, setQuote] = useState<{distance: string, duration: string, prices: Record<VehicleClass, number>} | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Mocks calculation when locations change
  useEffect(() => {
    if (formData.pickup && (formData.dropoff || tab === 'hourly')) {
      setIsCalculating(true);
      setTimeout(() => {
        const baseDist = Math.floor(Math.random() * 30) + 10;
        setQuote({
          distance: `${baseDist} km`,
          duration: `${Math.floor(baseDist * 1.2)} mins`,
          prices: {
            [VehicleClass.BUSINESS]: 50 + (baseDist * 2.5),
            [VehicleClass.FIRST]: 100 + (baseDist * 4),
            [VehicleClass.VAN]: 80 + (baseDist * 3.5)
          }
        });
        setIsCalculating(false);
      }, 800);
    }
  }, [formData.pickup, formData.dropoff, tab]);

  const handleCreate = (method: 'stripe' | 'whatsapp' | 'invoice') => {
    if (!selectedVehicle || !quote) return;
    
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: formData.name,
      customerPhone: formData.phone,
      customerEmail: formData.email,
      pickupLocation: formData.pickup,
      dropoffLocation: tab === 'hourly' ? 'As Directed (Hourly)' : formData.dropoff,
      pickupTime: new Date(`${formData.date}T${formData.time}`).toISOString(),
      passengers: formData.passengers,
      price: quote.prices[selectedVehicle],
      status: BookingStatus.PENDING,
      vehicleClass: selectedVehicle,
      paymentStatus: method === 'stripe' ? PaymentStatus.PAID : method === 'invoice' ? PaymentStatus.INVOICED : PaymentStatus.PENDING,
      distance: quote.distance,
      duration: quote.duration,
      isReturn: isReturn,
      notes: `${formData.notes} ${method === 'whatsapp' ? '[Booked via WhatsApp]' : ''} ${method === 'invoice' ? '[Xero Invoice Drafted]' : ''}`
    };
    
    onCreate(newBooking);
    onClose();
    
    if (method === 'whatsapp') {
       const text = `Hi, I'd like to book a ${selectedVehicle} from ${formData.pickup} to ${formData.dropoff} on ${formData.date} at ${formData.time}. Name: ${formData.name}`;
       window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-brand-600' : 'bg-slate-100'}`} />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row animate-in fade-in duration-300">
      {/* Left Side - Live Map Simulation */}
      <div className="hidden md:block w-1/2 bg-slate-50 relative overflow-hidden border-r border-slate-100">
        {/* Map Placeholder Background */}
        <div className="absolute inset-0 bg-[#f1f5f9] opacity-80" style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}></div>
        
        {/* Simulated Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path d="M 150 300 Q 400 400 500 200" stroke="#6366f1" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="12 8" className="animate-[dash_30s_linear_infinite]" />
            <circle cx="150" cy="300" r="12" fill="#10b981" className="shadow-lg" />
            <circle cx="150" cy="300" r="20" fill="#10b981" opacity="0.2" className="animate-ping" />
            <circle cx="500" cy="200" r="12" fill="#ef4444" className="shadow-lg" />
        </svg>

        {/* Map UI Elements */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
            <div className="bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-soft border border-white/50 w-64">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    Live Preview
                </h3>
                {quote ? (
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between text-slate-600">
                            <span>Distance</span>
                            <span className="font-bold text-slate-900">{quote.distance}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Est. Time</span>
                            <span className="font-bold text-slate-900">{quote.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 p-1.5 rounded-lg mt-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                             Traffic is flowing freely
                        </div>
                    </div>
                ) : (
                   <div className="text-xs text-slate-400 italic">Enter locations to see route estimate...</div>
                )}
            </div>
            <button onClick={onClose} className="p-3 bg-white rounded-full shadow-soft hover:bg-slate-50 transition-colors group border border-slate-100">
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </button>
        </div>

        {/* Vehicle Preview on Map */}
        {selectedVehicle && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white py-3 px-5 rounded-full shadow-glow flex items-center gap-3 animate-in slide-in-from-bottom-4 border border-slate-100">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <span className="font-bold text-slate-800">{selectedVehicle}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 text-sm">2 mins away</span>
            </div>
        )}
      </div>

      {/* Right Side - Booking Form */}
      <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto bg-surface">
        <div className="p-6 md:p-12 max-w-xl mx-auto w-full flex-1 flex flex-col">
          
          <div className="flex items-center justify-between mb-6 md:hidden">
             <h2 className="font-bold text-lg">New Booking</h2>
             <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">✕</button>
          </div>

          <StepIndicator />

          {/* Step 1: Journey Details */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Where to next?</h1>
                    <p className="text-slate-500 font-medium">Premium chauffeur service at your fingertips.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6 border border-slate-100">
                    <button onClick={() => setTab('oneway')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${tab === 'oneway' ? 'bg-white shadow-card text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>One Way</button>
                    <button onClick={() => setTab('hourly')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${tab === 'hourly' ? 'bg-white shadow-card text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>Hourly</button>
                    <button onClick={() => setTab('airport')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${tab === 'airport' ? 'bg-white shadow-card text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>Airport</button>
                </div>

                {/* Inputs */}
                <div className="space-y-5 relative">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-emerald-50 rounded-lg text-emerald-600 group-focus-within:bg-emerald-100 transition-colors">
                             <MapPin className="w-5 h-5" />
                        </div>
                        <input 
                            list="places"
                            type="text" 
                            placeholder={tab === 'airport' ? "Pickup Airport..." : "Pickup Location"}
                            className="w-full pl-16 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400"
                            value={formData.pickup}
                            onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                        />
                    </div>
                    
                    {tab !== 'hourly' && (
                         <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-red-50 rounded-lg text-red-500 group-focus-within:bg-red-100 transition-colors">
                                 <MapPin className="w-5 h-5" />
                            </div>
                            <input 
                                list="places"
                                type="text" 
                                placeholder="Dropoff Location"
                                className="w-full pl-16 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400"
                                value={formData.dropoff}
                                onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                         <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <input 
                                type="date" 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                                <Clock className="w-5 h-5" />
                            </div>
                            <input 
                                type="time" 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                                value={formData.time}
                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    {/* Datalist for mock autocomplete */}
                    <datalist id="places">
                        {MOCK_PLACES.map(place => <option key={place} value={place} />)}
                    </datalist>
                </div>

                {tab === 'oneway' && (
                     <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsReturn(!isReturn)}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isReturn ? 'bg-brand-600 border-brand-600' : 'border-slate-300'}`}>
                            {isReturn && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-sm font-bold text-slate-700">Add Return Journey?</span>
                     </div>
                )}

                <button 
                    onClick={() => setStep(2)}
                    disabled={!formData.pickup || (!formData.dropoff && tab !== 'hourly')}
                    className="w-full bg-brand-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30 text-lg mt-4"
                >
                    Select Vehicle <ArrowRight className="w-5 h-5" />
                </button>
            </div>
          )}

          {/* Step 2: Vehicle Selection */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setStep(1)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-700"><ChevronLeft className="w-6 h-6" /></button>
                    <h2 className="text-2xl font-bold text-slate-900">Select Vehicle</h2>
                </div>

                {isCalculating ? (
                    <div className="py-20 text-center">
                        <div className="relative w-16 h-16 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-800 font-bold text-lg">Calculating best rates...</p>
                        <p className="text-slate-400 text-sm mt-1">Checking availability in your area</p>
                    </div>
                ) : quote ? (
                    <div className="space-y-4">
                        {/* Business Class */}
                        <div 
                            onClick={() => setSelectedVehicle(VehicleClass.BUSINESS)}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedVehicle === VehicleClass.BUSINESS ? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-100' : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-14 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-inner">
                                    <div className="text-[10px] font-bold uppercase tracking-wider">E-Class</div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Business Class</h3>
                                    <p className="text-xs text-slate-500 font-medium">Mercedes-Benz E-Class or similar</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-bold">
                                        <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5"/> 3</span>
                                        <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1.5"/> 2</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-slate-900">£{quote.prices[VehicleClass.BUSINESS]}</div>
                                <div className="text-xs text-brand-600 font-bold bg-brand-50 inline-block px-2 py-1 rounded-full mt-1">Fixed Price</div>
                            </div>
                        </div>

                        {/* First Class */}
                        <div 
                            onClick={() => setSelectedVehicle(VehicleClass.FIRST)}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedVehicle === VehicleClass.FIRST ? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-100' : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-xl">
                                    <div className="text-[10px] font-bold uppercase tracking-wider">S-Class</div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">First Class</h3>
                                    <p className="text-xs text-slate-500 font-medium">Mercedes-Benz S-Class or similar</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-bold">
                                        <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5"/> 3</span>
                                        <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1.5"/> 2</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-slate-900">£{quote.prices[VehicleClass.FIRST]}</div>
                                <div className="text-xs text-brand-600 font-bold bg-brand-50 inline-block px-2 py-1 rounded-full mt-1">Fixed Price</div>
                            </div>
                        </div>

                        {/* Van Class */}
                        <div 
                            onClick={() => setSelectedVehicle(VehicleClass.VAN)}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedVehicle === VehicleClass.VAN ? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-100' : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-14 bg-slate-300 rounded-xl flex items-center justify-center text-slate-500 shadow-inner">
                                    <div className="text-[10px] font-bold uppercase tracking-wider">V-Class</div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Business Van</h3>
                                    <p className="text-xs text-slate-500 font-medium">Mercedes-Benz V-Class or similar</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-bold">
                                        <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5"/> 6</span>
                                        <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1.5"/> 6</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-slate-900">£{quote.prices[VehicleClass.VAN]}</div>
                                <div className="text-xs text-brand-600 font-bold bg-brand-50 inline-block px-2 py-1 rounded-full mt-1">Fixed Price</div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <button 
                    onClick={() => setStep(3)}
                    disabled={!selectedVehicle}
                    className="w-full bg-brand-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30 text-lg mt-4"
                >
                    Continue <ArrowRight className="w-5 h-5" />
                </button>
            </div>
          )}

           {/* Step 3: Passenger Details */}
           {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setStep(2)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-700"><ChevronLeft className="w-6 h-6" /></button>
                    <h2 className="text-2xl font-bold text-slate-900">Passenger Details</h2>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                             <input 
                                type="text" 
                                className="w-full p-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                placeholder="James Bond"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                             <input 
                                type="tel" 
                                className="w-full p-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                placeholder="+44 7700 900123"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                             />
                         </div>
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                         <input 
                            type="email" 
                            className="w-full p-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                            placeholder="james@mi6.gov.uk"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes for Chauffeur</label>
                         <textarea 
                            rows={3}
                            className="w-full p-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none resize-none font-medium"
                            placeholder="Flight number, child seat requirements..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                         />
                    </div>
                </div>

                <button 
                    onClick={() => setStep(4)}
                    disabled={!formData.name || !formData.phone}
                    className="w-full bg-brand-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30 text-lg mt-4"
                >
                    Review & Pay <ArrowRight className="w-5 h-5" />
                </button>
            </div>
           )}

           {/* Step 4: Confirmation */}
           {step === 4 && quote && selectedVehicle && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                 <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => setStep(3)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-700"><ChevronLeft className="w-6 h-6" /></button>
                    <h2 className="text-2xl font-bold text-slate-900">Confirm Booking</h2>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-5">
                         <div>
                             <p className="text-sm text-slate-500 font-medium">Total Price</p>
                             <p className="text-4xl font-black text-slate-900 tracking-tight">£{quote.prices[selectedVehicle]}</p>
                         </div>
                         <div className="text-right">
                             <p className="font-bold text-slate-900 text-lg">{selectedVehicle}</p>
                             <p className="text-sm text-slate-500 font-medium">{quote.distance} • {quote.duration}</p>
                         </div>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-700 font-bold">{formData.pickup}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-2 h-2 rounded-sm bg-red-500"></div>
                            <span className="text-slate-700 font-bold">{formData.dropoff}</span>
                        </div>
                        <div className="flex items-start gap-3 pt-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700 font-medium">{new Date(formData.date).toLocaleDateString('en-GB')} at {formData.time}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleCreate('stripe')}
                        className="w-full bg-[#635bff] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#5248e8] transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                    >
                        <CreditCard className="w-5 h-5" />
                        Pay securely with Stripe
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-bold uppercase tracking-widest">Or</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button 
                        onClick={() => handleCreate('whatsapp')}
                        className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#128C7E] transition-all shadow-lg shadow-green-200 active:scale-[0.98]"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Book via WhatsApp
                    </button>

                    <button 
                        onClick={() => handleCreate('invoice')}
                        className="w-full bg-white border-2 border-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]"
                    >
                        <Shield className="w-5 h-5" />
                        Pay on Invoice (Corporate)
                    </button>
                </div>
                
                <p className="text-center text-xs text-slate-400 mt-6 font-medium">
                    By booking you agree to our Terms of Service. Payments are processed securely.
                </p>
            </div>
           )}

        </div>
      </div>
    </div>
  );
};
