
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
    setFormData({ description: '', vendor: '', cost: '', serviceChargePercent: '5', notes: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-soft overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-50 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-accent-600" />
            </div>
            <h2 className="font-bold text-xl text-slate-800 tracking-tight">Add Concierge Service</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Item Description</label>
            <input required type="text" name="description" placeholder="e.g. Vintage Wine" value={formData.description} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vendor / Store</label>
            <input required type="text" name="vendor" placeholder="e.g. Harrods" value={formData.vendor} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cost (£)</label>
              <input required type="number" step="0.01" name="cost" placeholder="0.00" value={formData.cost} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Service Charge %</label>
              <div className="relative">
                 <input required type="number" min="0" max="100" name="serviceChargePercent" value={formData.serviceChargePercent} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
                 <span className="absolute right-4 top-3.5 text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Calculator Display */}
          <div className="bg-accent-50/50 p-5 rounded-2xl border border-accent-100 space-y-2">
             <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Subtotal (Cost)</span>
                <span>£{parseFloat(formData.cost || '0').toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-accent-600 font-bold">
                <span>Service Fee ({formData.serviceChargePercent}%)</span>
                <span>+ £{calculations.fee.toFixed(2)}</span>
             </div>
             <div className="border-t border-accent-200/50 pt-3 mt-1 flex justify-between font-black text-slate-800 text-lg">
                <span>Total to Bill</span>
                <span>£{calculations.total.toFixed(2)}</span>
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Internal Notes</label>
            <textarea name="notes" rows={2} value={formData.notes} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-accent-500 focus:bg-white transition-all outline-none font-medium text-slate-700 resize-none"></textarea>
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-slate-900/20 mt-2 flex items-center justify-center gap-2">
            <Calculator className="w-5 h-5" />
            Add Service Record
          </button>
        </form>
      </div>
    </div>
  );
};