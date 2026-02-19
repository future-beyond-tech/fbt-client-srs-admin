import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { isSameMonth, parseISO } from "date-fns";
import type {
  DashboardStats,
  Purchase,
  Sale,
  SaleDetail,
  SearchResult,
  Vehicle,
} from "@/lib/types";

interface Database {
  purchases: Purchase[];
  sales: Sale[];
}

export interface NewPurchaseInput {
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
}

export interface NewSaleInput {
  vehicleId: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMode: "Cash" | "UPI" | "Finance" | "Mixed";
  cashAmount: number;
  upiAmount: number;
  financeAmount: number;
  financeCompany?: string;
}

const DATA_PATH = path.join(process.cwd(), "data", "db.json");

const EMPTY_DB: Database = {
  purchases: [],
  sales: [],
};

async function ensureDb() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });

  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.writeFile(DATA_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
}

async function readDb(): Promise<Database> {
  await ensureDb();
  const raw = await fs.readFile(DATA_PATH, "utf-8");

  try {
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
    };
  } catch {
    return EMPTY_DB;
  }
}

async function writeDb(data: Database) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function isVehicleSold(sales: Sale[], vehicleId: string) {
  return sales.some((sale) => sale.vehicleId === vehicleId);
}

function mapToVehicle(purchase: Purchase, sales: Sale[]): Vehicle {
  return {
    id: purchase.id,
    brand: purchase.brand,
    model: purchase.model,
    year: purchase.year,
    registrationNumber: purchase.registrationNumber,
    sellingPrice: purchase.sellingPrice,
    status: isVehicleSold(sales, purchase.id) ? "SOLD" : "AVAILABLE",
  };
}

export async function getPurchases() {
  const db = await readDb();
  return [...db.purchases].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
}

export async function addPurchase(input: NewPurchaseInput) {
  const db = await readDb();

  const purchase: Purchase = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };

  db.purchases.push(purchase);
  await writeDb(db);
  return purchase;
}

export async function getVehicles() {
  const db = await readDb();
  return db.purchases.map((purchase) => mapToVehicle(purchase, db.sales));
}

export async function getAvailableVehicles() {
  const db = await readDb();

  return db.purchases
    .filter((purchase) => !isVehicleSold(db.sales, purchase.id))
    .map((purchase) => mapToVehicle(purchase, db.sales));
}

export async function addSale(input: NewSaleInput) {
  const db = await readDb();
  const vehicle = db.purchases.find((purchase) => purchase.id === input.vehicleId);

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (isVehicleSold(db.sales, input.vehicleId)) {
    throw new Error("Vehicle is already sold");
  }

  const totalPayment = input.cashAmount + input.upiAmount + input.financeAmount;

  if (Math.abs(totalPayment - vehicle.sellingPrice) > 0.001) {
    throw new Error("Total payment must equal selling price");
  }

  const saleDate = new Date().toISOString();
  const billPrefix = saleDate.slice(0, 10).replaceAll("-", "");
  const sameDayCount = db.sales.filter((sale) =>
    sale.saleDate.startsWith(saleDate.slice(0, 10)),
  ).length;

  const sale: Sale = {
    id: randomUUID(),
    billNumber: `SRS-${billPrefix}-${String(sameDayCount + 1).padStart(4, "0")}`,
    vehicleId: input.vehicleId,
    customerName: input.customerName,
    phone: input.phone,
    address: input.address,
    paymentMode: input.paymentMode,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
    financeAmount: input.financeAmount,
    financeCompany: input.financeCompany,
    totalPayment,
    saleDate,
  };

  db.sales.push(sale);
  await writeDb(db);

  return sale;
}

export async function getSaleDetail(saleId: string): Promise<SaleDetail | null> {
  const db = await readDb();
  const sale = db.sales.find((item) => item.id === saleId);

  if (!sale) {
    return null;
  }

  const vehicle = db.purchases.find((item) => item.id === sale.vehicleId);

  if (!vehicle) {
    return null;
  }

  return {
    ...sale,
    vehicle,
    profit: sale.totalPayment - vehicle.buyingCost - vehicle.expense,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await readDb();
  const totalVehiclesPurchased = db.purchases.length;
  const totalVehiclesSold = db.sales.length;
  const availableVehicles = totalVehiclesPurchased - totalVehiclesSold;

  const totalProfit = db.sales.reduce((sum, sale) => {
    const purchase = db.purchases.find((item) => item.id === sale.vehicleId);

    if (!purchase) {
      return sum;
    }

    return sum + (sale.totalPayment - purchase.buyingCost - purchase.expense);
  }, 0);

  const now = new Date();
  const salesThisMonth = db.sales.reduce((sum, sale) => {
    const saleDate = parseISO(sale.saleDate);

    if (isSameMonth(saleDate, now)) {
      return sum + sale.totalPayment;
    }

    return sum;
  }, 0);

  return {
    totalVehiclesPurchased,
    totalVehiclesSold,
    availableVehicles,
    totalProfit,
    salesThisMonth,
  };
}

export async function searchSales(query: string): Promise<SearchResult[]> {
  const db = await readDb();
  const normalized = query.trim().toLowerCase();

  return db.sales
    .map((sale) => {
      const vehicle = db.purchases.find((purchase) => purchase.id === sale.vehicleId);

      if (!vehicle) {
        return null;
      }

      const row: SearchResult = {
        saleId: sale.id,
        billNumber: sale.billNumber,
        customerName: sale.customerName,
        phone: sale.phone,
        vehicle: `${vehicle.brand} ${vehicle.model}`,
        registrationNumber: vehicle.registrationNumber,
        saleDate: sale.saleDate,
      };

      return row;
    })
    .filter((row): row is SearchResult => row !== null)
    .filter((row) => {
      if (!normalized) {
        return true;
      }

      return [
        row.billNumber,
        row.customerName,
        row.phone,
        row.vehicle,
        row.registrationNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    })
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate));
}
