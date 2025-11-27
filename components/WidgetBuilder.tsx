


import React, { useState, useEffect } from 'react';
import { Globe, Copy, Check, RefreshCw, Palette, Settings, Car, DollarSign, Image as ImageIcon, Upload, X, PanelLeftClose, Save, Loader2 } from 'lucide-react';
import { WidgetConfig, VehicleClass } from '../types';
import { BookingWidget } from './BookingWidget';
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Helper to convert VehicleClass keys to database-safe keys (underscores)
const toDbKey = (key: string): string => key.replace(/ /g, '_');
const fromDbKey = (key: string): string => key.replace(/_/g, ' ');

// Convert WidgetConfig for database storage (spaces -> underscores in vehicle keys)
const configToDb = (config: WidgetConfig) => ({
  ...config,
  vehicles: {
    Business_Class: config.vehicles[VehicleClass.BUSINESS],
    First_Class: config.vehicles[VehicleClass.FIRST],
    Business_Van: config.vehicles[VehicleClass.VAN],
  }
});

// Convert database config back to WidgetConfig (underscores -> spaces in vehicle keys)
const configFromDb = (dbConfig: any): WidgetConfig => ({
  ...dbConfig,
  vehicles: {
    [VehicleClass.BUSINESS]: dbConfig.vehicles.Business_Class,
    [VehicleClass.FIRST]: dbConfig.vehicles.First_Class,
    [VehicleClass.VAN]: dbConfig.vehicles.Business_Van,
  }
});

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

export const WidgetBuilder: React.FC = () => {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Get org ID from Clerk
  const { orgId } = useAuth();

  // Load existing config from database
  const savedConfig = useQuery(api.organizations.getWidgetConfig);
  const saveConfigMutation = useMutation(api.organizations.saveWidgetConfig);

  // Initialize config from database when loaded
  useEffect(() => {
    if (savedConfig?.config && !configLoaded) {
      // Convert from database format (underscores) to app format (spaces)
      setConfig(configFromDb(savedConfig.config));
      setConfigLoaded(true);
    }
  }, [savedConfig, configLoaded]);

  // Handle saving config to database
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Convert to database format (underscores) before saving
      await saveConfigMutation({ config: configToDb(config) });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate embed code with real org ID
  const widgetBaseUrl = window.location.origin;
  const embedCode = `<iframe src="${widgetBaseUrl}/widget?id=${orgId || 'YOUR_ID'}" width="100%" height="700" style="border:none;border-radius:24px;"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVehicleToggle = (vClass: VehicleClass) => {
    setConfig(prev => ({
      ...prev,
      vehicles: {
        ...prev.vehicles,
        [vClass]: { ...prev.vehicles[vClass], enabled: !prev.vehicles[vClass].enabled }
      }
    }));
  };

  const handleVehicleChange = (vClass: VehicleClass, field: keyof typeof config.vehicles[VehicleClass], value: any) => {
     setConfig(prev => ({
        ...prev,
        vehicles: {
          ...prev.vehicles,
          [vClass]: { ...prev.vehicles[vClass], [field]: value }
        }
     }));
  };
  
  const handleFileUpload = (vClass: VehicleClass, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleVehicleChange(vClass, 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 relative">
      
      {/* Floating Open Button (When sidebar is closed) */}
      <div className={`absolute left-0 top-6 z-30 transition-all duration-300 ${!isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
        <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-white text-slate-900 rounded-r-xl shadow-soft border-y border-r border-slate-100 hover:bg-slate-50 transition-colors group flex items-center gap-2"
            title="Open Settings"
        >
            <Settings className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
            <span className="text-xs font-bold text-slate-600 group-hover:text-brand-600 pr-1">Edit Widget</span>
        </button>
      </div>

      {/* Left Panel: Configuration */}
      <div className={`
        bg-surface border border-slate-100 rounded-3xl shadow-card overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col
        ${isSidebarOpen ? 'w-full lg:w-96 opacity-100' : 'w-0 lg:w-0 opacity-0 border-0'}
      `}>
        <div className="p-6 overflow-y-auto h-full w-full lg:w-96">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Widget Studio</h2>
                        <p className="text-xs text-slate-500 font-medium">Customize & Embed</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Minimize Sidebar"
                >
                    <PanelLeftClose className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-8">
            
            {/* Branding Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Branding
                </h3>
                
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Name</label>
                    <input 
                        type="text" 
                        value={config.companyName}
                        onChange={(e) => setConfig({...config, companyName: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Color</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                            value={config.primaryColor}
                            onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                            className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent p-0"
                        />
                        <input 
                            type="text" 
                            value={config.primaryColor}
                            onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Distance Unit</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setConfig({...config, distanceUnit: 'mi'})}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${config.distanceUnit === 'mi' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                        >
                            Miles
                        </button>
                        <button 
                            onClick={() => setConfig({...config, distanceUnit: 'km'})}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${config.distanceUnit === 'km' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                        >
                            Km
                        </button>
                        <button 
                            onClick={() => setConfig({...config, distanceUnit: 'hr'})}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${config.distanceUnit === 'hr' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                        >
                            Hour
                        </button>
                    </div>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Vehicles & Pricing */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Car className="w-4 h-4" /> Vehicles & Pricing
                </h3>

                {Object.keys(config.vehicles).map((vKey) => {
                    const vClass = vKey as VehicleClass;
                    const data = config.vehicles[vClass];
                    
                    return (
                        <div key={vClass} className={`p-4 rounded-2xl border ${data.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <input 
                                type="text" 
                                value={data.name}
                                onChange={(e) => handleVehicleChange(vClass, 'name', e.target.value)}
                                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none w-32 transition-colors"
                            />
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={data.enabled} onChange={() => handleVehicleToggle(vClass)} />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                            </label>
                        </div>
                        
                        {data.enabled && (
                            <div className="space-y-3">
                                <div>
                                    <input 
                                        type="text" 
                                        value={data.description}
                                        onChange={(e) => handleVehicleChange(vClass, 'description', e.target.value)}
                                        className="w-full text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none transition-colors"
                                        placeholder="Short description..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400">Base ({config.currency})</label>
                                        <input 
                                            type="number" 
                                            value={data.basePrice}
                                            onChange={(e) => handleVehicleChange(vClass, 'basePrice', parseFloat(e.target.value))}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400">Per {config.distanceUnit === 'hr' ? 'Hour' : config.distanceUnit}</label>
                                        <input 
                                            type="number" 
                                            value={data.pricePerUnit}
                                            onChange={(e) => handleVehicleChange(vClass, 'pricePerUnit', parseFloat(e.target.value))}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400">Max Pax</label>
                                        <input 
                                            type="number" 
                                            value={data.maxPassengers}
                                            onChange={(e) => handleVehicleChange(vClass, 'maxPassengers', parseInt(e.target.value))}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400">Max Bags</label>
                                        <input 
                                            type="number" 
                                            value={data.maxLuggage}
                                            onChange={(e) => handleVehicleChange(vClass, 'maxLuggage', parseInt(e.target.value))}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                        <label className="text-[10px] font-bold text-slate-400 mb-1 block">Vehicle Image</label>
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-1 group">
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    id={`file-upload-${vClass}`}
                                                    className="hidden"
                                                    onChange={(e) => handleFileUpload(vClass, e)}
                                                />
                                                <label 
                                                    htmlFor={`file-upload-${vClass}`}
                                                    className="flex items-center justify-center gap-2 w-full p-2 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-100 hover:border-brand-300 transition-all"
                                                >
                                                    <Upload className="w-3 h-3" />
                                                    {data.image && data.image.startsWith('data:') ? 'Replace' : 'Upload'}
                                                </label>
                                            </div>
                                            
                                            {data.image && (
                                                <div className="relative w-12 h-9 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0">
                                                    <img src={data.image} className="max-w-full max-h-full object-contain" alt="preview" />
                                                    <button 
                                                        onClick={() => handleVehicleChange(vClass, 'image', '')}
                                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                                                        title="Remove Image"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                </div>
                            </div>
                        )}
                        </div>
                    );
                })}
            </div>

            <hr className="border-slate-100" />

            {/* Save Configuration Button */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  saveSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </>
                )}
            </button>

            {/* Embed Section */}
            <div className="bg-slate-900 p-5 rounded-2xl text-white">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Embed Code
                </h3>
                {orgId ? (
                  <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-2 mb-3">
                    <p className="text-[10px] text-emerald-400 font-medium">
                      Your Widget ID: <span className="font-mono">{orgId}</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-2 mb-3">
                    <p className="text-[10px] text-amber-400 font-medium">
                      Organization not loaded yet...
                    </p>
                  </div>
                )}
                <div className="bg-slate-800 p-3 rounded-xl text-[10px] font-mono text-slate-300 break-all mb-3 border border-slate-700">
                    {embedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
                <button
                    onClick={handleCopy}
                    disabled={!orgId}
                    className="w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Snippet'}
                </button>
            </div>

            </div>
        </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="flex-1 bg-slate-100 rounded-3xl border border-slate-200/60 p-4 lg:p-8 flex flex-col shadow-inner relative overflow-hidden transition-all duration-500">
         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] pointer-events-none"></div>
         
         <div className="flex justify-between items-center mb-6 relative z-10">
             <div>
                <h2 className="font-bold text-slate-900">Live Preview</h2>
                <p className="text-xs text-slate-500">See your changes in real-time</p>
             </div>
             <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
             </div>
         </div>

         <div className="flex-1 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative z-10">
            {/* Pass configuration to the widget */}
            <BookingWidget 
                config={config} 
                isInline={true} 
                onClose={() => {}} 
                onCreate={(booking) => {
                    console.log("Booking created from preview:", booking);
                    alert("Preview: Booking Logic Triggered!");
                }} 
            />
         </div>
      </div>
    </div>
  );
};
