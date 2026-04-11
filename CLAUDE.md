# Annex Leather ERP System

## Project Overview

Web-based ERP system for the leather manufacturing industry (Annex Leather). Built with MERN stack (MongoDB, Express.js, React.js, Node.js). Manages Sales, Purchase, Inventory, Accounts, HRM, Leave, and more in a single platform.

**Figma Design:** https://www.figma.com/design/ohv5ax0gCDvLxtWKuiVqvB/Untitled?node-id=0-1&t=dDKU4kGcnFvaox5m-1

## Tech Stack

- **Frontend:** React.js (Vite), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JWT (access + refresh tokens)
- **Package Manager:** npm
- **API Style:** RESTful

## Project Structure

```
/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components (by module)
│   │   ├── layouts/         # Layout wrappers (sidebar, navbar)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   ├── services/        # API call functions (axios)
│   │   ├── utils/           # Helper/utility functions
│   │   ├── constants/       # Enums, config constants
│   │   └── assets/          # Images, icons
│   └── package.json
├── server/                  # Express backend
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── middlewares/     # Auth, role, validation middleware
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Helpers (calculations, formatters)
│   │   ├── validators/      # Request validation (Joi/Zod)
│   │   └── config/          # DB, env, constants
│   └── package.json
├── CLAUDE.md
└── package.json             # Root package.json (workspaces)
```

## Modules

| Module | Description |
|--------|-------------|
| Auth | Login, registration, forgot password, role-based access, profile |
| Dashboard | Financial summary cards, charts (sales vs expenses, profit, cash flow), date filters |
| Sales | Product/service sale, returns, discount, tax, shipping, due tracking, min price validation |
| Purchase | Purchase orders, returns, CNF management, document upload, payment tracking |
| Products | Single/variant/combo products, SKU, brand, category, pricing, images |
| Inventory | Opening stock, receive, transfer, adjustment, movement tracking, serial tracking, low stock alert |
| Contacts | Supplier and customer management |
| Accounts | Expense/income, bank accounts, chart of accounts, financial reports (P&L, balance sheet) |
| HRM | Staff management, attendance, payroll, loan management |
| Leave | Leave types, applications, approval workflow, carry forward, holidays |
| Transfer | Money transfer between accounts, product transfer between warehouses |
| Locations | Branch and warehouse management |
| Settings | Currency, timezone, invoice, email/SMS config |
| Activity Log | Track all user actions with filter and export |

## User Roles

Super Admin > Admin > Sales Manager / Purchase Officer / Inventory Manager / Accountant / HR Manager / Branch Manager > Staff

Each role has CRUD + Approve permissions scoped to their modules.

## Key Business Rules (MUST follow)

1. **Minimum selling price** — Sale is blocked if price < minimum. Only Admin can override.
2. **No negative stock** — Stock cannot go below zero. Show error if insufficient.
3. **Low stock alert** — Alert when `currentStock <= alertQuantity`.
4. **Double-entry accounting** — Every financial transaction has debit + credit entries.
5. **Leave approval required** — Leave goes through Apply > Pending > Approve/Reject workflow.
6. **Activity log on all actions** — Log `user + action + module + datetime` for every mutation.
7. **Role-based access mandatory** — Every API endpoint must check user role/permissions.
8. **Unique SKU** — Product SKU must be unique across the system.
9. **Serial tracking** — Serial-enabled products require unique serial selection on sale.

## Core Calculation Logic

### Sales
```
Subtotal = SUM(qty * unitPrice)
Discount = productDiscount + overallDiscount
TaxableAmount = Subtotal - Discount
Tax = TaxableAmount * taxRate
GrandTotal = TaxableAmount + Tax + Shipping + OtherCharges
Due = GrandTotal - PaidAmount
TotalPayable = PreviousDue + CurrentDue
```

### Purchase
```
Subtotal = qty * purchasePrice
GrandTotal = Subtotal - Discount + Tax + OtherCharges
SupplierDue = GrandTotal - Paid
```

### Inventory Stock
```
CurrentStock = OpeningStock + Purchases - Sales + SalesReturns - PurchaseReturns +/- Adjustments +/- Transfers
```

### Profit
```
NetProfit = TotalSales - COGS - Expenses
```

### Payroll
```
Salary = BasicSalary + Allowances - Deductions
NetSalary = Salary - LoanDeduction - LeaveDeduction
```

## Accounting Rules (Double Entry)

| Transaction | Debit | Credit |
|-------------|-------|--------|
| Cash Sale | Cash/Bank | Sales Revenue |
| Credit Sale | Accounts Receivable | Sales Revenue |
| Purchase | Inventory/Expense | Accounts Payable |
| Expense | Expense Account | Cash/Bank |
| Income | Cash/Bank | Income Account |

## API Conventions

- Base URL: `/api/v1`
- Auth header: `Authorization: Bearer <token>`
- Response format: `{ success: boolean, data: any, message: string }`
- Error format: `{ success: false, error: string, statusCode: number }`
- Pagination: `?page=1&limit=20`
- Search: `?search=keyword`
- Date filter: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- Soft delete preferred (use `isDeleted` flag)

## Database Conventions

- Collection names: lowercase plural (e.g., `users`, `products`, `sales`)
- Timestamps: Always include `createdAt`, `updatedAt` via Mongoose timestamps
- References: Use `mongoose.Schema.Types.ObjectId` with `ref`
- Monetary values: Store as numbers (use 2 decimal precision in logic)
- Enums: Define in schema where applicable

## Code Style

- Use `async/await` (no raw callbacks)
- Controllers call services, services contain business logic
- Validate requests at the middleware/validator level before reaching controllers
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 500)
- Environment variables via `.env` file (never commit secrets)
- Use `try/catch` with centralized error handler middleware

## Common Commands

```bash
# Install all dependencies (from root)
npm install

# Run dev (frontend + backend concurrently)
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client
```

## Layout

- Left sidebar (collapsible) with module navigation
- Top navbar with search, notifications, profile dropdown
- Main content area with breadcrumb navigation
- Responsive: Desktop-first, then tablet, then mobile
- Tables: search, filter, pagination, export (CSV/PDF)
- Forms: validation states, required field indicators
- Modals for CRUD operations
- Toast notifications for success/error feedback
