import React, { useState } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { BookingWidget } from './BookingWidget';
import { WidgetConfig, VehicleClass, Booking, PaymentStatus } from '../types';
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

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

export const WidgetPage: React.FC = () => {
  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get('id');
  const sessionId = urlParams.get('session_id');
  const bookingIdParam = urlParams.get('booking_id');
  const stripeStatus = urlParams.get('stripe');

  // State for showing success after checkout
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Fetch config from Convex (public query, no auth needed)
  const publicConfig = useQuery(
    api.organizations.getPublicWidgetConfig,
    orgId ? { orgId } : "skip"
  );

  // Check booking status if returning from Stripe
  const bookingStatus = useQuery(
    api.payments.checkout.getBookingStatus,
    bookingIdParam ? { bookingId: bookingIdParam } : "skip"
  );

  // Public booking creation mutation (for WhatsApp/non-payment bookings)
  const createBookingMutation = useMutation(api.bookings.createFromWidget);

  // Stripe checkout action
  const createCheckoutSession = useAction(api.payments.checkout.createCheckoutSession);

  // Handle Stripe checkout
  const handleStripeCheckout = async (bookingData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupTime: string;
    passengers: number;
    vehicleClass: string;
    notes?: string;
    distance?: string;
    duration?: string;
    isReturn?: boolean;
    price: number;
  }) => {
    if (!orgId) return;

    setIsProcessingCheckout(true);

    try {
      const baseUrl = window.location.origin;
      const result = await createCheckoutSession({
        orgId,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        customerEmail: bookingData.customerEmail,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        pickupTime: bookingData.pickupTime,
        passengers: bookingData.passengers,
        vehicleClass: bookingData.vehicleClass,
        notes: bookingData.notes,
        distance: bookingData.distance,
        duration: bookingData.duration,
        isReturn: bookingData.isReturn,
        clientPrice: bookingData.price,
        successUrl: `${baseUrl}/widget?id=${orgId}`,
        cancelUrl: `${baseUrl}/widget?id=${orgId}`,
      });

      // Redirect to Stripe Checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error.message || "Failed to start checkout. Please try again.");
      setIsProcessingCheckout(false);
    }
  };

  // Handle non-Stripe booking creation (WhatsApp)
  const handleCreateBooking = async (booking: Booking) => {
    if (!orgId) return;

    // If it's a Stripe payment, redirect to checkout instead
    if (booking.paymentStatus === PaymentStatus.PAID) {
      await handleStripeCheckout({
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        pickupTime: booking.pickupTime,
        passengers: booking.passengers,
        vehicleClass: booking.vehicleClass || '',
        notes: booking.notes,
        distance: booking.distance,
        duration: booking.duration,
        isReturn: booking.isReturn,
        price: booking.price,
      });
      return;
    }

    try {
      const distanceValue = booking.distanceValue;
      if (distanceValue === undefined || distanceValue === null || Number.isNaN(distanceValue)) {
        throw new Error("Distance is missing—please select pickup/dropoff so we can calculate a route.");
      }

      await createBookingMutation({
        orgId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        pickupTime: booking.pickupTime,
        passengers: booking.passengers,

        vehicleClass: booking.vehicleClass || '',
        distance: distanceValue,

        notes: booking.notes,
        duration: booking.duration,
        isReturn: booking.isReturn,
      });

      // Show success message (the widget itself handles success UI)
      console.log("Booking created successfully!");
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert("Failed to create booking. Please try again or contact the service provider.");
    }
  };

  // Show success page if returning from Stripe with paid booking
  if (sessionId && bookingIdParam && bookingStatus?.paymentStatus === 'PAID') {
    const formatPrice = (amount: number, currency: string) => {
      const symbols: Record<string, string> = { gbp: '£', usd: '$', eur: '€' };
      return `${symbols[currency] || '£'}${(amount / 100).toFixed(2)}`;
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-50 p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-lg w-full">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Booking Confirmed!</h1>
          <p className="text-slate-500 mb-8">
            Thank you for your booking with {bookingStatus.companyName}
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 mb-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pickup</p>
              <p className="text-slate-900 font-semibold">{bookingStatus.pickupLocation}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destination</p>
              <p className="text-slate-900 font-semibold">{bookingStatus.dropoffLocation}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</p>
                <p className="text-slate-900 font-semibold">
                  {new Date(bookingStatus.pickupTime).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })} at {new Date(bookingStatus.pickupTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</p>
                <p className="text-slate-900 font-semibold">{bookingStatus.vehicleClass}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Paid</span>
                <span className="text-2xl font-black text-emerald-600">
                  {formatPrice(bookingStatus.price, bookingStatus.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800">
            A confirmation has been sent to {bookingStatus.customerName}.
            Your driver details will be shared closer to your pickup time.
          </div>

          <button
            onClick={() => window.location.href = `/widget?id=${orgId}`}
            className="mt-6 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium"
          >
            Make Another Booking
          </button>
        </div>
      </div>
    );
  }

  // Error state - no org ID
  if (!orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md mx-4">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Widget Not Configured</h1>
          <p className="text-slate-500 leading-relaxed">
            Missing organization ID. The embed code requires a valid ID parameter.
          </p>
          <p className="text-xs text-slate-400 mt-4 font-mono">
            Expected: /widget?id=org_xxx
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (publicConfig === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <Loader2 className="w-16 h-16 text-brand-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-semibold">Loading booking widget...</p>
          <p className="text-slate-400 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  // Error state - org not found
  if (publicConfig === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Service Not Found</h1>
          <p className="text-slate-500 leading-relaxed">
            The booking service you're looking for doesn't exist or has been deactivated.
          </p>
          <p className="text-xs text-slate-400 mt-4">
            Please contact the service provider for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Merge saved config with defaults (converting from database format)
  const config: WidgetConfig = publicConfig.config
    ? configFromDb(publicConfig.config)
    : { ...DEFAULT_CONFIG, companyName: publicConfig.companyName };

  // Render the widget in full-page mode
  return (
    <div className="min-h-screen bg-slate-50">
      <BookingWidget
        config={config}
        isInline={false}
        onClose={() => {
          // In embedded mode, closing might redirect or show a message
          window.parent.postMessage({ type: 'widget-close' }, '*');
        }}
        onCreate={handleCreateBooking}
      />
    </div>
  );
};
