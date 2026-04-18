import { z } from 'zod';

export const journalLineSchema = z
  .object({
    accountId: z.string().cuid(),
    debit: z.coerce.number().finite().min(0).default(0),
    credit: z.coerce.number().finite().min(0).default(0),
    currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).default('BDT'),
    fxRate: z.coerce.number().finite().positive().default(1),
    memo: z.string().trim().max(200).optional().or(z.literal('')),
    costCenter: z.string().trim().max(64).optional().or(z.literal('')),
  })
  .refine((l) => (l.debit > 0) !== (l.credit > 0), {
    message: 'Each line must be exactly one of debit or credit (not both, not neither)',
  });

export const journalCreateSchema = z
  .object({
    branchId: z.string().cuid(),
    date: z.coerce.date(),
    memo: z.string().trim().max(500).optional().or(z.literal('')),
    reference: z.string().trim().max(120).optional().or(z.literal('')),
    post: z.boolean().default(false),
    lines: z.array(journalLineSchema).min(2, 'At least two lines required'),
  })
  .refine(
    (v) => {
      const d = v.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
      const c = v.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
      return Math.abs(d - c) < 0.00005 && d > 0;
    },
    { message: 'Debit total must equal credit total and be greater than zero' },
  );

export const journalVoidSchema = z.object({
  id: z.string().cuid(),
  reason: z.string().trim().min(3).max(500),
});

export type JournalLineInput = z.infer<typeof journalLineSchema>;
export type JournalCreateInput = z.infer<typeof journalCreateSchema>;
export type JournalVoidInput = z.infer<typeof journalVoidSchema>;
