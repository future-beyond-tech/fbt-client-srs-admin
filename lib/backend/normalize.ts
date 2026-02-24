type JsonRecord = Record<string, unknown>;

export function normalizeKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export function pickField(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }

  const entries = Object.entries(row);

  for (const key of keys) {
    const target = normalizeKey(key);
    const matched = entries.find(([entryKey]) => normalizeKey(entryKey) === target);

    if (matched && matched[1] !== undefined && matched[1] !== null) {
      return matched[1];
    }
  }

  return undefined;
}

export function asRecordArray(payload: unknown) {
  if (!Array.isArray(payload)) {
    return null;
  }

  return payload.filter(
    (item): item is JsonRecord => typeof item === "object" && item !== null,
  );
}

export function extractRows(payload: unknown) {
  const directRows = asRecordArray(payload);

  if (directRows) {
    return directRows;
  }

  if (typeof payload === "object" && payload !== null) {
    const container = payload as JsonRecord;

    return (
      asRecordArray(container.data) ??
      asRecordArray(container.items) ??
      asRecordArray(container.results) ??
      asRecordArray(container.rows)
    );
  }

  return null;
}

export function firstDefined<T>(...values: T[]) {
  return values.find((value) => value !== undefined && value !== null);
}

export function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

export function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.replace(/[, ]+/g, "").replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }

    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }

  return null;
}

export function normalizeStatus(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value === 1) {
      return "AVAILABLE";
    }

    if (value === 2) {
      return "SOLD";
    }
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().toUpperCase();

    if (normalized === "AVAILABLE" || normalized === "SOLD") {
      return normalized;
    }

    if (normalized === "IN_STOCK") {
      return "AVAILABLE";
    }

    if (normalized === "1") {
      return "AVAILABLE";
    }

    if (normalized === "2") {
      return "SOLD";
    }
  }

  return null;
}

function normalizePaymentMode(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value === 1) {
      return "Cash";
    }

    if (value === 2) {
      return "UPI";
    }

    if (value === 3) {
      return "Finance";
    }
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().toUpperCase();

    if (normalized === "CASH" || normalized === "1") {
      return "Cash";
    }

    if (normalized === "UPI" || normalized === "2") {
      return "UPI";
    }

    if (normalized === "FINANCE" || normalized === "3") {
      return "Finance";
    }
  }

  return "Cash";
}

export function normalizeVehicle(row: JsonRecord) {
  const vehicleId = asString(
    firstDefined(
      pickField(row, ["id", "vehicleId", "vehicle_id", "vehicleID", "purchaseId", "purchase_id"]),
      row.id,
    ),
  );
  const status = normalizeStatus(
    firstDefined(
      pickField(row, [
        "status",
        "statusId",
        "status_id",
        "vehicleStatus",
        "vehicle_status",
        "vehicleStatusId",
        "vehicle_status_id",
        "availabilityStatus",
      ]),
      row.status,
    ),
  );
  const isSold = firstDefined(
    pickField(row, ["isSold", "is_sold", "sold"]),
    row.isSold,
  );
  const isAvailable = firstDefined(
    pickField(row, ["isAvailable", "is_available", "available"]),
    row.isAvailable,
  );
  const soldFlag = toBoolean(isSold);
  const availableFlag = toBoolean(isAvailable);
  const normalizedSold = soldFlag ?? (availableFlag === null ? null : !availableFlag);
  const computedStatus =
    status ??
    (typeof normalizedSold === "boolean" ? (normalizedSold ? "SOLD" : "AVAILABLE") : "AVAILABLE");

  return {
    id: vehicleId,
    brand: asString(firstDefined(pickField(row, ["brand", "make"]), row.brand)),
    model: asString(
      firstDefined(pickField(row, ["model", "modelName", "vehicleModel"]), row.model),
    ),
    year: asNumber(
      firstDefined(pickField(row, ["year", "manufactureYear", "manufacture_year"]), row.year),
    ),
    registrationNumber: asString(
      firstDefined(
        pickField(row, [
          "registrationNumber",
          "registrationNo",
          "registration_number",
          "regNumber",
          "reg_no",
        ]),
        row.registrationNumber,
      ),
    ),
    chassisNumber: asString(
      firstDefined(pickField(row, ["chassisNumber", "chassisNo", "chassis_number"]), row.chassisNumber),
    ),
    engineNumber: asString(
      firstDefined(pickField(row, ["engineNumber", "engineNo", "engine_number"]), row.engineNumber),
    ),
    colour: asString(
      firstDefined(
        pickField(row, ["colour", "color", "vehicleColour", "vehicle_colour"]),
        row.colour,
      ),
    ),
    sellingPrice: asNumber(
      firstDefined(
        pickField(row, ["sellingPrice", "salePrice", "selling_price", "sale_price", "price"]),
        row.sellingPrice,
      ),
    ),
    buyingCost: asNumber(
      firstDefined(
        pickField(row, [
          "buyingCost",
          "buying_cost",
          "buyingPrice",
          "buying_price",
          "purchasePrice",
          "purchase_price",
          "costPrice",
          "cost_price",
        ]),
        row.buyingCost,
      ),
    ),
    expense: asNumber(
      firstDefined(pickField(row, ["expense", "expenses", "expense_amount"]), row.expense),
    ),
    sellerName: asString(
      firstDefined(pickField(row, ["sellerName", "seller_name", "ownerName"]), row.sellerName),
    ),
    sellerPhone: asString(
      firstDefined(pickField(row, ["sellerPhone", "seller_phone", "ownerPhone"]), row.sellerPhone),
    ),
    sellerAddress: asString(
      firstDefined(
        pickField(row, ["sellerAddress", "seller_address", "ownerAddress"]),
        row.sellerAddress,
      ),
    ),
    purchaseDate: asString(
      firstDefined(
        pickField(row, ["purchaseDate", "purchase_date", "createdAt", "created_at", "date"]),
        row.purchaseDate,
      ),
    ),
    imageUrl: asString(firstDefined(pickField(row, ["imageUrl", "image_url"]), row.imageUrl)),
    createdAt: asString(
      firstDefined(pickField(row, ["createdAt", "created_at", "purchaseDate"]), row.createdAt),
    ),
    status: computedStatus,
  };
}

export function normalizeSale(row: JsonRecord) {
  const nestedVehicle =
    typeof row.vehicle === "object" && row.vehicle !== null
      ? (row.vehicle as JsonRecord)
      : null;

  const normalizedVehicle = nestedVehicle ? normalizeVehicle(nestedVehicle) : null;

  const paymentMode = normalizePaymentMode(
    firstDefined(
      pickField(row, ["paymentMode", "payment_mode", "mode", "paymentModeId", "payment_mode_id"]),
      row.paymentMode,
    ),
  );

  return {
    id: asString(firstDefined(pickField(row, ["id", "saleId", "sale_id"]), row.id)),
    billNumber: asString(
      firstDefined(
        pickField(row, ["billNumber", "billNo", "bill_number", "invoiceNumber"]),
        row.billNumber,
      ),
    ),
    vehicleId: asString(
      firstDefined(
        pickField(row, ["vehicleId", "vehicle_id", "vehicleID", "purchaseId", "purchase_id"]),
        row.vehicleId,
        normalizedVehicle?.id,
        nestedVehicle?.id,
      ),
    ),
    customerName: asString(
      firstDefined(
        pickField(row, ["customerName", "customer_name", "buyerName", "buyer_name"]),
        row.customerName,
      ),
    ),
    customerPhotoUrl: asString(
      firstDefined(
        pickField(row, ["customerPhotoUrl", "customer_photo_url", "photoUrl", "photo_url"]),
        row.customerPhotoUrl,
      ),
    ),
    phone: asString(
      firstDefined(
        pickField(row, ["phone", "phoneNumber", "mobile", "customerPhone"]),
        row.phone,
      ),
    ),
    address: asString(
      firstDefined(pickField(row, ["address", "customerAddress", "customer_address"]), row.address),
    ),
    paymentMode,
    cashAmount: asNumber(
      firstDefined(pickField(row, ["cashAmount", "cash", "cash_amount"]), row.cashAmount),
    ),
    upiAmount: asNumber(
      firstDefined(pickField(row, ["upiAmount", "upi", "upi_amount"]), row.upiAmount),
    ),
    financeAmount: asNumber(
      firstDefined(
        pickField(row, [
          "financeAmount",
          "finance",
          "finance_amount",
          "loanAmount",
          "loan_amount",
        ]),
        row.financeAmount,
      ),
    ),
    financeCompany: asString(
      firstDefined(pickField(row, ["financeCompany", "finance_company"]), row.financeCompany),
    ),
    totalPayment: asNumber(
      firstDefined(
        pickField(row, ["totalPayment", "totalAmount", "total_payment", "amount"]),
        row.totalPayment,
      ),
    ),
    saleDate: asString(
      firstDefined(pickField(row, ["saleDate", "sale_date", "createdAt", "date"]), row.saleDate),
    ),
    registrationNumber: asString(
      firstDefined(
        pickField(row, [
          "registrationNumber",
          "registrationNo",
          "registration_number",
          "regNumber",
          "reg_no",
          "vehicleRegistrationNumber",
          "vehicleRegistrationNo",
        ]),
        normalizedVehicle?.registrationNumber,
      ),
    ),
    vehicle: normalizedVehicle ?? nestedVehicle,
  };
}

/**
 * Maps backend GET /api/sales/{billNumber} flat DTO to SaleDetail shape.
 */
export function normalizeSaleDetailFromFlat(row: JsonRecord) {
  const nestedVehicle =
    typeof row.vehicle === "object" && row.vehicle !== null
      ? (row.vehicle as JsonRecord)
      : null;
  const nestedCustomer =
    typeof row.customer === "object" && row.customer !== null
      ? (row.customer as JsonRecord)
      : null;

  const paymentMode = normalizePaymentMode(
    firstDefined(
      pickField(row, ["paymentMode", "payment_mode", "mode"]),
      row.paymentMode,
    ),
  );
  const billNumber = asNumber(
    firstDefined(
      pickField(row, ["billNumber", "billNo", "bill_number"]),
      row.billNumber,
    ),
  );
  const vehicleId = asNumber(
    firstDefined(
      pickField(row, ["vehicleId", "vehicle_id"]),
      row.vehicleId,
      nestedVehicle?.id,
    ),
  );
  const totalReceived = asNumber(
    firstDefined(
      pickField(row, ["totalReceived", "total_received", "totalPayment", "total_payment"]),
      row.totalReceived,
      row.totalPayment,
    ),
  );

  const flatVehicle: Record<string, unknown> = {
    id: asString(vehicleId),
    brand: asString(
      firstDefined(
        pickField(row, ["brand", "vehicleBrand", "vehicle_brand", "make"]),
        row.brand,
      ),
    ),
    model: asString(
      firstDefined(
        pickField(row, ["model", "vehicleModel", "vehicle_model", "modelName"]),
        row.model,
      ),
    ),
    year: asNumber(
      firstDefined(
        pickField(row, ["year", "vehicleYear", "vehicle_year", "manufactureYear"]),
        row.year,
      ),
    ),
    registrationNumber: asString(
      firstDefined(
        pickField(row, ["registrationNumber", "registrationNo", "registration_number"]),
        row.registrationNumber,
      ),
    ),
    chassisNumber: asString(
      firstDefined(
        pickField(row, ["chassisNumber", "chassisNo", "chassis_number"]),
        row.chassisNumber,
      ),
    ),
    engineNumber: asString(
      firstDefined(
        pickField(row, ["engineNumber", "engineNo", "engine_number"]),
        row.engineNumber,
      ),
    ),
    colour: asString(
      firstDefined(
        pickField(row, ["colour", "color", "vehicleColour", "vehicle_colour"]),
        row.colour,
      ),
    ),
    sellingPrice: asNumber(
      firstDefined(
        pickField(row, ["sellingPrice", "selling_price", "salePrice"]),
        row.sellingPrice,
      ),
    ),
    sellerName: asString(
      firstDefined(
        pickField(row, ["sellerName", "seller_name", "ownerName", "owner_name"]),
        row.sellerName,
      ),
    ),
    sellerPhone: asString(
      firstDefined(
        pickField(row, ["sellerPhone", "seller_phone", "ownerPhone", "owner_phone"]),
        row.sellerPhone,
      ),
    ),
    sellerAddress: asString(
      firstDefined(
        pickField(row, ["sellerAddress", "seller_address", "ownerAddress", "owner_address"]),
        row.sellerAddress,
      ),
    ),
    buyingCost: asNumber(
      firstDefined(
        pickField(row, ["buyingCost", "buying_cost"]),
        row.buyingCost,
      ),
    ),
    expense: asNumber(firstDefined(row.expense)),
    purchaseDate: asString(
      firstDefined(
        pickField(row, ["purchaseDate", "purchase_date"]),
        row.purchaseDate,
      ),
    ),
    createdAt: asString(
      firstDefined(
        pickField(row, ["purchaseDate", "purchase_date", "createdAt"]),
        row.purchaseDate,
      ),
    ),
  };

  const vehicle = normalizeVehicle((nestedVehicle ?? flatVehicle) as JsonRecord);
  const cashAmount = asNumber(
    firstDefined(pickField(row, ["cashAmount", "cash_amount"]), row.cashAmount),
  );
  const upiAmount = asNumber(
    firstDefined(pickField(row, ["upiAmount", "upi_amount"]), row.upiAmount),
  );
  const financeAmount = asNumber(
    firstDefined(
      pickField(row, ["financeAmount", "finance_amount"]),
      row.financeAmount,
    ),
  );
  const totalPayment = totalReceived || cashAmount + upiAmount + financeAmount;

  return {
    id: asString(billNumber),
    billNumber: asString(billNumber),
    vehicleId: asString(vehicleId || vehicle.id),
    customerPhotoUrl: asString(
      firstDefined(
        pickField(row, ["customerPhotoUrl", "customer_photo_url", "photoUrl", "photo_url"]),
        row.customerPhotoUrl,
        nestedCustomer?.photoUrl,
      ),
    ),
    customerName: asString(
      firstDefined(
        pickField(row, ["customerName", "customer_name", "buyerName", "buyer_name"]),
        row.customerName,
        nestedCustomer?.name,
      ),
    ),
    phone: asString(
      firstDefined(
        pickField(row, ["customerPhone", "customer_phone", "phone"]),
        row.customerPhone,
        nestedCustomer?.phone,
      ),
    ),
    address: asString(
      firstDefined(
        pickField(row, ["customerAddress", "customer_address", "address"]),
        row.customerAddress,
        nestedCustomer?.address,
      ),
    ),
    paymentMode,
    cashAmount,
    upiAmount,
    financeAmount,
    financeCompany: asString(
      firstDefined(pickField(row, ["financeCompany", "finance_company"]), row.financeCompany),
    ),
    totalPayment,
    saleDate: asString(
      firstDefined(pickField(row, ["saleDate", "sale_date", "createdAt"]), row.saleDate),
    ),
    vehicle: {
      ...vehicle,
      id: vehicle.id || asString(vehicleId),
      brand: vehicle.brand || asString(flatVehicle.brand),
      model: vehicle.model || asString(flatVehicle.model),
      year: vehicle.year || asNumber(flatVehicle.year),
      registrationNumber:
        vehicle.registrationNumber || asString(flatVehicle.registrationNumber),
      chassisNumber: vehicle.chassisNumber || asString(flatVehicle.chassisNumber),
      engineNumber: vehicle.engineNumber || asString(flatVehicle.engineNumber),
      sellerName: vehicle.sellerName || asString(flatVehicle.sellerName),
      sellerPhone: vehicle.sellerPhone || asString(flatVehicle.sellerPhone),
      sellerAddress: vehicle.sellerAddress || asString(flatVehicle.sellerAddress),
      sellingPrice: vehicle.sellingPrice || asNumber(flatVehicle.sellingPrice),
      buyingCost: vehicle.buyingCost || asNumber(flatVehicle.buyingCost),
      expense: vehicle.expense || asNumber(flatVehicle.expense),
      purchaseDate: vehicle.purchaseDate || asString(flatVehicle.purchaseDate),
      createdAt: vehicle.createdAt || asString(flatVehicle.createdAt),
    },
    profit: asNumber(firstDefined(row.profit)),
  };
}
