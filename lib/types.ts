export enum PaymentMode {
  Cash = "Cash",
  UPI = "UPI",
  Finance = "Finance",
}

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
  createdAt: string;
}

export enum VehicleStatus {
  Available = "AVAILABLE",
  Sold = "SOLD",
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  sellingPrice: number;
  status: VehicleStatus;
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
