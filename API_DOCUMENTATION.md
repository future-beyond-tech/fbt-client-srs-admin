# SRS (Sales & Revenue System) - Complete API Documentation

**Generated:** February 20, 2026  
**Version:** 1.1  
**Last Updated:** February 20, 2026

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Customer Endpoints](#customer-endpoints)
3. [Purchase Endpoints](#purchase-endpoints)
4. [Vehicle Endpoints](#vehicle-endpoints)
5. [Sales Endpoints](#sales-endpoints)
6. [Search Endpoints](#search-endpoints)
7. [Dashboard Endpoints](#dashboard-endpoints)
8. [Upload Endpoints](#upload-endpoints)
9. [Error Handling](#error-handling)
10. [Enums Reference](#enums-reference)
11. [Authentication](#authentication)
12. [Best Practices](#best-practices)

---

## Authentication Endpoints

### POST /api/auth/login

#### Endpoint Name
User Login

#### HTTP Method
`POST`

#### Route URL
`/api/auth/login`

#### Short Description
Authenticates a user and returns a JWT token for subsequent API requests.

#### Detailed Description
This endpoint validates user credentials (username and password) against the system. Upon successful authentication, a JWT bearer token is generated which must be included in subsequent requests to access protected endpoints. The token has a limited lifetime and must be refreshed or re-obtained by logging in again.

#### Authentication Requirement
**No** - This is a public endpoint required to obtain authentication tokens.

---

#### Request Section

**Content-Type:** `application/json`

##### Request Body JSON Example
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```

##### Request Fields Table

| Field Name | Data Type | Required | Default Value | Validation Rules | Description |
|---|---|---|---|---|---|
| `username` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string | The username of the user attempting to log in |
| `password` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string | The plaintext password associated with the username |

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Authentication Response**

```json
{
  "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFkbWluIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `Token` | String | No | A valid JWT bearer token for authenticating subsequent API requests |

---

##### Status Code: 401 (Unauthorized)

**Invalid Credentials Response**

```json
{
  "message": "Invalid credentials"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `message` | String | No | Error message indicating authentication failure |

---

#### Edge Cases
- Username not found in the system
- Password does not match the stored hash
- User account may be inactive or locked (if applicable)

#### Business Rules
- Credentials are case-sensitive
- Passwords are hashed and never stored in plaintext
- Token expiration is based on JWT issuer settings
- Failed login attempts may trigger rate limiting (if implemented)

#### Side Effects
- Creates audit log entries for login attempts
- Token is generated server-side with user claims
- No database modification occurs

#### Idempotent or Not
**Not Idempotent** - Multiple identical requests with correct credentials return the same token, but invalid credentials consistently return 401.

---

## Customer Endpoints

### POST /api/customers

#### Endpoint Name
Create Customer

#### HTTP Method
`POST`

#### Route URL
`/api/customers`

#### Short Description
Creates a new customer record in the system.

#### Detailed Description
Adds a new customer with basic contact and address information. This endpoint is used to register customers before they can purchase vehicles. The customer record is essential for tracking sales and maintaining customer relationships.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Request Body JSON Example
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "address": "123 Main Street, City, State 12345"
}
```

##### Request Fields Table

| Field Name | Data Type | Required | Default Value | Validation Rules | Description |
|---|---|---|---|---|---|
| `name` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string, max length varies | Full name of the customer |
| `phone` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string, valid phone format | Primary contact phone number |
| `address` | String (C#: `string?`, JSON: `string`) | Optional | `null` | Max length varies | Residential or business address |

---

#### Response Section

##### Status Code: 201 (Created)

**Successful Creation Response**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "phone": "9876543210",
  "address": "123 Main Street, City, State 12345",
  "photoUrl": null,
  "createdAt": "2026-02-20T10:30:00Z"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | GUID (UUID) | No | Unique identifier for the customer |
| `name` | String | No | Customer's full name |
| `phone` | String | No | Customer's phone number |
| `address` | String | Yes | Customer's address |
| `photoUrl` | String | Yes | URL to customer's profile photo |
| `createdAt` | DateTime (ISO 8601) | No | Timestamp when the customer was created |

---

##### Status Code: 400 (Bad Request)

**Validation Error Response**

```json
{
  "message": "Phone number is required"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `message` | String | No | Specific validation error message |

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Duplicate phone numbers may exist (no unique constraint enforced at endpoint level)
- Empty strings passed for required fields
- Special characters in phone number field
- Very long address strings
- Missing Authorization header

#### Business Rules
- Phone number serves as a primary identifier for customer lookup
- Customer can be created without a photo (optional field)
- Address is optional but recommended for delivery purposes
- Multiple customers can have the same name

#### Side Effects
- Creates a new record in the Customers table
- Generates a unique GUID for customer identification
- Records creation timestamp

#### Idempotent or Not
**Not Idempotent** - Each request creates a new customer record; identical requests with the same data create duplicate customers.

---

### GET /api/customers

#### Endpoint Name
Get All Customers

#### HTTP Method
`GET`

#### Route URL
`/api/customers`

#### Short Description
Retrieves a list of all customers in the system.

#### Detailed Description
Fetches all customer records from the database. This is a simple retrieval endpoint without pagination or filtering. Use with caution on systems with large numbers of customers.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Query Parameters
None

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main Street, City, State 12345",
    "photoUrl": "https://storage.example.com/customers/550e8400.jpg",
    "createdAt": "2026-02-20T10:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jane Smith",
    "phone": "9876543211",
    "address": null,
    "photoUrl": null,
    "createdAt": "2026-02-20T11:15:00Z"
  }
]
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | GUID (UUID) | No | Unique identifier for the customer |
| `name` | String | No | Customer's full name |
| `phone` | String | No | Customer's phone number |
| `address` | String | Yes | Customer's address |
| `photoUrl` | String | Yes | URL to customer's profile photo |
| `createdAt` | DateTime (ISO 8601) | No | Timestamp when the customer was created |

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- No customers exist in the system (returns empty array)
- Large dataset causing slow response times
- Missing Authorization header

#### Business Rules
- Returns all customers regardless of status
- No pagination implemented
- Results may not be sorted in any guaranteed order

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests return the same data.

---

### GET /api/customers/{id}

#### Endpoint Name
Get Customer by ID

#### HTTP Method
`GET`

#### Route URL
`/api/customers/{id}`

#### Short Description
Retrieves a specific customer by their unique identifier.

#### Detailed Description
Fetches detailed information for a single customer identified by their GUID. Returns full customer details including optional address and photo URL.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Route Parameters

| Parameter Name | Data Type | Required | Format | Description |
|---|---|---|---|---|
| `id` | GUID | Mandatory | UUID format (e.g., `550e8400-e29b-41d4-a716-446655440000`) | The unique identifier of the customer to retrieve |

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "phone": "9876543210",
  "address": "123 Main Street, City, State 12345",
  "photoUrl": "https://storage.example.com/customers/550e8400.jpg",
  "createdAt": "2026-02-20T10:30:00Z"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | GUID (UUID) | No | Unique identifier for the customer |
| `name` | String | No | Customer's full name |
| `phone` | String | No | Customer's phone number |
| `address` | String | Yes | Customer's address |
| `photoUrl` | String | Yes | URL to customer's profile photo |
| `createdAt` | DateTime (ISO 8601) | No | Timestamp when the customer was created |

---

##### Status Code: 404 (Not Found)

**Customer Not Found Response**

```json
{
  "message": "Not Found"
}
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Invalid GUID format provided
- Non-existent customer ID
- Missing Authorization header

#### Business Rules
- Returns only the requested customer if found
- GUID must be in valid UUID format

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests with the same valid ID return the same customer data.

---

### GET /api/customers/search

#### Endpoint Name
Search Customers by Phone

#### HTTP Method
`GET`

#### Route URL
`/api/customers/search`

#### Short Description
Searches for customers by phone number.

#### Detailed Description
Finds customer records matching the provided phone number. This is useful for quick lookups during sales transactions to retrieve existing customer information.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Query Parameters

| Parameter Name | Data Type | Required | Format | Description |
|---|---|---|---|---|
| `phone` | String | Mandatory | Valid phone number string | The phone number to search for |

##### Example Query
```
GET /api/customers/search?phone=9876543210
```

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Search Response**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main Street, City, State 12345",
    "photoUrl": "https://storage.example.com/customers/550e8400.jpg",
    "createdAt": "2026-02-20T10:30:00Z"
  }
]
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | GUID (UUID) | No | Unique identifier for the customer |
| `name` | String | No | Customer's full name |
| `phone` | String | No | Customer's phone number |
| `address` | String | Yes | Customer's address |
| `photoUrl` | String | Yes | URL to customer's profile photo |
| `createdAt` | DateTime (ISO 8601) | No | Timestamp when the customer was created |

---

##### Status Code: 200 (OK) - No Results

**Empty Search Result Response**

```json
[]
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- No customers found with the provided phone number
- Partial phone number matching (depends on implementation)
- Special characters in phone number
- Empty phone parameter
- Missing Authorization header

#### Business Rules
- Search is performed on the phone field only
- May support partial matches or exact matches (implementation-dependent)
- Returns all matching customers

#### Side Effects
- No database modifications
- May log search queries for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical search requests return the same results.

---

## Purchase Endpoints

### POST /api/purchases

#### Endpoint Name
Create Purchase

#### HTTP Method
`POST`

#### Route URL
`/api/purchases`

#### Short Description
Records a vehicle purchase transaction in the system.

#### Detailed Description
Creates a new purchase record when the business acquires a vehicle from a seller. This captures detailed information about the vehicle, seller details, purchase date, and financial data (buying cost and expenses). The vehicle becomes available for sale after a purchase is recorded.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Request Body JSON Example
```json
{
  "brand": "Toyota",
  "model": "Fortuner",
  "year": 2022,
  "registrationNumber": "DL-01-AB-1234",
  "chassisNumber": "JTMFA5C10D5001234",
  "engineNumber": "2TR5E-1234567",
  "colour": "Silver",
  "sellingPrice": 2500000.00,
  "sellerName": "Rajesh Kumar",
  "sellerPhone": "9123456789",
  "sellerAddress": "456 Seller Street, City",
  "buyingCost": 2000000.00,
  "expense": 50000.00,
  "purchaseDate": "2026-02-20T10:30:00Z"
}
```

##### Request Fields Table

| Field Name | Data Type | Required | Default Value | Validation Rules | Description |
|---|---|---|---|---|---|
| `brand` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string | Vehicle brand/manufacturer name (e.g., Toyota, Maruti, Hyundai) |
| `model` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string | Vehicle model name (e.g., Fortuner, Swift, i20) |
| `year` | Integer (C#: `int`, JSON: `number`) | Mandatory | None | Valid year (typically 1900-present) | Manufacturing year of the vehicle |
| `registrationNumber` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string, unique format | Vehicle registration/license plate number |
| `chassisNumber` | String (C#: `string?`, JSON: `string`) | Optional | `null` | Alphanumeric string | Unique chassis identifier number |
| `engineNumber` | String (C#: `string?`, JSON: `string`) | Optional | `null` | Alphanumeric string | Engine identification number |
| `colour` | String (C#: `string?`, JSON: `string`) | Optional | `null` | Color name or code | Vehicle exterior color |
| `sellingPrice` | Decimal (C#: `decimal`, JSON: `number`) | Mandatory | None | Non-negative decimal, max 2 decimal places | Expected selling price of the vehicle |
| `sellerName` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string | Name of the person/entity selling the vehicle |
| `sellerPhone` | String (C#: `string`, JSON: `string`) | Mandatory | None | Non-empty string, valid phone format | Contact phone number of the seller |
| `sellerAddress` | String (C#: `string?`, JSON: `string`) | Optional | `null` | Address string | Address of the seller |
| `buyingCost` | Decimal (C#: `decimal`, JSON: `number`) | Mandatory | None | Non-negative decimal, max 2 decimal places | Amount paid to acquire the vehicle |
| `expense` | Decimal (C#: `decimal`, JSON: `number`) | Mandatory | None | Non-negative decimal, max 2 decimal places | Additional expenses (taxes, registration, repairs, etc.) |
| `purchaseDate` | DateTime (C#: `DateTime`, JSON: `string`) | Mandatory | None | Valid ISO 8601 datetime format | Date and time of the purchase transaction |

---

#### Response Section

##### Status Code: 201 (Created)

**Successful Purchase Creation Response**

```json
{
  "id": 1,
  "vehicleId": 101,
  "brand": "Toyota",
  "model": "Fortuner",
  "year": 2022,
  "registrationNumber": "DL-01-AB-1234",
  "colour": "Silver",
  "sellingPrice": 2500000.00,
  "sellerName": "Rajesh Kumar",
  "sellerPhone": "9123456789",
  "sellerAddress": "456 Seller Street, City",
  "buyingCost": 2000000.00,
  "expense": 50000.00,
  "purchaseDate": "2026-02-20T10:30:00Z",
  "createdAt": "2026-02-20T10:35:00Z"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | Integer | No | Unique purchase record identifier |
| `vehicleId` | Integer | No | Reference to the created vehicle record |
| `brand` | String | No | Vehicle brand |
| `model` | String | No | Vehicle model |
| `year` | Integer | No | Manufacturing year |
| `registrationNumber` | String | No | Vehicle registration number |
| `colour` | String | Yes | Vehicle color |
| `sellingPrice` | Decimal | No | Expected selling price |
| `sellerName` | String | No | Seller's name |
| `sellerPhone` | String | No | Seller's phone number |
| `sellerAddress` | String | Yes | Seller's address |
| `buyingCost` | Decimal | No | Purchase price paid |
| `expense` | Decimal | No | Additional expenses incurred |
| `purchaseDate` | DateTime (ISO 8601) | No | Purchase transaction date |
| `createdAt` | DateTime (ISO 8601) | No | Record creation timestamp |

---

##### Status Code: 400 (Bad Request)

**Validation Error Response**

```json
{
  "message": "Selling price must be greater than buying cost"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `message` | String | No | Specific validation error message |

---

##### Status Code: 409 (Conflict)

**Duplicate Registration Number Response**

```json
{
  "message": "A vehicle with this registration number already exists"
}
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Duplicate registration numbers in different records
- Selling price lower than buying cost
- Missing required vehicle identification fields
- Future purchase dates
- Invalid year values
- Seller phone number format validation
- Missing Authorization header

#### Business Rules
- Registration number should be unique within the system
- Selling price should logically be greater than buying cost
- Buying cost + expense determines total cost of acquisition
- Profit on sale = selling price - (buying cost + expense)
- Vehicle status becomes "Available" after successful purchase
- PurchaseDate cannot be in the future

#### Side Effects
- Creates a new Purchase record in the database
- Creates a corresponding Vehicle record with status "Available"
- Generates unique IDs for both purchase and vehicle
- Records creation timestamp

#### Idempotent or Not
**Not Idempotent** - Each request creates a new purchase and vehicle record; duplicate requests create duplicate records.

---

### GET /api/purchases

#### Endpoint Name
Get All Purchases

#### HTTP Method
`GET`

#### Route URL
`/api/purchases`

#### Short Description
Retrieves all purchase records from the system.

#### Detailed Description
Fetches a complete list of all vehicle purchases made by the business. Returns basic purchase information for inventory and financial tracking.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Query Parameters
None

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
[
  {
    "id": 1,
    "vehicleId": 101,
    "brand": "Toyota",
    "model": "Fortuner",
    "year": 2022,
    "registrationNumber": "DL-01-AB-1234",
    "colour": "Silver",
    "sellingPrice": 2500000.00,
    "sellerName": "Rajesh Kumar",
    "sellerPhone": "9123456789",
    "sellerAddress": "456 Seller Street, City",
    "buyingCost": 2000000.00,
    "expense": 50000.00,
    "purchaseDate": "2026-02-20T10:30:00Z",
    "createdAt": "2026-02-20T10:35:00Z"
  },
  {
    "id": 2,
    "vehicleId": 102,
    "brand": "Maruti",
    "model": "Swift",
    "year": 2021,
    "registrationNumber": "DL-01-AB-5678",
    "colour": "Blue",
    "sellingPrice": 800000.00,
    "sellerName": "Priya Singh",
    "sellerPhone": "9876543210",
    "sellerAddress": "789 Seller Avenue, Town",
    "buyingCost": 600000.00,
    "expense": 20000.00,
    "purchaseDate": "2026-02-19T14:20:00Z",
    "createdAt": "2026-02-19T14:25:00Z"
  }
]
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | Integer | No | Unique purchase record identifier |
| `vehicleId` | Integer | No | Reference to the vehicle record |
| `brand` | String | No | Vehicle brand |
| `model` | String | No | Vehicle model |
| `year` | Integer | No | Manufacturing year |
| `registrationNumber` | String | No | Vehicle registration number |
| `colour` | String | Yes | Vehicle color |
| `sellingPrice` | Decimal | No | Expected selling price |
| `sellerName` | String | No | Seller's name |
| `sellerPhone` | String | No | Seller's phone number |
| `sellerAddress` | String | Yes | Seller's address |
| `buyingCost` | Decimal | No | Purchase price paid |
| `expense` | Decimal | No | Additional expenses incurred |
| `purchaseDate` | DateTime (ISO 8601) | No | Purchase transaction date |
| `createdAt` | DateTime (ISO 8601) | No | Record creation timestamp |

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- No purchases exist in the system (returns empty array)
- Large dataset causing slow response times
- Missing Authorization header

#### Business Rules
- Returns all purchases regardless of vehicle sales status
- No pagination implemented
- Results may not be sorted in any guaranteed order

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests return the same data.

---

### GET /api/purchases/{id}

#### Endpoint Name
Get Purchase by ID

#### HTTP Method
`GET`

#### Route URL
`/api/purchases/{id}`

#### Short Description
Retrieves a specific purchase record by its ID.

#### Detailed Description
Fetches detailed information for a single purchase identified by its numeric ID. Useful for viewing complete purchase details and associated vehicle information.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Route Parameters

| Parameter Name | Data Type | Required | Format | Description |
|---|---|---|---|---|
| `id` | Integer | Mandatory | Positive integer | The unique identifier of the purchase record |

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
{
  "id": 1,
  "vehicleId": 101,
  "brand": "Toyota",
  "model": "Fortuner",
  "year": 2022,
  "registrationNumber": "DL-01-AB-1234",
  "colour": "Silver",
  "sellingPrice": 2500000.00,
  "sellerName": "Rajesh Kumar",
  "sellerPhone": "9123456789",
  "sellerAddress": "456 Seller Street, City",
  "buyingCost": 2000000.00,
  "expense": 50000.00,
  "purchaseDate": "2026-02-20T10:30:00Z",
  "createdAt": "2026-02-20T10:35:00Z"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | Integer | No | Unique purchase record identifier |
| `vehicleId` | Integer | No | Reference to the vehicle record |
| `brand` | String | No | Vehicle brand |
| `model` | String | No | Vehicle model |
| `year` | Integer | No | Manufacturing year |
| `registrationNumber` | String | No | Vehicle registration number |
| `colour` | String | Yes | Vehicle color |
| `sellingPrice` | Decimal | No | Expected selling price |
| `sellerName` | String | No | Seller's name |
| `sellerPhone` | String | No | Seller's phone number |
| `sellerAddress` | String | Yes | Seller's address |
| `buyingCost` | Decimal | No | Purchase price paid |
| `expense` | Decimal | No | Additional expenses incurred |
| `purchaseDate` | DateTime (ISO 8601) | No | Purchase transaction date |
| `createdAt` | DateTime (ISO 8601) | No | Record creation timestamp |

---

##### Status Code: 404 (Not Found)

**Purchase Not Found Response**

```json
{
  "message": "Not Found"
}
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Non-existent purchase ID
- Invalid ID format (non-integer)
- Missing Authorization header

#### Business Rules
- Returns only the requested purchase if found
- ID must be a valid positive integer

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests with the same valid ID return the same purchase data.

---

## Vehicle Endpoints

### GET /api/vehicles

#### Endpoint Name
Get All Vehicles

#### HTTP Method
`GET`

#### Route URL
`/api/vehicles`

#### Short Description
Retrieves all vehicles in the system regardless of their status.

#### Detailed Description
Fetches a complete inventory of all vehicles, including those that are available for sale and those already sold. Provides comprehensive vehicle information including specifications and pricing.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Query Parameters
None

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
[
  {
    "id": 101,
    "brand": "Toyota",
    "model": "Fortuner",
    "year": 2022,
    "registrationNumber": "DL-01-AB-1234",
    "chassisNumber": "JTMFA5C10D5001234",
    "engineNumber": "2TR5E-1234567",
    "colour": "Silver",
    "sellingPrice": 2500000.00,
    "status": 1,
    "createdAt": "2026-02-20T10:35:00Z"
  },
  {
    "id": 102,
    "brand": "Maruti",
    "model": "Swift",
    "year": 2021,
    "registrationNumber": "DL-01-AB-5678",
    "chassisNumber": "MA3FF5R19LM123456",
    "engineNumber": "K12M-7890123",
    "colour": "Blue",
    "sellingPrice": 800000.00,
    "status": 2,
    "createdAt": "2026-02-19T14:25:00Z"
  }
]
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | Integer | No | Unique vehicle identifier |
| `brand` | String | No | Vehicle manufacturer brand |
| `model` | String | No | Vehicle model name |
| `year` | Integer | No | Manufacturing year |
| `registrationNumber` | String | No | Vehicle registration/license plate number |
| `chassisNumber` | String | Yes | Unique chassis identifier |
| `engineNumber` | String | Yes | Engine identification number |
| `colour` | String | Yes | Vehicle exterior color |
| `sellingPrice` | Decimal | No | Price at which vehicle is offered for sale |
| `status` | Integer (Enum: VehicleStatus) | No | Current status: 1=Available, 2=Sold |
| `createdAt` | DateTime (ISO 8601) | No | Record creation timestamp |

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- No vehicles exist in the system (returns empty array)
- Large inventory causing slow response times
- Missing Authorization header

#### Business Rules
- Returns both available and sold vehicles
- No pagination implemented
- VehicleStatus values: 1 = Available, 2 = Sold

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests return the same data.

---

### GET /api/vehicles/available

#### Endpoint Name
Get Available Vehicles

#### HTTP Method
`GET`

#### Route URL
`/api/vehicles/available`

#### Short Description
Retrieves only vehicles that are currently available for sale.

#### Detailed Description
Fetches a filtered list of vehicles with status "Available". These are vehicles that have been purchased but not yet sold. This endpoint is useful for displaying inventory available for customer sales.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Query Parameters
None

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
[
  {
    "id": 101,
    "brand": "Toyota",
    "model": "Fortuner",
    "year": 2022,
    "registrationNumber": "DL-01-AB-1234",
    "chassisNumber": "JTMFA5C10D5001234",
    "engineNumber": "2TR5E-1234567",
    "colour": "Silver",
    "sellingPrice": 2500000.00,
    "status": 1,
    "createdAt": "2026-02-20T10:35:00Z"
  },
  {
    "id": 103,
    "brand": "Hyundai",
    "model": "i20",
    "year": 2023,
    "registrationNumber": "DL-01-AB-9012",
    "chassisNumber": "KMHEC5A46EU123456",
    "engineNumber": "G4LC-2345678",
    "colour": "Red",
    "sellingPrice": 1200000.00,
    "status": 1,
    "createdAt": "2026-02-18T09:10:00Z"
  }
]
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | Integer | No | Unique vehicle identifier |
| `brand` | String | No | Vehicle manufacturer brand |
| `model` | String | No | Vehicle model name |
| `year` | Integer | No | Manufacturing year |
| `registrationNumber` | String | No | Vehicle registration/license plate number |
| `chassisNumber` | String | Yes | Unique chassis identifier |
| `engineNumber` | String | Yes | Engine identification number |
| `colour` | String | Yes | Vehicle exterior color |
| `sellingPrice` | Decimal | No | Price at which vehicle is offered for sale |
| `status` | Integer (Enum: VehicleStatus) | No | Vehicle status (1 = Available, 2 = Sold) |
| `createdAt` | DateTime (ISO 8601) | No | Record creation timestamp |

---

##### Status Code: 200 (OK) - No Available Vehicles

**Empty Result Response**

```json
[]
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- No available vehicles (returns empty array)
- All vehicles have been sold
- Missing Authorization header

#### Business Rules
- Returns only vehicles with status "Available" (value: 1)
- No pagination implemented
- Does not include sold vehicles (status = 2)

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests return the same data.

---

## Sales Endpoints

### GET /api/sales

#### Endpoint Name
Get Sales History

#### HTTP Method
`GET`

#### Route URL
`/api/sales`

#### Short Description
Retrieves a paginated and filterable history of all vehicle sales transactions.

#### Detailed Description
Fetches sales records with support for pagination, full-text search on customer name, and date range filtering. Essential for sales analytics, reporting, and tracking sales performance over time.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Query Parameters

| Parameter Name | Data Type | Required | Default Value | Format | Description |
|---|---|---|---|---|---|
| `pageNumber` | Integer | Optional | 1 | Positive integer | The page number for pagination (1-indexed) |
| `pageSize` | Integer | Optional | 10 | Positive integer | Number of records per page |
| `search` | String | Optional | None | Text string | Search term to filter by customer name or other fields |
| `fromDate` | DateTime | Optional | None | ISO 8601 format | Filter sales from this date onwards |
| `toDate` | DateTime | Optional | None | ISO 8601 format | Filter sales up to this date |

##### Example Query
```
GET /api/sales?pageNumber=1&pageSize=10&search=John&fromDate=2026-01-01&toDate=2026-02-28
```

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
{
  "items": [
    {
      "billNumber": 1001,
      "saleDate": "2026-02-20T14:30:00Z",
      "customerName": "John Doe",
      "phone": "9876543210",
      "vehicleModel": "Fortuner",
      "registrationNumber": "DL-01-AB-1234",
      "profit": 450000.00
    },
    {
      "billNumber": 1002,
      "saleDate": "2026-02-19T11:15:00Z",
      "customerName": "Jane Smith",
      "phone": "9123456789",
      "vehicleModel": "Swift",
      "registrationNumber": "DL-01-AB-5678",
      "profit": 180000.00
    }
  ],
  "totalCount": 2,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `items` | Array of SaleHistoryDto | No | List of sale records for the page |
| `items[].billNumber` | Integer | No | Unique bill/invoice number for the sale |
| `items[].saleDate` | DateTime (ISO 8601) | No | Date and time of the sale |
| `items[].customerName` | String | No | Name of the customer who purchased |
| `items[].phone` | String | No | Customer's contact phone number |
| `items[].vehicleModel` | String | No | Model name of the vehicle sold |
| `items[].registrationNumber` | String | No | Registration number of the sold vehicle |
| `items[].profit` | Decimal | No | Profit earned on this sale |
| `totalCount` | Integer | No | Total number of records matching the filter |
| `pageNumber` | Integer | No | Current page number |
| `pageSize` | Integer | No | Number of records per page |
| `totalPages` | Integer | No | Total number of pages available |

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- No sales records exist (returns empty items array)
- Invalid page number or size (should handle gracefully)
- Date range with no matching records
- Search term that returns no results
- fromDate is after toDate
- Missing Authorization header

#### Business Rules
- Pagination is 1-indexed (starts at page 1)
- Default page size is 10 records
- Search may filter by multiple fields including customer name
- Date filtering is inclusive on both ends
- TotalPages is calculated as `ceiling(totalCount / pageSize)`

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests with the same parameters return the same data (assuming no new sales are added concurrently).

---

### POST /api/sales

#### Endpoint Name
Create Sale

#### HTTP Method
`POST`

#### Route URL
`/api/sales`

#### Short Description
Records a new vehicle sale transaction.

#### Detailed Description
Creates a sale record when a vehicle is sold to a customer. Captures comprehensive sale details including customer information, payment mode, payment breakdown (cash/UPI/finance), and sale date. The vehicle status is updated to "Sold" upon successful sale creation. Customer can be either existing (referenced by ID) or new (created inline with sale).

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Request Body JSON Example
```json
{
  "vehicleId": 101,
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "customerName": null,
  "customerPhone": null,
  "customerAddress": null,
  "customerPhotoUrl": "https://storage.example.com/customers/550e8400.jpg",
  "paymentMode": 1,
  "cashAmount": 2500000.00,
  "upiAmount": null,
  "financeAmount": null,
  "financeCompany": null,
  "saleDate": "2026-02-20T14:30:00Z"
}
```

##### Request Fields Table

| Field Name | Data Type | Required | Default Value | Validation Rules | Description |
|---|---|---|---|---|---|
| `vehicleId` | Integer (C#: `int`, JSON: `number`) | Mandatory | None | Valid vehicle ID, vehicle must be Available | The ID of the vehicle being sold |
| `customerId` | GUID (C#: `Guid?`, JSON: `string`) | Optional | `null` | Valid customer GUID if provided | Reference to existing customer; if null, use customer inline info |
| `customerName` | String (C#: `string?`, JSON: `string`) | Optional* | `null` | Non-empty string if customerId is null | Name of the customer (required if no customerId) |
| `customerPhone` | String (C#: `string?`, JSON: `string`) | Optional* | `null` | Non-empty string if customerId is null | Phone number (required if no customerId) |
| `customerAddress` | String (C#: `string?`, JSON: `string`) | Optional | `null` | Address string | Customer's delivery/contact address |
| `customerPhotoUrl` | String (C#: `string`, JSON: `string`) | Mandatory | None | Valid URL string | URL to customer's photo/ID proof |
| `paymentMode` | Integer/Enum (C#: `PaymentMode`, JSON: `number`) | Mandatory | None | 1=Cash, 2=UPI, 3=Finance | The primary method of payment |
| `cashAmount` | Decimal (C#: `decimal?`, JSON: `number`) | Optional* | `null` | Non-negative, required if paymentMode=Cash | Amount received in cash |
| `upiAmount` | Decimal (C#: `decimal?`, JSON: `number`) | Optional* | `null` | Non-negative, required if paymentMode=UPI | Amount received via UPI |
| `financeAmount` | Decimal (C#: `decimal?`, JSON: `number`) | Optional* | `null` | Non-negative, required if paymentMode=Finance | Amount financed through a finance company |
| `financeCompany` | String (C#: `string?`, JSON: `string`) | Optional* | `null` | Non-empty string, required if financeAmount > 0 | Name of the finance company |
| `saleDate` | DateTime (C#: `DateTime`, JSON: `string`) | Mandatory | None | Valid ISO 8601 datetime, not future date | Date and time of the sale transaction |

*Optional notes: customerName, customerPhone, customerAddress are required only if customerId is null. cashAmount/upiAmount/financeAmount required based on paymentMode.

---

#### Response Section

##### Status Code: 201 (Created)

**Successful Sale Creation Response**

```json
{
  "billNumber": 1001,
  "vehicleId": 101,
  "vehicle": "Toyota Fortuner 2022",
  "customerName": "John Doe",
  "totalReceived": 2500000.00,
  "profit": 450000.00,
  "saleDate": "2026-02-20T14:30:00Z"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `billNumber` | Integer | No | Unique invoice/bill number for this sale |
| `vehicleId` | Integer | No | Reference to the sold vehicle |
| `vehicle` | String | No | Formatted vehicle description (Brand Model Year) |
| `customerName` | String | No | Name of the customer who purchased |
| `totalReceived` | Decimal | No | Total amount received from the customer |
| `profit` | Decimal | No | Calculated profit on the sale |
| `saleDate` | DateTime (ISO 8601) | No | Date and time of the sale |

---

##### Status Code: 400 (Bad Request)

**Validation Error Response**

```json
{
  "message": "Either customerId or customerName must be provided"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `message` | String | No | Specific validation error message |

---

##### Status Code: 400 (Bad Request) - Validation Exception

**Validation Exception Response**

```json
{
  "message": "Selling price must be greater than buying cost"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `message` | String | No | Specific validation exception message |

---

##### Status Code: 404 (Not Found)

**Vehicle Not Found Response**

```json
{
  "message": "Vehicle not found"
}
```

---

##### Status Code: 409 (Conflict)

**Vehicle Already Sold Response**

```json
{
  "message": "Vehicle has already been sold"
}
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Vehicle ID doesn't exist
- Vehicle already sold (status = Sold)
- customerId references non-existent customer
- Both customerId and customerName provided (should use customerId)
- Payment amounts don't match selling price
- Multiple payment modes specified simultaneously
- Invalid payment mode value
- Future sale date
- Selling price less than expected or invalid (ValidationException)
- Invalid data validation (ValidationException)
- Missing Authorization header

#### Business Rules
- Either customerId OR customerName must be provided (not both required, but one must exist)
- Vehicle must have status "Available" to be sold
- Vehicle status changes to "Sold" after successful sale
- Payment amounts should total to the vehicle's selling price
- Profit is calculated as: SellingPrice - (BuyingCost + Expense)
- BillNumber is auto-generated and unique
- Can use existing customer or create inline customer data

#### Side Effects
- Creates a new Sale record in the database
- Updates the Vehicle status from "Available" to "Sold"
- If customerId is null, may create a new customer record
- Records creation timestamp
- Generates unique bill number
- Updates customer relationship if customerId provided

#### Idempotent or Not
**Not Idempotent** - Each request creates a new sale record; duplicate requests create duplicate sales.

---

### GET /api/sales/{billNumber}

#### Endpoint Name
Get Sale by Bill Number

#### HTTP Method
`GET`

#### Route URL
`/api/sales/{billNumber}`

#### Short Description
Retrieves detailed information about a specific sale using the bill number.

#### Detailed Description
Fetches complete sale details including vehicle information, customer details, payment breakdown, and calculated profit. Bill number is the primary identifier for sales transactions.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Route Parameters

| Parameter Name | Data Type | Required | Format | Description |
|---|---|---|---|---|
| `billNumber` | Integer | Mandatory | Positive integer | The unique bill number of the sale to retrieve |

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
{
  "billNumber": 1001,
  "saleDate": "2026-02-20T14:30:00Z",
  "vehicleId": 101,
  "brand": "Toyota",
  "model": "Fortuner",
  "year": 2022,
  "registrationNumber": "DL-01-AB-1234",
  "chassisNumber": "JTMFA5C10D5001234",
  "engineNumber": "2TR5E-1234567",
  "colour": "Silver",
  "sellingPrice": 2500000.00,
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "customerAddress": "123 Main Street, City",
  "customerPhotoUrl": "https://storage.example.com/customers/550e8400.jpg",
  "purchaseDate": "2026-02-20T10:30:00Z",
  "buyingCost": 2000000.00,
  "expense": 50000.00,
  "paymentMode": 1,
  "cashAmount": 2500000.00,
  "upiAmount": null,
  "financeAmount": null,
  "financeCompany": null,
  "profit": 450000.00,
  "totalReceived": 2500000.00
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `billNumber` | Integer | No | Unique bill/invoice number |
| `saleDate` | DateTime (ISO 8601) | No | Date and time of the sale |
| `vehicleId` | Integer | No | Reference to the vehicle |
| `brand` | String | No | Vehicle brand |
| `model` | String | No | Vehicle model |
| `year` | Integer | No | Manufacturing year |
| `registrationNumber` | String | No | Vehicle registration number |
| `chassisNumber` | String | Yes | Chassis identifier |
| `engineNumber` | String | Yes | Engine identifier |
| `colour` | String | Yes | Vehicle color |
| `sellingPrice` | Decimal | No | Price at which vehicle was sold |
| `customerName` | String | No | Customer's name |
| `customerPhone` | String | No | Customer's phone number |
| `customerAddress` | String | Yes | Customer's address |
| `customerPhotoUrl` | String | Yes | URL to customer's photo |
| `purchaseDate` | DateTime (ISO 8601) | No | Original purchase date of vehicle |
| `buyingCost` | Decimal | No | Cost paid to acquire the vehicle |
| `expense` | Decimal | No | Additional expenses on the vehicle |
| `paymentMode` | Integer (Enum: PaymentMode) | No | Payment method (1=Cash, 2=UPI, 3=Finance) |
| `cashAmount` | Decimal | Yes | Cash amount received |
| `upiAmount` | Decimal | Yes | UPI amount received |
| `financeAmount` | Decimal | Yes | Finance amount |
| `financeCompany` | String | Yes | Finance company name |
| `profit` | Decimal | No | Profit on the sale |
| `totalReceived` | Decimal | No | Total amount received |

---

##### Status Code: 404 (Not Found)

**Sale Not Found Response**

```json
{
  "message": "Not Found"
}
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Non-existent bill number
- Invalid bill number format
- Missing Authorization header

#### Business Rules
- Bill number is unique and immutable
- Returns complete bill details with all related information
- Includes both vehicle purchase and sale details for comparison

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests with the same valid bill number return the same sale data.

---

### GET /api/sales/{billNumber}/invoice

#### Endpoint Name
Get Sale Invoice

#### HTTP Method
`GET`

#### Route URL
`/api/sales/{billNumber}/invoice`

#### Short Description
Retrieves the detailed invoice for a specific sale.

#### Detailed Description
Fetches comprehensive invoice information for a sale including customer details (from system), vehicle specifications, payment breakdown, and profit calculation. This is the data used to generate PDF invoices and customer receipts.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Route Parameters

| Parameter Name | Data Type | Required | Format | Description |
|---|---|---|---|---|
| `billNumber` | Integer | Mandatory | Positive integer | The unique bill number of the sale |

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
{
  "billNumber": 1001,
  "saleDate": "2026-02-20T14:30:00Z",
  "deliveryTime": "14:45:00",
  "customerName": "John Doe",
  "fatherName": "James Doe",
  "phone": "9876543210",
  "address": "123 Main Street, City",
  "photoUrl": "https://storage.example.com/customers/customer-550e8400.jpg",
  "idProofNumber": "ABC123456789",
  "customerPhone": "9876543210",
  "customerAddress": "123 Main Street, City",
  "customerPhotoUrl": "https://storage.example.com/customers/550e8400.jpg",
  "vehicleBrand": "Toyota",
  "vehicleModel": "Fortuner",
  "registrationNumber": "DL-01-AB-1234",
  "chassisNumber": "JTMFA5C10D5001234",
  "engineNumber": "2TR5E-1234567",
  "colour": "Silver",
  "sellingPrice": 2500000.00,
  "paymentMode": 1,
  "cashAmount": 2500000.00,
  "upiAmount": null,
  "financeAmount": null,
  "financeCompany": null,
  "profit": 450000.00
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `billNumber` | Integer | No | Unique bill/invoice number |
| `saleDate` | DateTime (ISO 8601) | No | Date and time of the sale |
| `deliveryTime` | TimeSpan | Yes | Time at which vehicle was delivered (HH:MM:SS) |
| `customerName` | String | No | Customer's full name |
| `fatherName` | String | Yes | Father's name (for ID verification) |
| `phone` | String | No | Customer's phone number |
| `address` | String | Yes | Customer's address |
| `photoUrl` | String | No | URL to customer's photo/ID proof |
| `idProofNumber` | String | Yes | ID proof number (e.g., Aadhar, DL, PAN) |
| `customerPhone` | String | No | Customer's phone (from sale record) |
| `customerAddress` | String | Yes | Customer's address (from sale record) |
| `customerPhotoUrl` | String | No | Customer's photo URL (from sale record) |
| `vehicleBrand` | String | No | Vehicle manufacturer |
| `vehicleModel` | String | No | Vehicle model name |
| `registrationNumber` | String | No | Vehicle registration number |
| `chassisNumber` | String | Yes | Chassis number |
| `engineNumber` | String | Yes | Engine number |
| `colour` | String | Yes | Vehicle color |
| `sellingPrice` | Decimal | No | Selling price of vehicle |
| `paymentMode` | Integer (Enum: PaymentMode) | No | Payment method (1=Cash, 2=UPI, 3=Finance) |
| `cashAmount` | Decimal | Yes | Amount paid in cash |
| `upiAmount` | Decimal | Yes | Amount paid via UPI |
| `financeAmount` | Decimal | Yes | Amount financed |
| `financeCompany` | String | Yes | Finance company name |
| `profit` | Decimal | No | Profit on the sale |

---

##### Status Code: 404 (Not Found)

**Sale Not Found Response**

```json
{
  "message": "Not Found"
}
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Non-existent bill number
- Invoice data incomplete or missing
- Missing Authorization header

#### Business Rules
- Includes data from both sale transaction and customer/vehicle records
- Used primarily for invoice generation and printing
- May contain additional metadata like ID proof details

#### Side Effects
- No database modifications
- May log the request for audit purposes

#### Idempotent or Not
**Idempotent** - Multiple identical requests with the same valid bill number return the same invoice data.

---

### POST /api/sales/{billNumber}/send-invoice

#### Endpoint Name
Send Invoice via WhatsApp

#### HTTP Method
`POST`

#### Route URL
`/api/sales/{billNumber}/send-invoice`

#### Short Description
Sends the sale invoice to the customer via WhatsApp.

#### Detailed Description
Generates a PDF invoice and sends it to the customer's phone number via WhatsApp. This endpoint integrates with Meta WhatsApp API to automatically deliver invoices. The process involves generating the PDF, uploading it to cloud storage, and sending via WhatsApp messaging service.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Route Parameters

| Parameter Name | Data Type | Required | Format | Description |
|---|---|---|---|---|
| `billNumber` | Integer | Mandatory | Positive integer | The bill number for which to send invoice |

##### Request Body
No request body required. Note: CancellationToken is handled by ASP.NET runtime.

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Invoice Send Response**

```json
{
  "billNumber": 1001,
  "pdfUrl": "https://storage.example.com/invoices/bill-1001.pdf",
  "status": "Sent successfully"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `billNumber` | Integer | No | Bill number of the invoice sent |
| `pdfUrl` | String | No | URL to the generated PDF invoice |
| `status` | String | No | Status message indicating success |

---

##### Status Code: 400 (Bad Request)

**Validation/Missing Data Error Response**

```json
{
  "message": "Customer phone number is missing or invalid"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `message` | String | No | Error message describing the validation issue |

---

##### Status Code: 404 (Not Found)

**Sale Not Found Response**

```json
{
  "message": "Sale not found"
}
```

---

##### Status Code: 502 (Bad Gateway)

**WhatsApp/External Service Error Response**

```json
{
  "message": "Failed to send WhatsApp message: API rate limit exceeded"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `message` | String | No | Error message from external service |

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Bill number doesn't exist
- Customer phone number missing or invalid
- PDF generation fails
- Cloud storage upload fails
- WhatsApp API returns rate limiting error
- Network timeout during WhatsApp message sending
- Customer opted out of WhatsApp messages
- Missing Authorization header

#### Business Rules
- Requires valid customer phone number in international format
- PDF is generated on-demand from invoice data
- Invoice is stored in cloud storage for future access
- WhatsApp sending is asynchronous but response waits for completion
- Same invoice can be sent multiple times to the same customer
- Depends on WhatsApp API configuration and credentials

#### Side Effects
- Generates and stores PDF invoice in cloud storage
- Sends WhatsApp message to customer's phone number
- May create audit log of message sent
- Updates customer communication history (if tracked)

#### Idempotent or Not
**Not Idempotent** - Multiple identical requests send the invoice multiple times to the customer via WhatsApp.

---

## Search Endpoints

### GET /api/search

#### Endpoint Name
Global Search

#### HTTP Method
`GET`

#### Route URL
`/api/search`

#### Short Description
Performs a global search across sales transactions using a search query.

#### Detailed Description
Searches across multiple fields including bill number, customer name, phone number, vehicle model, and registration number. Returns matching sales records. Useful for finding sales transactions when you have partial information about the customer or vehicle.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Query Parameters

| Parameter Name | Data Type | Required | Default Value | Format | Description |
|---|---|---|---|---|---|
| `q` | String | Optional | Empty string | Text string | Search query to match against various sale fields |

##### Example Query
```
GET /api/search?q=John
```

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Search Response**

```json
[
  {
    "billNumber": 1001,
    "customerName": "John Doe",
    "customerPhone": "9876543210",
    "vehicle": "Toyota Fortuner 2022",
    "registrationNumber": "DL-01-AB-1234",
    "saleDate": "2026-02-20T14:30:00Z"
  },
  {
    "billNumber": 1005,
    "customerName": "John Smith",
    "customerPhone": "9988776655",
    "vehicle": "Maruti Swift 2021",
    "registrationNumber": "DL-01-AB-9999",
    "saleDate": "2026-02-18T10:00:00Z"
  }
]
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `billNumber` | Integer | No | Unique bill number of the sale |
| `customerName` | String | No | Name of the customer |
| `customerPhone` | String | No | Customer's phone number |
| `vehicle` | String | No | Vehicle description (Brand Model Year) |
| `registrationNumber` | String | No | Vehicle registration number |
| `saleDate` | DateTime (ISO 8601) | No | Date and time of the sale |

---

##### Status Code: 200 (OK) - No Results

**Empty Search Result Response**

```json
[]
```

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- Empty search query (searches all or none based on implementation)
- No matching results found
- Special characters in search query
- Very broad search term returning many results
- Missing Authorization header

#### Business Rules
- Searches across multiple fields (customer name, phone, vehicle model, registration)
- Returns sales records matching the search criteria
- Search is case-insensitive (typically)
- No pagination implemented
- Empty search term may return all or no results depending on implementation

#### Side Effects
- No database modifications
- May log search queries for analytics
- May affect database query performance if full-text search is not indexed

#### Idempotent or Not
**Idempotent** - Multiple identical search queries return the same results (assuming no new sales added concurrently).

---

## Dashboard Endpoints

### GET /api/dashboard

#### Endpoint Name
Get Dashboard Statistics

#### HTTP Method
`GET`

#### Route URL
`/api/dashboard`

#### Short Description
Retrieves key business statistics and metrics for the dashboard.

#### Detailed Description
Fetches aggregated metrics including total vehicles purchased, total vehicles sold, available inventory, total profit, and sales for the current month. Essential endpoint for displaying business performance overview on the dashboard.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `application/json`

##### Query Parameters
None

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Retrieval Response**

```json
{
  "totalVehiclesPurchased": 45,
  "totalVehiclesSold": 38,
  "availableVehicles": 7,
  "totalProfit": 5670000.00,
  "salesThisMonth": 8950000.00
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `totalVehiclesPurchased` | Integer | No | Total count of vehicles purchased by the business |
| `totalVehiclesSold` | Integer | No | Total count of vehicles sold to customers |
| `availableVehicles` | Integer | No | Current count of vehicles with status "Available" |
| `totalProfit` | Decimal | No | Sum of profit from all sales |
| `salesThisMonth` | Decimal | No | Total sales revenue for the current month |

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- No sales or purchases exist
- Month boundary (first/last day of month)
- No profit transactions
- Missing Authorization header

#### Business Rules
- "Current month" is determined by the server's current date
- TotalProfit is cumulative across all time
- SalesThisMonth is filtered by month and year of sale date
- AvailableVehicles = TotalVehiclesPurchased - TotalVehiclesSold (approximately)
- All amounts are in the system's base currency

#### Side Effects
- No database modifications
- May log the request for audit purposes
- May cache results if performance is critical

#### Idempotent or Not
**Idempotent** - Multiple identical requests return the same data (within the current date).

---

## Upload Endpoints

### POST /api/upload

#### Endpoint Name
Upload Customer Photo

#### HTTP Method
`POST`

#### Route URL
`/api/upload`

#### Short Description
Uploads a customer photo file to the system.

#### Detailed Description
Handles file upload for customer profile photos using a dedicated customer photo storage service. Supports image files with a maximum size of 2MB. The uploaded file is stored in a cloud storage system and returns a publicly accessible URL for use in customer records. This endpoint uses multipart/form-data content type and includes file size validation at both request attribute and form limits level.

#### Authentication Requirement
**Yes** - Requires Bearer Token with **Admin** role

---

#### Request Section

**Content-Type:** `multipart/form-data`

##### Request Body

| Field Name | Data Type | Required | Validation Rules | Description |
|---|---|---|---|---|
| `file` | IFormFile (Binary) | Mandatory | Max size: 2MB (2,097,152 bytes), valid image format | The image file to upload for customer profile photo |

##### Example Request (using curl)
```bash
curl -X POST "https://api.example.com/api/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@customer_photo.jpg"
```

---

#### Response Section

##### Status Code: 200 (OK)

**Successful Upload Response**

```json
{
  "url": "https://storage.example.com/customers/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `url` | String (URI) | No | Publicly accessible URL to the uploaded file in cloud storage |

---

##### Status Code: 400 (Bad Request)

**Invalid File Error Response**

```json
{
  "message": "File size exceeds maximum allowed size of 2MB"
}
```

| Field Name | Data Type | Nullable | Description |
|---|---|---|---|
| `message` | String | No | Error message describing the validation issue |

**Additional 400 Error Scenarios:**
- "Unsupported file format"
- "File is corrupted or invalid"
- "No file provided in the request"

---

##### Status Code: 401 (Unauthorized)

**Missing or Invalid Token Response**

```json
{
  "message": "Unauthorized"
}
```

---

#### Edge Cases
- File size exceeds 2MB limit
- Unsupported file format (e.g., .exe, .zip, non-image files)
- No file provided in the request
- Corrupted or invalid image file
- Network error during upload
- Cloud storage service unavailable
- File name contains special characters or is excessively long
- Missing Authorization header

#### Business Rules
- Maximum file size is strictly **2,097,152 bytes (2MB)**
- Size validation enforced at both `[RequestSizeLimit]` and `[RequestFormLimits]` attributes
- Supported formats typically include: jpg, jpeg, png, gif, bmp
- Uploaded files are stored with unique identifiers
- URL is publicly accessible for image display
- Files are stored in cloud storage system (Cloudinary, AWS S3, or similar)
- File names are sanitized to prevent security issues
- Service uses dedicated `ICustomerPhotoStorageService` for storage operations

#### Side Effects
- Uploads file to persistent cloud storage
- Generates unique file URL
- Creates file access logs
- May trigger virus/malware scanning (depending on storage service)
- File becomes immediately available via returned URL

#### Idempotent or Not
**Not Idempotent** - Each upload creates a new file with a unique URL; identical file uploads create separate files with different URLs.

---

---

## Error Handling

### Standard Error Response Format

All error responses follow a consistent format:

```json
{
  "message": "Description of the error that occurred"
}
```

### Common HTTP Status Codes

| Status Code | Meaning | Common Scenarios |
|---|---|---|
| 200 | OK | Request succeeded, returning data |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Validation error, invalid input, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Requested resource doesn't exist |
| 409 | Conflict | Business rule violation (e.g., duplicate, already sold) |
| 502 | Bad Gateway | External service error (e.g., WhatsApp API failure) |
| 500 | Internal Server Error | Unexpected server error |

### Validation Error Example

```json
{
  "message": "Field validation failed: Phone number is required"
}
```

### Exception-Based Error Example

```json
{
  "message": "Database connection failed: Unable to reach database server"
}
```

### Authentication Error Example

```json
{
  "message": "Invalid credentials"
}
```

### Business Logic Error Example

```json
{
  "message": "Vehicle has already been sold"
}
```

---

## Enums Reference

### PaymentMode Enum

Used in sale transactions to specify payment method.

| Value | Name | Description |
|---|---|---|
| 1 | Cash | Payment received in cash |
| 2 | UPI | Payment received via UPI (digital wallet) |
| 3 | Finance | Vehicle financed through a finance company |

### VehicleStatus Enum

Represents the current status of a vehicle in inventory.

| Value | Name | Description |
|---|---|---|
| 1 | Available | Vehicle is available for sale |
| 2 | Sold | Vehicle has been sold to a customer |

### UserRole Enum

User roles for access control.

| Value | Name | Description |
|---|---|---|
| 1 | Admin | Administrator with full system access |

---

## Authentication

### Bearer Token Format

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Token Acquisition

Obtain a token by calling the Login endpoint:

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

Response:
```json
{
  "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI..."
}
```

### Token Validation

Tokens are validated for:
- **Signature**: Issued by the correct server
- **Issuer**: Matches the configured issuer
- **Audience**: Matches the configured audience
- **Expiration**: Not expired
- **Role**: User has required Admin role for protected endpoints

---

## Rate Limiting & Best Practices

### Recommendations

1. **Cache Responses**: Cache dashboard and inventory data for 5-10 minutes
2. **Pagination**: Use pagination when retrieving large result sets
3. **Error Handling**: Implement retry logic with exponential backoff for transient failures
4. **Logging**: Log all API requests for audit and troubleshooting
5. **Token Management**: Refresh tokens before expiration, don't store in localStorage
6. **Data Validation**: Validate on client-side before sending requests

### Rate Limiting

- Not explicitly documented; check with API administrator for limits
- WhatsApp endpoint may have rate limits from Meta API

---

## End of Documentation

For additional support, contact the development team.


