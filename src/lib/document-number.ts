/**
 * Small helper to build sequential human-readable document numbers
 * (e.g. PR-2026-001, PO-2026-042). Pass the prior count — the caller is
 * responsible for reading it inside the same transaction to avoid races.
 */
export function nextDocumentNumber(prefix: string, year: number, previousCount: number, pad = 3) {
  const seq = (previousCount + 1).toString().padStart(pad, '0');
  return `${prefix}-${year}-${seq}`;
}

export function nextSupplierCode(previousCount: number, pad = 3) {
  return `SUP-${(previousCount + 1).toString().padStart(pad, '0')}`;
}

export function nextPaymentNumber(previousCount: number, pad = 3) {
  return `PAY-${(previousCount + 1).toString().padStart(pad, '0')}`;
}

export function nextProductionNumber(year: number, previousCount: number, pad = 3) {
  return nextDocumentNumber('PRO', year, previousCount, pad);
}

export function nextAssetCode(previousCount: number, pad = 4) {
  return `AST-${(previousCount + 1).toString().padStart(pad, '0')}`;
}

export function nextCustomerCode(previousCount: number, pad = 3) {
  return `CUS-${(previousCount + 1).toString().padStart(pad, '0')}`;
}
