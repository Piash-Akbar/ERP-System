import {
  HiOutlineHome,
  HiOutlineShoppingCart,
  HiOutlineUsers,
  HiOutlineCube,
  HiOutlineWrenchScrewdriver,
  HiOutlineArchiveBox,
  HiOutlineTruck,
  HiOutlineBanknotes,
  HiOutlineArrowsRightLeft,
  HiOutlineMapPin,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
  HiOutlineCog6Tooth,
  HiOutlineWrench,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';

export const sidebarMenu = [
  {
    name: 'Dashboard',
    path: '/',
    icon: HiOutlineHome,
  },
  {
    name: 'Sales & Marketing',
    icon: HiOutlineShoppingCart,
    children: [
      { name: 'Sales List', path: '/sales' },
      { name: 'Sales Return', path: '/sales/return' },
      { name: 'Product Sale', path: '/sales/product-sale' },
      { name: 'Service Sale', path: '/sales/service-sale' },
    ],
  },
  {
    name: 'Contacts',
    icon: HiOutlineUsers,
    children: [
      { name: 'All Contacts', path: '/contacts' },
      { name: 'Customers', path: '/contacts/customers' },
      { name: 'Suppliers', path: '/contacts/suppliers' },
    ],
  },
  {
    name: 'Products',
    icon: HiOutlineCube,
    children: [
      { name: 'Product List', path: '/products' },
      { name: 'Add Product', path: '/products/add' },
      { name: 'Categories', path: '/products/categories' },
      { name: 'Brands', path: '/products/brands' },
    ],
  },
  {
    name: 'Manufacturing',
    icon: HiOutlineWrenchScrewdriver,
    children: [
      { name: 'Production Planning', path: '/manufacturing/production' },
      { name: 'Work Orders', path: '/manufacturing/work-orders' },
      { name: 'BOM', path: '/manufacturing/bom' },
      { name: 'Capacity Planning', path: '/manufacturing/capacity' },
      { name: 'Identify Subcontr.', path: '/manufacturing/subcontracting-items' },
      { name: 'Subcontr. Orders', path: '/manufacturing/subcontracting-orders' },
      { name: 'Subcontr. Billing', path: '/manufacturing/subcontracting-billing' },
      { name: 'Reports', path: '/manufacturing/reports' },
    ],
  },
  {
    name: 'Inventory',
    icon: HiOutlineArchiveBox,
    children: [
      { name: 'Stock List', path: '/inventory' },
      { name: 'Opening Stock', path: '/inventory/opening-stock' },
      { name: 'Stock Adjustment', path: '/inventory/adjustment' },
      { name: 'Product Movement', path: '/inventory/movement' },
    ],
  },
  {
    name: 'Purchase',
    icon: HiOutlineTruck,
    children: [
      { name: 'Purchase Orders', path: '/purchase' },
      { name: 'Purchase Return', path: '/purchase/return' },
      { name: 'Stock Alerts', path: '/purchase/stock-alerts' },
      { name: 'CNF Management', path: '/purchase/cnf' },
    ],
  },
  {
    name: 'Accounts & Finance',
    icon: HiOutlineBanknotes,
    children: [
      { name: 'Expenses', path: '/accounts/expenses' },
      { name: 'Income', path: '/accounts/income' },
      { name: 'Bank Accounts', path: '/accounts/bank-accounts' },
      { name: 'Chart of Accounts', path: '/accounts/chart' },
      { name: 'Transactions', path: '/accounts/transactions' },
      { name: 'Profit & Loss', path: '/accounts/profit-loss' },
    ],
  },
  {
    name: 'Transfer',
    icon: HiOutlineArrowsRightLeft,
    children: [
      { name: 'Money Transfer', path: '/transfer/new' },
      { name: 'Transfer List', path: '/transfer' },
    ],
  },
  {
    name: 'Location',
    icon: HiOutlineMapPin,
    children: [
      { name: 'Branches', path: '/locations/branches' },
      { name: 'Warehouses', path: '/locations/warehouses' },
    ],
  },
  {
    name: 'HRM',
    icon: HiOutlineUserGroup,
    children: [
      { name: 'Staff List', path: '/hrm' },
      { name: 'Add Staff', path: '/hrm/add-staff' },
      { name: 'Departments', path: '/hrm/departments' },
      { name: 'Roles', path: '/hrm/roles' },
      { name: 'Attendance', path: '/hrm/attendance' },
      { name: 'Payroll', path: '/hrm/payroll' },
      { name: 'Staff Loans', path: '/hrm/loans' },
    ],
  },
  {
    name: 'Leave Management',
    icon: HiOutlineCalendarDays,
    children: [
      { name: 'Leave Types', path: '/leave/types' },
      { name: 'Leave Define', path: '/leave/define' },
      { name: 'Apply Leave', path: '/leave/apply' },
      { name: 'Pending Requests', path: '/leave/pending' },
      { name: 'Holiday Setup', path: '/leave/holidays' },
    ],
  },
  {
    name: 'Settings',
    icon: HiOutlineCog6Tooth,
    children: [
      { name: 'General Settings', path: '/settings/general' },
      { name: 'Invoice Settings', path: '/settings/invoice' },
      { name: 'Email Settings', path: '/settings/email' },
      { name: 'SMS Settings', path: '/settings/sms' },
    ],
  },
  {
    name: 'Setup',
    icon: HiOutlineWrench,
    children: [
      { name: 'Tax Management', path: '/setup/tax' },
      { name: 'Country Management', path: '/setup/country' },
      { name: 'Language Management', path: '/setup/language' },
    ],
  },
  {
    name: 'Activity Log',
    path: '/activity-log',
    icon: HiOutlineClipboardDocumentList,
  },
];
