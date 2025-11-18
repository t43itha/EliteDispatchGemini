
import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Calculator } from 'lucide-react';
import { ServiceRecord } from '../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (service: ServiceRecord) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    description: '',
    vendor: '',
    cost: '',
    serviceChargePercent: '5',
    notes: ''
  });

  const [calculations, setCalculations] = useState({
    fee: 0,
    total: 0
  });

  useEffect(() => {
    const costVal = parseFloat(formData.cost) || 0;
    const percentVal = parseFloat(formData.serviceChargePercent) || 0;
    const fee = costVal * (percentVal / 100);
    const total = costVal + fee;
    setCalculations({ fee, total });
  }, [formData.cost, formData.serviceChargePercent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newService: ServiceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      description: formData.description,
      vendor: formData.vendor,
      cost: parseFloat(formData.cost),
      serviceChargePercent: parseFloat(formData.serviceChargePercent),
      serviceFee: calculations.fee,
      total: calculations.total,
      status: 'PENDING',
      notes: formData.notes
    };
    onCreate(newService);
    onClose();
    // Reset form
    setFormData({ description: '', vendor: '', cost: '', serviceChargePercent: '5', notes: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="font-bold text-lg text-slate-800">Add Concierge Service</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description of Item/Service</label>
            <input required type="text" name="description" placeholder="e.g. Vintage Wine, Concert Tickets" value={formData.description} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vendor / Store</label>
            <input required type="text" name="vendor" placeholder="e.g. Harrods, The Ritz" value={formData.vendor} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cost (£)</label>
              <input required type="number" step="0.01" name="cost" placeholder="0.00" value={formData.cost} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Service Charge %</label>
              <div className="relative">
                 <input required type="number" min="0" max="100" name="serviceChargePercent" value={formData.serviceChargePercent} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                 <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Calculator Display */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
             <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal (Cost)</span>
                <span>£{parseFloat(formData.cost || '0').toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-purple-600 font-medium">
                <span>Service Fee ({formData.serviceChargePercent}%)</span>
                <span>+ £{calculations.fee.toFixed(2)}</span>
             </div>
             <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-lg">
                <span>Total to Bill</span>
                <span>£{calculations.total.toFixed(2)}</span>
             </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Internal Notes</label>
            <textarea name="notes" rows={2} value={formData.notes} onChange={handleChange} className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"></textarea>
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95 mt-4 flex items-center justify-center gap-2">
            <Calculator className="w-5 h-5" />
            Add Service Record
          </button>
        </form>
      </div>
    </div>
  );
};
