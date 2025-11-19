


import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Calendar, Clock, Users, Briefcase, Check, 
  ArrowRight, CreditCard, MessageCircle, ChevronLeft, X, AlertTriangle
} from 'lucide-react';
import { Booking, BookingStatus, VehicleClass, PaymentStatus, WidgetConfig } from '../types';

// Declare google as any to avoid TypeScript namespace errors
declare var google: any;

interface BookingWidgetProps {
  onClose: () => void;
  onCreate: (booking: Booking) => void;
  config?: WidgetConfig;
  isInline?: boolean; // If true, renders without modal overlay (for preview)
}

const DEFAULT_CONFIG: WidgetConfig = {
  companyName: 'EliteDispatch',
  primaryColor: '#2563eb',
  currency: '£',
  showMap: true,
  distanceUnit: 'mi',
  vehicles: {
    [VehicleClass.BUSINESS]: { 
        enabled: true, 
        basePrice: 50, 
        pricePerUnit: 3.5, 
        image: 'https://www.sixt.com/fileadmin/files/global/user_upload/fleet/png/350x200/mercedes-benz-e-class-4d-black-2020.png',
        name: 'Business Class',
        description: 'Mercedes E-Class or similar',
        maxPassengers: 3,
        maxLuggage: 2
    },
    [VehicleClass.FIRST]: { 
        enabled: true, 
        basePrice: 100, 
        pricePerUnit: 5.0,
        image: 'https://www.sixt.com/fileadmin/files/global/user_upload/fleet/png/350x200/mercedes-benz-s-class-4d-black-2020.png',
        name: 'First Class',
        description: 'Mercedes S-Class or similar',
        maxPassengers: 3,
        maxLuggage: 2
    },
    [VehicleClass.VAN]: { 
        enabled: true, 
        basePrice: 80, 
        pricePerUnit: 4.5,
        image: 'https://www.sixt.com/fileadmin/files/global/user_upload/fleet/png/350x200/mercedes-benz-v-class-van-black-2020.png',
        name: 'Business Van',
        description: 'Mercedes V-Class or similar',
        maxPassengers: 6,
        maxLuggage: 6
    },
  }
};

// Soft Pop Map Style
const MAP_STYLES = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];

export const BookingWidget: React.FC<BookingWidgetProps> = ({ 
  onClose, 
  onCreate, 
  config = DEFAULT_CONFIG, 
  isInline = false 
}) => {
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState<'oneway' | 'hourly' | 'airport'>('oneway');
  const [isReturn, setIsReturn] = useState(false);
  const [mapError, setMapError] = useState(false);
  
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
  const [quote, setQuote] = useState<{distanceText: string, duration: string, distanceVal: number, prices: Record<VehicleClass, number>} | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Google Maps Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  // Using any type to bypass namespace errors
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);

  // Initialize Map and Autocomplete
  useEffect(() => {
    if (!(window as any).google) {
      setMapError(true);
      return;
    }

    // Initialize Map
    if (config.showMap && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: 51.5074, lng: -0.1278 }, // London Default
        zoom: 12,
        disableDefaultUI: true,
        styles: MAP_STYLES,
      });

      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: config.primaryColor,
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
    }

    // Initialize Autocomplete for Pickup
    if (pickupInputRef.current) {
      const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInputRef.current, {
        fields: ["formatted_address", "geometry", "name"],
        strictBounds: false,
      });
      
      pickupAutocomplete.addListener("place_changed", () => {
        const place = pickupAutocomplete.getPlace();
        if (place.formatted_address) {
          setFormData(prev => ({ ...prev, pickup: place.formatted_address || '' }));
        }
      });
    }

    // Initialize Autocomplete for Dropoff
    if (dropoffInputRef.current) {
      const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInputRef.current, {
        fields: ["formatted_address", "geometry", "name"],
        strictBounds: false,
      });

      dropoffAutocomplete.addListener("place_changed", () => {
        const place = dropoffAutocomplete.getPlace();
        if (place.formatted_address) {
          setFormData(prev => ({ ...prev, dropoff: place.formatted_address || '' }));
        }
      });
    }

  }, [config.showMap, config.primaryColor]);

  // Trigger Route Calculation with Debounce
  useEffect(() => {
    if ((window as any).google && formData.pickup && formData.dropoff && tab !== 'hourly') {
      // Only trigger if inputs have substantial length to avoid "NOT_FOUND" on partial matches
      if (formData.pickup.length < 3 || formData.dropoff.length < 3) return;

      const timer = setTimeout(() => {
          calculateRoute();
      }, 1500); // 1.5s debounce to prevent spamming API while typing

      return () => clearTimeout(timer);
    }
  }, [formData.pickup, formData.dropoff, tab, config.distanceUnit]); // Recalculate if unit changes

  const calculateRoute = () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    setIsCalculating(true);
    setRouteError(null);
    
    directionsServiceRef.current.route(
      {
        origin: formData.pickup,
        destination: formData.dropoff,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        setIsCalculating(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
          
          const leg = result.routes[0].legs[0];
          if (leg && leg.distance && leg.duration) {
            // Convert meters or seconds to requested unit
            let pricingUnitVal = 0;
            let distanceText = "";

            if (config.distanceUnit === 'km') {
                pricingUnitVal = leg.distance.value / 1000;
                distanceText = `${pricingUnitVal.toFixed(1)} km`;
            } else if (config.distanceUnit === 'mi') {
                pricingUnitVal = leg.distance.value / 1609.34; // meters to miles
                distanceText = `${pricingUnitVal.toFixed(1)} mi`;
            } else if (config.distanceUnit === 'hr') {
                pricingUnitVal = leg.duration.value / 3600; // seconds to hours
                distanceText = `${pricingUnitVal.toFixed(1)} hr`;
            }
            
            // Calculate Prices
            const prices: any = {};
            Object.keys(config.vehicles).forEach((v) => {
              const vClass = v as VehicleClass;
              const rules = config.vehicles[vClass];
              if (rules.enabled) {
                const calculatedPrice = Math.round(rules.basePrice + (pricingUnitVal * rules.pricePerUnit));
                prices[vClass] = calculatedPrice;
              }
            });

            setQuote({
              distanceText: distanceText,
              duration: leg.duration.text,
              distanceVal: pricingUnitVal,
              prices: prices
            });
          }
        } else {
          console.log("Directions request failed due to " + status);
          if (status === 'NOT_FOUND' || status === 'ZERO_RESULTS') {
              setRouteError("Route not found. Please check addresses.");
              setQuote(null);
          }
        }
      }
    );
  };

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
      distance: quote.distanceText,
      duration: quote.duration,
      isReturn: isReturn,
      notes: `${formData.notes} ${method === 'whatsapp' ? '[Booked via WhatsApp]' : ''} ${method === 'invoice' ? '[Xero Invoice Drafted]' : ''}`
    };
    
    onCreate(newBooking);
    if (!isInline) onClose();
    
    if (method === 'whatsapp') {
       const text = `Hi, I'd like to book a ${config.vehicles[selectedVehicle].name} from ${formData.pickup} to ${formData.dropoff} on ${formData.date} at ${formData.time}. Name: ${formData.name}`;
       window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div 
            key={s} 
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? '' : 'bg-slate-100'}`}
            style={{ backgroundColor: s <= step ? config.primaryColor : undefined }}
        />
      ))}
    </div>
  );

  const containerClass = isInline 
    ? "w-full h-full bg-white flex flex-col md:flex-row overflow-hidden rounded-3xl border border-slate-200" 
    : "fixed inset-0 z-50 bg-white flex flex-col md:flex-row animate-in fade-in duration-300";

  return (
    <div className={containerClass}>
      {/* Left Side - Live Map */}
      {config.showMap && (
        <div className="hidden md:block w-1/2 bg-slate-50 relative overflow-hidden border-r border-slate-100">
            {mapError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-slate-100">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="font-bold text-slate-900 text-lg">Google Maps API Missing</h3>
                <p className="text-slate-500 text-sm mt-2">
                  Please add your Google Maps API key to the <code>index.html</code> file to enable the map and routing features.
                </p>
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full"></div>
            )}
            
            {/* Map UI Overlay */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
                <div className="bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-soft border border-white/50 w-64 pointer-events-auto">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" style={{ color: config.primaryColor }} />
                        Live Preview
                    </h3>
                    {quote ? (
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between text-slate-600">
                                <span>{config.distanceUnit === 'hr' ? 'Calculated Duration' : 'Distance'}</span>
                                <span className="font-bold text-slate-900">{quote.distanceText}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Est. Time</span>
                                <span className="font-bold text-slate-900">{quote.duration}</span>
                            </div>
                        </div>
                    ) : (
                    <div className="text-xs text-slate-400 italic">
                        {routeError ? <span className="text-red-500 font-bold">{routeError}</span> : "Enter locations to see route..."}
                    </div>
                    )}
                </div>
                {!isInline && (
                    <button onClick={onClose} className="p-3 bg-white rounded-full shadow-soft hover:bg-slate-50 transition-colors group border border-slate-100 pointer-events-auto">
                        <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Right Side - Booking Form */}
      <div className={`w-full ${config.showMap ? 'md:w-1/2' : 'md:w-full max-w-2xl mx-auto'} flex flex-col h-full overflow-y-auto bg-surface`}>
        <div className="p-6 md:p-12 max-w-xl mx-auto w-full flex-1 flex flex-col">
          
          <div className="flex items-center justify-between mb-6 md:hidden">
             <h2 className="font-bold text-lg">{config.companyName}</h2>
             {!isInline && <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">✕</button>}
          </div>

          <StepIndicator />

          {/* Step 1: Journey Details */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{config.companyName}</h1>
                    <p className="text-slate-500 font-medium">Premium chauffeur service at your fingertips.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6 border border-slate-100">
                    <button 
                        onClick={() => setTab('oneway')} 
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${tab === 'oneway' ? 'bg-white shadow-card' : 'text-slate-400 hover:text-slate-600'}`}
                        style={{ color: tab === 'oneway' ? config.primaryColor : undefined }}
                    >One Way</button>
                    <button 
                        onClick={() => setTab('hourly')} 
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${tab === 'hourly' ? 'bg-white shadow-card' : 'text-slate-400 hover:text-slate-600'}`}
                        style={{ color: tab === 'hourly' ? config.primaryColor : undefined }}
                    >Hourly</button>
                    <button 
                        onClick={() => setTab('airport')} 
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${tab === 'airport' ? 'bg-white shadow-card' : 'text-slate-400 hover:text-slate-600'}`}
                        style={{ color: tab === 'airport' ? config.primaryColor : undefined }}
                    >Airport</button>
                </div>

                {/* Inputs */}
                <div className="space-y-5 relative">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-emerald-50 rounded-lg text-emerald-600 group-focus-within:bg-emerald-100 transition-colors z-10">
                             <MapPin className="w-5 h-5" />
                        </div>
                        <input 
                            ref={pickupInputRef}
                            type="text" 
                            placeholder={tab === 'airport' ? "Pickup Airport..." : "Pickup Location"}
                            className="w-full pl-16 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:bg-white transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400"
                            style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
                            defaultValue={formData.pickup}
                            onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                        />
                    </div>
                    
                    {tab !== 'hourly' && (
                         <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-red-50 rounded-lg text-red-500 group-focus-within:bg-red-100 transition-colors z-10">
                                 <MapPin className="w-5 h-5" />
                            </div>
                            <input 
                                ref={dropoffInputRef}
                                type="text" 
                                placeholder="Dropoff Location"
                                className="w-full pl-16 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:bg-white transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400"
                                style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
                                defaultValue={formData.dropoff}
                                onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                         <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <input 
                                type="date" 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                                style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors">
                                <Clock className="w-5 h-5" />
                            </div>
                            <input 
                                type="time" 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                                style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
                                value={formData.time}
                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {tab === 'oneway' && (
                     <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsReturn(!isReturn)}>
                        <div 
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isReturn ? 'border-transparent' : 'border-slate-300'}`}
                            style={{ backgroundColor: isReturn ? config.primaryColor : 'transparent' }}
                        >
                            {isReturn && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-sm font-bold text-slate-700">Add Return Journey?</span>
                     </div>
                )}

                <button 
                    onClick={() => setStep(2)}
                    disabled={!formData.pickup || (!formData.dropoff && tab !== 'hourly')}
                    className="w-full text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30 text-lg mt-4 hover:brightness-110"
                    style={{ backgroundColor: config.primaryColor }}
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
                            <div className="absolute inset-0 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${config.primaryColor} transparent transparent transparent` }}></div>
                        </div>
                        <p className="text-slate-800 font-bold text-lg">Calculating best rates...</p>
                        <p className="text-slate-400 text-sm mt-1">Checking availability in your area</p>
                    </div>
                ) : quote ? (
                    <div className="space-y-4">
                        {Object.keys(config.vehicles).map((vKey) => {
                            const vClass = vKey as VehicleClass;
                            const rules = config.vehicles[vClass];
                            if (!rules.enabled) return null;
                            
                            const isSelected = selectedVehicle === vClass;

                            return (
                                <div 
                                    key={vClass}
                                    onClick={() => setSelectedVehicle(vClass)}
                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between group relative overflow-hidden ${isSelected ? 'bg-slate-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                    style={{ borderColor: isSelected ? config.primaryColor : undefined }}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-24 h-16 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-sm border border-slate-100 p-2">
                                            {rules.image ? (
                                                <img 
                                                    src={rules.image} 
                                                    alt={rules.name || vClass} 
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/300x200/png?text=Vehicle'; 
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-xs font-bold text-slate-300">No Image</div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{rules.name || vClass}</h3>
                                            <p className="text-xs text-slate-400 font-medium mb-1">{rules.description}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-bold">
                                                <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5"/> {rules.maxPassengers}</span>
                                                <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1.5"/> {rules.maxLuggage}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right mt-4 sm:mt-0 relative z-10">
                                        <div className="text-2xl font-black text-slate-900">{config.currency}{quote.prices[vClass]}</div>
                                        <div className="text-xs font-bold bg-slate-100 inline-block px-2 py-1 rounded-full mt-1" style={{ color: config.primaryColor }}>Fixed Price</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-10 text-center text-slate-400">
                        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-amber-400 opacity-50" />
                        <p>Please enter a valid route to see vehicle pricing.</p>
                    </div>
                )}

                <button 
                    onClick={() => setStep(3)}
                    disabled={!selectedVehicle}
                    className="w-full text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30 text-lg mt-4"
                    style={{ backgroundColor: config.primaryColor }}
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
                                className="w-full p-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 outline-none font-medium"
                                style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
                                placeholder="James Bond"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                             <input 
                                type="tel" 
                                className="w-full p-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 outline-none font-medium"
                                style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
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
                            className="w-full p-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 outline-none font-medium"
                            style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
                            placeholder="james@mi6.gov.uk"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes for Chauffeur</label>
                         <textarea 
                            rows={3}
                            className="w-full p-4 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 outline-none resize-none font-medium"
                            style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
                            placeholder="Flight number, child seat requirements..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                         />
                    </div>
                </div>

                <button 
                    onClick={() => setStep(4)}
                    disabled={!formData.name || !formData.phone}
                    className="w-full text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30 text-lg mt-4"
                    style={{ backgroundColor: config.primaryColor }}
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
                             <p className="text-4xl font-black text-slate-900 tracking-tight">{config.currency}{quote.prices[selectedVehicle]}</p>
                         </div>
                         <div className="text-right">
                             <p className="font-bold text-slate-900 text-lg">{config.vehicles[selectedVehicle].name}</p>
                             <p className="text-sm text-slate-500 font-medium">{quote.distanceText} • {quote.duration}</p>
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
                </div>
            </div>
           )}

        </div>
      </div>
    </div>
  );
};