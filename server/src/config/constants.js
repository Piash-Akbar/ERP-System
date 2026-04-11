const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALES_MANAGER: 'sales_manager',
  PURCHASE_OFFICER: 'purchase_officer',
  INVENTORY_MANAGER: 'inventory_manager',
  ACCOUNTANT: 'accountant',
  HR_MANAGER: 'hr_manager',
  BRANCH_MANAGER: 'branch_manager',
  STAFF: 'staff',
};

const MODULES = {
  DASHBOARD: 'dashboard',
  SALES: 'sales',
  PURCHASE: 'purchase',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  CONTACTS: 'contacts',
  ACCOUNTS: 'accounts',
  HRM: 'hrm',
  LEAVE: 'leave',
  TRANSFER: 'transfer',
  LOCATIONS: 'locations',
  SETTINGS: 'settings',
  ACTIVITY_LOG: 'activity_log',
};

const PERMISSIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
};

module.exports = { ROLES, MODULES, PERMISSIONS };
