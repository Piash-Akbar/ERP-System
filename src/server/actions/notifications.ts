'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { notificationService } from '@/server/services/notification.service';
import { ApiError } from '@/lib/errors';

export async function markNotificationReadAction(id: string) {
  try {
    const session = await getSession();
    await notificationService.markRead(session, id);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/notifications');
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await getSession();
    await notificationService.markAllRead(session);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/notifications');
  return { success: true };
}
