# Annex Leather ERP

A full enterprise ERP for leather / factory / showroom / business operations — covering inventory, factory, retail/wholesale/corporate/online sales, purchase, accounting, assets, HR & payroll, reporting, approvals, and audit, with multi-branch support and role-based access.

> **Status:** Being rebuilt from scratch on **Next.js 15 + PostgreSQL + Prisma**, replacing the previous MERN (Express + React/Vite + MongoDB) implementation. The old `client/` and `server/` folders (and `legacy-mern-backup/`) are reference-only for business logic, validators, and schemas — not the source of truth going forward.

## Table of Contents

- [Product Goal](#product-goal)
- [Tech Stack](#tech-stack)
- [Core Principles](#core-principles)
- [Module Map](#module-map)
- [Build Phases](#build-phases)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database & Seeding](#database--seeding)
- [Running the Application](#running-the-application)
- [Architecture Rules](#architecture-rules)
- [Domain Rules](#domain-rules)
- [UI & Design System](#ui--design-system)
- [Migration From MERN](#migration-from-mern)
- [License](#license)

## Product Goal

Build a production-grade ERP that supports:

- Real-time business visibility with KPI dashboards
- Inventory and warehouse control (scan-first workflows)
- Factory and production management (planning → WIP → finished goods)
- Retail (POS), wholesale, corporate B2B, and e-commerce sales
- Purchase and supplier workflows (PR → RFQ → PO → GRN → Invoice → Payment)
- Double-entry accounts with period lock and `Decimal` precision
- Asset, reporting, approval, audit, and notification control
- Multi-branch operations with per-branch currency and data scoping
- HR, attendance, and payroll
- Secure role- and permission-driven access

The ERP is modular, scalable, permission-driven, audit-ready, and follows the Figma reference at `/home/pias-akbar/Downloads/ERP/` (clean enterprise UI: dark sidebar, blue primary, card + table layouts).

## Tech Stack

| Layer                 | Technology                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| **Language**          | TypeScript (strict, `noUncheckedIndexedAccess`)                            |
| **Framework**         | Next.js 15+ (App Router, RSC + Server Actions), Node.js 20+                |
| **Styling / UI**      | Tailwind CSS v4, shadcn/ui (Radix), Lucide, Recharts, sonner, next-themes  |
| **Forms / Validation**| React Hook Form + Zod (`@hookform/resolvers/zod`)                          |
| **Tables / State**    | TanStack Table (wrapped `<DataTable>`), TanStack Query                     |
| **Database**          | PostgreSQL 16+ with Prisma ORM (`Decimal(18,4)` for money/qty)             |
| **Auth**              | Auth.js v5 (Credentials), JWT sessions, bcryptjs, middleware RBAC          |
| **Storage**           | Local disk (dev) + pluggable S3-compatible driver (prod)                   |
| **Email**             | Resend (preferred) / Nodemailer fallback                                   |
| **Realtime**          | SSE (Route Handler streaming) with polling fallback                        |
| **Reporting / Export**| `@react-pdf/renderer` / `pdf-lib`, `exceljs`                               |
| **Tooling**           | pnpm, ESLint, Prettier, Vitest, Playwright, Husky + lint-staged            |

## Core Principles

1. Module-by-module, single unified Next.js app.
2. Single source of truth for stock, accounts, users, and approvals.
3. Every business-critical action is traceable via the audit log.
4. Role permission is enforced at middleware, route handlers, Server Actions, services, **and** UI.
5. Approval flow is respected for restricted actions — no bypass, even for super admins.
6. Financial transactions use double-entry logic with `Decimal` precision (never `Float`).
7. Inventory updates are always transaction-driven (`prisma.$transaction`) and write an `InventoryLedger` row.
8. Multi-branch support is preserved in every major table, query, and UI state.
9. Server Components by default; Client Components only where interaction requires it.
10. Strongly typed, reusable, maintainable code — derive types from Zod and Prisma.

## Module Map

24 modules, mirrored under `src/app/(app)/`:

| # | Module                          | Slug              |
|---|---------------------------------|-------------------|
| 1 | Admin Dashboard                 | `dashboard`       |
| 2 | Barcode Management              | `barcode`         |
| 3 | Inventory Management            | `inventory`       |
| 4 | Warehouse Management            | `warehouse`       |
| 5 | Factory Management              | `factory`         |
| 6 | POS (Retail / Showroom)         | `pos`             |
| 7 | Corporate Sales                 | `corporate-sales` |
| 8 | Wholesale                       | `wholesale`       |
| 9 | E-commerce / Online Sales       | `ecommerce`       |
| 10| Export / Import                 | `trade`           |
| 11| Supplier Management             | `suppliers`       |
| 12| CRM                             | `crm`             |
| 13| Accounts & Finance              | `accounts`        |
| 14| Chart of Accounts               | `coa`             |
| 15| Asset Management                | `assets`          |
| 16| Reporting & Analytics           | `reports`         |
| 17| User Management & Role Permission| `users`          |
| 18| Audit Log                       | `audit`           |
| 19| Notification System             | `notifications`   |
| 20| Multi-Branch Management         | `branches`        |
| 21| Purchase Management             | `purchase`        |
| 22| Approval Workflow               | `approvals`       |
| 23| Document Management (DMS)       | `documents`       |
| 24| HR & Payroll                    | `hr`              |

## Build Phases

Follow this order — do not build randomly.

- **Phase 0 — Scaffold:** Next.js app, Prisma (`User`, `Role`, `Permission`, `Branch`), shadcn/ui init, Auth.js config, middleware, seed super admin.
- **Phase 1 — Foundation:** Users & Roles → Branches → Approval Workflow → Audit Log → Notifications (SSE) → Documents.
- **Phase 2 — Product & Stock Core:** Barcode → Inventory → Warehouse.
- **Phase 3 — Purchase & Input Flow:** Suppliers → Purchase (PR → PO → GRN → Invoice → Payment).
- **Phase 4 — Production & Asset:** Factory → Assets.
- **Phase 5 — Sales Stack:** CRM → POS → Wholesale → Corporate Sales → E-commerce → Export/Import.
- **Phase 6 — Finance:** Chart of Accounts → Accounts & Finance.
- **Phase 7 — People & Intelligence:** HR & Payroll → Reporting & Analytics → Admin Dashboard.

## Project Structure

```
/
├─ prisma/
│  ├─ schema.prisma                 # single source of truth for DB
│  ├─ migrations/
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (auth)/                    # login, forgot-password
│  │  ├─ (app)/                     # authenticated area, shared AppShell layout
│  │  │  ├─ dashboard/
│  │  │  ├─ inventory/  warehouse/  pos/  purchase/  suppliers/
│  │  │  ├─ accounts/   coa/        approvals/  users/  branches/
│  │  │  ├─ documents/  hr/         reports/   assets/  factory/
│  │  │  ├─ barcode/    crm/        wholesale/ corporate-sales/
│  │  │  ├─ ecommerce/  trade/      notifications/ audit/
│  │  │  └─ layout.tsx
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ sse/notifications/route.ts
│  │  │  └─ <module>/route.ts       # only when a REST surface is needed
│  │  ├─ layout.tsx  not-found.tsx  error.tsx  globals.css
│  ├─ components/
│  │  ├─ ui/                        # shadcn primitives
│  │  ├─ shared/                    # AppShell, DataTable, KpiCard, ScanInput, ...
│  │  └─ <module>/                  # module-specific client components
│  ├─ server/
│  │  ├─ db.ts                      # Prisma singleton
│  │  ├─ auth/                      # config, session, authorize (RBAC)
│  │  ├─ services/                  # business logic per module
│  │  ├─ validators/                # Zod schemas per module
│  │  ├─ actions/                   # Server Actions per module
│  │  ├─ audit/logger.ts
│  │  ├─ notifications/publisher.ts
│  │  ├─ storage/                   # file storage driver
│  │  └─ email/                     # Resend client + templates
│  ├─ lib/                          # utils, money, permissions, errors, api helpers
│  ├─ hooks/                        # use-branch, use-permission, use-scan
│  ├─ constants/navigation.ts       # 24-module sidebar map
│  ├─ types/
│  └─ middleware.ts                 # auth + branch context
├─ client/                          # legacy MERN frontend (reference only)
├─ server/                          # legacy MERN backend (reference only)
├─ legacy-mern-backup/              # archived MERN snapshot
├─ components.json                  # shadcn config
├─ next.config.ts  tsconfig.json  package.json
└─ README.md
```

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (recommended) or npm
- **PostgreSQL** 16+ (local or hosted)

## Installation

```bash
git clone https://github.com/Piash-Akbar/ERP-System.git
cd ERP-System
pnpm install
cp .env.example .env   # then edit with your values
```

## Environment Variables

Create `.env` at the project root:

| Variable              | Description                                     | Example                                              |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                    | `postgresql://user:pass@localhost:5432/annex_erp`    |
| `NEXTAUTH_SECRET`     | Auth.js session secret                          | *(generate with `openssl rand -base64 32`)*          |
| `NEXTAUTH_URL`        | Canonical app URL                               | `http://localhost:3000`                              |
| `RESEND_API_KEY`      | Resend API key for transactional email          | `re_...`                                             |
| `STORAGE_DRIVER`      | `local` (dev) or `s3` (prod)                    | `local`                                              |
| `S3_ENDPOINT`         | S3-compatible endpoint (prod only)              | `https://...`                                        |
| `S3_BUCKET`           | S3 bucket name (prod only)                      | `annex-erp`                                          |
| `S3_ACCESS_KEY_ID`    | S3 access key (prod only)                       |                                                      |
| `S3_SECRET_ACCESS_KEY`| S3 secret key (prod only)                       |                                                      |

## Database & Seeding

```bash
pnpm prisma migrate dev        # apply migrations in development
pnpm prisma generate           # regenerate the Prisma client
pnpm prisma db seed            # seed super admin, default roles, Main Branch, fiscal period
pnpm prisma studio             # inspect the database
```

Seed output includes:

- Super admin user
- Default roles: `Admin`, `Manager`, `Cashier`, `Accountant`, `WarehouseOp` with base permissions
- Default `Main Branch` (with currency: `INR` / `BDT`)
- Initial fiscal `Period` (open)

## Running the Application

```bash
pnpm dev           # start Next.js dev server (http://localhost:3000)
pnpm build         # production build
pnpm start         # run the production build
pnpm lint          # ESLint
pnpm test          # Vitest (unit / service)
pnpm test:e2e      # Playwright (critical flows only)
```

## Architecture Rules

- **Server-first.** Default to Server Components; add `'use client'` only when you need state, effects, refs, or event handlers.
- **Thin route handlers / actions.** Parse → validate (Zod) → authorize → call service → format response. Business logic lives in `server/services/*`.
- **Server Actions for internal mutations.** Route Handlers (`/api/...`) only when a stable REST surface is needed (mobile, webhooks, scanners).
- **Shared Zod schemas** between server and client forms.
- **Standard response shape:**
  ```ts
  type ApiResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string; details?: unknown };
  ```
  via `apiOk(data, message?)` / `apiError(err, details?)` in `src/lib/api.ts`.
- **Type derivation:** `z.infer<typeof X>` and `Prisma.XGetPayload<...>` — never duplicate shapes. No `any`.
- **DB conventions:** `id` (cuid), `branchId`, `createdById`, `updatedById`, `createdAt`, `updatedAt`; enums for status; `@db.Decimal(18,4)` for money/qty; `@@index([branchId, createdAt])` on date-filtered tables.
- **Transactions:** every stock or financial mutation runs inside `prisma.$transaction` with an accompanying `InventoryLedger` / `JournalEntryLine` row **and** an `AuditLog` write.

## Domain Rules

- **Inventory:** no stock change without an `InventoryLedger` row; negative stock blocked unless `Branch.allowNegativeStock = true`; locked periods reject backdated edits; transfers write two ledger rows (out + in) in one transaction.
- **Sales:** sale → inventory ledger → journal entry (on post), atomic. Partial payments create receivable rows. Returns link via `returnOfInvoiceId`. High discount requires approval.
- **Purchase:** `PR → Approval → RFQ → Quotation → PO → GRN → Invoice → Payment`. Partial receiving supported. Supplier + pricing validated before PO commits.
- **Factory:** raw material reserved & consumed before finished goods entry (same transaction). Stage sequence enforced via `ProductionStage.order`. Delays flagged when `actualEndDate > plannedEndDate`.
- **Finance:** double-entry mandatory. `postJournal(lines[])` refuses unbalanced entries. All money via `Decimal` — compared with `.equals()` / `.cmp()`, never `===`. Locked periods are read-only. Financial reports read only from `JournalEntryLine`.
- **Approval:** no bypass, not even for super admins (unless the `ApprovalRule` explicitly allows skip). Multi-level routing by amount/role/module. Escalation after `escalateAfterHours`.
- **Audit:** append-only `AuditLog` with `actor`, `branch`, `module`, `action`, `entity`, `before`, `after` (JSONB), `ip`, `userAgent`, `createdAt`.
- **Security:** middleware denies unauthenticated access under `(app)`. Services always call `authorize(session, 'module:action')` first. Login + password reset are rate-limited. HTTPS-only cookies in prod.

## UI & Design System

- **Layout.** Dark slate-900 sidebar (light variant where the Figma calls for it) + topbar (global search, branch switcher, notification bell, user menu) + neutral-50 canvas with card/table content.
- **Color tokens.** `primary` blue-600 (`#2563EB`), `success` emerald-500/600, `warning` amber-500, `danger` red-500/600.
- **Typography.** Inter via `next/font`; tabular numbers for money/ledger columns.
- **Currency.** `formatCurrency(amount, branchCurrency)` — branch carries the currency (`INR`, `BDT`, …). Dates `yyyy-MM-dd` in tables; `timestamptz` in DB.
- **Shared components (first to build).** `<AppShell>`, `<PageHeader>`, `<DataTable>`, `<StatusBadge>`, `<KpiCard>`, `<BranchSwitcher>`, `<NotificationBell>`, `<SearchCommand>` (⌘K), `<ScanInput>`, `<MoneyInput>`, `<DateRangePicker>`, `<PermissionGate>`, `<ConfirmDialog>`, `<FileUpload>`.
- **Module UX patterns.** POS / Wholesale: left product grid + scan, right cart (F2 scan, F8 clear, F12 pay). Purchase / Corporate Sales: wizard with stage breadcrumb. Journal Entry: live debit/credit totals, red on unbalanced. Approval queue: list left, details + actions right.
- **Figma reference.** `/home/pias-akbar/Downloads/ERP/<N>.<Module Name>/` — review the matching folder before implementing any module UI.

## Migration From MERN

The previous Express + Mongoose + React/Vite codebase in `client/` and `server/` is being **replaced**, not incrementally migrated.

**Salvage:**
- Mongoose schemas → Prisma models (review for SQL normalization; embedded docs often become separate tables).
- Joi validators → Zod schemas.
- Express services → `server/services/<module>.service.ts`, adapted to Prisma transactions.
- React page structure → UI sketch only; rebuild with Server Components + shadcn.
- Constants / enums / navigation values → rewritten as TS modules.

**Do not copy:** `mongoose`, `express`, `cors`, `joi`, `multer` wiring; Axios service files; React Router; any global state tied to Mongoose callbacks.

**Cutover:** `client/` and `server/` remain until Phase 1 + 2 ship and seed parity is confirmed, then move into `legacy-mern-backup/` and drop from the default workspace.

## License

Proprietary software developed for Annex Leather.
