import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ScanBarcode,
  Boxes,
  Warehouse,
  Factory,
  ShoppingCart,
  Building2,
  Package,
  Globe,
  Ship,
  Truck,
  Users,
  Banknote,
  BookOpen,
  BarChart3,
  UserCog,
  History,
  Bell,
  Network,
  FileCheck2,
  ShieldCheck,
  FolderOpen,
  UsersRound,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Scale,
  ListOrdered,
  ClipboardList,
  PackageCheck,
  Receipt,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:read' },
    ],
  },
  {
    label: 'Stock',
    items: [
      { label: 'Products', href: '/inventory/products', icon: Boxes, permission: 'inventory:read' },
      { label: 'Categories', href: '/inventory/categories', icon: Boxes, permission: 'inventory:read' },
      { label: 'Stock balance', href: '/inventory/stock', icon: Scale, permission: 'inventory:read' },
      { label: 'Ledger', href: '/inventory/ledger', icon: ListOrdered, permission: 'inventory:read' },
      { label: 'Warehouses', href: '/warehouse', icon: Warehouse, permission: 'warehouse:read' },
      { label: 'Receive', href: '/warehouse/receive', icon: ArrowDownToLine, permission: 'warehouse:receive' },
      { label: 'Issue', href: '/warehouse/issue', icon: ArrowUpFromLine, permission: 'warehouse:issue' },
      { label: 'Transfer', href: '/warehouse/transfer', icon: ArrowLeftRight, permission: 'warehouse:transfer' },
      { label: 'Physical count', href: '/warehouse/count', icon: Scale, permission: 'warehouse:count' },
      { label: 'Barcode', href: '/barcode', icon: ScanBarcode, permission: 'barcode:read' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Factory', href: '/factory', icon: Factory, permission: 'factory:read' },
      { label: 'Assets', href: '/assets', icon: Building2, permission: 'assets:read' },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { label: 'Purchase Dashboard', href: '/purchase', icon: Package, permission: 'purchase:read' },
      { label: 'Requisitions', href: '/purchase/requisitions', icon: ClipboardList, permission: 'purchase:read' },
      { label: 'Purchase Orders', href: '/purchase/orders', icon: ShoppingCart, permission: 'purchase:read' },
      { label: 'Goods Receive', href: '/purchase/grn', icon: PackageCheck, permission: 'purchase:receive' },
      { label: 'Invoices', href: '/purchase/invoices', icon: Receipt, permission: 'purchase:read' },
      { label: 'Suppliers', href: '/suppliers', icon: Truck, permission: 'suppliers:read' },
      { label: 'Supplier Payments', href: '/suppliers/payments', icon: Wallet, permission: 'suppliers:read' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'POS', href: '/pos', icon: ShoppingCart, permission: 'pos:sell' },
      { label: 'Wholesale', href: '/wholesale', icon: Package, permission: 'wholesale:read' },
      { label: 'Corporate Sales', href: '/corporate-sales', icon: Building2, permission: 'corporate-sales:read' },
      { label: 'E-commerce', href: '/ecommerce', icon: Globe, permission: 'ecommerce:read' },
      { label: 'Export / Import', href: '/trade', icon: Ship, permission: 'trade:read' },
      { label: 'CRM', href: '/crm', icon: Users, permission: 'crm:read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Accounts & Finance', href: '/accounts', icon: Banknote, permission: 'accounts:read' },
      { label: 'Chart of Accounts', href: '/coa', icon: BookOpen, permission: 'coa:read' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'HR & Payroll', href: '/hr', icon: UsersRound, permission: 'hr:read' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports:read' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', href: '/users', icon: UserCog, permission: 'users:read' },
      { label: 'Roles', href: '/roles', icon: ShieldCheck, permission: 'roles:read' },
      { label: 'Branches', href: '/branches', icon: Network, permission: 'branches:read' },
      { label: 'Approvals', href: '/approvals', icon: FileCheck2, permission: 'approvals:read' },
      { label: 'Documents', href: '/documents', icon: FolderOpen, permission: 'documents:read' },
      { label: 'Notifications', href: '/notifications', icon: Bell, permission: 'notifications:read' },
      { label: 'Audit Log', href: '/audit', icon: History, permission: 'audit:read' },
    ],
  },
];
