/**
 * Central permission string registry. Format: "<module>:<action>".
 * Every Server Action / Route Handler calls authorize(session, <permission>).
 */
export const PERMISSIONS = {
  // Phase 1
  users: ['read', 'write', 'delete', 'assign-role'],
  roles: ['read', 'write', 'delete'],
  branches: ['read', 'write', 'delete'],
  approvals: ['read', 'approve', 'reject', 'configure'],
  audit: ['read'],
  notifications: ['read', 'write'],
  documents: ['read', 'write', 'delete'],

  // Phase 2
  barcode: ['read', 'generate', 'print'],
  inventory: ['read', 'write', 'transfer', 'adjust', 'return', 'damage'],
  warehouse: ['read', 'receive', 'issue', 'transfer', 'reconcile', 'count'],

  // Phase 3
  suppliers: ['read', 'write', 'delete'],
  purchase: ['read', 'write', 'approve', 'receive', 'invoice', 'pay'],

  // Phase 4
  factory: ['read', 'plan', 'execute', 'close'],
  assets: ['read', 'write', 'transfer', 'dispose', 'depreciate'],

  // Phase 5
  crm: ['read', 'write', 'delete'],
  pos: ['sell', 'refund', 'discount-override', 'close-session'],
  wholesale: ['read', 'write', 'return', 'payment', 'discount-override', 'void'],
  'corporate-sales': [
    'read',
    'quote',
    'order',
    'invoice',
    'deliver',
    'payment',
    'cancel',
    'discount-override',
  ],
  ecommerce: ['read', 'fulfill', 'refund'],
  trade: ['read', 'write'],

  // Phase 6
  coa: ['read', 'write'],
  accounts: ['read', 'post', 'void', 'close-period'],

  // Phase 7
  hr: ['read', 'write', 'process-payroll', 'lock-payroll'],
  reports: ['read', 'export'],
  dashboard: ['read'],
} as const;

export type PermissionModule = keyof typeof PERMISSIONS;
export type Permission = {
  [K in PermissionModule]: `${K}:${(typeof PERMISSIONS)[K][number]}`;
}[PermissionModule];

export function allPermissions(): Permission[] {
  const out: Permission[] = [];
  for (const [mod, actions] of Object.entries(PERMISSIONS)) {
    for (const a of actions) out.push(`${mod}:${a}` as Permission);
  }
  return out;
}
