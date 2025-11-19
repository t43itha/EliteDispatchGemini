
export enum BookingStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFF_DUTY = 'OFF_DUTY'
}

export enum VehicleClass {
  BUSINESS = 'Business Class', // E-Class
  FIRST = 'First Class', // S-Class
  VAN = 'Business Van' // V-Class
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  INVOICED = 'INVOICED'
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehicleColour?: string;
  plate: string;
  status: DriverStatus;
  rating: number;
  location: string;
  notes?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string; // ISO string
  passengers: number;
  price: number;
  status: BookingStatus;
  driverId?: string;
  notes?: string;
  vehicleClass?: VehicleClass;
  paymentStatus?: PaymentStatus;
  distance?: string;
  duration?: string;
  isReturn?: boolean;
}

export interface ServiceRecord {
  id: string;
  date: string;
  description: string;
  vendor: string;
  cost: number;
  serviceChargePercent: number;
  serviceFee: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'PAID';
  driverId?: string;
  notes?: string;
}

export interface DashboardStats {
  revenue: number;
  activeJobs: number;
  pendingDispatch: number;
  completedToday: number;
}

export interface AiDriverSuggestion {
  driverId: string;
  reasoning: string;
}