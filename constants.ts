
import { Driver, Booking, DriverStatus, BookingStatus, ServiceRecord } from './types';

export const MOCK_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Carlos Mendoza',
    phone: '+13055550101',
    vehicle: 'Cadillac Escalade',
    vehicleColor: 'Black',
    plate: 'LIMO-99',
    status: DriverStatus.AVAILABLE,
    rating: 4.9,
    location: 'Downtown Miami',
    notes: 'Prefers long distance trips. speaks Spanish.'
  },
  {
    id: 'd2',
    name: 'Sarah Jenkins',
    phone: '+13055550102',
    vehicle: 'Mercedes S-Class',
    vehicleColor: 'Silver',
    plate: 'LUX-01',
    status: DriverStatus.BUSY,
    rating: 4.8,
    location: 'MIA Airport',
    notes: 'Available for night shifts.'
  },
  {
    id: 'd3',
    name: 'Michael Chen',
    phone: '+13055550103',
    vehicle: 'Chevy Suburban',
    vehicleColor: 'Black',
    plate: 'VIP-88',
    status: DriverStatus.AVAILABLE,
    rating: 4.7,
    location: 'South Beach',
    notes: 'Great with corporate clients.'
  },
  {
    id: 'd4',
    name: 'David Ross',
    phone: '+13055550104',
    vehicle: 'Lincoln Continental',
    vehicleColor: 'White',
    plate: 'EXEC-22',
    status: DriverStatus.OFF_DUTY,
    rating: 4.5,
    location: 'Coral Gables',
    notes: 'No weekends.'
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    customerName: 'John Smith',
    customerPhone: '+12125551234',
    pickupLocation: 'Fontainebleau Miami Beach',
    dropoffLocation: 'Miami International Airport (MIA)',
    pickupTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    passengers: 2,
    price: 85,
    status: BookingStatus.PENDING,
    notes: 'Flight AA1234'
  },
  {
    id: 'b2',
    customerName: 'Alice Cooper',
    customerPhone: '+14155559876',
    pickupLocation: 'Brickell City Centre',
    dropoffLocation: 'Nobu Malibu',
    pickupTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    passengers: 4,
    price: 150,
    status: BookingStatus.ASSIGNED,
    driverId: 'd2',
    notes: 'Extra luggage'
  },
  {
    id: 'b3',
    customerName: 'Tech Corp Inc.',
    customerPhone: '+16505554321',
    pickupLocation: 'MIA Airport Terminal D',
    dropoffLocation: 'Ritz-Carlton Key Biscayne',
    pickupTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    passengers: 1,
    price: 120,
    status: BookingStatus.COMPLETED,
    driverId: 'd1',
    notes: 'VIP Client'
  }
];

export const MOCK_SERVICES: ServiceRecord[] = [
  {
    id: 's1',
    date: new Date().toISOString(),
    description: 'Chanel No. 5 Perfume (Gift wrapped)',
    vendor: 'Harrods',
    cost: 120,
    serviceChargePercent: 10,
    serviceFee: 12,
    total: 132,
    status: 'COMPLETED',
    driverId: 'd1',
    notes: 'Client requested gift receipt'
  },
  {
    id: 's2',
    date: new Date(Date.now() - 86400000).toISOString(),
    description: 'Dry Cleaning Pickup',
    vendor: 'Mayfair Valet',
    cost: 45,
    serviceChargePercent: 20,
    serviceFee: 9,
    total: 54,
    status: 'PENDING',
    driverId: 'd2'
  }
];