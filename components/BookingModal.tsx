
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Booking, BookingStatus } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupLocation: '',
    dropoffLocation: '',
    date: '',
    time: '',
    passengers: 1,
    price: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      pickupLocation: formData.pickupLocation,
      dropoffLocation: formData.dropoffLocation,
      pickupTime: new Date(`${formData.date}T${formData.time}`).toISOString(),
      passengers: Number(formData.passengers),
      price: Number(formData.price),
      status: BookingStatus.PENDING,
      notes: formData.notes
    };
    onCreate(newBooking);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-soft overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <h2 className="font-bold text-xl text-slate-800 tracking-tight">New Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Time</label>
              <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Customer Name</label>
            <input required type="text" name="customerName" placeholder="e.g. James Bond" value={formData.customerName} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile (WhatsApp)</label>
            <input required type="tel" name="customerPhone" placeholder="+44..." value={formData.customerPhone} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" />
          </div>

          <div className="relative pl-4">
            <div className="absolute left-[23px] top-9 bottom-10 w-0.5 bg-slate-200 border-l border-dashed border-slate-300"></div>
            <div className="space-y-5">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pickup</label>
                <div className="absolute left-[-20px] top-[34px] w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white z-10 shadow-sm"></div>
                <input required type="text" name="pickupLocation" placeholder="Enter pickup location" value={formData.pickupLocation} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Dropoff</label>
                <div className="absolute left-[-20px] top-[34px] w-3 h-3 rounded-sm bg-accent-500 ring-4 ring-white z-10 shadow-sm"></div>
                <input required type="text" name="dropoffLocation" placeholder="Enter dropoff location" value={formData.dropoffLocation} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Passengers</label>
              <input type="number" min="1" max="10" name="passengers" value={formData.passengers} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Price (£)</label>
              <input required type="number" name="price" placeholder="0.00" value={formData.price} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea name="notes" rows={2} value={formData.notes} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400 resize-none"></textarea>
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-brand-500/25 mt-2">
            Create Booking
          </button>
        </form>
      </div>
    </div>
  );
};