import React from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { BookingWidget } from './BookingWidget';
import { WidgetConfig, VehicleClass, Booking } from '../types';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
  // Get org ID from URL query param
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get('id');

  // Fetch config from Convex (public query, no auth needed)
  const publicConfig = useQuery(
    api.organizations.getPublicWidgetConfig,
    orgId ? { orgId } : "skip"
  );

  // Public booking creation mutation
  const createBookingMutation = useMutation(api.bookings.createFromWidget);

  // Handle booking creation
  const handleCreateBooking = async (booking: Booking) => {
    if (!orgId) return;

    try {
      await createBookingMutation({
        orgId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        pickupTime: booking.pickupTime,
        passengers: booking.passengers,
        price: booking.price,
        vehicleClass: booking.vehicleClass,
        notes: booking.notes,
        distance: booking.distance,
        duration: booking.duration,
        isReturn: booking.isReturn,
        paymentStatus: booking.paymentStatus,
      });

      // Show success message (the widget itself handles success UI)
      console.log("Booking created successfully!");
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert("Failed to create booking. Please try again or contact the service provider.");
    }
  };

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
