
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
    vehicleColor: '',
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
      vehicleColor: formData.vehicleColor,
      plate: formData.plate,
      status: formData.status,
      rating: 5.0, // Default starting rating
      location: 'Unknown', // Default location
      notes: formData.notes
    };
    onCreate(newDriver);
    onClose();
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      vehicleType: '',
      vehicleColor: '',
      plate: '',
      status: DriverStatus.AVAILABLE,
      notes: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="font-bold text-lg text-slate-800">Add New Driver</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">First Name</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="e.g. James" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Name</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="e.g. Bond" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">WhatsApp Number</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="+44..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vehicle Type</label>
              <input required type="text" name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="e.g. Mercedes S-Class" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vehicle Colour</label>
              <input required type="text" name="vehicleColor" value={formData.vehicleColor} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="e.g. Black" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Licence Plate</label>
                <input required type="text" name="plate" value={formData.plate} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="ABC 123" />
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white">
                    {Object.values(DriverStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
             </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preferences / Notes</label>
            <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="E.g. Prefers morning shifts, no pets..."></textarea>
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95 mt-4 flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Driver
          </button>
        </form>
      </div>
    </div>
  );
};
