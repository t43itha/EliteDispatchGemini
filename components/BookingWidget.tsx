
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Calendar, Clock, Users, Briefcase, Check, 
  ArrowRight, Shield, CreditCard, MessageCircle, Plane, Ship, Repeat
} from 'lucide-react';
import { Booking, BookingStatus, VehicleClass, PaymentStatus } from '../types';

interface BookingWidgetProps {
  onClose: () => void;
  onCreate: (booking: Booking) => void;
}

// Simulated Places Autocomplete
const MOCK_PLACES = [
  "Heathrow Airport (LHR), London",
  "Gatwick Airport (LGW), London",
  "The Ritz London, Piccadilly",
  "Canary Wharf, London",
  "Mayfair, London",
  "Oxford Street, London",
  "Cambridge, UK",
  "Brighton, UK"
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
        <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-brand-600' : 'bg-slate-200'}`} />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row animate-in fade-in duration-300">
      {/* Left Side - Live Map Simulation */}
      <div className="hidden md:block w-1/2 bg-slate-100 relative overflow-hidden border-r border-slate-200">
        {/* Map Placeholder Background */}
        <div className="absolute inset-0 bg-[#e5e7eb] opacity-50" style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
        
        {/* Simulated Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path d="M 150 300 Q 400 400 500 200" stroke="#3b82f6" strokeWidth="4" fill="none" strokeDasharray="8 4" className="animate-[dash_20s_linear_infinite]" />
            <circle cx="150" cy="300" r="8" fill="#22c55e" />
            <circle cx="500" cy="200" r="8" fill="#ef4444" />
        </svg>

        {/* Map UI Elements */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    Live Route Preview
                </h3>
                {quote && (
                    <div className="mt-2 text-sm text-slate-600">
                        <p>Distance: <b>{quote.distance}</b></p>
                        <p>Est. Time: <b>{quote.duration}</b></p>
                        <p className="text-xs text-slate-400 mt-1">Traffic: Normal</p>
                    </div>
                )}
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors">
                <div className="w-6 h-6 flex items-center justify-center font-bold text-slate-500">✕</div>
            </button>
        </div>

        {/* Vehicle Preview on Map */}
        {selectedVehicle && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-slate-800">{selectedVehicle}</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">2 mins away</span>
            </div>
        )}
      </div>

      {/* Right Side - Booking Form */}
      <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto bg-white">
        <div className="p-6 md:p-10 max-w-xl mx-auto w-full flex-1 flex flex-col">
          
          <div className="flex items-center justify-between mb-6 md:hidden">
             <h2 className="font-bold text-lg">New Booking</h2>
             <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">✕</button>
          </div>

          <StepIndicator />

          {/* Step 1: Journey Details */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Where to next?</h1>
                    <p className="text-slate-500">Premium chauffeur service at your fingertips.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button onClick={() => setTab('oneway')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'oneway' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}>One Way</button>
                    <button onClick={() => setTab('hourly')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'hourly' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}>Hourly</button>
                    <button onClick={() => setTab('airport')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'airport' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}>Airport</button>
                </div>

                {/* Inputs */}
                <div className="space-y-4 relative">
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-green-500 group-focus-within:text-green-600" />
                        <input 
                            list="places"
                            type="text" 
                            placeholder={tab === 'airport' ? "Pickup Airport..." : "Pickup Location"}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium"
                            value={formData.pickup}
                            onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                        />
                    </div>
                    
                    {tab !== 'hourly' && (
                         <div className="relative group">
                            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-red-500 group-focus-within:text-red-600" />
                            <input 
                                list="places"
                                type="text" 
                                placeholder="Dropoff Location"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium"
                                value={formData.dropoff}
                                onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                         <div className="relative">
                            <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="date" 
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <Clock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="time" 
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
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
                     <div className="flex items-center gap-2 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50" onClick={() => setIsReturn(!isReturn)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isReturn ? 'bg-brand-600 border-brand-600' : 'border-slate-300'}`}>
                            {isReturn && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700">Add Return Journey?</span>
                     </div>
                )}

                <button 
                    onClick={() => setStep(2)}
                    disabled={!formData.pickup || (!formData.dropoff && tab !== 'hourly')}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Select Vehicle <ArrowRight className="w-5 h-5" />
                </button>
            </div>
          )}

          {/* Step 2: Vehicle Selection */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
                    <h2 className="text-2xl font-bold text-slate-900">Select Vehicle</h2>
                </div>

                {isCalculating ? (
                    <div className="py-20 text-center">
                        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium">Calculating best rates...</p>
                    </div>
                ) : quote ? (
                    <div className="space-y-4">
                        {/* Business Class */}
                        <div 
                            onClick={() => setSelectedVehicle(VehicleClass.BUSINESS)}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedVehicle === VehicleClass.BUSINESS ? 'border-brand-600 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                    <div className="text-[10px]">E-Class</div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Business Class</h3>
                                    <p className="text-xs text-slate-500">Mercedes-Benz E-Class or similar</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                        <span className="flex items-center"><Users className="w-3 h-3 mr-1"/> 3</span>
                                        <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1"/> 2</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-slate-900">${quote.prices[VehicleClass.BUSINESS]}</div>
                                <div className="text-xs text-slate-500">Fixed Price</div>
                            </div>
                        </div>

                        {/* First Class */}
                        <div 
                            onClick={() => setSelectedVehicle(VehicleClass.FIRST)}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedVehicle === VehicleClass.FIRST ? 'border-brand-600 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white">
                                    <div className="text-[10px]">S-Class</div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">First Class</h3>
                                    <p className="text-xs text-slate-500">Mercedes-Benz S-Class or similar</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                        <span className="flex items-center"><Users className="w-3 h-3 mr-1"/> 3</span>
                                        <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1"/> 2</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-slate-900">${quote.prices[VehicleClass.FIRST]}</div>
                                <div className="text-xs text-slate-500">Fixed Price</div>
                            </div>
                        </div>

                        {/* Van Class */}
                        <div 
                            onClick={() => setSelectedVehicle(VehicleClass.VAN)}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedVehicle === VehicleClass.VAN ? 'border-brand-600 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-10 bg-slate-300 rounded-lg flex items-center justify-center text-slate-500">
                                    <div className="text-[10px]">V-Class</div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Business Van</h3>
                                    <p className="text-xs text-slate-500">Mercedes-Benz V-Class or similar</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                        <span className="flex items-center"><Users className="w-3 h-3 mr-1"/> 6</span>
                                        <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1"/> 6</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-slate-900">${quote.prices[VehicleClass.VAN]}</div>
                                <div className="text-xs text-slate-500">Fixed Price</div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <button 
                    onClick={() => setStep(3)}
                    disabled={!selectedVehicle}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continue <ArrowRight className="w-5 h-5" />
                </button>
            </div>
          )}

           {/* Step 3: Passenger Details */}
           {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setStep(2)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
                    <h2 className="text-2xl font-bold text-slate-900">Passenger Details</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                             <input 
                                type="text" 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                             <input 
                                type="tel" 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="+1 234 567 890"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                             />
                         </div>
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                         <input 
                            type="email" 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes for Driver</label>
                         <textarea 
                            rows={3}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                            placeholder="Flight number, child seat requirements, gate number..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                         />
                    </div>
                </div>

                <button 
                    onClick={() => setStep(4)}
                    disabled={!formData.name || !formData.phone}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Review & Pay <ArrowRight className="w-5 h-5" />
                </button>
            </div>
           )}

           {/* Step 4: Confirmation */}
           {step === 4 && quote && selectedVehicle && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
                 <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => setStep(3)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
                    <h2 className="text-2xl font-bold text-slate-900">Confirm Booking</h2>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                         <div>
                             <p className="text-sm text-slate-500">Total Price</p>
                             <p className="text-3xl font-black text-slate-900">${quote.prices[selectedVehicle]}</p>
                         </div>
                         <div className="text-right">
                             <p className="font-bold text-slate-900">{selectedVehicle}</p>
                             <p className="text-sm text-slate-500">{quote.distance} • {quote.duration}</p>
                         </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-slate-700 font-medium">{formData.pickup}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                            <span className="text-slate-700 font-medium">{formData.dropoff}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                            <span className="text-slate-700">{new Date(formData.date).toLocaleDateString()} at {formData.time}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleCreate('stripe')}
                        className="w-full bg-[#635bff] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#5248e8] transition-all shadow-lg shadow-indigo-200"
                    >
                        <CreditCard className="w-5 h-5" />
                        Pay securely with Stripe
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button 
                        onClick={() => handleCreate('whatsapp')}
                        className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-all shadow-lg shadow-green-200"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Book via WhatsApp
                    </button>

                    <button 
                        onClick={() => handleCreate('invoice')}
                        className="w-full bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                    >
                        <Shield className="w-5 h-5" />
                        Pay on Invoice (Corporate)
                    </button>
                </div>
                
                <p className="text-center text-xs text-slate-400 mt-4">
                    By booking you agree to our Terms of Service. Payments are processed securely.
                </p>
            </div>
           )}

        </div>
      </div>
    </div>
  );
};
