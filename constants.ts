
import { Driver, Booking, DriverStatus, BookingStatus, ServiceRecord, VehicleClass } from './types';

export const MOCK_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'James Sterling',
    phone: '+447700900001',
    vehicle: 'Mercedes S-Class',
    vehicleColour: 'Obsidian Black',
    plate: 'LD69 VXL',
    status: DriverStatus.AVAILABLE,
    rating: 4.9,
    location: 'Mayfair, London',
    notes: 'Expert in corporate roadshows.'
  },
  {
    id: 'd2',
    name: 'Sarah Jenkins',
    phone: '+447700900002',
    vehicle: 'Mercedes V-Class',
    vehicleColour: 'Silver',
    plate: 'GV23 ABC',
    status: DriverStatus.BUSY,
    rating: 4.8,
    location: 'Heathrow T5',
    notes: 'Available for night shifts.'
  },
  {
    id: 'd3',
    name: 'Michael Chen',
    phone: '+447700900003',
    vehicle: 'BMW 7 Series',
    vehicleColour: 'Black',
    plate: 'BK72 XYZ',
    status: DriverStatus.AVAILABLE,
    rating: 4.7,
    location: 'Canary Wharf',
    notes: 'Great with corporate clients.'
  },
  {
    id: 'd4',
    name: 'David Ross',
    phone: '+447700900004',
    vehicle: 'Range Rover',
    vehicleColour: 'White',
    plate: 'RR22 BOSS',
    status: DriverStatus.OFF_DUTY,
    rating: 4.5,
    location: 'Kensington',
    notes: 'No weekends.'
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    customerName: 'John Smith',
    customerPhone: '+447800123456',
    pickupLocation: 'The Ritz London',
    dropoffLocation: 'Heathrow Airport (LHR) T5',
    pickupTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    passengers: 2,
    price: 145,
    status: BookingStatus.PENDING,
    notes: 'Flight BA123',
    vehicleClass: VehicleClass.FIRST
  },
  {
    id: 'b2',
    customerName: 'Alice Cooper',
    customerPhone: '+447900654321',
    pickupLocation: 'One Canada Square, Canary Wharf',
    dropoffLocation: 'Gatwick Airport (LGW)',
    pickupTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    passengers: 4,
    price: 180,
    status: BookingStatus.ASSIGNED,
    driverId: 'd2',
    notes: 'Extra luggage',
    vehicleClass: VehicleClass.VAN
  },
  {
    id: 'b3',
    customerName: 'Tech Corp Ltd.',
    customerPhone: '+442071234567',
    pickupLocation: 'London City Airport (LCY)',
    dropoffLocation: 'The Savoy',
    pickupTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    passengers: 1,
    price: 95,
    status: BookingStatus.COMPLETED,
    driverId: 'd1',
    notes: 'VIP Client',
    vehicleClass: VehicleClass.BUSINESS
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