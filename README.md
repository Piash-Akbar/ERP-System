# Annex Leather ERP System

A comprehensive, web-based Enterprise Resource Planning (ERP) system built for the leather manufacturing industry. Manages Sales, Purchase, Inventory, Accounts, HRM, Leave, Manufacturing, and more — all in a single platform.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Modules](#modules)
- [User Roles & Permissions](#user-roles--permissions)
- [Business Rules](#business-rules)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Role-Based Access Control** — 9 predefined roles with granular module-level permissions (view, create, edit, delete, approve)
- **Sales Management** — Product & service sales, returns, discount/tax handling, due tracking, minimum price validation
- **Purchase Management** — Purchase orders, returns, CNF management, document uploads, supplier payment tracking
- **Inventory Control** — Opening stock, stock adjustments, transfers between warehouses, product movement tracking, low stock alerts
- **Double-Entry Accounting** — Expenses, income, bank accounts, chart of accounts, transactions, profit & loss reports
- **Manufacturing** — Production planning, work orders, bill of materials, capacity planning, subcontracting management
- **HRM** — Staff management, departments, roles, attendance tracking, payroll, loan management
- **Leave Management** — Leave types, applications, approval workflow, holiday setup
- **Contact Management** — Separate customer and supplier directories
- **Multi-Location Support** — Branch and warehouse management with stock transfer between locations
- **Money Transfers** — Inter-account fund transfers with full history
- **Activity Logging** — Tracks all user actions across every module
- **Notifications** — In-app notification system
- **Dark Mode** — Theme toggle support
- **Responsive Layout** — Collapsible sidebar, top navbar, breadcrumb navigation

## Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7, Recharts |
| **Backend**  | Node.js, Express 4                                          |
| **Database** | MongoDB with Mongoose 8 ODM                                 |
| **Auth**     | JWT (access + refresh tokens), bcryptjs                     |
| **Tooling**  | Concurrently, Nodemon, ESLint, Morgan                       |

## Project Structure

```
annex-leather-erp/
├── client/                          # React frontend (Vite)
│   ├── public/                      # Static assets (favicon, icons)
│   ├── src/
│   │   ├── assets/                  # Images (hero, logos)
│   │   ├── components/              # Reusable UI (DataTable, Modal, FormInput, StatusBadge, etc.)
│   │   ├── constants/               # Navigation config
│   │   ├── context/                 # AuthContext, ThemeContext
│   │   ├── hooks/                   # Custom hooks (useFetch)
│   │   ├── layouts/                 # MainLayout, Sidebar, Navbar
│   │   ├── pages/                   # Page components organized by module
│   │   │   ├── accounts/            # Expenses, Income, BankAccounts, ChartOfAccounts, P&L
│   │   │   ├── activitylog/         # Activity log viewer
│   │   │   ├── contacts/            # Customers, Suppliers
│   │   │   ├── hrm/                 # Staff, Departments, Roles, Attendance, Payroll, Loans
│   │   │   ├── inventory/           # Stock list, Opening stock, Adjustments, Movement
│   │   │   ├── leave/               # Leave types, Applications, Pending requests, Holidays
│   │   │   ├── locations/           # Branches, Warehouses
│   │   │   ├── manufacturing/       # Production, Work orders, BOM, Subcontracting
│   │   │   ├── products/            # Product list, Add product, Categories, Brands
│   │   │   ├── purchase/            # Purchase orders, Returns, Stock alerts, CNF
│   │   │   ├── sales/               # Product sale, Service sale, Returns
│   │   │   ├── settings/            # General, Invoice, Email, SMS settings
│   │   │   ├── setup/               # Tax, Country, Language management
│   │   │   └── transfer/            # Money transfers, Transfer history
│   │   ├── services/                # API service layer (axios)
│   │   ├── App.jsx                  # Root component with all routes
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── vite.config.js               # Vite config with API proxy
│   └── package.json
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/                  # Database connection, constants (roles, modules, permissions)
│   │   ├── controllers/             # Route handlers (one per module)
│   │   ├── middlewares/             # Auth, authorization, validation, error handling, file upload, activity logger
│   │   ├── models/                  # Mongoose schemas (34 models)
│   │   ├── routes/                  # Express route definitions (one per module)
│   │   ├── seeds/                   # Database seeders (roles, demo data)
│   │   ├── services/                # Business logic layer
│   │   ├── utils/                   # Helpers (apiError, asyncHandler, pagination, token generation, notifications)
│   │   ├── validators/              # Request validation with Joi
│   │   ├── app.js                   # Express app setup (middleware, routes)
│   │   └── server.js                # Server entry point (DB connect + listen)
│   ├── .env.example                 # Environment variable template
│   └── package.json
├── package.json                     # Root workspace config
└── README.md
```

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 6.x (local instance or MongoDB Atlas)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Piash-Akbar/ERP-System.git
   cd ERP-System
   ```

2. **Install all dependencies** (installs both client and server via workspaces)

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp server/.env.example server/.env
   ```

   Then edit `server/.env` with your own values (see [Environment Variables](#environment-variables)).

## Environment Variables

Create a `server/.env` file based on `server/.env.example`:

| Variable               | Description                    | Default                                      |
| ---------------------- | ------------------------------ | -------------------------------------------- |
| `PORT`                 | Backend server port            | `5000`                                       |
| `NODE_ENV`             | Environment mode               | `development`                                |
| `MONGO_URI`            | MongoDB connection string      | `mongodb://localhost:27017/annex-leather-erp` |
| `JWT_SECRET`           | Secret for access tokens       | *(must change in production)*                |
| `JWT_REFRESH_SECRET`   | Secret for refresh tokens      | *(must change in production)*                |
| `JWT_ACCESS_EXPIRES`   | Access token expiry duration   | `15m`                                        |
| `JWT_REFRESH_EXPIRES`  | Refresh token expiry duration  | `7d`                                         |
| `CLIENT_URL`           | Frontend URL (for CORS)        | `http://localhost:5173`                       |

## Database Seeding

Seed the database with default roles, a Super Admin user, and sample data:

```bash
# Seed everything (roles, users, branches, products, contacts, etc.)
cd server
npm run seed

# Or seed only roles
npm run seed:roles
```

## Running the Application

```bash
# Run both frontend and backend concurrently (from root)
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client
```

Once running:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/v1/health

The Vite dev server proxies `/api` and `/uploads` requests to the backend automatically.

## API Reference

All API endpoints are prefixed with `/api/v1`. Authentication is required via `Authorization: Bearer <token>` header.

### Base Endpoints

| Method | Endpoint                | Description       |
| ------ | ----------------------- | ----------------- |
| `GET`  | `/api/v1/health`        | Health check      |
| `POST` | `/api/v1/auth/login`    | User login        |
| `POST` | `/api/v1/auth/register` | User registration |

### Module Endpoints

| Prefix                    | Module          |
| ------------------------- | --------------- |
| `/api/v1/dashboard`       | Dashboard       |
| `/api/v1/sales`           | Sales           |
| `/api/v1/purchases`       | Purchases       |
| `/api/v1/products`        | Products        |
| `/api/v1/categories`      | Categories      |
| `/api/v1/brands`          | Brands          |
| `/api/v1/units`           | Units           |
| `/api/v1/taxes`           | Tax Rates       |
| `/api/v1/inventory`       | Inventory       |
| `/api/v1/contacts`        | Contacts        |
| `/api/v1/accounts`        | Accounts        |
| `/api/v1/transfers`       | Transfers       |
| `/api/v1/hrm`             | HRM             |
| `/api/v1/leave`           | Leave           |
| `/api/v1/branches`        | Branches        |
| `/api/v1/warehouses`      | Warehouses      |
| `/api/v1/cnf`             | CNF Management  |
| `/api/v1/manufacturing`   | Manufacturing   |
| `/api/v1/notifications`   | Notifications   |
| `/api/v1/settings`        | Settings        |
| `/api/v1/activity-logs`   | Activity Logs   |

### Response Format

```json
// Success
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}

// Error
{
  "success": false,
  "error": "Error description",
  "statusCode": 400
}
```

### Query Parameters

| Parameter   | Example                  | Description      |
| ----------- | ------------------------ | ---------------- |
| `page`      | `?page=1`               | Page number      |
| `limit`     | `?limit=20`             | Items per page   |
| `search`    | `?search=keyword`       | Search filter    |
| `startDate` | `?startDate=2025-01-01` | Date range start |
| `endDate`   | `?endDate=2025-12-31`   | Date range end   |

## Modules

| Module            | Description                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Dashboard**     | Financial summary cards, charts (sales vs expenses, profit, cash flow), date filters |
| **Sales**         | Product/service sales, returns, discount, tax, shipping, due tracking                |
| **Purchase**      | Purchase orders, returns, CNF management, document upload, payment tracking          |
| **Products**      | Product management with categories, brands, SKU, pricing, images                     |
| **Manufacturing** | Production planning, work orders, BOM, capacity planning, subcontracting             |
| **Inventory**     | Opening stock, adjustments, transfers, movement tracking, low stock alerts            |
| **Contacts**      | Supplier and customer management                                                     |
| **Accounts**      | Expenses, income, bank accounts, chart of accounts, transactions, P&L reports        |
| **Transfer**      | Money transfers between accounts, product transfers between warehouses                |
| **HRM**           | Staff management, departments, roles, attendance, payroll, loans                     |
| **Leave**         | Leave types, applications, approval workflow, carry forward, holidays                |
| **Locations**     | Branch and warehouse management                                                      |
| **Settings**      | General, invoice, email, and SMS configuration                                       |
| **Setup**         | Tax rates, countries, and language management                                        |
| **Activity Log**  | Track all user actions with filters                                                  |

## User Roles & Permissions

The system supports 9 predefined roles with module-level permissions:

| Role                   | Access Level                             |
| ---------------------- | ---------------------------------------- |
| **Super Admin**        | Full access to all modules               |
| **Admin**              | Full access to all modules               |
| **Sales Manager**      | Sales, contacts, products                |
| **Purchase Officer**   | Purchase, inventory, contacts            |
| **Inventory Manager**  | Inventory, products, warehouses          |
| **Accountant**         | Accounts, transactions, reports          |
| **HR Manager**         | HRM, leave, attendance, payroll          |
| **Branch Manager**     | Branch-scoped access to relevant modules |
| **Staff**              | Limited access based on assignment       |

Each role's permissions are defined per module with 5 action levels: **View**, **Create**, **Edit**, **Delete**, **Approve**.

## Business Rules

1. **Minimum Selling Price** — Sales are blocked if the price falls below the product's minimum. Only Admin can override.
2. **No Negative Stock** — Stock cannot go below zero. Insufficient stock triggers an error.
3. **Low Stock Alerts** — Alerts trigger when `currentStock <= alertQuantity`.
4. **Double-Entry Accounting** — Every financial transaction records both debit and credit entries.
5. **Leave Approval Workflow** — Leave follows Apply > Pending > Approve/Reject flow.
6. **Activity Logging** — Every mutation is logged with user, action, module, and timestamp.
7. **Role-Based Access** — Every API endpoint checks user role and permissions.
8. **Unique SKU** — Product SKUs must be unique system-wide.
9. **Serial Tracking** — Serial-enabled products require unique serial selection on sale.
10. **Soft Delete** — Records use an `isDeleted` flag instead of hard deletion.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is proprietary software developed for Annex Leather.
