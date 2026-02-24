/** UI/form display; API uses numeric 1=Cash, 2=UPI, 3=Finance */
export enum PaymentMode {
  Cash = "Cash",
  UPI = "UPI",
  Finance = "Finance",
}

/** API contract: PaymentMode as number (POST /api/sales, etc.) */
export const PaymentModeApi = {
  Cash: 1,
  UPI: 2,
  Finance: 3,
} as const;

export type PaymentModeApiValue = (typeof PaymentModeApi)[keyof typeof PaymentModeApi];

export interface Purchase {
  id: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  chassisNumber: string;
  engineNumber: string;
  sellingPrice: number;
  sellerName: string;
  sellerPhone: string;
  sellerAddress: string;
  buyingCost: number;
  expense: number;
  purchaseDate: string;
  imageUrl?: string;
  colour?: string | null;
  createdAt: string;
}

/** UI/display; API returns number 1=Available, 2=Sold */
export enum VehicleStatus {
  Available = "AVAILABLE",
  Sold = "SOLD",
}

/** API contract: VehicleStatus as number (GET /api/vehicles, etc.) */
export const VehicleStatusApi = {
  Available: 1,
  Sold: 2,
} as const;

export type VehicleStatusApiValue = (typeof VehicleStatusApi)[keyof typeof VehicleStatusApi];

export interface VehiclePhoto {
  id: number;
  url: string;
  isPrimary: boolean;
  displayOrder?: number;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  colour?: string | null;
  sellingPrice: number;
  status: VehicleStatus;
  photos?: VehiclePhoto[];
}

export interface Sale {
  id: string;
  billNumber: string;
  vehicleId: string;
  customerPhotoUrl: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMode: PaymentMode;
  cashAmount: number;
  upiAmount: number;
  financeAmount: number;
  financeCompany?: string;
  totalPayment: number;
  saleDate: string;
}

export interface DashboardStats {
  totalVehiclesPurchased: number;
  totalVehiclesSold: number;
  availableVehicles: number;
  totalProfit: number;
  salesThisMonth: number;
}

export interface SearchResult {
  billNumber: number;
  customerName: string;
  customerPhone: string;
  vehicle: string;
  registrationNumber: string;
  saleDate: string;
}

export interface SaleDetail extends Sale {
  vehicle: Purchase;
  profit: number;
}

/** Single row from GET /api/sales (paginated list) */
export interface SaleHistoryItem {
  billNumber: number | string;
  saleDate: string;
  customerName: string;
  phone: string;
  vehicleModel?: string;
  registrationNumber?: string;
  profit: number;
}

export interface SalesPageResponse {
  items: SaleHistoryItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  photoUrl: string | null;
  createdAt: string;
}

/**
 * Request body for POST /api/sales (Create Sale).
 * Aligns with API_DOCUMENTATION.md and optional SaleCreateDto fields from OpenAPI.
 */
export interface SaleCreateDto {
  vehicleId: number;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerPhotoUrl: string;
  paymentMode: PaymentModeApiValue;
  cashAmount?: number | null;
  upiAmount?: number | null;
  financeAmount?: number | null;
  financeCompany?: string | null;
  saleDate: string; // ISO 8601
  /** RC book received from seller (optional backend field) */
  rcBookReceived?: boolean | null;
  /** Ownership transfer accepted by buyer (optional backend field) */
  ownershipTransferAccepted?: boolean | null;
  /** Vehicle accepted in as-is condition (optional backend field) */
  vehicleAcceptedInAsIsCondition?: boolean | null;
}

export interface FinanceCompany {
  id: number;
  name: string;
}

export interface DeliveryNoteSettings {
  shopName: string | null;
  shopAddress: string | null;
  gstNumber: string | null;
  contactNumber: string | null;
  footerText: string | null;
  termsAndConditions: string | null;
  logoUrl: string | null;
  signatureLine: string | null;
}

export interface UpdateDeliveryNoteSettingsDto {
  shopName?: string | null;
  shopAddress?: string | null;
  gstNumber?: string | null;
  contactNumber?: string | null;
  footerText?: string | null;
  termsAndConditions?: string | null;
  logoUrl?: string | null;
  signatureLine?: string | null;
}

export interface PurchaseExpense {
  id: number;
  vehicleId: number;
  expenseType: string;
  amount: number;
}
