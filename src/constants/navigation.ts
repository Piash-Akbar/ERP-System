export interface NavItem {
  label: string;
  href: string;
  iconName?: string;
  permission?: string;
}

export interface NavModule {
  number: number;
  label: string;
  href: string;
  iconName: string;
  permission?: string;
  items?: NavItem[];
}

export const MODULES: NavModule[] = [
  {
    number: 1,
    label: 'Admin Dashboard',
    href: '/dashboard',
    iconName: 'LayoutDashboard',
    permission: 'dashboard:read',
  },
  {
    number: 2,
    label: 'Barcode',
    href: '/barcode',
    iconName: 'ScanBarcode',
    permission: 'barcode:read',
    items: [
      { label: 'Overview', href: '/barcode', permission: 'barcode:read' },
      { label: 'Print labels', href: '/barcode/print', permission: 'barcode:read' },
    ],
  },
  {
    number: 3,
    label: 'Inventory',
    href: '/inventory',
    iconName: 'Boxes',
    permission: 'inventory:read',
    items: [
      { label: 'Overview', href: '/inventory', permission: 'inventory:read' },
      { label: 'Products', href: '/inventory/products', permission: 'inventory:read' },
      { label: 'Categories', href: '/inventory/categories', permission: 'inventory:read' },
      { label: 'Stock balance', href: '/inventory/stock', permission: 'inventory:read' },
      { label: 'Ledger', href: '/inventory/ledger', permission: 'inventory:read' },
    ],
  },
  {
    number: 4,
    label: 'Warehouse',
    href: '/warehouse',
    iconName: 'Warehouse',
    permission: 'warehouse:read',
    items: [
      { label: 'Overview', href: '/warehouse', permission: 'warehouse:read' },
      { label: 'Receive', href: '/warehouse/receive', permission: 'warehouse:receive' },
      { label: 'Issue', href: '/warehouse/issue', permission: 'warehouse:issue' },
      { label: 'Transfer', href: '/warehouse/transfer', permission: 'warehouse:transfer' },
      { label: 'Physical count', href: '/warehouse/count', permission: 'warehouse:count' },
    ],
  },
  {
    number: 5,
    label: 'Factory',
    href: '/factory',
    iconName: 'Factory',
    permission: 'factory:read',
    items: [
      { label: 'Production orders', href: '/factory', permission: 'factory:read' },
      { label: 'New production order', href: '/factory/new', permission: 'factory:plan' },
    ],
  },
  {
    number: 6,
    label: 'POS',
    href: '/pos',
    iconName: 'ShoppingCart',
    permission: 'pos:sell',
    items: [
      { label: 'Terminal', href: '/pos', permission: 'pos:sell' },
      { label: 'Sales', href: '/pos/sales', permission: 'pos:sell' },
      { label: 'Sessions', href: '/pos/sessions', permission: 'pos:sell' },
    ],
  },
  {
    number: 7,
    label: 'Corporate Sales',
    href: '/corporate-sales',
    iconName: 'Building2',
    permission: 'corporate-sales:read',
    items: [
      { label: 'Overview', href: '/corporate-sales', permission: 'corporate-sales:read' },
      { label: 'Quotes', href: '/corporate-sales/quotes', permission: 'corporate-sales:read' },
      { label: 'Orders', href: '/corporate-sales/orders', permission: 'corporate-sales:read' },
      { label: 'Invoices', href: '/corporate-sales/invoices', permission: 'corporate-sales:read' },
    ],
  },
  {
    number: 8,
    label: 'Wholesale',
    href: '/wholesale',
    iconName: 'Package',
    permission: 'wholesale:read',
    items: [
      { label: 'Overview', href: '/wholesale', permission: 'wholesale:read' },
      { label: 'New invoice', href: '/wholesale/new', permission: 'wholesale:write' },
      { label: 'Invoices', href: '/wholesale/invoices', permission: 'wholesale:read' },
    ],
  },
  {
    number: 9,
    label: 'E-commerce',
    href: '/ecommerce',
    iconName: 'Globe',
    permission: 'ecommerce:read',
  },
  {
    number: 10,
    label: 'Export / Import',
    href: '/trade',
    iconName: 'Ship',
    permission: 'trade:read',
    items: [
      { label: 'Overview', href: '/trade', permission: 'trade:read' },
      { label: 'Orders', href: '/trade/orders', permission: 'trade:read' },
      { label: 'New order', href: '/trade/orders/new', permission: 'trade:write' },
      { label: 'Letters of Credit', href: '/trade/lc', permission: 'trade:read' },
      { label: 'New LC', href: '/trade/lc/new', permission: 'trade:write' },
      { label: 'Shipments', href: '/trade/shipments', permission: 'trade:read' },
      { label: 'Payments', href: '/trade/payments', permission: 'trade:read' },
    ],
  },
  {
    number: 11,
    label: 'Suppliers',
    href: '/suppliers',
    iconName: 'Truck',
    permission: 'suppliers:read',
    items: [
      { label: 'All suppliers', href: '/suppliers', permission: 'suppliers:read' },
      { label: 'Payments', href: '/suppliers/payments', permission: 'suppliers:read' },
    ],
  },
  {
    number: 12,
    label: 'CRM',
    href: '/crm',
    iconName: 'Users',
    permission: 'crm:read',
    items: [
      { label: 'Customers', href: '/crm', permission: 'crm:read' },
      { label: 'New customer', href: '/crm/new', permission: 'crm:write' },
    ],
  },
  {
    number: 13,
    label: 'Accounts & Finance',
    href: '/accounts',
    iconName: 'Banknote',
    permission: 'accounts:read',
    items: [
      { label: 'Overview', href: '/accounts', permission: 'accounts:read' },
      { label: 'Journals', href: '/accounts/journals', permission: 'accounts:read' },
      { label: 'New journal', href: '/accounts/journals/new', permission: 'accounts:post' },
      { label: 'Account ledger', href: '/accounts/ledger', permission: 'accounts:read' },
      { label: 'Trial balance', href: '/accounts/trial-balance', permission: 'accounts:read' },
      { label: 'Balance sheet', href: '/accounts/balance-sheet', permission: 'accounts:read' },
      { label: 'Income statement', href: '/accounts/income-statement', permission: 'accounts:read' },
      { label: 'Fiscal periods', href: '/accounts/periods', permission: 'accounts:read' },
    ],
  },
  {
    number: 14,
    label: 'Chart of Accounts',
    href: '/coa',
    iconName: 'BookOpen',
    permission: 'coa:read',
  },
  {
    number: 15,
    label: 'Assets',
    href: '/assets',
    iconName: 'Building2',
    permission: 'assets:read',
    items: [
      { label: 'All assets', href: '/assets', permission: 'assets:read' },
      { label: 'Categories', href: '/assets/categories', permission: 'assets:read' },
    ],
  },
  {
    number: 16,
    label: 'Reports & Analytics',
    href: '/reports',
    iconName: 'BarChart3',
    permission: 'reports:read',
    items: [
      { label: 'Overview', href: '/reports', permission: 'reports:read' },
      { label: 'Sales', href: '/reports/sales', permission: 'reports:read' },
      { label: 'Top products', href: '/reports/top-products', permission: 'reports:read' },
      { label: 'Purchase', href: '/reports/purchase', permission: 'reports:read' },
      { label: 'Inventory valuation', href: '/reports/inventory', permission: 'reports:read' },
      { label: 'HR summary', href: '/reports/hr', permission: 'reports:read' },
    ],
  },
  {
    number: 17,
    label: 'Users & Roles',
    href: '/users',
    iconName: 'UserCog',
    permission: 'users:read',
    items: [
      { label: 'Users', href: '/users', permission: 'users:read' },
      { label: 'Roles', href: '/roles', permission: 'roles:read' },
    ],
  },
  {
    number: 18,
    label: 'Audit Log',
    href: '/audit',
    iconName: 'History',
    permission: 'audit:read',
  },
  {
    number: 19,
    label: 'Notifications',
    href: '/notifications',
    iconName: 'Bell',
    permission: 'notifications:read',
  },
  {
    number: 20,
    label: 'Branches',
    href: '/branches',
    iconName: 'Network',
    permission: 'branches:read',
  },
  {
    number: 21,
    label: 'Purchase',
    href: '/purchase',
    iconName: 'Package',
    permission: 'purchase:read',
    items: [
      { label: 'Overview', href: '/purchase', permission: 'purchase:read' },
      { label: 'Requisitions', href: '/purchase/requisitions', permission: 'purchase:read' },
      { label: 'Orders', href: '/purchase/orders', permission: 'purchase:read' },
      { label: 'Goods receive', href: '/purchase/grn', permission: 'purchase:receive' },
      { label: 'Invoices', href: '/purchase/invoices', permission: 'purchase:read' },
    ],
  },
  {
    number: 22,
    label: 'Approvals',
    href: '/approvals',
    iconName: 'FileCheck2',
    permission: 'approvals:read',
    items: [
      { label: 'Queue', href: '/approvals', permission: 'approvals:read' },
      { label: 'Rules', href: '/approvals/rules', permission: 'approvals:read' },
    ],
  },
  {
    number: 23,
    label: 'Documents',
    href: '/documents',
    iconName: 'FolderOpen',
    permission: 'documents:read',
  },
  {
    number: 24,
    label: 'HR & Payroll',
    href: '/hr',
    iconName: 'UsersRound',
    permission: 'hr:read',
    items: [
      { label: 'Overview', href: '/hr', permission: 'hr:read' },
      { label: 'Employees', href: '/hr/employees', permission: 'hr:read' },
      { label: 'New employee', href: '/hr/employees/new', permission: 'hr:write' },
      { label: 'Attendance', href: '/hr/attendance', permission: 'hr:read' },
      { label: 'Leaves', href: '/hr/leaves', permission: 'hr:read' },
      { label: 'Payroll', href: '/hr/payroll', permission: 'hr:read' },
    ],
  },
  {
    number: 25,
    label: 'Cash Flow',
    href: '/cash-flow',
    iconName: 'ArrowRightLeft',
    permission: 'reports:read',
    items: [
      { label: 'Daily / Range', href: '/cash-flow', permission: 'reports:read' },
    ],
  },
];
