import React, { useState, useEffect } from 'react';
import { X, User, Sparkles, MessageCircle, Send, MapPin } from 'lucide-react';
import { Booking, Driver, BookingStatus, AiDriverSuggestion } from '../types';
import { suggestDriver, generateWhatsAppMessage } from '../services/geminiService';

interface DispatchModalProps {
  booking: Booking | null;
  drivers: Driver[];
  onClose: () => void;
  onAssign: (bookingId: string, driverId: string) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({ booking, drivers, onClose, onAssign }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [aiSuggestion, setAiSuggestion] = useState<AiDriverSuggestion | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  useEffect(() => {
    if (booking?.driverId) {
      setSelectedDriverId(booking.driverId);
    } else {
      setSelectedDriverId('');
    }
    setAiSuggestion(null);
    setGeneratedMessage('');
    setSendWhatsApp(true);
  }, [booking]);

  if (!booking) return null;

  const handleAiSuggest = async () => {
    setIsLoadingAi(true);
    const suggestion = await suggestDriver(booking, drivers);
    setAiSuggestion(suggestion);
    if (suggestion?.driverId) {
      setSelectedDriverId(suggestion.driverId);
      handleGenerateMessage(suggestion.driverId);
    }
    setIsLoadingAi(false);
  };

  const handleGenerateMessage = async (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    
    setIsLoadingMessage(true);
    const msg = await generateWhatsAppMessage(booking, driver);
    setGeneratedMessage(msg);
    setIsLoadingMessage(false);
  };

  const handleDriverSelect = (id: string) => {
    setSelectedDriverId(id);
    handleGenerateMessage(id);
  };

  const handleDispatch = () => {
    if (!selectedDriverId) return;
    onAssign(booking.id, selectedDriverId);
    
    if (sendWhatsApp) {
      const driver = drivers.find(d => d.id === selectedDriverId);
      if (driver) {
          const url = `https://wa.me/${driver.phone.replace(/\+/g, '')}?text=${encodeURIComponent(generatedMessage)}`;
          window.open(url, '_blank');
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
        
        {/* Left Panel: Booking Info & Driver Select */}
        <div className="w-full md:w-1/2 p-6 border-r border-slate-100 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Dispatch Job #{booking.id.toUpperCase()}</h2>
                    <p className="text-sm text-slate-500">{new Date(booking.pickupTime).toLocaleString()}</p>
                </div>
            </div>

            <div className="mb-6 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Pickup</p>
                        <p className="text-sm font-medium">{booking.pickupLocation}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Dropoff</p>
                        <p className="text-sm font-medium">{booking.dropoffLocation}</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                    <span className="font-bold text-slate-700">Notes:</span> {booking.notes || 'None'}
                </div>
            </div>

            <div className="mb-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Assign Driver</h3>
                <button 
                    onClick={handleAiSuggest}
                    disabled={isLoadingAi}
                    className="flex items-center gap-2 text-xs font-bold bg-brand-50 text-brand-600 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors disabled:opacity-50"
                >
                    {isLoadingAi ? <span className="animate-spin">✨</span> : <Sparkles className="w-3 h-3" />}
                    {isLoadingAi ? 'Thinking...' : 'AI Suggest'}
                </button>
            </div>

            {aiSuggestion && (
                <div className="mb-4 p-3 bg-brand-50 border border-brand-100 rounded-lg text-xs text-brand-800 animate-in fade-in slide-in-from-top-2">
                    <span className="font-bold">AI Reasoning:</span> {aiSuggestion.reasoning}
                </div>
            )}

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {drivers.map(driver => (
                    <div 
                        key={driver.id}
                        onClick={() => handleDriverSelect(driver.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            selectedDriverId === driver.id 
                            ? 'border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-500' 
                            : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                        } ${driver.status !== 'AVAILABLE' ? 'opacity-60' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                driver.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}>
                                {driver.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {driver.location}
                                </p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            driver.status === 'AVAILABLE' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                            {driver.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Panel: WhatsApp Preview */}
        <div className="w-full md:w-1/2 bg-slate-100 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4 md:hidden">
                 <h3 className="font-bold text-slate-600">Preview</h3>
                 <button onClick={onClose}><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center max-w-xs mx-auto w-full">
                <div className="bg-[#e5ded8] rounded-2xl shadow-xl border border-slate-300 overflow-hidden flex flex-col h-[400px]">
                    {/* Fake WhatsApp Header */}
                    <div className="bg-[#075e54] p-3 flex items-center gap-2 text-white">
                         <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden">
                            <User className="w-5 h-5 text-slate-500" />
                         </div>
                         <div>
                            <p className="text-sm font-bold leading-tight">{selectedDriverId ? drivers.find(d => d.id === selectedDriverId)?.name : 'Select Driver'}</p>
                            <p className="text-[10px] opacity-80">online</p>
                         </div>
                    </div>
                    
                    {/* Message Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                         {selectedDriverId ? (
                            <div className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm max-w-[90%] self-start text-sm text-slate-800 relative w-full">
                                {isLoadingMessage ? (
                                    <div className="flex gap-1 p-2">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                ) : (
                                    <textarea
                                        value={generatedMessage}
                                        onChange={(e) => setGeneratedMessage(e.target.value)}
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-sm font-medium h-[160px] leading-relaxed"
                                        placeholder="Message will appear here..."
                                    />
                                )}
                                <span className="text-[10px] text-slate-400 absolute bottom-1 right-2 flex items-center gap-0.5">
                                    {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} <span className="text-blue-500">✓✓</span>
                                </span>
                            </div>
                         ) : (
                             <div className="flex h-full items-center justify-center text-slate-500 text-xs text-center opacity-60 p-4 bg-white/80 rounded-lg m-4">
                                 Select a driver to draft a dispatch message
                             </div>
                         )}
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <input 
                        type="checkbox" 
                        id="sendWhatsapp"
                        checked={sendWhatsApp}
                        onChange={(e) => setSendWhatsApp(e.target.checked)}
                        className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                    />
                    <label htmlFor="sendWhatsapp" className="text-sm text-slate-600 font-medium cursor-pointer select-none">
                        Send confirmation via WhatsApp
                    </label>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDispatch}
                        disabled={!selectedDriverId || (sendWhatsApp && isLoadingMessage)}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-whatsapp hover:bg-whatsapp-dark flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                        {sendWhatsApp ? 'Dispatch & Send' : 'Dispatch Only'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};