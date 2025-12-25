import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import {
  X,
  Receipt,
  User,
  FileText,
  Eye,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Booking, XeroTaxType } from '../types';

interface XeroInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedBookingIds?: string[];
  bookings: Booking[];
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  taxType: XeroTaxType;
  bookingId?: string;
  isEditable: boolean;
}

interface XeroContact {
  id: string;
  xeroContactId: string;
  name: string;
  email?: string;
  phone?: string;
}

type WizardStep = 1 | 2 | 3 | 4;

export const XeroInvoiceModal: React.FC<XeroInvoiceModalProps> = ({
  isOpen,
  onClose,
  preSelectedBookingIds = [],
  bookings,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>(preSelectedBookingIds);
  const [bulkStrategy, setBulkStrategy] = useState<'combine' | 'separate'>('combine');
  const [selectedContact, setSelectedContact] = useState<XeroContact | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14); // 14 days from now
    return date.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    invoices?: Array<{ xeroInvoiceNumber?: string; xeroUrl?: string; error?: string }>;
    error?: string;
  } | null>(null);

  // Queries
  const connectionStatus = useQuery(api.xero.oauth.getConnectionStatus);
  const cachedContacts = useQuery(api.xero.contacts.listCachedContacts);

  // Actions
  const syncContacts = useAction(api.xero.contacts.syncContacts);
  const createInvoice = useAction(api.invoicing.createInvoiceFromBookings);

  // Filter eligible bookings (COMPLETED and not INVOICED)
  const eligibleBookings = useMemo(() =>
    bookings.filter(b => b.status === 'COMPLETED' && b.paymentStatus !== 'INVOICED'),
    [bookings]
  );

  // Selected bookings data
  const selectedBookings = useMemo(() =>
    eligibleBookings.filter(b => selectedBookingIds.includes(b.id)),
    [eligibleBookings, selectedBookingIds]
  );

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!cachedContacts) return [];
    const searchLower = contactSearch.toLowerCase();
    return cachedContacts.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  }, [cachedContacts, contactSearch]);

  // Initialize line items when bookings are selected
  useEffect(() => {
    if (selectedBookings.length > 0 && currentStep >= 3) {
      const bookingLineItems: LineItem[] = selectedBookings.map(booking => ({
        id: `booking-${booking.id}`,
        description: `Transport: ${booking.pickupLocation} → ${booking.dropoffLocation} (${new Date(booking.pickupTime).toLocaleDateString('en-GB')})`,
        quantity: 1,
        unitAmount: booking.price,
        taxType: XeroTaxType.OUTPUT2, // Default to 20% VAT
        bookingId: booking.id,
        isEditable: false,
      }));
      setLineItems(prev => {
        // Keep custom items, replace booking items
        const customItems = prev.filter(item => item.isEditable);
        return [...bookingLineItems, ...customItems];
      });
    }
  }, [selectedBookings, currentStep]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitAmount), 0);
    const totalVat = lineItems.reduce((sum, item) => {
      if (item.taxType === XeroTaxType.OUTPUT2) {
        return sum + (item.quantity * item.unitAmount * 0.2);
      }
      return sum;
    }, 0);
    return {
      subtotal,
      totalVat,
      total: subtotal + totalVat,
    };
  }, [lineItems]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedBookingIds(preSelectedBookingIds);
      setSelectedContact(null);
      setLineItems([]);
      setContactSearch('');
      setSubmitResult(null);
    }
  }, [isOpen, preSelectedBookingIds]);

  // Set initial selection when modal opens
  useEffect(() => {
    if (isOpen && preSelectedBookingIds.length > 0) {
      setSelectedBookingIds(preSelectedBookingIds);
    }
  }, [isOpen, preSelectedBookingIds]);

  // Handlers
  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, {
      id: `custom-${Date.now()}`,
      description: '',
      quantity: 1,
      unitAmount: 0,
      taxType: XeroTaxType.NONE, // Extras default to no VAT
      isEditable: true,
    }]);
  };

  const handleUpdateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSyncContacts = async () => {
    await syncContacts();
  };

  const handleSubmit = async () => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await createInvoice({
        contactId: selectedContact.xeroContactId,
        contactName: selectedContact.name,
        bookingIds: selectedBookingIds,
        extraLineItems: lineItems
          .filter(item => item.isEditable && item.description && item.unitAmount > 0)
          .map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            taxType: item.taxType,
            bookingId: item.bookingId,
          })),
        combineInvoices: bulkStrategy === 'combine',
        dueDate,
      });

      setSubmitResult(result);
      if (result.success) {
        setCurrentStep(4);
      }
    } catch (err) {
      setSubmitResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create invoice',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (step: WizardStep): boolean => {
    switch (step) {
      case 1:
        return selectedBookingIds.length > 0;
      case 2:
        return selectedContact !== null;
      case 3:
        return lineItems.length > 0 && lineItems.every(item =>
          !item.isEditable || (item.description && item.unitAmount >= 0)
        );
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  // Show connection required message
  if (!connectionStatus?.connected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-soft overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Xero Not Connected</h2>
          <p className="text-slate-600 mb-6">
            Please connect your Xero account in Settings to create invoices.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (submitResult?.success && currentStep === 4) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-soft overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in delay-150">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Invoice{submitResult.invoices && submitResult.invoices.length > 1 ? 's' : ''} Created!
          </h2>
          <div className="space-y-2 mb-6">
            {submitResult.invoices?.map((inv, idx) => (
              <div key={idx} className="flex items-center justify-center gap-2">
                {inv.xeroInvoiceNumber && (
                  <span className="font-mono text-sm text-slate-600">#{inv.xeroInvoiceNumber}</span>
                )}
                {inv.xeroUrl && (
                  <a
                    href={inv.xeroUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1"
                  >
                    View in Xero
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-soft overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-xl">
              <Receipt className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-800">Create Invoice</h2>
              <p className="text-sm text-slate-500">Step {currentStep} of 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-slate-50 shrink-0">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {[
              { step: 1, label: 'Bookings', icon: FileText },
              { step: 2, label: 'Contact', icon: User },
              { step: 3, label: 'Line Items', icon: Receipt },
              { step: 4, label: 'Review', icon: Eye },
            ].map(({ step, label, icon: Icon }, idx) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep >= step
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                      }`}
                  >
                    {currentStep > step ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium ${currentStep >= step ? 'text-slate-700' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step ? 'bg-brand-500' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Bookings */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">Select Bookings</h3>
                <p className="text-sm text-slate-500">Choose completed bookings to include in the invoice</p>
              </div>

              {eligibleBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No eligible bookings</p>
                  <p className="text-sm">Bookings must be completed and not already invoiced</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {eligibleBookings.map(booking => (
                      <label
                        key={booking.id}
                        className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedBookingIds.includes(booking.id)
                          ? 'border-brand-200 bg-brand-50/50'
                          : 'border-slate-100 hover:border-slate-200'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.includes(booking.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBookingIds(prev => [...prev, booking.id]);
                            } else {
                              setSelectedBookingIds(prev => prev.filter(id => id !== booking.id));
                            }
                          }}
                          className="mt-1 w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">{booking.customerName}</span>
                            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                              #{booking.id.substring(0, 6)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 truncate">
                            {booking.pickupLocation} → {booking.dropoffLocation}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(booking.pickupTime).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">£{booking.price.toFixed(2)}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedBookingIds.length > 1 && (
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                      <p className="text-sm font-bold text-slate-700">Multiple bookings selected</p>
                      <div className="flex gap-3">
                        <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${bulkStrategy === 'combine' ? 'border-brand-200 bg-brand-50' : 'border-slate-200'
                          }`}>
                          <input
                            type="radio"
                            name="bulkStrategy"
                            checked={bulkStrategy === 'combine'}
                            onChange={() => setBulkStrategy('combine')}
                            className="text-brand-600"
                          />
                          <span className="text-sm font-medium">Combine into one invoice</span>
                        </label>
                        <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${bulkStrategy === 'separate' ? 'border-brand-200 bg-brand-50' : 'border-slate-200'
                          }`}>
                          <input
                            type="radio"
                            name="bulkStrategy"
                            checked={bulkStrategy === 'separate'}
                            onChange={() => setBulkStrategy('separate')}
                            className="text-brand-600"
                          />
                          <span className="text-sm font-medium">Create separate invoices</span>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Select Contact */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">Select Contact</h3>
                  <p className="text-sm text-slate-500">Choose who to bill for this invoice</p>
                </div>
                <button
                  onClick={handleSyncContacts}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync from Xero
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
                />
              </div>

              {selectedContact && (
                <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-900">{selectedContact.name}</p>
                    {selectedContact.email && (
                      <p className="text-sm text-brand-600">{selectedContact.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Change
                  </button>
                </div>
              )}

              {!selectedContact && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <User className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No contacts found</p>
                      <p className="text-sm">Sync contacts from Xero or try a different search</p>
                    </div>
                  ) : (
                    filteredContacts.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all"
                      >
                        <p className="font-bold text-slate-900">{contact.name}</p>
                        {contact.email && (
                          <p className="text-sm text-slate-500">{contact.email}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Line Items */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">Invoice Line Items</h3>
                <p className="text-sm text-slate-500">Configure items and VAT settings</p>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border ${item.isEditable ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
                      }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-1">
                        {item.isEditable ? (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(item.id, { description: e.target.value })}
                            placeholder="Description"
                            className="w-full p-2 bg-slate-50 rounded-lg border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                          />
                        ) : (
                          <p className="text-sm font-medium text-slate-700">{item.description}</p>
                        )}
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateLineItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          min="1"
                          disabled={!item.isEditable}
                          className="w-full p-2 bg-slate-50 rounded-lg border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm font-medium text-center disabled:opacity-60"
                        />
                      </div>
                      <div className="w-28">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                          <input
                            type="number"
                            value={item.unitAmount}
                            onChange={(e) => handleUpdateLineItem(item.id, { unitAmount: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                            disabled={!item.isEditable}
                            className="w-full pl-7 pr-2 py-2 bg-slate-50 rounded-lg border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm font-medium text-right disabled:opacity-60"
                          />
                        </div>
                      </div>
                      <div className="w-32">
                        <select
                          value={item.taxType}
                          onChange={(e) => handleUpdateLineItem(item.id, { taxType: e.target.value as XeroTaxType })}
                          className="w-full p-2 bg-slate-50 rounded-lg border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                        >
                          <option value={XeroTaxType.OUTPUT2}>20% VAT</option>
                          <option value={XeroTaxType.NONE}>No VAT</option>
                        </select>
                      </div>
                      {item.isEditable && (
                        <button
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddLineItem}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-bold"
              >
                <Plus className="w-4 h-4" />
                Add Line Item
              </button>

              {/* Totals */}
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 mt-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-bold text-slate-900">£{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">VAT (20%)</span>
                  <span className="font-bold text-slate-900">£{totals.totalVat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-black text-slate-900">£{totals.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-slate-600">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="p-2 bg-slate-50 rounded-lg border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review (before submit) */}
          {currentStep === 4 && !submitResult?.success && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">Review Invoice</h3>
                <p className="text-sm text-slate-500">Confirm details before creating in Xero</p>
              </div>

              {/* Invoice Preview */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
                <div className="mb-6">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
                  <p className="font-bold text-slate-900">{selectedContact?.name}</p>
                  {selectedContact?.email && (
                    <p className="text-sm text-slate-600">{selectedContact.email}</p>
                  )}
                </div>

                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-slate-500 font-medium">Description</th>
                      <th className="text-right py-2 text-slate-500 font-medium w-20">Qty</th>
                      <th className="text-right py-2 text-slate-500 font-medium w-24">Price</th>
                      <th className="text-right py-2 text-slate-500 font-medium w-20">VAT</th>
                      <th className="text-right py-2 text-slate-500 font-medium w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(item => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3 text-slate-700">{item.description}</td>
                        <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                        <td className="py-3 text-right text-slate-600">£{item.unitAmount.toFixed(2)}</td>
                        <td className="py-3 text-right text-slate-600">
                          {item.taxType === XeroTaxType.OUTPUT2 ? '20%' : '-'}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          £{(item.quantity * item.unitAmount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-1 text-right">
                  <div className="flex justify-end gap-8 text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold text-slate-700 w-24">£{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-8 text-sm">
                    <span className="text-slate-500">VAT (20%)</span>
                    <span className="font-bold text-slate-700 w-24">£{totals.totalVat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-8 text-lg pt-2 border-t border-slate-200 mt-2">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-black text-slate-900 w-24">£{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-400">Due Date: {new Date(dueDate).toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              {submitResult?.error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{submitResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center shrink-0">
          <button
            onClick={() => currentStep > 1 ? setCurrentStep((currentStep - 1) as WizardStep) : onClose()}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((currentStep + 1) as WizardStep)}
              disabled={!canProceed(currentStep)}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  Create in Xero
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default XeroInvoiceModal;
