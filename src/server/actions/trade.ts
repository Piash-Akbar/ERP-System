'use server';

import { getSession } from '@/server/auth/session';
import { tradeService } from '@/server/services/trade.service';
import { apiOk, apiError } from '@/lib/api';
import {
  createTradeOrderSchema,
  updateTradeOrderStatusSchema,
  createShipmentSchema,
  updateShipmentStatusSchema,
  createLCSchema,
  updateLCStatusSchema,
  createLCAmendmentSchema,
  amendmentDecisionSchema,
  createLCDrawdownSchema,
  drawdownDecisionSchema,
  recordDrawdownPaymentSchema,
  createTradePaymentSchema,
} from '@/server/validators/trade';

export async function createTradeOrder(input: unknown) {
  const session = await getSession();
  const parsed = createTradeOrderSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.createOrder(session, parsed.data);
    return apiOk(data, 'Trade order created');
  } catch (err) {
    return apiError(err);
  }
}

export async function updateTradeOrderStatus(input: unknown) {
  const session = await getSession();
  const parsed = updateTradeOrderStatusSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.updateOrderStatus(session, parsed.data);
    return apiOk(data, 'Status updated');
  } catch (err) {
    return apiError(err);
  }
}

export async function createTradeShipment(input: unknown) {
  const session = await getSession();
  const parsed = createShipmentSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.createShipment(session, parsed.data);
    return apiOk(data, 'Shipment recorded');
  } catch (err) {
    return apiError(err);
  }
}

export async function updateTradeShipmentStatus(input: unknown) {
  const session = await getSession();
  const parsed = updateShipmentStatusSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.updateShipmentStatus(session, parsed.data);
    return apiOk(data, 'Shipment status updated');
  } catch (err) {
    return apiError(err);
  }
}

export async function createLetterOfCredit(input: unknown) {
  const session = await getSession();
  const parsed = createLCSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.createLC(session, parsed.data);
    return apiOk(data, 'Letter of Credit issued');
  } catch (err) {
    return apiError(err);
  }
}

export async function updateLCStatus(input: unknown) {
  const session = await getSession();
  const parsed = updateLCStatusSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.updateLCStatus(session, parsed.data);
    return apiOk(data, 'LC status updated');
  } catch (err) {
    return apiError(err);
  }
}

export async function createLCAmendment(input: unknown) {
  const session = await getSession();
  const parsed = createLCAmendmentSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.createAmendment(session, parsed.data);
    return apiOk(data, 'Amendment request submitted');
  } catch (err) {
    return apiError(err);
  }
}

export async function decideLCAmendment(input: unknown) {
  const session = await getSession();
  const parsed = amendmentDecisionSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.decideAmendment(session, parsed.data);
    return apiOk(data, `Amendment ${parsed.data.decision.toLowerCase()}`);
  } catch (err) {
    return apiError(err);
  }
}

export async function createLCDrawdown(input: unknown) {
  const session = await getSession();
  const parsed = createLCDrawdownSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.createDrawdown(session, parsed.data);
    return apiOk(data, 'Drawdown presentation recorded');
  } catch (err) {
    return apiError(err);
  }
}

export async function decideLCDrawdown(input: unknown) {
  const session = await getSession();
  const parsed = drawdownDecisionSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.decideDrawdown(session, parsed.data);
    return apiOk(data, `Drawdown ${parsed.data.decision.toLowerCase().replace('_', ' ')}`);
  } catch (err) {
    return apiError(err);
  }
}

export async function recordLCDrawdownPayment(input: unknown) {
  const session = await getSession();
  const parsed = recordDrawdownPaymentSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.recordDrawdownPayment(session, parsed.data);
    return apiOk(data, 'Payment recorded');
  } catch (err) {
    return apiError(err);
  }
}

export async function createTradePaymentAction(input: unknown) {
  const session = await getSession();
  const parsed = createTradePaymentSchema.safeParse(input);
  if (!parsed.success) return apiError('Validation failed', parsed.error.flatten());
  try {
    const data = await tradeService.createPayment(session, parsed.data);
    return apiOk(data, 'Payment recorded');
  } catch (err) {
    return apiError(err);
  }
}
