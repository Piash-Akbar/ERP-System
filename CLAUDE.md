# CLAUDE.md


## Project
Annex Leather ERP — Full Enterprise ERP for leather / factory / showroom / business operations.


This file is the master implementation guide for Claude Code / Claude AI to understand the product scope, architecture, development rules, module boundaries, UI direction, design system, and execution order.


The project is being **rebuilt from scratch on Next.js + PostgreSQL**, replacing the previous MERN (Express + React/Vite + MongoDB) implementation. The old `client/` and `server/` folders are treated as a reference for business logic, validators, and schemas, but are **not** the source of truth going forward.


---


## 1) Product Goal


Build a full-stack, production-grade ERP that supports:


- Real-time business visibility
- Inventory and warehouse control
- Factory and production management
- Retail, wholesale, corporate, and e-commerce sales
- Purchase and supplier workflows
- Accounts with double-entry logic
- Asset, reporting, approval, audit, and notification control
- Multi-branch operations
- HR and payroll
- Secure user / role-based access


This ERP must be modular, scalable, permission-driven, audit-ready, and match the Figma design (clean enterprise UI with dark sidebar, blue primary, card + table layouts).


---


## 2) Core Principles


Claude must follow these principles during development:


1. Build module-by-module, but keep architecture unified inside a single Next.js app.
2. Maintain a single source of truth for stock, accounts, users, and approvals.
3. All business-critical actions must be traceable via the audit log.
4. Role permission must be enforced everywhere — middleware, route handlers, Server Actions, and UI.
5. Approval flow must be respected for restricted actions.
6. Financial transactions must support double-entry accounting with `Decimal` precision (never `Float`).
7. Inventory updates must always be transaction-driven (`prisma.$transaction`).
8. Multi-branch support must be preserved in all major tables, queries, and UI state.
9. UI must be fast, practical, and operator-friendly (Server Components by default, Client only where interaction requires it).
10. Code must be strongly typed, reusable, and easy to maintain.


---


## 3) Tech Stack


Use this stack. Do not substitute without explicit user approval.


### Language
- **TypeScript** (strict mode on) — frontend, backend, and shared code.


### Framework
- **Next.js 15+ (App Router)** — single fullstack app. Frontend (RSC + Client Components) and backend (Route Handlers + Server Actions) in one codebase.
- **Node.js 20+** runtime.


### Styling & UI
- **Tailwind CSS v4**
- **shadcn/ui** (Radix-based primitives, copy-into-repo components)
- **Lucide React** icons
- **Recharts** (or `shadcn/chart`) for analytics
- **next-themes** for dark-mode groundwork (optional, but scaffold it)
- **sonner** for toasts


### Data & Forms
- **React Hook Form** + **Zod** (via `@hookform/resolvers/zod`)
- **TanStack Query** for client-side server-state (when Server Components aren't enough — mutations, optimistic updates, infinite lists)
- **TanStack Table** (wrapped as a reusable `<DataTable>` shadcn component)


### Database & ORM
- **PostgreSQL 16+**
- **Prisma ORM** with `prisma migrate` and `prisma generate`
- **`Decimal`** type for all money / quantity-with-fraction fields
- Connection via singleton Prisma client (`src/server/db.ts`) to avoid dev-mode leaks


### Auth
- **Auth.js v5 (NextAuth)** with Credentials provider (email + password) for ERP-style login
- JWT session strategy with access + short-lived refresh pattern, or DB session — either is acceptable; default to JWT for simpler ops
- **bcryptjs** for password hashing
- **Middleware-based RBAC** at `src/middleware.ts` plus per-action permission checks


### Validation
- **Zod** schemas, colocated in `src/server/validators/<module>.ts`, shared between Server Actions, Route Handlers, and client forms.


### File Upload & Storage
- `multer`-style parsing via Route Handlers + `formData()`
- Local disk for dev; pluggable S3-compatible driver (`src/server/storage/`) for prod


### Email
- **Resend** (preferred) or **Nodemailer** fallback


### Realtime / Notifications
- Start with **SSE** (Server-Sent Events via Route Handler streaming) for in-app notifications
- Graceful polling fallback
- Upgrade path to **Pusher** / **Ably** / **Socket.IO** when load justifies it


### Reporting / Export
- **@react-pdf/renderer** or **pdf-lib** for server-side PDF
- **exceljs** for Excel exports


### Tooling
- **pnpm** (preferred) or npm
- **ESLint** + **Prettier**
- **Vitest** for unit / service tests, **Playwright** for E2E (scoped to critical flows: login, POS checkout, journal post, approval)
- **Husky + lint-staged** for pre-commit


### Package Manager
- **pnpm** (recommended — workspace-ready if the project ever splits into packages)


---


## 4) Development Rules


Claude must follow these rules while generating code.


### Architecture Rules
- Single Next.js app under project root. Source in `src/`.
- Separate UI (`components/`), business logic (`server/services/`), DB access (Prisma inside services), and validation (`server/validators/`).
- **Business rules live in `server/services/*`** — never in Route Handlers, Server Actions, or Components.
- Route Handlers and Server Actions are thin: parse → validate (Zod) → authorize → call service → format response.
- Client Components only when you need interactivity / state. Default to Server Components.
- Prefer Server Actions for mutations inside App Router; use Route Handlers (`/api/...`) when you need to expose a stable REST-ish surface (mobile client, webhooks, external scanners).
- Reuse Zod schemas across server and client.


### TypeScript Rules
- `strict: true`, `noUncheckedIndexedAccess: true`.
- No `any`. Use `unknown` + narrowing.
- Derive types from Zod (`z.infer<typeof X>`) and Prisma (`Prisma.XGetPayload<...>`) — don't duplicate shapes.


### Database Rules
- Every major transactional table should include:
  - `id` (cuid or uuid)
  - `branchId` (FK) where applicable
  - `createdById`, `updatedById`
  - `createdAt`, `updatedAt`
- Use enums for status fields (`OrderStatus`, `ApprovalStatus`, etc.), modeled as Prisma enums.
- All foreign keys explicit. Use `onDelete: Restrict` for financial / inventory tables; `Cascade` only for owned child rows.
- **Money** → `Decimal(18, 4)`. **Quantities** that can fractional → `Decimal(18, 4)`. Integer counts → `Int`.
- Index `branchId`, `createdAt`, and any frequently filtered column.
- Every mutation that changes stock or financial balance runs inside `prisma.$transaction`.
- Never silently change stock or ledger balance — write an `InventoryLedger` / `JournalEntryLine` row.


### UI Rules
- Dashboard and transaction screens must be fast — render with Server Components and stream where possible.
- Operator screens must minimize clicks; scan-first flows must be keyboard-only.
- Use card layout for overview screens.
- Use table-heavy layout for operational modules (wrap TanStack Table in a reusable `<DataTable>`).
- Use split-layout where the Figma shows it:
  - left: list / scan / workflow
  - right: details / cart / preview / form
- Status colors (match Figma):
  - **Green** = success / healthy / posted / approved
  - **Yellow** = warning / pending
  - **Red** = critical / rejected / out of stock
  - **Blue** = active / informational / primary actions


### Validation Rules
- Validate on both client (RHF + Zod) and server (Zod before service call). Client validation is UX; server validation is the gate.
- Prevent invalid stock issue.
- Prevent unauthorized approval.
- Prevent invalid accounting entry (debit total must equal credit total; enforced in service + DB check).
- Prevent duplicate barcode, duplicate payroll, duplicate account code, and duplicate asset where required (unique indexes + pre-check).


### Audit Rules
- Route every mutation through a service that calls `auditLogger.record(...)`.
- Store `actorId`, `branchId`, `module`, `action`, `entityId`, `before`, `after`, `ip`, `userAgent`, `createdAt`.
- For sensitive updates, store full old/new snapshots (JSONB).
- Never allow destructive actions without permission + log.


---


## 5) Global Cross-Module Controls


These rules apply system-wide:


### Permission
Every route, Server Action, Route Handler, button, mutation, and report must respect role permission.

- Permissions are strings like `inventory:read`, `inventory:write`, `accounts:post`, `approval:approve`.
- Central permission matrix lives in the DB (`Role` ↔ `Permission`).
- Helper: `await authorize(session, 'inventory:write', { branchId })` throws `ForbiddenError` if denied.
- UI hides / disables controls the user doesn't have — but the server still enforces.


### Approval
Restricted flows must support approval:
- purchase
- expense
- transfer
- asset disposal
- high discount
- credit override
- sensitive finance operations
- payroll finalization
- other configurable business actions


### Branch
- All major records carry `branchId`.
- The session stores `activeBranchId`; the `<BranchSwitcher>` in the topbar changes it.
- Service calls take `branchId` explicitly. Never derive it implicitly from the user's default.


### Notifications
Generate alerts for:
- low stock
- due payments
- delayed production
- pending approvals
- document expiry
- payroll due
- suspicious activity
- delivery issue


### Reporting
All major modules should expose reportable data via a service function that returns a typed DTO.


### Search & Filter
Use fast searchable tables with filters by:
- date, branch, user, customer, supplier, product, status, document type, category.


---


## 6) Module Map (24 Modules)


Build the ERP around these 24 modules (folder names mirrored under `src/app/(app)/`):


1. Admin Dashboard (`dashboard`)
2. Barcode Management (`barcode`)
3. Inventory Management (`inventory`)
4. Warehouse Management (`warehouse`)
5. Factory Management (`factory`)
6. POS (Retail / Showroom) (`pos`)
7. Corporate Sales (`corporate-sales`)
8. Wholesale (`wholesale`)
9. E-commerce / Online Sales (`ecommerce`)
10. Export / Import (`trade`)
11. Supplier Management (`suppliers`)
12. CRM (Customer Management) (`crm`)
13. Accounts & Finance (`accounts`)
14. Chart of Accounts (`coa`)
15. Asset Management (`assets`)
16. Reporting & Analytics (`reports`)
17. User Management & Role Permission (`users`)
18. Audit Log (`audit`)
19. Notification System (`notifications`)
20. Multi-Branch Management (`branches`)
21. Purchase Management (`purchase`)
22. Approval Workflow (`approvals`)
23. Document Management (DMS) (`documents`)
24. HR & Payroll (`hr`)


---


## 7) Module Summary and Build Intent


(Business intent is tech-agnostic — same as before. Included here so Claude doesn't need to flip between files.)


### 1. Admin Dashboard
KPI cards, charts, approval widget, activity preview, notification panel, quick actions. Mostly Server Components with a couple of Client islands (charts).


### 2. Barcode Management
Barcode / QR generation, print labels, scan engine, duplicate control, sound feedback, hardware scanner support (keyboard wedge input).


### 3. Inventory Management
SKU / product control, stock in/out, transfer, return, damaged stock, movement log, negative-stock control, stock freeze / period lock.


### 4. Warehouse Management
Goods receiving, goods issue, warehouse transfer, bin / rack / location, reconciliation, physical count, batch scan, **continuous scan mode**, offline-capable scan input (future PWA).


### 5. Factory Management
Production planning, production orders, raw material consumption, WIP tracking, stage status, finished goods, productivity, delay alerts, production costing.


### 6. POS
Barcode scan, cart, quick checkout, split payment, receipt print, discount control (with approval for high discount), returns, cash session open/close. **Split layout: left product grid / scan, right cart.**


### 7. Corporate Sales
B2B clients, quotation → sales order → invoice → delivery → receivable, credit limit, approval for exceptions.


### 8. Wholesale
Customer-based bulk billing, quick pricing, due tracking, invoice, return, discount control, continuous scan.


### 9. E-commerce / Online Sales
Order sync, order status lifecycle, packing / fulfillment, shipment tracking, COD / online payment, return / refund, payment reconciliation, delayed order alerts.


### 10. Export / Import
Export / import order, shipment stages, trade documents, foreign payment, exchange rate handling, compliance checks, missing / expired document alerts.


### 11. Supplier Management
Supplier profile, credit terms, purchase history, payable tracking, payment history, supplier performance, overdue alerts.


### 12. CRM
Customer profile, categorization, sales history, interaction log, due tracking, loyalty support, inactive / overdue alerts.


### 13. Accounts & Finance
Journal entries, vouchers, double-entry logic, receivable / payable, cash / bank, expense / income, period lock, financial reports, audit trail.

**Critical accounting rule:** Debit total must always equal credit total — enforced in service layer **and** via a DB check constraint / trigger where possible.


### 14. Chart of Accounts (COA)
Account hierarchy (adjacency list with materialized path), posting vs control account, mapping with modules, opening balance, cost center / branch mapping, duplicate account prevention.


### 15. Asset Management
Asset registration, categorization, allocation, transfer, maintenance, disposal, depreciation methods (straight-line, declining balance), accounting integration.


### 16. Reporting & Analytics
Standard reports, custom report builder, charts, KPI cards, advanced filtering, PDF / Excel export, anomaly / insight alerts.


### 17. User Management & Role Permission
User CRUD, role CRUD, permission matrix, authentication, RBAC, approval rights, block / deactivate, user activity reports.


### 18. Audit Log
Create / update / delete / login tracking, old / new values (JSONB diff), suspicious activity alerts, tamper-resistant storage (append-only table, no update / delete permission at DB role level), searchable logs.


### 19. Notification System
Info / warning / critical notifications, approval alerts, stock alerts, due alerts, real-time push (SSE), user targeting, notification history, user notification settings.


### 20. Multi-Branch Management
Branch setup, branch-wise data visibility, inter-branch flow support, branch performance comparison, branch-level stock / sales / expense visibility.


### 21. Purchase Management
PR → RFQ → Supplier Quotation → PO → GRN → Invoice → Payment flow. Approval gates, delivery / price mismatch alerts, partial receiving.


### 22. Approval Workflow
Rule-based approval flow, multi-level approval, dynamic routing by amount / role / module, approve / reject / hold / change request, escalation, approval history. Centralized engine consumed by all restricted-action modules.


### 23. Document Management
Upload, categorize, tag, link with records (polymorphic association: `entityType` + `entityId`), version control, inline preview, role-based access, expiry / missing-document alerts.


### 24. HR & Payroll
Employee profile, attendance, leave, salary structure, payroll processing, payslip, payroll lock, payroll approval, HR / payroll reports.


---


## 8) Recommended Build Order


Follow this order. Do not build randomly.


### Phase 0 — Scaffold (one-shot)
- `pnpm dlx create-next-app@latest` (TS, Tailwind, App Router, ESLint, src-dir)
- Install Prisma, Auth.js, shadcn/ui, Zod, RHF, TanStack Query / Table, Recharts, Lucide, Resend, sonner, exceljs, pdf-lib
- Set up Prisma schema with `User`, `Role`, `Permission`, `Branch`
- Initialize shadcn/ui (`pnpm dlx shadcn@latest init`)
- Create `src/server/db.ts`, `src/server/auth/`, `src/middleware.ts`
- Seed: super admin user, default roles, default branch


### Phase 1 — Foundation
1. User Management & Role Permission
2. Multi-Branch Management
3. Approval Workflow (engine + UI)
4. Audit Log (logger + viewer)
5. Notification System (SSE + bell UI)
6. Document Management


### Phase 2 — Product and Stock Core
7. Barcode Management
8. Inventory Management
9. Warehouse Management


### Phase 3 — Purchase and Input Flow
10. Supplier Management
11. Purchase Management


### Phase 4 — Production and Asset
12. Factory Management
13. Asset Management


### Phase 5 — Sales Stack
14. CRM
15. POS
16. Wholesale
17. Corporate Sales
18. E-commerce / Online Sales
19. Export / Import


### Phase 6 — Finance
20. Chart of Accounts
21. Accounts & Finance


### Phase 7 — People and Intelligence
22. HR & Payroll
23. Reporting & Analytics
24. Admin Dashboard


---


## 9) Backend Domain Rules


### Inventory
- No stock update without a transaction row in `InventoryLedger`.
- Negative stock is blocked unless `Branch.allowNegativeStock = true` (audit-logged warning).
- Locked periods prevent backdated changes (check `Period.status === 'OPEN'`).
- Stock transfer changes location, not total stock — two ledger rows (out + in) in one `$transaction`.


### Sales
- Every sale generates a sales transaction + inventory ledger rows + (when posted) journal entry.
- Stock decrements atomically with invoice creation.
- Payment must match invoice logic; partial payments create receivable balance rows.
- Returns link to original sale (`returnOfInvoiceId`).
- High discount requires approval; enforced before invoice posts.


### Purchase
- `PR → Approval → RFQ → Quotation → PO → GRN → Invoice → Payment` preserved.
- Partial receiving supported (`GRN.items[].receivedQty <= PO.items[].orderedQty`).
- Supplier + pricing validation before PO commits.


### Factory
- Raw material consumed before finished goods entry (reservation + consumption in one transaction).
- Stage sequence respected (`ProductionStage.order`).
- Delay tracking visible; alert if `actualEndDate > plannedEndDate`.


### Finance
- Double-entry accounting mandatory. Service helper `postJournal(lines[])` refuses if `sum(debit) !== sum(credit)`.
- All money uses `Decimal`, compared with `.equals()` / `.cmp()`, never `===`.
- COA mapping mandatory on every posting line.
- Locked period cannot be edited.
- Financial reports are built from `JournalEntryLine` rows only.


### Approval
- Approval bypass is not allowed — even super admins go through the workflow unless the rule explicitly allows skip.
- Multi-level flow configurable via `ApprovalRule` (rule = module + action + amount threshold + approver role sequence).
- Delayed approvals escalate to next-level approver after `escalateAfterHours`.


### Security
- **No route without auth guard.** Middleware denies unauthenticated access to everything under `(app)`.
- **No mutation without permission check.** Service functions accept a `session` argument and call `authorize(...)` as their first line.
- Sensitive actions logged.
- Rate-limit login and password reset routes.
- CSP, CSRF (for forms outside Server Actions), HTTPS-only cookies in prod.


---


## 10) UI Direction & Design System


### Derived from the Figma


Design reference: 24 module folders of PNG exports at `/home/pias-akbar/Downloads/ERP/`, each named by module number + module name. Always review the matching folder before implementing a module's UI.


### Layout pattern
- **Dark sidebar** (slate-900) with app title at top, nav below, user card at bottom. Active nav item gets blue-600 bg + white text.
- Some modules use **light sidebar** variant (white bg, colored icons) — honor the Figma per-module.
- **Topbar** with: global search (SKU / barcode / accounts / docs), branch switcher, notification bell, user menu.
- **Main canvas**: white / neutral-50 bg, generous padding, card-based sections, rounded-lg corners, subtle shadows.


### Color tokens (Tailwind)
- `primary` → blue-600 (`#2563EB`) for active states, CTAs, links, KPI highlights
- `success` → emerald-500/600
- `warning` → amber-500
- `danger` → red-500/600
- `sidebar` → slate-900 (dark variant)
- `surface` → white on neutral-50 canvas


### Typography
- Sans: **Inter** (via `next/font`) as the default.
- Tabular numbers for currency and ledger columns (`font-variant-numeric: tabular-nums`).


### Currency & Locale
- Dual currency visible in Figma: **₹ (INR)** and **৳ (BDT)**. Branch has a `currency` field (`INR` | `BDT` | others). All display uses `formatCurrency(amount, branchCurrency)`.
- Date display: `yyyy-MM-dd` in tables, long form elsewhere. Store `timestamptz` in DB.


### Common components to build first (in `src/components/shared/`)
- `<AppShell>` (sidebar + topbar + content slot)
- `<PageHeader>` (title, subtitle, actions)
- `<DataTable>` (TanStack Table + shadcn)
- `<StatusBadge>` (posted / pending / approved / rejected / draft / overdue)
- `<KpiCard>` (label, value, delta, icon, color)
- `<BranchSwitcher>`
- `<NotificationBell>` (SSE-subscribed)
- `<SearchCommand>` (⌘K global)
- `<ScanInput>` (auto-focus, enter-to-submit, continuous-scan toggle, audio feedback)
- `<MoneyInput>` (Decimal-safe)
- `<DateRangePicker>`
- `<PermissionGate>` (wraps children, hides if no permission)
- `<ConfirmDialog>`
- `<FileUpload>`


### Module-specific UI patterns
- **Dashboard**: KPI grid → charts → alerts → recent activity → quick actions.
- **POS / Wholesale**: left product grid with scan input, right cart + payment. Keyboard shortcuts: F2 scan, F8 clear, F12 pay.
- **Corporate Sales / Purchase**: step-based wizard (PR → PO → GRN → Invoice → Payment), breadcrumb of stage status.
- **Inventory / Warehouse / Audit / Reporting**: filter bar + `<DataTable>` with saved views.
- **Accounts / Journal Entry**: detail form with line-item table, live debit / credit totals that turn red if unbalanced.
- **DMS**: folder + tag + inline preview.
- **Users / Roles**: list + permission matrix with checkboxes.
- **Approval queue**: list left, details + action buttons right.


### UX expectations
- Fewer clicks.
- Clear status badge everywhere.
- Real-time feedback (toasts via `sonner`).
- Keyboard-friendly (focus traps, submit on Enter, Esc to close).
- Scan-first flow where relevant (warehouse, POS, wholesale).
- Loading states via Suspense + skeletons, not spinners.


---


## 11) Folder Structure


```txt
/
├─ prisma/
│  ├─ schema.prisma                    # single source of truth for DB
│  ├─ migrations/
│  └─ seed.ts
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ forgot-password/page.tsx
│  │  │  └─ layout.tsx
│  │  ├─ (app)/                        # authenticated area, shared layout = AppShell
│  │  │  ├─ layout.tsx
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ inventory/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ products/
│  │  │  │  ├─ stock-in/
│  │  │  │  ├─ stock-out/
│  │  │  │  ├─ transfers/
│  │  │  │  └─ ledger/
│  │  │  ├─ warehouse/
│  │  │  ├─ pos/
│  │  │  ├─ purchase/
│  │  │  ├─ suppliers/
│  │  │  ├─ accounts/
│  │  │  ├─ coa/
│  │  │  ├─ approvals/
│  │  │  ├─ users/
│  │  │  ├─ branches/
│  │  │  ├─ documents/
│  │  │  ├─ hr/
│  │  │  ├─ reports/
│  │  │  ├─ assets/
│  │  │  ├─ factory/
│  │  │  ├─ barcode/
│  │  │  ├─ crm/
│  │  │  ├─ wholesale/
│  │  │  ├─ corporate-sales/
│  │  │  ├─ ecommerce/
│  │  │  ├─ trade/
│  │  │  ├─ notifications/
│  │  │  └─ audit/
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ sse/notifications/route.ts
│  │  │  └─ <module>/route.ts          # only when REST surface is needed
│  │  ├─ layout.tsx                    # root layout (fonts, providers)
│  │  ├─ not-found.tsx
│  │  ├─ error.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ ui/                           # shadcn primitives (button, input, dialog, ...)
│  │  ├─ shared/                       # cross-module (DataTable, PageHeader, KpiCard, ...)
│  │  └─ <module>/                     # module-specific client components
│  ├─ server/
│  │  ├─ db.ts                         # Prisma singleton
│  │  ├─ auth/
│  │  │  ├─ config.ts                  # Auth.js config
│  │  │  ├─ session.ts                 # getSession helper
│  │  │  └─ authorize.ts               # RBAC gate
│  │  ├─ services/
│  │  │  ├─ inventory.service.ts
│  │  │  ├─ accounts.service.ts
│  │  │  ├─ approval.service.ts
│  │  │  ├─ audit.service.ts
│  │  │  └─ ...                        # one per module
│  │  ├─ validators/
│  │  │  ├─ inventory.ts
│  │  │  ├─ accounts.ts
│  │  │  └─ ...
│  │  ├─ actions/                      # Server Actions, grouped by module
│  │  │  ├─ inventory.ts
│  │  │  └─ ...
│  │  ├─ audit/logger.ts
│  │  ├─ notifications/publisher.ts
│  │  ├─ storage/                      # file storage driver
│  │  └─ email/                        # Resend client + templates
│  ├─ lib/
│  │  ├─ utils.ts                      # cn(), etc.
│  │  ├─ money.ts                      # Decimal helpers
│  │  ├─ permissions.ts                # permission string constants
│  │  ├─ errors.ts                     # ApiError, ForbiddenError, ...
│  │  └─ api.ts                        # typed response helpers
│  ├─ hooks/
│  │  ├─ use-branch.ts
│  │  ├─ use-permission.ts
│  │  └─ use-scan.ts
│  ├─ types/
│  ├─ constants/
│  │  └─ navigation.ts                 # sidebar nav from 24-module map
│  └─ middleware.ts                    # auth + branch context
├─ .env.example
├─ next.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
├─ components.json                     # shadcn config
└─ package.json
```


---


## 12) API, Actions, and Service Guidelines


### Server Actions (preferred for internal UI mutations)


```ts
// src/server/actions/inventory.ts
'use server';

import { stockTransferSchema } from '@/server/validators/inventory';
import { authorize } from '@/server/auth/authorize';
import { getSession } from '@/server/auth/session';
import { inventoryService } from '@/server/services/inventory.service';
import { apiError, apiOk } from '@/lib/api';

export async function transferStock(input: unknown) {
  const session = await getSession();
  await authorize(session, 'inventory:transfer');

  const parsed = stockTransferSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());

  try {
    const data = await inventoryService.transfer(session, parsed.data);
    return apiOk(data, 'Transfer created');
  } catch (err) {
    return apiError(err);
  }
}
```


### Route Handlers (for REST surface, webhooks, scanners, mobile)


```ts
// src/app/api/inventory/route.ts
import { NextRequest } from 'next/server';
import { inventoryService } from '@/server/services/inventory.service';
import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { apiError, apiOk } from '@/lib/api';

export async function GET(req: NextRequest) {
  const session = await getSession();
  await authorize(session, 'inventory:read');
  const data = await inventoryService.list(session, req.nextUrl.searchParams);
  return Response.json(apiOk(data));
}
```


### Standard response shape


```ts
type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: unknown };
```


Helpers in `src/lib/api.ts`:
- `apiOk(data, message?)`
- `apiError(errOrMessage, details?)`


### Service layer rules
- Always takes a `session` argument (or null for system jobs).
- Always performs `authorize(...)` as the first step.
- Wraps multi-step mutations in `prisma.$transaction(async (tx) => { ... })`.
- Calls `auditLogger.record(...)` inside the same transaction.
- Returns typed DTOs, not raw Prisma models where the shape leaks sensitive fields.


---


## 13) Database Design Guidelines


### Table groups
- **Master**: `User`, `Role`, `Permission`, `RolePermission`, `Branch`, `Product`, `ProductVariant`, `Supplier`, `Customer`, `ChartAccount`, `AssetCategory`, `Warehouse`, `Bin`.
- **Transactional**: `SalesInvoice`, `SalesInvoiceItem`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceiving`, `GoodsIssue`, `StockTransfer`, `ProductionOrder`, `JournalEntry`, `JournalEntryLine`, `Payment`, `Payslip`.
- **Ledger / movement**: `InventoryLedger`, `AccountLedger` (derived), `StockCountSession`.
- **Linking**: `DocumentLink` (polymorphic `entityType` + `entityId`), `ApprovalTarget`.
- **Approval**: `ApprovalRule`, `ApprovalRequest`, `ApprovalStep`.
- **Audit**: `AuditLog` (append-only, JSONB diff).
- **Settings**: `AppSetting`, `BranchSetting`, `Period` (fiscal year + period lock).


### Conventions
- PK: `id String @id @default(cuid())`.
- All transactional tables include `branchId`, `createdById`, `createdAt`, `updatedAt`, `status`.
- Use Prisma `@@index([branchId, createdAt])` on anything filtered by date range.
- Money: `@db.Decimal(18, 4)`; expose as `Prisma.Decimal` in TS.
- Enums live in `schema.prisma` and are imported, not duplicated.
- Unique indexes for `Product.sku`, `Product.barcode`, `ChartAccount.code`, `User.email`, `Asset.code`.


---


## 14) Coding Style


- Modular, readable, strongly typed.
- Clear naming; small functions; explicit validation; defensive checks at boundaries.
- Comments only where the *why* is non-obvious (hidden invariant, workaround, surprising behavior). Let names carry the *what*.
- No premature abstraction — three similar usages first, then extract.
- Prefer Server Components; reach for `'use client'` only when a component needs state, effects, refs, or event handlers.


---


## 15) What Claude Should Do First


When starting from scratch, Claude should:


1. Scaffold Next.js app (TypeScript, Tailwind, App Router, src dir, pnpm).
2. Configure path aliases (`@/*` → `src/*`).
3. Install dependencies listed in §3.
4. Initialize shadcn/ui and generate base primitives (button, input, form, dialog, dropdown, table, tabs, toast, card, badge, sheet, command).
5. Set up Prisma: `schema.prisma` with `User`, `Role`, `Permission`, `RolePermission`, `Branch`, `Period`, `AuditLog`, `Notification`. Run first migration.
6. Create `src/server/db.ts` (Prisma singleton), `src/server/auth/config.ts` (Auth.js Credentials), `src/server/auth/authorize.ts`, `src/server/audit/logger.ts`, `src/lib/api.ts`, `src/lib/errors.ts`.
7. Write `src/middleware.ts` to gate `(app)` routes.
8. Build `AppShell` (sidebar + topbar + content), `BranchSwitcher`, `NotificationBell`, `SearchCommand`.
9. Generate sidebar nav from `src/constants/navigation.ts` (24-module map).
10. Seed: super admin user, default `Admin`, `Manager`, `Cashier`, `Accountant`, `WarehouseOp` roles with base permissions, default `Main Branch`, fiscal `Period`.
11. Build **User Management** module end-to-end (Phase 1 kickoff) as the reference pattern for all other modules.


After that: proceed through the Phase 1 → Phase 7 order in §8.


---


## 16) Immediate Development Priority


If asked to start implementation immediately:


1. Auth + session + middleware.
2. `AppShell` layout + sidebar + topbar.
3. Role / permission system + seed.
4. Dashboard shell (KPIs wired to placeholder data).
5. Branch selector (wired to session).
6. Approval queue shell.
7. Notification bell (SSE skeleton).
8. User management CRUD (reference implementation for module pattern).
9. Audit log base table + logger + viewer page.


After that:
- Inventory → Warehouse → Purchase → POS → Accounts.


---


## 17) Output Expectations for Claude


When generating output for this project, prefer:


- Complete file-based implementation with correct Next.js App Router conventions.
- Minimal placeholders.
- Realistic business logic.
- ERP-ready naming.
- Seedable dummy data only if requested.
- Migration-friendly Prisma schema.
- Reusable UI components (add to `components/shared/` if used by 2+ modules).


When generating a module, always provide:
- Prisma schema additions (models, enums, indexes)
- Zod validators in `server/validators/<module>.ts`
- Service in `server/services/<module>.service.ts`
- Server Actions / Route Handlers
- Pages + Client components
- Permission constants in `lib/permissions.ts`
- Navigation entry in `constants/navigation.ts`
- Audit integration
- Approval integration (if restricted)


Always reference the matching Figma folder at `/home/pias-akbar/Downloads/ERP/<N>.<Module Name>/` before building a module's UI.


---


## 18) Migration From The Previous MERN Codebase


The previous codebase (Express + Mongoose + React/Vite) lives in `client/` and `server/`. It is being **replaced**, not incrementally migrated, because the architecture differs fundamentally.


### Salvage from the old code
- **Mongoose schemas** → translate fields / relations into Prisma models (but review for SQL-appropriate normalization; Mongo's embedded docs often become separate tables).
- **Joi validators** → rewrite as Zod schemas.
- **Express services** → port business logic into `server/services/<module>.service.ts`, adapting to Prisma transactions.
- **React page structure** → use as a UI sketch, but rebuild with Server Components + shadcn primitives.
- **constants, enums, navigation map** → copy values, rewrite as TS modules.


### Do not copy
- `mongoose`, `express`, `cors`, `joi`, `multer` wiring (replaced by Next.js + Zod + formData).
- Axios service files (`client/src/services/*.service.js`) — replaced by Server Actions + typed fetch helpers.
- React Router (replaced by App Router).
- Any global state patterns tied to React Router / Mongoose callbacks.


### Cutover
- The new Next.js app is scaffolded at the **project root** (alongside existing `client/` and `server/`, which stay until Phase 1 is complete and seed parity is confirmed).
- Once Phase 1 + 2 ship, archive `client/` and `server/` into a `legacy-mern/` folder and remove from the default workspace.


---


## 19) Final Instruction


Claude is not building a demo.
Claude is building a real ERP foundation on Next.js + PostgreSQL.


Priority order:
- correctness
- control
- traceability
- speed
- usability
- scalability


Never break:
- accounting truth (debit = credit, period lock, Decimal precision)
- stock truth (every change is a ledger row, within a transaction)
- approval truth (no bypass)
- permission truth (server enforces, UI reflects)
