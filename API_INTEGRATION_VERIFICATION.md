# API Integration Verification Report

**Date:** 2026-02-22  
**Scope:** Vehicles, Purchases, Purchase Expenses, Sales — UI integration and backend proxy correctness.

---

## Summary

| Module            | Endpoints | Integrated in UI | Backend proxied | Notes |
|-------------------|-----------|------------------|-----------------|--------|
| Vehicles          | 9         | 9                | 9               | All wired; detail + photos added. |
| Purchases         | 3         | 3                | 3               | List, detail, create. |
| Purchase Expenses | 3         | 3                | 3               | Used on purchase detail page. |
| Sales             | 6         | 6                | 6               | List, detail, invoice, send, process. |

---

## Vehicles

| API | Implemented in UI | Location | Backend proxy |
|-----|-------------------|----------|----------------|
| `GET /api/vehicles` | Yes | `app/(protected)/vehicles/page.tsx` — list (toggle all vs available) | `app/api/vehicles/route.ts` → GET `/api/vehicles` |
| `GET /api/vehicles/{id}` | Yes | `app/(protected)/vehicles/[id]/page.tsx` — vehicle detail; linked from list "View" | `app/api/vehicles/[id]/route.ts` → GET `/api/vehicles/{id}`; response includes `photos` when returned by backend |
| `GET /api/vehicles/available` | Yes | Same vehicles page (toggle "Show Available Only"); sales page dropdown | `app/api/vehicles/available/route.ts` → GET `/api/vehicles/available` (with fallback) |
| `PUT /api/vehicles/{id}` | Yes | Vehicles list — inline Edit (price, colour, reg number) | `app/api/vehicles/[id]/route.ts` → PUT `/api/vehicles/{id}` |
| `DELETE /api/vehicles/{id}` | Yes | Vehicles list — Delete with confirm dialog | `app/api/vehicles/[id]/route.ts` → DELETE `/api/vehicles/{id}` |
| `PATCH /api/vehicles/{id}/status` | Yes | Vehicles list — "Mark Sold" / status toggle | `app/api/vehicles/[id]/status/route.ts` → PATCH `/api/vehicles/{id}/status` |
| `POST /api/vehicles/{vehicleId}/photos` | Yes | Vehicle detail page — "Upload Photos" (multipart) | `app/api/vehicles/[id]/photos/route.ts` → POST `/api/vehicles/{vehicleId}/photos` |
| `PATCH /api/vehicles/{vehicleId}/photos/{photoId}/primary` | Yes | Vehicle detail page — "Set as primary" per photo | `app/api/vehicles/[id]/photos/[photoId]/primary/route.ts` → PATCH backend |
| `DELETE /api/vehicles/photos/{photoId}` | Yes | Vehicle detail page — delete photo with confirm | `app/api/vehicles/photos/[photoId]/route.ts` → DELETE `/api/vehicles/photos/{photoId}` |

**Client helpers:** `lib/api/vehicles.ts` — `getVehicleById`, `uploadVehiclePhotos`, `setPrimaryVehiclePhoto`, `deleteVehiclePhoto`.

---

## Purchases

| API | Implemented in UI | Location | Backend proxy |
|-----|-------------------|----------|----------------|
| `POST /api/purchases` | Yes | `app/(protected)/purchases/new/page.tsx` — Create Purchase form | `app/api/purchases/route.ts` → POST `/api/purchases` |
| `GET /api/purchases` | Yes | `app/(protected)/purchases/page.tsx` — list; row click → detail | `app/api/purchases/route.ts` → GET `/api/purchases` |
| `GET /api/purchases/{id}` | Yes | `app/(protected)/purchases/[id]/page.tsx` — purchase detail | `app/api/purchases/[id]/route.ts` → GET `/api/purchases/{id}` |

**Note:** Expense endpoints use the same purchase/vehicle `id` from the detail page; backend expects `vehicleId` in path. Normalized purchase `id` is set from `row.id` or `row.vehicleId`, so if the backend uses vehicle id for the purchase record, the same id is passed correctly.

---

## Purchase Expenses

| API | Implemented in UI | Location | Backend proxy |
|-----|-------------------|----------|----------------|
| `POST /api/purchases/{vehicleId}/expenses` | Yes | Purchase detail page — "Add Expense" form | `app/api/purchases/[id]/expenses/route.ts` → POST `/api/purchases/{vehicleId}/expenses` |
| `GET /api/purchases/{vehicleId}/expenses` | Yes | Purchase detail page — list of expenses | `lib/api/purchase-expenses.ts` → GET `/api/purchases/{id}/expenses` (id = purchase/vehicle id from page) |
| `DELETE /api/purchases/expenses/{expenseId}` | Yes | Purchase detail page — Delete per expense | `app/api/purchases/expenses/[expenseId]/route.ts` → DELETE `/api/purchases/expenses/{expenseId}` |

**Client helpers:** `lib/api/purchase-expenses.ts` — `getPurchaseExpenses`, `createPurchaseExpense`, `deletePurchaseExpense`.

---

## Sales

| API | Implemented in UI | Location | Backend proxy |
|-----|-------------------|----------|----------------|
| `POST /api/sales` | Yes | `app/(protected)/sales/page.tsx` — Create Sale form | `app/api/sales/route.ts` → POST `/api/sales` |
| `GET /api/sales?pageNumber=&pageSize=&search=&fromDate=&toDate=` | Yes | `app/(protected)/sales/list/page.tsx` — paginated list with filters | `app/api/sales/route.ts` → GET `/api/sales` with `includeQuery: true` |
| `GET /api/sales/{billNumber}` | Yes | Sale detail (RSC) and server sale detail; invoice page context | `app/api/sales/[id]/route.ts` → GET `/api/sales/{billNumber}`; `getServerSaleDetail()` calls internal `/api/sales/{id}` |
| `GET /api/sales/{billNumber}/invoice` | Yes | `app/(protected)/sales/[id]/invoice/page.tsx` — invoice view | `getServerSaleInvoice()` → internal `/api/sales/{id}/invoice`; `app/api/sales/[id]/invoice/route.ts` → GET backend |
| `POST /api/sales/{billNumber}/send-invoice` | Yes | `components/layout/invoice-actions.tsx` — "Send via WhatsApp" | `app/api/sales/[id]/send-invoice/route.ts` → POST backend |
| `POST /api/sales/{billNumber}/process-invoice` | Yes | `components/layout/invoice-actions.tsx` — "Mark as Processed" | `app/api/sales/[id]/process-invoice/route.ts` → POST backend; `lib/api/sales.ts` → `processInvoice(billNumber)` |

**Client helpers:** `lib/api/sales.ts` — `processInvoice`. Other sales calls use `apiClient` or server helpers (`getServerSaleDetail`, `getServerSaleInvoice`).

---

## Backend Proxy Checklist

- All listed routes use `requireAuth(request)` and return 401 when unauthenticated.
- Vehicle, purchase, and sales routes use `fetchFromBackend` / `proxyToBackend` from `lib/backend/proxy.ts` with correct `backendPath` and method.
- Query params are forwarded where needed (e.g. GET `/api/sales` with `includeQuery: true`).
- Multipart bodies are forwarded with `forwardBody: true` (upload, vehicle photos).
- Normalization (e.g. vehicle, sale detail) is done in route handlers where applicable; GET vehicle by id now merges `photos` into the response when the backend returns them.

---

## UI Locations Quick Reference

- **Vehicles list & actions:** `/vehicles` — list, filter available, edit, delete, status, **View** → `/vehicles/[id]`.
- **Vehicle detail & photos:** `/vehicles/[id]` — GET by id, upload photos, set primary, delete photo.
- **Purchases list:** `/purchases` — list, link to detail.
- **Purchase detail & expenses:** `/purchases/[id]` — GET purchase, list/add/delete expenses.
- **New purchase:** `/purchases/new` — POST purchase (and vehicle).
- **New sale:** `/sales` — POST sale; uses GET `/vehicles/available`, customer search, finance companies, POST `/upload` for customer photo.
- **Sales history:** `/sales/list` — GET sales with pagination/filters.
- **Sale detail:** `/sales/[id]` — GET sale by bill number (RSC).
- **Invoice:** `/sales/[id]/invoice` — GET invoice, Print, Download PDF, Send via WhatsApp, **Mark as Processed**.

All of the listed APIs are integrated in the UI at the correct places and proxy to the backend correctly.
