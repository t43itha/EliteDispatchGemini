
import React, { useState } from 'react';
import { X, UserPlus, Car } from 'lucide-react';
import { Driver, DriverStatus } from '../types';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (driver: Driver) => void;
}

export const DriverModal: React.FC<DriverModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    vehicleType: '',
    vehicleColour: '',
    plate: '',
    status: DriverStatus.AVAILABLE,
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDriver: Driver = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${formData.firstName} ${formData.lastName}`,
      phone: formData.phone,
      vehicle: formData.vehicleType,
      vehicleColour: formData.vehicleColour,
      plate: formData.plate,
      status: formData.status,
      rating: 5.0, // Default starting rating
      location: 'London, UK', // Default location
      notes: formData.notes
    };
    onCreate(newDriver);
    onClose();
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      vehicleType: '',
      vehicleColour: '',
      plate: '',
      status: DriverStatus.AVAILABLE,
      notes: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-soft overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-xl">
              <UserPlus className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="font-bold text-xl text-slate-800 tracking-tight">Add New Driver</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" placeholder="e.g. James" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" placeholder="e.g. Bond" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number (WhatsApp)</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" placeholder="+44..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Model</label>
              <input required type="text" name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" placeholder="e.g. S-Class" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Colour</label>
              <input required type="text" name="vehicleColour" value={formData.vehicleColour} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" placeholder="e.g. Black" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Licence Plate</label>
                <input required type="text" name="plate" value={formData.plate} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" placeholder="LD69..." />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                <div className="relative">
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700 appearance-none">
                        {Object.values(DriverStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                </div>
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Preferences / Notes</label>
            <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700 resize-none" placeholder="E.g. Prefers morning shifts..."></textarea>
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-brand-500/25 mt-2 flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Driver
          </button>
        </form>
      </div>
    </div>
  );
};