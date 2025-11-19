
import React, { useState, useEffect } from 'react';
import { X, User, Sparkles, MessageCircle, Send, MapPin, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-soft overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[650px] border border-slate-100">
        
        {/* Left Panel: Booking Info & Driver Select */}
        <div className="w-full md:w-7/12 p-8 border-r border-slate-100 overflow-y-auto bg-white">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dispatch Job</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">#{booking.id.toUpperCase()} • {new Date(booking.pickupTime).toLocaleString('en-GB')}</p>
                </div>
            </div>

            <div className="mb-8 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-4">
                    <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-4 ring-white shadow-sm"></div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pickup</p>
                        <p className="text-sm font-bold text-slate-800">{booking.pickupLocation}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="mt-1.5 w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0 ring-4 ring-white shadow-sm"></div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Dropoff</p>
                        <p className="text-sm font-bold text-slate-800">{booking.dropoffLocation}</p>
                    </div>
                </div>
                {booking.notes && (
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-sm mt-2">
                        <span className="font-bold text-slate-700">Notes:</span> {booking.notes}
                    </div>
                )}
            </div>

            <div className="mb-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-lg">Assign Driver</h3>
                <button 
                    onClick={handleAiSuggest}
                    disabled={isLoadingAi}
                    className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-brand-500/20 transition-all disabled:opacity-50 shadow-md"
                >
                    {isLoadingAi ? <span className="animate-spin">✨</span> : <Sparkles className="w-3 h-3 fill-white" />}
                    {isLoadingAi ? 'Thinking...' : 'AI Suggest Match'}
                </button>
            </div>

            {aiSuggestion && (
                <div className="mb-6 p-4 bg-brand-50 border border-brand-100 rounded-xl text-sm text-brand-900 animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <div className="flex gap-2">
                        <Sparkles className="w-5 h-5 text-brand-600 shrink-0" />
                        <div>
                            <span className="font-bold">AI Recommendation:</span>
                            <p className="mt-1 leading-relaxed">{aiSuggestion.reasoning}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {drivers.map(driver => (
                    <div 
                        key={driver.id}
                        onClick={() => handleDriverSelect(driver.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                            selectedDriverId === driver.id 
                            ? 'border-brand-500 bg-brand-50/50 shadow-md ring-1 ring-brand-500' 
                            : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'
                        } ${driver.status !== 'AVAILABLE' ? 'opacity-70 grayscale-[0.5]' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                                driver.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}>
                                {driver.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                                    <MapPin className="w-3 h-3" /> {driver.location}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                                driver.status === 'AVAILABLE' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                                {driver.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Panel: WhatsApp Preview */}
        <div className="w-full md:w-5/12 bg-slate-50/50 p-8 flex flex-col justify-between border-l border-slate-100">
            <div className="flex justify-between items-center mb-6 md:hidden">
                 <h3 className="font-bold text-slate-600">Preview</h3>
                 <button onClick={onClose}><X className="w-6 h-6 text-slate-400"/></button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center w-full mx-auto">
                <div className="bg-[#e5ded8] rounded-[2rem] shadow-xl border-[6px] border-slate-800 overflow-hidden flex flex-col h-[450px] relative">
                    {/* Fake Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>

                    {/* Fake WhatsApp Header */}
                    <div className="bg-[#008069] p-4 pt-8 flex items-center gap-3 text-white">
                         <div className="w-9 h-9 rounded-full bg-slate-200/20 flex items-center justify-center overflow-hidden border border-white/30">
                            <User className="w-5 h-5 text-white" />
                         </div>
                         <div>
                            <p className="text-sm font-bold leading-tight">{selectedDriverId ? drivers.find(d => d.id === selectedDriverId)?.name : 'Select Driver'}</p>
                            <p className="text-[10px] opacity-80 font-medium">online</p>
                         </div>
                    </div>
                    
                    {/* Message Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[length:400px]">
                         {selectedDriverId ? (
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[95%] self-start text-sm text-slate-800 relative w-full mt-2">
                                {isLoadingMessage ? (
                                    <div className="flex gap-1.5 p-2 items-center">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                ) : (
                                    <textarea
                                        value={generatedMessage}
                                        onChange={(e) => setGeneratedMessage(e.target.value)}
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-[13px] font-medium h-[180px] leading-relaxed"
                                        placeholder="Message will appear here..."
                                    />
                                )}
                                <span className="text-[10px] text-slate-400 absolute bottom-2 right-3 flex items-center gap-1 font-medium">
                                    {new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})} <span className="text-sky-500 font-bold">✓✓</span>
                                </span>
                            </div>
                         ) : (
                             <div className="flex h-full items-center justify-center p-6">
                                 <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm text-center">
                                     <p className="text-slate-500 text-xs font-medium">Select a driver to draft dispatch</p>
                                 </div>
                             </div>
                         )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex items-center gap-3 mb-5 px-2 py-3 bg-white rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSendWhatsApp(!sendWhatsApp)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sendWhatsApp ? 'bg-brand-600 border-brand-600' : 'border-slate-300'}`}>
                         {sendWhatsApp && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <label className="text-sm text-slate-700 font-bold cursor-pointer select-none flex-1">
                        Send via WhatsApp
                    </label>
                    <MessageCircle className="w-4 h-4 text-whatsapp" />
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-600 bg-white border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDispatch}
                        disabled={!selectedDriverId || (sendWhatsApp && isLoadingMessage)}
                        className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                    >
                        <Send className="w-4 h-4" />
                        {sendWhatsApp ? 'Dispatch' : 'Assign Only'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};