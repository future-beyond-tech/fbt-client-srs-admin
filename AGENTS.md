# SRS Admin - Agent Documentation

> **Project**: Shree Raamalingam Sons Admin Panel  
> **Type**: Next.js full-stack web application for vehicle dealership management  
> **Language**: English (US)  

---

## Project Overview

This is a **Next.js 14** application that serves as both:
1. An **admin panel** for managing vehicle dealership operations (purchases, sales, customers, inventory)
2. A **public-facing website** showcasing available vehicles for potential buyers

The application follows a **Backend-for-Frontend (BFF)** pattern where Next.js API routes proxy requests to an external .NET backend API.

### Key Features
- **Admin Dashboard**: Dashboard stats, vehicle management, purchase tracking, sales processing
- **Sales Management**: Create sales, generate invoices, print delivery notes
- **Customer Management**: Customer database with photo support
- **Inventory Management**: Vehicle photos, status tracking (Available/Sold)
- **Public Website**: Landing page, vehicle listings, individual vehicle details
- **Authentication**: JWT-based auth with httpOnly cookies

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 14.2.5 |
| Runtime | React | 18.2.0 |
| Language | TypeScript | 5.6.3 |
| Styling | Tailwind CSS | 3.4.14 |
| UI Components | Custom (cva-based) | - |
| Forms | React Hook Form | 7.53.1 |
| Validation | Zod | 3.23.8 |
| HTTP Client | Axios | 1.7.7 |
| JWT Handling | jose | 5.9.6 |
| Icons | lucide-react | 0.462.0 |
| PDF Generation | jspdf + html2canvas | - |

---

## Project Structure

```
app/
├── (protected)/           # Route group: Admin pages (requires auth)
│   ├── customers/         # Customer management
│   ├── dashboard/         # Dashboard with stats
│   ├── purchases/         # Vehicle purchase tracking
│   ├── sales/             # Sales creation and history
│   ├── search/            # Sale search functionality
│   ├── settings/          # Delivery note settings
│   ├── vehicles/          # Vehicle inventory
│   └── layout.tsx         # Admin shell layout
├── (public)/              # Route group: Public website
│   ├── contact/           # Contact page
│   ├── listings/          # Vehicle listings
│   ├── vehicle/           # Individual vehicle details
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Public layout
│   └── PublicHeader.tsx   # Public navigation
├── api/                   # Next.js API routes (BFF pattern)
│   ├── auth/              # Login/logout endpoints
│   ├── customers/         # Customer API proxy
│   ├── vehicles/          # Vehicle API proxy
│   ├── purchases/         # Purchase API proxy
│   ├── sales/             # Sales API proxy
│   ├── public/            # Public API (no auth)
│   └── ...
├── layout.tsx             # Root layout
├── login/                 # Login page
└── globals.css            # Global styles + Tailwind

components/
├── ui/                    # Reusable UI components (Button, Input, Card, etc.)
├── layout/                # Layout components (AdminShell, etc.)
├── providers/             # React context providers
└── public/                # Public site components

lib/
├── api/                   # API client functions
├── auth/                  # Authentication utilities
├── backend/               # Backend proxy utilities
├── validations/           # Zod schemas
├── types.ts               # Shared TypeScript types
├── types/public.ts        # Public-facing DTOs
├── constants.ts           # App constants
└── utils.ts               # Utility functions

services/
└── publicVehicleService.ts # Server-side vehicle fetching

data/
└── db.json                # Local data store (minimal usage)
```

---

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

---

## Environment Configuration

Create `.env.local` in the project root:

```bash
# Required: Backend API URL
EXTERNAL_API_URL=http://localhost:5253

# Optional: JWT secrets (for token signing/verification)
JWT_SECRET=your-internal-secret
EXTERNAL_JWT_SECRET=your-external-secret  # For external token verification
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `EXTERNAL_API_URL` | Yes | Base URL of the .NET backend API |
| `JWT_SECRET` | No | Internal JWT signing secret (has default) |
| `EXTERNAL_JWT_SECRET` | No | External JWT verification secret |

---

## Architecture Patterns

### 1. Route Groups
The app uses Next.js Route Groups to separate concerns:
- `(protected)/` - All admin routes requiring authentication
- `(public)/` - Public-facing website routes

### 2. Backend-for-Frontend (BFF) Pattern
All external API calls go through Next.js API routes:
- Client → `/api/vehicles` (Next.js) → `EXTERNAL_API_URL/api/vehicles` (.NET backend)
- This enables request/response transformation, auth token forwarding, and error handling

### 3. Authentication Flow
1. User logs in via `/api/auth/login`
2. Token stored in httpOnly cookie (`srs_token`)
3. Middleware (`middleware.ts`) checks token on protected routes
4. API routes extract token from cookie and forward to backend
5. 401 responses trigger client-side redirect to login

### 4. Dual JWT Secret Support
The auth system supports both internally-signed tokens and external tokens (e.g., from Microsoft Identity):
- Tries internal secret first
- Falls back to `EXTERNAL_JWT_SECRET` if configured
- Normalizes Microsoft-style claims (`unique_name`, `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`)

---

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - All strict TypeScript options are on
- Use explicit return types for public functions
- Prefer `interface` over `type` for object shapes
- Use enums for discrete values with UI representations

### Naming Conventions
- **Components**: PascalCase (`AdminShell.tsx`)
- **Hooks**: camelCase starting with `use` (`useAuth.ts`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Types/Interfaces**: PascalCase with descriptive names

### Component Patterns
- Use `"use client"` directive for client components only when necessary
- Prefer Server Components by default
- Use `cva` (class-variance-authority) for variant-based components
- Compose classes with `cn()` utility (clsx + tailwind-merge)

### Styling (Tailwind)
- Use custom CSS variables for theming (defined in `globals.css`)
- Custom utility classes:
  - `.srs-container` - Responsive container
  - `.srs-page-title` - Page heading style
  - `.card-surface` - Card with shadow
  - `.min-h-touch` - Minimum touch target (44px)
- Mobile-first responsive design
- Respect `prefers-reduced-motion`

---

## API Integration

### Backend API Contract
The external backend is a .NET API. Key conventions:
- **PaymentMode**: 1=Cash, 2=UPI, 3=Finance
- **VehicleStatus**: 1=Available, 2=Sold
- **Dates**: ISO 8601 format
- **Auth**: Bearer token in Authorization header

### API Client Usage
```typescript
// Client-side API calls
import apiClient from "@/lib/api/client";

const response = await apiClient.get("/vehicles");
```

### Backend Proxy Helpers
```typescript
// Server-side API routes
import { proxyToBackend } from "@/lib/backend/proxy";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    method: "GET",
    backendPath: "/api/vehicles",
  });
}
```

---

## Testing

Currently, the project does not have automated tests configured. Testing is primarily manual.

### Manual Testing Checklist
- [ ] Login/logout flow
- [ ] Vehicle CRUD operations
- [ ] Purchase creation
- [ ] Sales workflow with invoice generation
- [ ] Customer management
- [ ] Public site vehicle display
- [ ] Mobile responsiveness
- [ ] Print invoice functionality

---

## Security Considerations

### Authentication
- JWT tokens stored in httpOnly cookies (not localStorage)
- 8-hour token expiration
- Middleware protects routes at the edge
- Automatic redirect to login on 401

### API Security
- All admin API routes require authentication via `requireAuth()`
- Tokens forwarded to backend for verification
- No sensitive data in client-side code

### Input Validation
- Zod schemas for all form inputs
- Server-side validation on API routes
- Type-safe API contracts

---

## Common Tasks

### Adding a New Admin Page
1. Create folder in `app/(protected)/new-feature/`
2. Add `page.tsx` with Server Component
3. Add API routes in `app/api/new-feature/`
4. Add client lib in `lib/api/new-feature.ts`
5. Add types to `lib/types.ts`

### Adding a New API Route
1. Create `app/api/feature/route.ts`
2. Use `requireAuth()` for protected routes
3. Use `proxyToBackend()` for simple proxy
4. Use `fetchFromBackend()` for response transformation

### Adding UI Components
1. Create in `components/ui/ComponentName.tsx`
2. Use `cva` for variants
3. Use `cn()` for class composition
4. Export from file, no barrel exports

---

## Documentation References

- `API_DOCUMENTATION.md` - Complete backend API documentation
- `openapi.json` - OpenAPI 3.0 specification
- `README.md` - Basic setup instructions

---

## Troubleshooting

### Backend Connection Issues
- Verify `EXTERNAL_API_URL` is set correctly
- Check backend is running on the specified port
- Check CORS configuration on backend

### Authentication Issues
- Clear cookies and localStorage
- Check JWT secrets match between frontend and backend
- Verify token format (internal vs external)

### Build Issues
- Delete `.next/` and `node_modules/` and reinstall
- Check for TypeScript errors with `npm run lint`
- Verify Node.js version compatibility
