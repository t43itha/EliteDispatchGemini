import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import {
    MapPin,
    Clock,
    User,
    Car,
    Phone,
    CheckCircle2,
    Clock3,
    Loader2,
    AlertCircle,
    MessageCircle,
    Users,
    CreditCard,
} from 'lucide-react';

interface BookingStatusPageProps {
    bookingId: string;
}

export const BookingStatusPage: React.FC<BookingStatusPageProps> = ({ bookingId }) => {
    const booking = useQuery(api.bookings.public.getBookingStatus, {
        bookingId: bookingId as Id<"bookings">,
    });

    if (booking === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (booking === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Booking Not Found</h1>
                    <p className="text-slate-600">
                        This booking link may be invalid or the booking may have been removed.
                    </p>
                </div>
            </div>
        );
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PENDING':
                return {
                    label: 'Pending Assignment',
                    description: 'Your booking is confirmed. We are assigning a driver.',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: Clock3,
                    iconColor: 'text-amber-500',
                };
            case 'ASSIGNED':
                return {
                    label: booking.whatsappDriverAccepted ? 'Driver Confirmed' : 'Driver Assigned',
                    description: booking.whatsappDriverAccepted
                        ? 'Your driver has confirmed and will arrive on time.'
                        : 'A driver has been assigned to your booking.',
                    color: 'bg-brand-50 text-brand-700 border-brand-200',
                    icon: Car,
                    iconColor: 'text-brand-500',
                };
            case 'IN_PROGRESS':
                return {
                    label: 'In Progress',
                    description: 'Your trip is in progress. Enjoy your ride!',
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: Car,
                    iconColor: 'text-emerald-500',
                };
            case 'COMPLETED':
                return {
                    label: 'Completed',
                    description: 'Your trip has been completed. Thank you for travelling with us!',
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: CheckCircle2,
                    iconColor: 'text-emerald-500',
                };
            case 'CANCELLED':
                return {
                    label: 'Cancelled',
                    description: 'This booking has been cancelled.',
                    color: 'bg-slate-100 text-slate-600 border-slate-200',
                    icon: AlertCircle,
                    iconColor: 'text-slate-400',
                };
            default:
                return {
                    label: status,
                    description: '',
                    color: 'bg-slate-100 text-slate-600 border-slate-200',
                    icon: Clock3,
                    iconColor: 'text-slate-400',
                };
        }
    };

    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;

    const pickupDate = new Date(booking.pickupTime);
    const formattedDate = pickupDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const formattedTime = pickupDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-4 py-4">
                <div className="max-w-lg mx-auto">
                    <h1 className="text-lg font-bold text-slate-900">{booking.orgName}</h1>
                    <p className="text-sm text-slate-500">Booking Status</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto p-4 space-y-4">
                {/* Status Card */}
                <div className={`rounded-2xl p-5 border ${statusConfig.color}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                            <StatusIcon className={`w-6 h-6 ${statusConfig.iconColor}`} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">{statusConfig.label}</h2>
                            <p className="text-sm opacity-80">{statusConfig.description}</p>
                        </div>
                    </div>
                </div>

                {/* Driver Card (if assigned) */}
                {booking.driver && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Your Driver</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                                {booking.driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-lg">{booking.driver.name}</p>
                                <p className="text-sm text-slate-500">
                                    {booking.driver.vehicle}
                                    {booking.driver.vehicleColour && ` • ${booking.driver.vehicleColour}`}
                                </p>
                                <p className="text-sm font-mono font-bold text-slate-700 mt-1">{booking.driver.plate}</p>
                            </div>
                        </div>
                        {booking.driver.phone && (
                            <a
                                href={`https://wa.me/${booking.driver.phone.replace(/[^\d]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1da851] transition-colors shadow-lg shadow-green-500/20"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Contact Driver
                            </a>
                        )}
                    </div>
                )}

                {/* Booking Details */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Trip Details</h3>

                    <div className="space-y-4">
                        {/* Date & Time */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pickup Time</p>
                                <p className="font-bold text-slate-900">{formattedTime}</p>
                                <p className="text-sm text-slate-600">{formattedDate}</p>
                            </div>
                        </div>

                        {/* Pickup */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pickup</p>
                                <p className="font-bold text-slate-900">{booking.pickupLocation}</p>
                            </div>
                        </div>

                        {/* Dropoff */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Dropoff</p>
                                <p className="font-bold text-slate-900">{booking.dropoffLocation}</p>
                            </div>
                        </div>

                        {/* Passengers & Vehicle */}
                        <div className="flex gap-4">
                            <div className="flex items-center gap-3 flex-1 p-3 bg-slate-50 rounded-xl">
                                <Users className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Passengers</p>
                                    <p className="font-bold text-slate-900">{booking.passengers}</p>
                                </div>
                            </div>
                            {booking.vehicleClass && (
                                <div className="flex items-center gap-3 flex-1 p-3 bg-slate-50 rounded-xl">
                                    <Car className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Vehicle</p>
                                        <p className="font-bold text-slate-900">{booking.vehicleClass.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-xl border border-brand-100">
                            <CreditCard className="w-5 h-5 text-brand-600" />
                            <div>
                                <p className="text-sm text-brand-600">Total Fare</p>
                                <p className="font-bold text-brand-900 text-xl">£{booking.price.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Support */}
                {booking.orgPhone && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Need Help?</h3>
                        <a
                            href={`tel:${booking.orgPhone}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <Phone className="w-5 h-5" />
                            Call {booking.orgName}
                        </a>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center py-6 text-sm text-slate-400">
                    <p>Booking #{booking.id.slice(-6).toUpperCase()}</p>
                </div>
            </div>
        </div>
    );
};
