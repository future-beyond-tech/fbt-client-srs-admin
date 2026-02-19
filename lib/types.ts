export type PaymentMode = "Cash" | "UPI" | "Finance" | "Mixed";

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

export type VehicleStatus = "AVAILABLE" | "SOLD";

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
  saleId: string;
  billNumber: string;
  customerName: string;
  phone: string;
  vehicle: string;
  registrationNumber: string;
  saleDate: string;
}

export interface SaleDetail extends Sale {
  vehicle: Purchase;
  profit: number;
}
