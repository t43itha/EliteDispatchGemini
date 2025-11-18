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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800">New Booking</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
              <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Time</label>
              <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer Name</label>
            <input required type="text" name="customerName" placeholder="e.g. Sarah Connor" value={formData.customerName} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone (WhatsApp)</label>
            <input required type="tel" name="customerPhone" placeholder="+1..." value={formData.customerPhone} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
          </div>

          <div className="relative">
            <div className="absolute left-3 top-9 bottom-3 w-0.5 bg-slate-200"></div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pickup</label>
                <input required type="text" name="pickupLocation" placeholder="Enter pickup location" value={formData.pickupLocation} onChange={handleChange} className="w-full p-2 pl-8 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none relative z-10 bg-white" />
                 <div className="absolute left-[5px] top-[2.1rem] w-2 h-2 rounded-full bg-green-500 z-20"></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dropoff</label>
                <input required type="text" name="dropoffLocation" placeholder="Enter dropoff location" value={formData.dropoffLocation} onChange={handleChange} className="w-full p-2 pl-8 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none relative z-10 bg-white" />
                <div className="absolute left-[5px] top-[6.5rem] w-2 h-2 rounded-sm bg-red-500 z-20"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Passengers</label>
              <input type="number" min="1" max="10" name="passengers" value={formData.passengers} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price ($)</label>
              <input required type="number" name="price" placeholder="0.00" value={formData.price} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notes</label>
            <textarea name="notes" rows={2} value={formData.notes} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"></textarea>
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95 mt-4">
            Create Booking
          </button>
        </form>
      </div>
    </div>
  );
};