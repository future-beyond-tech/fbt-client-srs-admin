Full API Integration Audit & Implementation

```markdown
# Task: Complete API Integration Audit & Implementation

## Context
You are working on a Second Hand Car Resale System (SRS) with a .NET backend API and a frontend application. Your task is to ensure EVERY backend API endpoint is properly integrated into the frontend at the correct location with proper UI/UX.

## Backend API Specification (OpenAPI 3.0)

### Authentication
- `POST /api/auth/login` - JWT Bearer token authentication

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - List all customers
- `GET /api/customers/{id}` - Get customer by ID (UUID)
- `GET /api/customers/search?phone={phone}` - Search by phone

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/{id}` - Get vehicle by ID
- `GET /api/vehicles/available` - List available vehicles only
- `PUT /api/vehicles/{id}` - Update vehicle (price, color, reg number)
- `DELETE /api/vehicles/{id}` - Delete vehicle
- `PATCH /api/vehicles/{id}/status` - Update vehicle status (Available=1, Sold=2)
- `POST /api/vehicles/{vehicleId}/photos` - Upload multiple photos (multipart/form-data)
- `PATCH /api/vehicles/{vehicleId}/photos/{photoId}/primary` - Set primary photo
- `DELETE /api/vehicles/photos/{photoId}` - Delete specific photo

### Purchases
- `POST /api/purchases` - Create new purchase (also creates vehicle)
- `GET /api/purchases` - List all purchases
- `GET /api/purchases/{id}` - Get purchase details

### Purchase Expenses
- `POST /api/purchases/{vehicleId}/expenses` - Add expense to purchase
- `GET /api/purchases/{vehicleId}/expenses` - List expenses for purchase
- `DELETE /api/purchases/expenses/{expenseId}` - Delete expense

### Sales
- `POST /api/sales` - Create sale transaction
- `GET /api/sales?pageNumber={n}&pageSize={n}&search={text}&fromDate={iso}&toDate={iso}` - Paginated list with filters
- `GET /api/sales/{billNumber}` - Get sale by bill number
- `GET /api/sales/{billNumber}/invoice` - Get invoice PDF/data
- `POST /api/sales/{billNumber}/send-invoice` - Email/send invoice
- `POST /api/sales/{billNumber}/process-invoice` - Process/mark invoice

### Finance Companies
- `POST /api/finance-companies` - Create finance company
- `GET /api/finance-companies` - List all finance companies
- `DELETE /api/finance-companies/{id}` - Delete finance company

### Settings
- `GET /api/settings/delivery-note` - Get delivery note settings
- `PUT /api/settings/delivery-note` - Update delivery note settings

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics/metrics

### Search
- `GET /api/search?q={query}` - Global search across entities

### Upload
- `POST /api/upload` - Generic file upload (multipart/form-data)

## Your Mission

### Phase 1: AUDIT (Do this first - do not skip)

Create a comprehensive audit report in this format:

```
## API Integration Audit Report

### 1. Authentication
- [ ] Login page implemented
- [ ] Token stored securely (localStorage/httpOnly cookie)
- [ ] Axios/fetch interceptors configured with Bearer token
- [ ] Auto-redirect to login on 401
- [ ] Logout functionality

### 2. Customers Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| POST /api/customers | [ ] | | |
| GET /api/customers | [ ] | | |
| GET /api/customers/{id} | [ ] | | |
| GET /api/customers/search | [ ] | | |

### 3. Vehicles Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| GET /api/vehicles | [ ] | | |
| GET /api/vehicles/{id} | [ ] | | |
| GET /api/vehicles/available | [ ] | | |
| PUT /api/vehicles/{id} | [ ] | | |
| DELETE /api/vehicles/{id} | [ ] | | |
| PATCH /api/vehicles/{id}/status | [ ] | | |
| POST /api/vehicles/{id}/photos | [ ] | | |
| PATCH /api/vehicles/{id}/photos/{id}/primary | [ ] | | |
| DELETE /api/vehicles/photos/{id} | [ ] | | |

### 4. Purchases Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| POST /api/purchases | [ ] | | |
| GET /api/purchases | [ ] | | |
| GET /api/purchases/{id} | [ ] | | |

### 5. Purchase Expenses Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| POST /api/purchases/{id}/expenses | [ ] | | |
| GET /api/purchases/{id}/expenses | [ ] | | |
| DELETE /api/purchases/expenses/{id} | [ ] | | |

### 6. Sales Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| POST /api/sales | [ ] | | |
| GET /api/sales (paginated) | [ ] | | |
| GET /api/sales/{billNumber} | [ ] | | |
| GET /api/sales/{billNumber}/invoice | [ ] | | |
| POST /api/sales/{billNumber}/send-invoice | [ ] | | |
| POST /api/sales/{billNumber}/process-invoice | [ ] | | |

### 7. Finance Companies Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| POST /api/finance-companies | [ ] | | |
| GET /api/finance-companies | [ ] | | |
| DELETE /api/finance-companies/{id} | [ ] | | |

### 8. Settings Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| GET /api/settings/delivery-note | [ ] | | |
| PUT /api/settings/delivery-note | [ ] | | |

### 9. Dashboard Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| GET /api/dashboard | [ ] | | |

### 10. Search Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| GET /api/search | [ ] | | |

### 11. Upload Module
| API | Implemented | Location | Missing Features |
|-----|-------------|----------|------------------|
| POST /api/upload | [ ] | | |

### Summary
- Total Endpoints: 35
- Implemented: X
- Missing: X
- Coverage: X%
```

### Phase 2: IMPLEMENTATION REQUIREMENTS

For each missing or incomplete endpoint, implement with these specifications:

#### A. API Service Layer (services/api.ts or similar)
Create/update API functions with EXACT types:

```typescript
// Example pattern to follow:
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  // Add other fields from actual API response
}

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> => 
    api.post('/api/auth/login', data),
};

// Vehicle interfaces
export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  chassisNumber: string;
  engineNumber: string;
  colour: string;
  sellingPrice: number;
  status: 1 | 2; // 1=Available, 2=Sold
  photos?: VehiclePhoto[];
}

export interface VehiclePhoto {
  id: number;
  url: string;
  isPrimary: boolean;
}

export interface PurchaseCreateDto {
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  chassisNumber: string;
  engineNumber: string;
  colour: string;
  sellingPrice: number;
  sellerName: string;
  sellerPhone: string;
  sellerAddress: string;
  buyingCost: number;
  expense: number;
  purchaseDate: string; // ISO 8601
}

export interface SaleCreateDto {
  vehicleId: number;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerPhotoUrl?: string;
  paymentMode: 1 | 2 | 3; // Cash=1, UPI=2, Finance=3
  cashAmount?: number;
  upiAmount?: number;
  financeAmount?: number;
  financeCompany?: string;
  rcBookReceived: boolean;
  ownershipTransferAccepted: boolean;
  vehicleAcceptedInAsIsCondition: boolean;
  saleDate: string; // ISO 8601
}

// Add ALL other interfaces from OpenAPI spec
```

#### B. State Management
- Use React Query (TanStack Query) for server state
- Implement proper caching strategies
- Handle loading, error, and success states
- Implement optimistic updates where appropriate

#### C. UI/UX Requirements

**For Lists (GET all):**
- Table with sorting (click headers)
- Pagination (if applicable)
- Search/filter functionality
- Loading skeletons
- Empty states
- Error boundaries
- Refresh capability

**For Details (GET by ID):**
- Full detail view with all fields
- Image galleries with lightbox
- Status badges (color coded)
- Action buttons (Edit, Delete, Print)
- Breadcrumb navigation

**For Forms (POST/PUT/PATCH):**
- Form validation (required fields, formats)
- Field-specific validation (phone regex, date validation)
- File uploads with progress indicators
- Image previews before upload
- Multi-select for enums
- Auto-save drafts
- Success/error toasts
- Dirty form warnings on navigation

**For Search:**
- Debounced input (300ms)
- Highlight matching results
- Filter chips/tags
- Recent searches
- Empty search states

**For Dashboard:**
- KPI cards with trends
- Charts (recharts or chart.js)
- Recent activity feed
- Quick action buttons
- Real-time updates (if applicable)

#### D. Page Structure Requirements

Map APIs to specific routes:

```
/auth/login - Login page
/dashboard - Dashboard with GET /api/dashboard

/vehicles
  / - List all vehicles (GET /api/vehicles)
  /available - Available only (GET /api/vehicles/available)
  /:id - Vehicle detail (GET /api/vehicles/:id)
  /:id/edit - Edit vehicle (PUT /api/vehicles/:id)
  /new - Create purchase (POST /api/purchases) [Redirects to vehicle after]

/purchases
  / - List purchases (GET /api/purchases)
  /:id - Purchase detail (GET /api/purchases/:id)
  /:id/expenses - Manage expenses (POST/GET/DELETE expenses)

/sales
  / - List sales with filters (GET /api/sales)
  /new - Create sale (POST /api/sales)
  /:billNumber - Sale detail (GET /api/sales/:billNumber)
  /:billNumber/invoice - View invoice (GET /api/sales/:billNumber/invoice)
  /:billNumber/invoice/send - Send invoice action

/customers
  / - List (GET /api/customers)
  /search - Phone search (GET /api/customers/search)
  /:id - Detail (GET /api/customers/:id)

/finance-companies
  / - List & Manage (GET, POST, DELETE)

/settings
  /delivery-note - Configure (GET, PUT)

/search - Global search results (GET /api/search)
```

### Phase 3: IMPLEMENTATION CHECKLIST

For each endpoint, verify:

- [ ] **Request Shape**: Matches OpenAPI schema exactly (field names, types, required)
- [ ] **Response Handling**: Parses all response fields, handles nulls
- [ ] **Error Handling**: 400 validation errors, 401 auth, 404 not found, 500 server errors
- [ ] **Loading States**: Skeletons, spinners, disable buttons during submit
- [ ] **Success Feedback**: Toast notifications, redirect logic
- [ ] **File Uploads**: Multipart/form-data, progress tracking, multiple files
- [ ] **Image Handling**: Gallery view, primary photo selection, delete with confirmation
- [ ] **Date Handling**: ISO 8601 format, timezone aware, date pickers
- [ ] **Currency**: Proper formatting (INR ₹), decimal handling
- [ ] **Phone Validation**: Indian format (+91 or 10 digits)
- [ ] **Responsive**: Mobile, tablet, desktop layouts
- [ ] **Accessibility**: ARIA labels, keyboard navigation, focus management

### Phase 4: TESTING SCENARIOS

Implement these test flows:

1. **Happy Path**: Login → Add Purchase → Add Photos → Create Sale → Generate Invoice
2. **Customer Search**: Search existing customer by phone during sale creation
3. **Finance Sale**: Create sale with finance company, verify amounts
4. **Expense Tracking**: Add multiple expenses to purchase, verify totals
5. **Settings Update**: Modify delivery note settings, verify on next invoice
6. **Error Recovery**: Network failure during upload, retry mechanism

## Deliverables

1. **Audit Report** (Markdown table format)
2. **Updated API Service Layer** with all endpoints typed
3. **New/Updated Pages** with full UI/UX implementation
4. **Component Library** additions (if needed):
   - DataTable with sorting/pagination
   - ImageGallery with upload/primary selection
   - SearchInput with debounce
   - StatCards for dashboard
   - FormBuilder with validation
   - FileUploader with drag-drop
5. **Route Configuration** updates
6. **Environment Configuration** for API base URL

## Critical Rules

1. **NEVER** modify backend API contracts - adapt frontend to match exactly
2. **ALWAYS** handle loading and error states - no silent failures
3. **USE** TypeScript strict types - no `any` types for API data
4. **IMPLEMENT** optimistic updates for better UX
5. **CACHE** appropriately with React Query
6. **VALIDATE** both client-side and handle server validation errors
7. **FORMAT** dates as DD-MM-YYYY for display, ISO for API
8. **FORMAT** currency with ₹ symbol and Indian number format (1,00,000)
9. **CONFIRM** destructive actions (delete) with modal dialog
10. **IMPLEMENT** proper image fallbacks for broken URLs

## Current Project Structure

Analyze the existing codebase and match the pattern:
- Check existing API calls in `services/` or `api/` folder
- Check state management (Redux/Zustand/Context/React Query)
- Check UI library (Material-UI/Ant Design/Tailwind/Chakra)
- Check routing (React Router/Next.js)
- Check form handling (React Hook Form/Formik)

Maintain consistency with existing patterns while filling gaps.

Start with Phase 1 Audit now. Report findings before proceeding to implementation.
```



