# SRS Admin — API Contract Audit Report

**Source of truth:** `API_DOCUMENTATION.md`  
**Audit date:** 2026-02-20  
**Scope:** Next.js frontend + app/api route handlers vs backend contract.

---

## STEP 1 — Backend Contract (Extracted)

### Authentication
| Endpoint | Method | Route | Auth | Content-Type | Params | Body Required | Body Optional | Response 200/201 | Errors |
|---------|--------|-------|------|--------------|--------|---------------|---------------|------------------|--------|
| User Login | POST | `/api/auth/login` | No | application/json | — | username, password | — | { token } | 401: Invalid credentials |

### Customers
| Endpoint | Method | Route | Auth | Content-Type | Params | Body Required | Body Optional | Response | Errors |
|---------|--------|-------|------|--------------|--------|---------------|---------------|----------|--------|
| Create Customer | POST | `/api/customers` | Yes (Admin) | application/json | — | name, phone | address | 201: id, name, phone, address?, photoUrl?, createdAt | 400, 401 |
| Get All Customers | GET | `/api/customers` | Yes (Admin) | — | — | — | — | 200: Array<Customer> | 401 |
| Get Customer by ID | GET | `/api/customers/{id}` | Yes (Admin) | — | id (GUID) | — | — | 200: Customer | 401, 404 |
| Search Customers by Phone | GET | `/api/customers/search` | Yes (Admin) | — | **phone** (query) | — | — | 200: Array<Customer> or [] | 401 |

### Purchases
| Endpoint | Method | Route | Auth | Content-Type | Params | Body Required | Body Optional | Response | Errors |
|---------|--------|-------|------|--------------|--------|---------------|---------------|----------|--------|
| Create Purchase | POST | `/api/purchases` | Yes (Admin) | application/json | — | brand, model, year, registrationNumber, sellingPrice, sellerName, sellerPhone, buyingCost, expense, purchaseDate | chassisNumber, engineNumber, colour, sellerAddress | 201: id, vehicleId, brand, model, year, registrationNumber, colour?, sellingPrice, sellerName, sellerPhone, sellerAddress?, buyingCost, expense, purchaseDate, createdAt | 400, 401, 409 |
| Get All Purchases | GET | `/api/purchases` | Yes (Admin) | — | — | — | — | 200: Array<PurchaseDto> | 401 |
| Get Purchase by ID | GET | `/api/purchases/{id}` | Yes (Admin) | — | id (integer) | — | — | 200: PurchaseDto | 401, 404 |

### Vehicles
| Endpoint | Method | Route | Auth | Content-Type | Params | Response | Errors |
|---------|--------|-------|------|--------------|--------|----------|--------|
| Get All Vehicles | GET | `/api/vehicles` | Yes (Admin) | — | — | 200: Array<VehicleDto> (status: 1\|2) | 401 |
| Get Available Vehicles | GET | `/api/vehicles/available` | Yes (Admin) | — | — | 200: Array<VehicleDto> (status 1) | 401 |

### Sales
| Endpoint | Method | Route | Auth | Params / Query | Body | Response | Errors |
|---------|--------|-------|------|----------------|------|----------|--------|
| Get Sales History | GET | `/api/sales` | Yes (Admin) | **pageNumber**, **pageSize**, **search**, **fromDate**, **toDate** (all optional) | — | 200: { items, totalCount, pageNumber, pageSize, totalPages } | 401 |
| Create Sale | POST | `/api/sales` | Yes (Admin) | — | vehicleId (number), customerPhotoUrl (required), paymentMode (1\|2\|3), saleDate (ISO); customerId? OR customerName+customerPhone; customerAddress?; cashAmount/upiAmount/financeAmount per mode; financeCompany if financeAmount>0 | 201: billNumber, vehicleId, vehicle, customerName, totalReceived, profit, saleDate | 400, 401, 404, 409 |
| Get Sale by Bill Number | GET | `/api/sales/{billNumber}` | Yes (Admin) | billNumber (integer) | — | 200: full sale detail DTO | 401, 404 |
| Get Sale Invoice | GET | `/api/sales/{billNumber}/invoice` | Yes (Admin) | billNumber (integer) | — | 200: invoice DTO (deliveryTime, fatherName, idProofNumber, etc.) | 401, 404 |
| Send Invoice via WhatsApp | POST | `/api/sales/{billNumber}/send-invoice` | Yes (Admin) | billNumber (integer) | No body | 200: { billNumber, pdfUrl, status } | 400, 401, 404, 502 |

### Search
| Endpoint | Method | Route | Auth | Query | Response | Errors |
|---------|--------|-------|------|------|----------|--------|
| Global Search | GET | `/api/search` | Yes (Admin) | **q** (optional) | 200: Array<{ billNumber, customerName, customerPhone, vehicle, registrationNumber, saleDate }> | 401 |

### Dashboard
| Endpoint | Method | Route | Auth | Response | Errors |
|---------|--------|-------|------|----------|--------|
| Get Dashboard Statistics | GET | `/api/dashboard` | Yes (Admin) | 200: { totalVehiclesPurchased, totalVehiclesSold, availableVehicles, totalProfit, salesThisMonth } | 401 |

### Upload
| Endpoint | Method | Route | Auth | Content-Type | Body | Response | Errors |
|---------|--------|-------|------|--------------|------|----------|--------|
| Upload Customer Photo | POST | `/api/upload` | Yes (Admin) | **multipart/form-data** | **file** (binary, max 2MB) | 200: { url } | 400, 401 |

### Enums
- **PaymentMode:** 1 = Cash, 2 = UPI, 3 = Finance  
- **VehicleStatus:** 1 = Available, 2 = Sold  
- **UserRole:** 1 = Admin  

### Conditional / Business Rules
- **POST /api/sales:** Either `customerId` (GUID) OR inline `customerName` + `customerPhone`; `customerAddress` optional; `customerPhotoUrl` mandatory; payment amounts by `paymentMode`; `financeCompany` required when `financeAmount` > 0.
- **DateTime:** ISO 8601 string.
- **Auth:** Bearer token in `Authorization` header for all protected endpoints.

---

## STEP 2 — Frontend API Call → Backend Mapping

| Frontend Call | Next.js Route | Backend Endpoint Actually Used |
|---------------|---------------|--------------------------------|
| `fetch("/api/auth/login", { method: "POST", body: { username, password } })` | POST /api/auth/login | POST /api/auth/login |
| `apiClient.post("/auth/logout")` | POST /api/auth/logout | (local only; no backend) |
| `apiClient.get("/dashboard")` | GET /api/dashboard | GET /api/dashboard |
| `apiClient.get("/search", { params: { q } })` | GET /api/search | GET /api/search (query forwarded) |
| `apiClient.get("/vehicles")` | GET /api/vehicles | GET /api/vehicles (or fallback GET /api/sales for status) |
| `apiClient.get("/vehicles/available")` | GET /api/vehicles/available | GET /api/vehicles/available (or fallback GET /api/vehicles + GET /api/sales) |
| `apiClient.get("/purchases")` | GET /api/purchases | GET /api/purchases (or fallback GET /api/vehicles) |
| `apiClient.post("/purchases", values)` | POST /api/purchases | POST /api/purchases |
| `apiClient.post("/sales", body)` | POST /api/sales | POST /api/sales |
| `apiClient.post("/upload", formData)` | POST /api/upload | POST /api/upload |
| `getServerSaleDetail(billNumber)` → `fetch(\`/api/sales/${billNumber}\`)` | GET /api/sales/[id] | **GET /api/sales** (all) + **GET /api/vehicles** (all); then in-memory find by id — **NOT** GET /api/sales/{billNumber} |
| (No direct call) | — | GET /api/sales (list) never called with **pageNumber, pageSize, search, fromDate, toDate** from UI |
| (No call) | — | GET /api/sales/{billNumber}/invoice — **not used** |
| (No call) | — | POST /api/sales/{billNumber}/send-invoice — **not used** |
| (No call) | — | All **Customer** endpoints — **not used** |
| (No call) | — | GET /api/purchases/{id} — **not used** |

---

## STEP 3 — Coverage Validation (Per Endpoint)

### Correctly wired and largely compliant
- **POST /api/auth/login** — Used; method, route, Content-Type, body (username, password) match. 401 and token handling present.
- **GET /api/dashboard** — Proxied; auth; response shape matches DashboardStats.
- **GET /api/search** — Proxied with `includeQuery: true`; frontend uses **q**; auth.
- **GET /api/vehicles** — Proxied; auth; status normalized 1/2 → AVAILABLE/SOLD.
- **GET /api/vehicles/available** — Proxied; auth; fallback to vehicles + sales when /available fails.
- **GET /api/purchases** — Proxied; auth; response normalized.
- **POST /api/purchases** — Proxied; auth; body forwarded; purchaseDate normalized to ISO.
- **POST /api/upload** — Proxied with `forwardBody: true`; auth; multipart/form-data; field name **file** (contract: **file**).
- **POST /api/sales** — Proxied; auth; paymentMode converted to 1/2/3; saleDate ISO; customerPhotoUrl required.

### Incomplete or incorrect
- **GET /api/sales** — Used only inside Next.js route **GET /api/sales/[id]** to fetch **all** sales; **query params (pageNumber, pageSize, search, fromDate, toDate) are never sent**. Paginated list UI does not exist; no sales list page calls GET /api/sales with params.
- **GET /api/sales/{billNumber}** — **Not used.** Next.js handler for `/api/sales/[id]` ignores route param and calls GET /api/sales + GET /api/vehicles, then finds by id in memory. Contract requires GET /api/sales/{billNumber}.
- **POST /api/sales body:** **vehicleId** must be **number**; code sends **string** (`asString(vehicleId)` in `toBackendSalePayload` and in payloads). Risk of 400 or model-binding failure.
- **POST /api/sales:** Backend allows **customerId** (GUID); frontend never sends it (inline customer only). Acceptable but “select existing customer” not implemented.
- **Address:** Backend marks **customerAddress** optional; Next.js sales route requires `backendPayload.address.trim()` and returns 400 if missing — **stricter than contract**.

---

## STEP 4 — Response Validation

### TypeScript vs API
- **DashboardStats** — Matches backend (totalVehiclesPurchased, totalVehiclesSold, availableVehicles, totalProfit, salesThisMonth).
- **SearchResult** — billNumber (number), customerName, customerPhone, vehicle, registrationNumber, saleDate (string). Matches search response.
- **Vehicle** — id (string in UI; backend number — normalized), status VehicleStatus; backend returns status 1|2, normalized to "AVAILABLE"|"SOLD". OK.
- **Purchase** — Normalized from backend; Purchase type has optional imageUrl (not in backend response). OK.
- **Sale / SaleDetail** — Used for getServerSaleDetail. Backend GET /api/sales/{billNumber} returns different shape (e.g. billNumber number, paymentMode number, nullable cash/upi/finance amounts). Currently response is from **in-memory merge** of GET /api/sales + GET /api/vehicles, not from GET /api/sales/{billNumber}, so types are aligned to that merged shape, not to the real single-sale endpoint.
- **Sale.billNumber** — Typed as `string`; API uses integer. Normalization uses asString; if we switch to GET /api/sales/{billNumber}, billNumber should be number in response type.
- **GET /api/sales (list)** — Backend returns `{ items, totalCount, pageNumber, pageSize, totalPages }`. Next.js route returns only normalized `items` (no totalCount/totalPages). No list page consumes this yet; when added, need a proper paginated type.
- **Error handling** — getApiErrorMessage supports message, detail, title, errors; 401 triggers redirect to /login and logout in apiClient. 404/400/409 not specially differentiated in UI (toast/error message only).
- **No `any`** for API responses in checked code; types are explicit.

### Gaps
- Sale detail/invoice pages assume merged sale+vehicle shape; they do not use GET /api/sales/{billNumber} or GET /api/sales/{billNumber}/invoice, so backend invoice-only fields (deliveryTime, fatherName, idProofNumber) are never used.
- If backend returns billNumber as number, some places use sale.id vs sale.billNumber for links; consistency (use billNumber for route param) should be enforced.

---

## STEP 5 — Contract Violations (Structured)

### 1. Correctly Implemented Endpoints
- POST /api/auth/login  
- GET /api/dashboard  
- GET /api/search (query **q** used)  
- GET /api/vehicles  
- GET /api/vehicles/available  
- GET /api/purchases  
- POST /api/purchases  
- POST /api/upload (multipart, field **file**)  
- POST /api/sales (except vehicleId type and address strictness)

### 2. Missing Controller Integrations

| Backend Endpoint | Suggested UI Location | Suggested Service / Hook |
|------------------|------------------------|---------------------------|
| **POST /api/customers** | Customer management or “Add customer” before sale | `createCustomer(data: CreateCustomerDto)` in a customers service; use in sale form when “existing customer” is added |
| **GET /api/customers** | Customers list page, sale form dropdown | `getCustomers()`; hook `useCustomers()` |
| **GET /api/customers/{id}** | Customer detail / edit | `getCustomerById(id: string)` |
| **GET /api/customers/search?phone=** | Sale form: lookup by phone | `searchCustomersByPhone(phone: string)`; use in sale form to prefill name/address |
| **GET /api/purchases/{id}** | Purchase detail page | `getPurchaseById(id: number)`; use on purchases list row click |
| **GET /api/sales** (with pagination) | Sales history / list page | `getSales({ pageNumber, pageSize, search?, fromDate?, toDate? })` returning `{ items, totalCount, pageNumber, pageSize, totalPages }` |
| **GET /api/sales/{billNumber}** | Sale detail & invoice (replace current in-memory merge) | Use in Next.js GET /api/sales/[id] and in getServerSaleDetail: proxy to backend GET /api/sales/{billNumber} |
| **GET /api/sales/{billNumber}/invoice** | Invoice page (optional: use backend invoice DTO for print/PDF) | `getSaleInvoice(billNumber: number)`; optional use for invoice UI or PDF generation |
| **POST /api/sales/{billNumber}/send-invoice** | “Send via WhatsApp” in InvoiceActions | `sendInvoiceWhatsApp(billNumber: number)`; call from InvoiceActions instead of only Web Share / wa.me |

### 3. Incomplete Integrations

| Item | Issue |
|------|--------|
| **GET /api/sales** | Never called with pagination/filter params; no sales list page. |
| **GET /api/sales/[id]** (Next.js) | Does not proxy to GET /api/sales/{billNumber}; fetches all sales + all vehicles and finds by id. |
| **POST /api/sales** | Sends vehicleId as string; contract requires number. Address required in Next.js layer although API has customerAddress optional. |
| **Sale form** | Does not support customerId (existing customer); only inline customer. |

### 4. UI Calling Non-Existent Endpoints
- None. All frontend calls go to existing Next.js routes.

### 5. Critical Contract Mismatches

| Mismatch | Location | Contract | Current |
|----------|----------|----------|---------|
| **vehicleId type** | app/api/sales/route.ts → toBackendSalePayload / buildPascalSalePayload / buildCamelSalePayload | Integer | String (asString(vehicleId)) |
| **Sale by id** | app/api/sales/[id]/route.ts | Call GET /api/sales/{billNumber} | Calls GET /api/sales + GET /api/vehicles, finds in memory |
| **GET /api/sales query params** | app/api/sales/route.ts GET | pageNumber, pageSize, search, fromDate, toDate | Not forwarded; no list caller |

### 6. Authentication Issues
- Protected routes use requireAuth; proxy builds Bearer from cookie/header via extractTokenFromRequest. 401 from backend is proxied; client apiClient redirects to /login and clears session on 401. No role check (Admin) in UI; backend enforces. **No critical auth gaps.**

### 7. Enum Mismatches
- **PaymentMode:** Frontend sends string (Cash/UPI/Finance); converted to 1/2/3 in Next.js sales route. Backend expects number. **Correct.**  
- **VehicleStatus:** Backend returns 1/2; normalized to "AVAILABLE"/"SOLD". **Correct.**

### 8. DTO / Interface Mismatches

| Area | Issue |
|------|--------|
| **Sale create response** | Backend 201: billNumber (number), vehicleId, vehicle, customerName, totalReceived, profit, saleDate. Next.js returns billNumber (from payload); frontend expects `response.data.billNumber` (number). OK. |
| **Sale detail** | Current SaleDetail is for merged sale+vehicle; real GET /api/sales/{billNumber} has more/different fields (e.g. paymentMode number, nullable amounts). Need a dedicated SaleDetailDto when switching to that endpoint. |
| **GET /api/sales list** | Backend: { items, totalCount, pageNumber, pageSize, totalPages }. No frontend type for this yet. |

### 9. Validation Gaps
- **Sale:** Frontend requires address; API has customerAddress optional. Align: either make address optional in UI/route or document as business choice.  
- **Purchase:** Frontend requires chassisNumber, engineNumber, sellerAddress; API has them optional. Stricter than contract; acceptable.  
- **POST /api/sales:** customerId not sent; no validation for “customerId OR (customerName + customerPhone)” on client (backend will reject).  

### 10. Error Handling Gaps
- 401: Handled (redirect + logout).  
- 404/400/409: Shown via getApiErrorMessage; no specific UI for 404 (e.g. “Sale not found” page) beyond notFound() in sale detail.  
- 502 (e.g. send-invoice): Not applicable until send-invoice is integrated.  
- No retry or backoff for transient errors.

---

## STEP 6 — Auto-Fix Suggestions

### 1. vehicleId as number (POST /api/sales)

**Corrected payload (ensure number):**

```ts
// lib/api/sale-payload.ts or in app/api/sales/route.ts
function toBackendSalePayload(input: Record<string, unknown>) {
  const vehicleIdRaw = firstDefined(input.vehicleId, input.vehicle_id);
  const vehicleId = typeof vehicleIdRaw === "number" && Number.isInteger(vehicleIdRaw)
    ? vehicleIdRaw
    : Number(asString(vehicleIdRaw).replace(/\D/g, "")) || 0;

  return {
    vehicleId,  // number
    customerPhotoUrl: asString(...),
    // ... rest unchanged
  };
}
```

In buildPascalSalePayload / buildCamelSalePayload use `VehicleId: Number(payload.vehicleId)` (or keep number from above). Ensure all candidates sent to backend use numeric vehicleId.

**Interface:**

```ts
// Backend expects
interface CreateSaleRequest {
  vehicleId: number;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerPhotoUrl: string;
  paymentMode: 1 | 2 | 3;
  cashAmount?: number | null;
  upiAmount?: number | null;
  financeAmount?: number | null;
  financeCompany?: string | null;
  saleDate: string; // ISO 8601
}
```

### 2. Use GET /api/sales/{billNumber} for sale detail

**Next.js route (app/api/sales/[id]/route.ts):**

```ts
// Replace current implementation with proxy to backend by bill number
export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const billNumber = context.params.id;
  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: `/api/sales/${billNumber}`,
  });

  if (!result.ok) return result.response;
  if (!result.response.ok) return toNextResponse(result.response);

  const payload = await result.response.json().catch(() => null);
  // Normalize to SaleDetail shape (map paymentMode number, nullable amounts, etc.)
  return NextResponse.json(normalizeSaleDetail(payload), { status: 200 });
}
```

**getServerSaleDetail:** Keep calling `fetch(\`/api/sales/${billNumber}\`)`; it will now hit the corrected route that proxies to GET /api/sales/{billNumber}.

**Type for backend sale detail response:**

```ts
interface SaleDetailBackend {
  billNumber: number;
  saleDate: string;
  vehicleId: number;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  chassisNumber: string | null;
  engineNumber: string | null;
  colour: string | null;
  sellingPrice: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerPhotoUrl: string | null;
  purchaseDate: string;
  buyingCost: number;
  expense: number;
  paymentMode: 1 | 2 | 3;
  cashAmount: number | null;
  upiAmount: number | null;
  financeAmount: number | null;
  financeCompany: string | null;
  profit: number;
  totalReceived: number;
}
```

Map to existing SaleDetail (with vehicle from payload or a minimal vehicle object) in normalizeSaleDetail.

### 3. Optional address for sale

**Next.js route (app/api/sales/route.ts):** Remove the check that returns 400 when `!backendPayload.address.trim()`. Allow empty address to match API (customerAddress optional).

**Validation (optional):** If you want to keep “address required” as product rule, keep the check but document that it’s stricter than the API.

### 4. GET /api/sales with pagination (new sales list page)

**Service:**

```ts
// lib/api/sales.ts
export interface GetSalesParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  fromDate?: string; // ISO date
  toDate?: string;
}

export interface SalesPageResponse {
  items: SaleHistoryItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export async function getSales(params: GetSalesParams = {}) {
  const { data } = await apiClient.get<SalesPageResponse>("/sales", { params });
  return data;
}
```

**Hook:**

```ts
// hooks/use-sales.ts
export function useSales(params: GetSalesParams) {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => getSales(params),
  });
}
```

**Next.js GET /api/sales:** Forward query: `includeQuery: true` is already set when proxying; ensure backend path is `/api/sales` and request nextUrl.search is forwarded (already done in proxy). Then add a sales list page that calls getSales with pageNumber, pageSize, search, fromDate, toDate.

### 5. POST /api/sales/{billNumber}/send-invoice

**Service:**

```ts
// lib/api/sales.ts
export interface SendInvoiceResponse {
  billNumber: number;
  pdfUrl: string;
  status: string;
}

export async function sendInvoiceWhatsApp(billNumber: number): Promise<SendInvoiceResponse> {
  const { data } = await apiClient.post<SendInvoiceResponse>(
    `/sales/${billNumber}/send-invoice`
  );
  return data;
}
```

**InvoiceActions:** Add “Send via backend” (or replace current WhatsApp flow): call sendInvoiceWhatsApp(billNumber). On 200 show toast with pdfUrl/status; on 400/404/502 show getApiErrorMessage. Handle 502 (e.g. “WhatsApp service temporarily unavailable”).

### 6. Customer endpoints (optional)

**Service example:**

```ts
// lib/api/customers.ts
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export async function searchCustomersByPhone(phone: string) {
  const { data } = await apiClient.get<Customer[]>("/customers/search", {
    params: { phone },
  });
  return data;
}

export async function createCustomer(payload: { name: string; phone: string; address?: string }) {
  const { data } = await apiClient.post<Customer>("/customers", payload);
  return data;
}
```

You’ll need Next.js routes that proxy to `/api/customers` and `/api/customers/search` (and optionally GET /api/customers, GET /api/customers/{id}).

---

## Summary Table

| Category | Count |
|----------|--------|
| Correctly implemented | 9 endpoints |
| Missing (no frontend call) | 9 (4 customer, 1 purchase by id, 1 sales list with params, 1 sale by billNumber, 1 sale invoice, 1 send-invoice) |
| Incomplete / wrong | 4 (GET /api/sales usage, GET /api/sales/[id] implementation, vehicleId type, address strictness) |
| Critical mismatches | 3 (vehicleId string vs number; sale by id not using backend; GET /api/sales params not used) |

**Recommended order of fixes:**  
1) Fix vehicleId → number and optional address in POST /api/sales.  
2) Change GET /api/sales/[id] to proxy to GET /api/sales/{billNumber} and normalize response.  
3) Add GET /api/sales with params and a sales list page.  
4) Integrate POST /api/sales/{billNumber}/send-invoice in InvoiceActions.  
5) Optionally add customer and purchase-by-id integrations and GET /api/sales/{billNumber}/invoice if needed.
