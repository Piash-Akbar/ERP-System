import { Prisma } from '@prisma/client';

export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

export function d(v: Prisma.Decimal.Value): Decimal {
  return new Prisma.Decimal(v);
}

export function sumDecimal(values: Prisma.Decimal.Value[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(v), new Prisma.Decimal(0));
}

export type CurrencyCode = 'BDT' | 'INR' | 'USD' | 'EUR';

const SYMBOL: Record<CurrencyCode, string> = {
  BDT: '৳',
  INR: '₹',
  USD: '$',
  EUR: '€',
};

const LOCALE: Record<CurrencyCode, string> = {
  BDT: 'en-BD',
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-GB',
};

export function formatCurrency(
  value: Prisma.Decimal.Value,
  currency: CurrencyCode = 'BDT',
  opts: Intl.NumberFormatOptions = {},
): string {
  const n = typeof value === 'object' && 'toNumber' in value ? value.toNumber() : Number(value);
  const formatted = new Intl.NumberFormat(LOCALE[currency], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(n);
  return `${SYMBOL[currency]}${formatted}`;
}
