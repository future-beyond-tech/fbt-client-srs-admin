# Manual Billing — Frontend ↔ Backend Integration Plan

**Scope:** End-to-end Manual Billing from Admin UI (fbt-client-srs-admin) to .NET API (fbt-client-srs-service). No secrets in repo; no PII in logs.

---

## A) Backend (fbt-client-srs-service) — Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `POST /api/manual-bills` | POST | JWT Bearer, Admin | Create manual bill. Returns `{ billNumber, pdfUrl?, createdAt }`. |
| `GET /api/manual-bills/{billNumber}` | GET | JWT Bearer, Admin | Get bill details (optional for UI). |
| `GET /api/manual-bills/{billNumber}/pdf` | GET | JWT Bearer, Admin | **`?download=true`** → PDF bytes; else JSON `{ pdfUrl }`. |
| `POST /api/manual-bills/{billNumber}/send-invoice` | POST | JWT Bearer, Admin | Generate PDF (if needed), upload, send WhatsApp. Returns `{ billNumber, pdfUrl, status }`. |
| `POST /api/upload` | POST | JWT Bearer, Admin | Multipart photo upload. Returns `{ url }`. Use for manual bill photo before create. |

**Auth:** JWT Bearer in `Authorization` header. No tenant/shop in URL; delivery note settings (shop name/address) are singleton.

**Create DTO (camelCase over wire):**  
`customerName`, `phone`, `address?`, `photoUrl`, `sellerName?`, `itemDescription`, `chassisNumber?`, `engineNumber?`, `color?`, `notes?`, `amountTotal`, `paymentMode` (1=Cash, 2=UPI, 3=Finance), `cashAmount?`, `upiAmount?`, `financeAmount?`, `financeCompany?`.  
Payment split must sum to `amountTotal`. `PhotoUrl` required (use `/api/upload` first).

**Risks:**  
- **Phone:** Backend normalizes to E.164 (+91…). Frontend already uses `normalizePhoneIndia`; ensure 10 digits or +91.  
- **PDF:** Without `?download=true` backend returns JSON; BFF and client must use `?download=true` for PDF bytes.  
- **Create payload:** Frontend currently sends `totalAmount`; backend expects `amountTotal`. Send `amountTotal` and derive `paymentMode` (and optional `financeCompany`) from form.

---

## B) Frontend (fbt-client-srs-admin) — Summary

| Area | Status | Notes |
|------|--------|--------|
| **Page** | `app/(protected)/manual-billing/page.tsx` | Create form, photo upload/camera, actions (Print, Download PDF, Send WhatsApp). |
| **BFF routes** | `app/api/manual-bills/*` | POST create, GET pdf, POST send-invoice exist. PDF route does **not** pass `?download=true`. |
| **API client** | `lib/api/manual-bills.ts` | createManualBill, uploadPhoto, sendManualBillInvoice, getManualBillPdfUrl (latter broken: no `?download=true`, expects blob). |
| **Upload** | `app/api/upload/route.ts` | Proxies to backend `POST /api/upload`. |
| **Blueprint** | Sales: `lib/api/sales.ts` (getSalesInvoicePdfBlob), `components/layout/invoice-actions.tsx` | Download = GET pdf with blob; Print = open `/api/sales/{id}/pdf` in new tab. |

**Gaps:**  
1. BFF GET `.../pdf` must forward query and call backend with `?download=true` when client wants PDF bytes.  
2. Client: add `downloadManualBillPdf(billNumber)` that GETs `.../pdf?download=true` with `responseType: 'blob'` and returns `Blob`; use for Download.  
3. Create payload: map form to backend shape (`amountTotal`, `paymentMode`, optional `sellerName`, `financeCompany`, etc.).  
4. Optional: GET `manual-bills/[billNumber]` route if UI ever needs bill details.

---

## C) Implementation Slices

**Phase 1 — BFF (no UI)**  
- Ensure GET `app/api/manual-bills/[billNumber]/pdf/route.ts` forwards query and calls backend with `?download=true` when requesting PDF file (e.g. when `request.nextUrl.searchParams.get('download') === 'true'` or always for this route so that opening in new tab and client download both get bytes).  
- Add GET `app/api/manual-bills/[billNumber]/route.ts` (proxy to backend) if we want details elsewhere.

**Phase 2 — API client**  
- Add `downloadManualBillPdf(billNumber): Promise<Blob>` that GETs `/api/manual-bills/{billNumber}/pdf?download=true` with `responseType: 'blob'`.  
- Keep `getManualBillPdfUrl` for redirect/open-in-tab use, or replace Print with same PDF URL + `?download=true`.  
- Ensure create payload: build backend shape (`amountTotal`, `paymentMode`, `sellerName?`, `financeCompany?`, etc.) from form; keep using existing `createManualBill` and `uploadPhoto`.

**Phase 3 — UI**  
- Create form: ensure payload includes `amountTotal`, derived `paymentMode`, optional `sellerName`, `financeCompany` when finance checked; optional fields (chassisNumber, engineNumber, color, notes) can be added later or left null.  
- After create: Download PDF → call `downloadManualBillPdf(billNumber)` and trigger file download.  
- Print → open `/api/manual-bills/{billNumber}/pdf?download=true` in new tab.  
- Send WhatsApp → already calls `sendManualBillInvoice`; no change.  
- Normalize `billNumber` from response (number → string) for state/URLs.

**Phase 4 — E2E checks**  
- Create manual bill (with/without sellerName, with payment split + finance name).  
- Download PDF → 200, `application/pdf`, filename; open and confirm Tamil block + seller.  
- Print → new tab shows PDF.  
- Send WhatsApp → 200, `{ billNumber, pdfUrl, status }`.  
- No PII in logs; no secrets in repo.

---

## D) Minimal DTO Mappings (Frontend → Backend)

- `totalAmount` → `amountTotal`  
- Derive `paymentMode`: if `financeAmount > 0` → 3, else if `upiAmount > 0` → 2, else → 1.  
- `financeCompany` → send when `paymentMode === 3` and user entered name (optional).  
- `sellerName` → optional; backend defaults to delivery note shop name.  
- All other fields: map 1:1 (camelCase); null/empty for optional.

---

## E) Files to Touch

| Phase | File | Change |
|-------|------|--------|
| 1 | `fbt-client-srs-admin/app/api/manual-bills/[billNumber]/pdf/route.ts` | Forward query; call backend with `?download=true` for PDF bytes. |
| 1 | `fbt-client-srs-admin/app/api/manual-bills/[billNumber]/route.ts` | Add GET proxy for bill details (optional). |
| 2 | `fbt-client-srs-admin/lib/api/manual-bills.ts` | Add `downloadManualBillPdf(billNumber)`; fix create payload shape in page or here. |
| 3 | `fbt-client-srs-admin/app/(protected)/manual-billing/page.tsx` | Build create payload (amountTotal, paymentMode, financeCompany, sellerName); use `downloadManualBillPdf` for Download; open `?download=true` for Print; ensure billNumber string. |

---

**Risks (recap):** Auth (JWT forwarded by BFF); phone normalization (+91); photo required (upload first); PDF only when `download=true`.

---

## Phase 4 — E2E Testing Checklist

- **A) Create without sellerName:** Submit form with seller name empty → PDF shows shop name (from delivery note settings) as seller.
- **B) Create with sellerName:** Enter seller name → PDF shows that value as seller.
- **C) Payment:** Cash only → PDF shows cash checked; Finance + finance company name → PDF shows finance name.
- **D) Tamil terms:** Open generated PDF → confirm all 4 Tamil lines are present.
- **E) Network:** Click "Download PDF" → request is `GET /api/manual-bills/{billNumber}/pdf?download=true` → response `Content-Type: application/pdf`, file downloads with filename.
- **F) Print:** Click "Print / Open PDF" → new tab opens same URL with `?download=true` → PDF loads (not JSON).
- **G) Send WhatsApp:** Click "Send via WhatsApp" → `POST .../send-invoice` → 200, response has `billNumber`, `pdfUrl`, `status`.

**Deliver:** Short test notes, screenshots of UI + PDF, any remaining TODOs. No PII in logs; no secrets in repo.
