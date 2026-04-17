'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/server/auth/config';

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email');
  const password = formData.get('password');
  const callbackUrl = (formData.get('callbackUrl') as string) || '/dashboard';

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return undefined;
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === 'CredentialsSignin') return { error: 'Invalid email or password.' };
      return { error: 'Sign-in failed. Try again.' };
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
