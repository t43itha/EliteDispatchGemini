

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

export interface WidgetConfig {
  companyName: string;
  primaryColor: string;
  currency: string;
  showMap: boolean;
  distanceUnit: 'km' | 'mi' | 'hr';
  vehicles: {
    [key in VehicleClass]: { 
      enabled: boolean; 
      basePrice: number; 
      pricePerUnit: number;
      image: string;
      name: string;
      description: string;
      maxPassengers: number;
      maxLuggage: number;
    };
  };
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

// ==================== XERO INTEGRATION TYPES ====================

export enum XeroInvoiceStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  AUTHORISED = 'AUTHORISED',
  PAID = 'PAID',
  VOIDED = 'VOIDED'
}

export enum XeroTaxType {
  OUTPUT2 = 'OUTPUT2',  // 20% VAT (UK standard rate)
  NONE = 'NONE'         // No VAT (zero-rated or exempt)
}

export interface XeroConnection {
  tenantId: string;
  tenantName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  connectedAt: number;
  connectedBy: string;
}

export interface XeroContact {
  id: string;              // Our DB ID
  xeroContactId: string;   // Xero's contact ID
  name: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  isCustomer: boolean;
}

export interface InvoiceLineItem {
  id: string;              // Client-side ID for UI state
  description: string;
  quantity: number;
  unitAmount: number;      // Price per unit
  taxType: XeroTaxType;    // VAT or No VAT
  lineAmount: number;      // quantity * unitAmount
  bookingId?: string;      // Link to booking if auto-populated
  isEditable: boolean;     // false for auto-populated from bookings
}

export interface XeroInvoice {
  id: string;              // Our DB ID
  xeroInvoiceId: string;   // Xero's invoice ID
  xeroInvoiceNumber: string;
  status: XeroInvoiceStatus;
  xeroContactId: string;
  contactName: string;
  subtotal: number;
  totalTax: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  currencyCode: string;
  lineItems: Omit<InvoiceLineItem, 'id' | 'isEditable'>[];
  bookingIds: string[];
  invoiceDate: string;
  dueDate: string;
  createdAt: number;
  createdBy: string;
  xeroUrl?: string;
}

// For invoice creation wizard state
export interface InvoiceWizardState {
  currentStep: 1 | 2 | 3 | 4;
  selectedBookingIds: string[];
  bulkStrategy: 'combine' | 'separate' | null;
  selectedContact: XeroContact | null;
  lineItems: InvoiceLineItem[];
  invoiceDate: string;
  dueDate: string;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// For API responses
export interface CreateInvoiceResult {
  success: boolean;
  invoiceId?: string;
  xeroInvoiceNumber?: string;
  xeroUrl?: string;
  error?: string;
}